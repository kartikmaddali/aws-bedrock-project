import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { auth0Config, isAuth0Configured, SESSION_COOKIE, SIM_COOKIE } from "@/lib/auth0"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const { domain, clientId, baseUrl } = auth0Config()
  const origin = baseUrl ?? new URL(req.url).origin

  const store = await cookies()
  store.delete(SESSION_COOKIE)
  store.delete(SIM_COOKIE)
  store.delete("ha_access_token")

  if (isAuth0Configured() && domain && clientId) {
    const params = new URLSearchParams({
      client_id: clientId,
      returnTo: origin,
    })
    return NextResponse.redirect(`https://${domain}/v2/logout?${params.toString()}`)
  }
  return NextResponse.redirect(origin)
}
