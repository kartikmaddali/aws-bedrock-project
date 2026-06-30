import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { auth0Config, SESSION_COOKIE } from "@/lib/auth0"

export const dynamic = "force-dynamic"

// Exchanges the authorization code for tokens at Auth0's /oauth/token endpoint
// and persists the id_token in an httpOnly session cookie.
export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const { domain, clientId, clientSecret, baseUrl } = auth0Config()
  const origin = baseUrl ?? url.origin

  const store = await cookies()
  const expectedState = store.get("ha_oauth_state")?.value

  if (!code || !domain || !clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/?error=auth_config`)
  }
  if (!state || state !== expectedState) {
    return NextResponse.redirect(`${origin}/?error=state_mismatch`)
  }

  try {
    const resp = await fetch(`https://${domain}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${origin}/api/auth/callback`,
      }),
    })
    const tokens = await resp.json()
    if (!resp.ok) {
      console.log("[v0] token exchange failed:", tokens)
      return NextResponse.redirect(`${origin}/?error=token_exchange`)
    }

    const idToken = tokens.id_token as string
    store.set(SESSION_COOKIE, idToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    })
    if (tokens.access_token) {
      store.set("ha_access_token", tokens.access_token as string, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 8,
      })
    }
    store.delete("ha_oauth_state")
    return NextResponse.redirect(`${origin}/?stage=context`)
  } catch (err) {
    console.log("[v0] callback error:", (err as Error).message)
    return NextResponse.redirect(`${origin}/?error=callback`)
  }
}
