import { NextResponse } from "next/server"
import { auth0Config, getSession, getCimdUrl } from "@/lib/auth0"
import type { CibaInitResponse, CibaPollResponse } from "@/lib/types"

export const dynamic = "force-dynamic"

// In-memory tracking of simulated CIBA requests. Real deployments rely on
// Auth0's backchannel endpoints; here we model the polling lifecycle so the
// guardrail dialog resolves end to end in the preview.
const simRequests = new Map<string, { createdAt: number; approveAfterMs: number }>()

function cibaConfigured() {
  const { domain, clientId } = auth0Config()
  return Boolean(domain && clientId && process.env.AUTH0_CLIENT_SECRET)
}

// POST = initiate backchannel authorization (bc-authorize).
export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

  const { binding_message } = (await req.json().catch(() => ({}))) as {
    binding_message?: string
  }
  const { domain, clientId, clientSecret, audience } = auth0Config()

  if (cibaConfigured() && domain && clientId) {
    try {
      const body = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret as string,
        scope: "openid orders:write payments:charge",
        binding_message: binding_message ?? "Approve high-value order",
        login_hint: JSON.stringify({
          format: "iss_sub",
          iss: `https://${domain}/`,
          sub: session.sub,
        }),
        // A4AA: identify the agent principal making the request.
        actor_token: getCimdUrl(),
        actor_token_type: "urn:ietf:params:oauth:token-type:access_token",
      })
      if (audience) body.set("audience", audience)
      const resp = await fetch(`https://${domain}/bc-authorize`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      })
      const data = await resp.json()
      if (resp.ok && data.auth_req_id) {
        const payload: CibaInitResponse = {
          authReqId: data.auth_req_id,
          interval: data.interval ?? 5,
          expiresIn: data.expires_in ?? 300,
          source: "auth0",
        }
        return NextResponse.json(payload)
      }
      console.log("[v0] bc-authorize failed, simulating:", data)
    } catch (err) {
      console.log("[v0] bc-authorize error, simulating:", (err as Error).message)
    }
  }

  // Simulated backchannel request — resolves to approved after ~6s of polling.
  const authReqId = `sim_${crypto.randomUUID()}`
  simRequests.set(authReqId, { createdAt: Date.now(), approveAfterMs: 6000 })
  const payload: CibaInitResponse = {
    authReqId,
    interval: 2,
    expiresIn: 120,
    source: "simulated",
  }
  return NextResponse.json(payload)
}

// GET = poll the token endpoint for the backchannel decision.
export async function GET(req: Request) {
  const url = new URL(req.url)
  const authReqId = url.searchParams.get("authReqId")
  if (!authReqId) return NextResponse.json({ error: "missing authReqId" }, { status: 400 })

  const { domain, clientId, clientSecret } = auth0Config()

  if (!authReqId.startsWith("sim_") && cibaConfigured() && domain && clientId) {
    try {
      const body = new URLSearchParams({
        grant_type: "urn:openid:params:grant-type:ciba",
        auth_req_id: authReqId,
        client_id: clientId,
        client_secret: clientSecret as string,
      })
      const resp = await fetch(`https://${domain}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      })
      const data = await resp.json()
      if (resp.ok && data.access_token) {
        const token = data.access_token as string
        const payload: CibaPollResponse = {
          status: "approved",
          authReqId,
          tokenPreview: `${token.slice(0, 12)}…${token.slice(-6)}`,
          source: "auth0",
        }
        return NextResponse.json(payload)
      }
      const status =
        data.error === "authorization_pending" || data.error === "slow_down"
          ? "pending"
          : data.error === "access_denied"
            ? "denied"
            : data.error === "expired_token"
              ? "expired"
              : "pending"
      return NextResponse.json({ status, authReqId, source: "auth0" } as CibaPollResponse)
    } catch (err) {
      console.log("[v0] ciba poll error:", (err as Error).message)
      return NextResponse.json({ status: "pending", authReqId, source: "auth0" } as CibaPollResponse)
    }
  }

  // Simulated polling lifecycle.
  const rec = simRequests.get(authReqId)
  if (!rec) {
    return NextResponse.json({ status: "expired", authReqId, source: "simulated" } as CibaPollResponse)
  }
  const elapsed = Date.now() - rec.createdAt
  if (elapsed >= rec.approveAfterMs) {
    simRequests.delete(authReqId)
    const fakeToken = `eyJhbGciOiJSUzI1NiI.${crypto.randomUUID().replace(/-/g, "")}.sig`
    const payload: CibaPollResponse = {
      status: "approved",
      authReqId,
      tokenPreview: `${fakeToken.slice(0, 12)}…${fakeToken.slice(-6)}`,
      source: "simulated",
    }
    return NextResponse.json(payload)
  }
  return NextResponse.json({ status: "pending", authReqId, source: "simulated" } as CibaPollResponse)
}
