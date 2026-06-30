import { cookies } from "next/headers"
import { createRemoteJWKSet, jwtVerify, decodeJwt } from "jose"
import { type CarlosClaims, ORG_CLAIM, TIER_CLAIM } from "./types"

// ---------------------------------------------------------------------------
// Auth0 configuration. Every value is read lazily so the app boots cleanly in
// the v0 preview even when no Auth0 tenant is wired up (graceful fallback).
// ---------------------------------------------------------------------------

export const SESSION_COOKIE = "ha_session"
export const SIM_COOKIE = "ha_sim_session"

export function auth0Config() {
  const domain = process.env.AUTH0_DOMAIN
  const clientId = process.env.AUTH0_CLIENT_ID
  const clientSecret = process.env.AUTH0_CLIENT_SECRET
  const audience = process.env.AUTH0_AUDIENCE
  const baseUrl = process.env.APP_BASE_URL ?? process.env.AUTH0_BASE_URL
  return { domain, clientId, clientSecret, audience, baseUrl }
}

export function isAuth0Configured(): boolean {
  const { domain, clientId, clientSecret } = auth0Config()
  return Boolean(domain && clientId && clientSecret)
}

// The decoded identity Carlos sees when no live tenant is connected. These are
// the exact custom claims the storyline expects.
export const SIMULATED_CLAIMS: CarlosClaims = {
  sub: "auth0|carlos-apex-cooling",
  name: "Carlos Mendez",
  email: "carlos@apexcooling.com",
  picture: undefined,
  org: "Apex Cooling LLC",
  tier: "Platinum",
  source: "simulated",
  raw: {
    sub: "auth0|carlos-apex-cooling",
    name: "Carlos Mendez",
    email: "carlos@apexcooling.com",
    [ORG_CLAIM]: "Apex Cooling LLC",
    [TIER_CLAIM]: "Platinum",
    scope: "openid profile email inventory:read pricing:read orders:read",
    iss: "https://hvac-copilot-demo.us.auth0.com/",
    aud: "https://api.hvac-copilot.demo",
  },
}

// ---------------------------------------------------------------------------
// CIMD + OBO helpers for Auth0 A4AA (Agent as Principal).
// ---------------------------------------------------------------------------

/** The URL of this app's CIMD document — this IS the agent's client_id. */
export function getCimdUrl(): string {
  const base = process.env.APP_BASE_URL ?? process.env.AUTH0_BASE_URL ?? ""
  return `${base}/.well-known/client-metadata.json`
}

/** Read the user's access_token from the httpOnly cookie set at callback. */
export async function getAccessToken(): Promise<string | null> {
  const store = await cookies()
  return store.get("ha_access_token")?.value ?? null
}

export interface AgentContext {
  agentId: string
  aliasId: string
  sessionId: string
  actionGroup: string
}

/**
 * RFC 8693 token exchange: swaps the user's access_token for a delegated
 * OBO token carrying both the user's sub and the full AgentCore act claim.
 * Extra AgentCore parameters are picked up by the Auth0 post-token-exchange
 * Action and written into the act claim.
 */
export async function exchangeOboToken(
  userAccessToken: string,
  scope: string,
  agentCtx: AgentContext,
): Promise<{ preview: string; source: "auth0" | "simulated"; actClaim: Record<string, unknown> }> {
  const { domain, clientId, clientSecret, audience } = auth0Config()
  const cimdUrl = getCimdUrl()

  const actClaim: Record<string, unknown> = {
    sub: cimdUrl,
    "urn:amazon:bedrock:agent_id":     agentCtx.agentId,
    "urn:amazon:bedrock:alias_id":     agentCtx.aliasId,
    "urn:amazon:bedrock:session_id":   agentCtx.sessionId,
    "urn:amazon:bedrock:action_group": agentCtx.actionGroup,
    "urn:amazon:bedrock:delegated":    true,
  }

  if (domain && clientId && clientSecret) {
    try {
      const body = new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
        client_id: clientId,
        client_secret: clientSecret,
        subject_token: userAccessToken,
        subject_token_type: "urn:ietf:params:oauth:token-type:access_token",
        actor_token: cimdUrl,
        actor_token_type: "urn:ietf:params:oauth:token-type:access_token",
        scope,
        // AgentCore context — picked up by the Auth0 post-token-exchange Action.
        "urn:amazon:bedrock:agent_id":     agentCtx.agentId,
        "urn:amazon:bedrock:alias_id":     agentCtx.aliasId,
        "urn:amazon:bedrock:session_id":   agentCtx.sessionId,
        "urn:amazon:bedrock:action_group": agentCtx.actionGroup,
        ...(audience ? { audience } : {}),
      })
      const resp = await fetch(`https://${domain}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      })
      const data = await resp.json()
      if (resp.ok && data.access_token) {
        const token = data.access_token as string
        return { preview: `${token.slice(0, 20)}…${token.slice(-8)}`, source: "auth0", actClaim }
      }
      console.log("[v0] OBO exchange fell back to simulation:", data.error ?? data)
    } catch (err) {
      console.log("[v0] OBO exchange error:", (err as Error).message)
    }
  }

  // Simulated OBO token — full AgentCore act claim preserved in payload.
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url")
  const payload = Buffer.from(JSON.stringify({
    sub: "sim|user",
    act: actClaim,
    scope,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  })).toString("base64url")
  const token = `${header}.${payload}.sim_sig_${crypto.randomUUID().slice(0, 8)}`
  return { preview: `${token.slice(0, 20)}…${token.slice(-8)}`, source: "simulated", actClaim }
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null
function getJwks() {
  const { domain } = auth0Config()
  if (!domain) return null
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`https://${domain}/.well-known/jwks.json`))
  }
  return jwks
}

/** Verify a real Auth0-issued JWT and project it into CarlosClaims. */
export async function verifyAndProject(token: string): Promise<CarlosClaims | null> {
  const { domain, clientId } = auth0Config()
  const keys = getJwks()
  try {
    let payload: Record<string, unknown>
    if (keys && domain) {
      const verified = await jwtVerify(token, keys, {
        issuer: `https://${domain}/`,
        // id_token audience is the client_id, not the API audience.
        audience: clientId || undefined,
      })
      payload = verified.payload as Record<string, unknown>
    } else {
      // No JWKS available — decode without signature verification (degraded).
      payload = decodeJwt(token) as Record<string, unknown>
    }
    return {
      sub: String(payload.sub ?? "unknown"),
      name: String(payload.name ?? payload.nickname ?? "Carlos Mendez"),
      email: String(payload.email ?? ""),
      picture: payload.picture ? String(payload.picture) : undefined,
      org: String(payload[ORG_CLAIM] ?? "Apex Cooling LLC"),
      tier: String(payload[TIER_CLAIM] ?? "Platinum"),
      source: "auth0",
      raw: payload,
    }
  } catch (err) {
    console.log("[v0] Auth0 token verification failed:", (err as Error).message)
    return null
  }
}

/**
 * Resolve the active session for server components and route handlers.
 * Order of resolution:
 *   1. A real Auth0 id_token stored in an httpOnly cookie (after OIDC callback).
 *   2. A simulated demo session cookie (graceful fallback login).
 *   3. null (logged out).
 */
export async function getSession(): Promise<CarlosClaims | null> {
  const store = await cookies()
  const real = store.get(SESSION_COOKIE)?.value
  if (real) {
    const claims = await verifyAndProject(real)
    if (claims) return claims
  }
  const sim = store.get(SIM_COOKIE)?.value
  if (sim === "1") return SIMULATED_CLAIMS
  return null
}
