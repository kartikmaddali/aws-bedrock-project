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
  const { domain, audience } = auth0Config()
  const keys = getJwks()
  try {
    let payload: Record<string, unknown>
    if (keys && domain) {
      const verified = await jwtVerify(token, keys, {
        issuer: `https://${domain}/`,
        audience: audience || undefined,
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
