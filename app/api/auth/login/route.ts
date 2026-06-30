import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { auth0Config, isAuth0Configured, SIM_COOKIE } from "@/lib/auth0"

export const dynamic = "force-dynamic"

// Kicks off the OIDC Authorization Code flow against the live Auth0 tenant.
// When no tenant is configured, we set a simulated session cookie so the
// storyline still runs end to end in the preview.
export async function GET(req: Request) {
  const { domain, clientId, audience, baseUrl } = auth0Config()
  const origin = baseUrl ?? new URL(req.url).origin

  if (!isAuth0Configured() || !domain || !clientId) {
    const store = await cookies()
    store.set(SIM_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    })
    return NextResponse.redirect(`${origin}/?stage=context`)
  }

  const state = crypto.randomUUID()
  const store = await cookies()
  store.set("ha_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  })

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: `${origin}/api/auth/callback`,
    scope: "openid profile email inventory:read pricing:read orders:read",
    state,
  })
  if (audience) params.set("audience", audience)

  return NextResponse.redirect(`https://${domain}/authorize?${params.toString()}`)
}
