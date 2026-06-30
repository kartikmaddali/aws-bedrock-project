import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// Serves the Client-Initiated Metadata Document (CIMD) for the HVAC Copilot
// Agent. The URL of this document IS the agent's client_id in Auth0 A4AA.
// Auth0 fetches this document when the CIMD client is registered.
export async function GET() {
  const baseUrl = process.env.APP_BASE_URL ?? process.env.AUTH0_BASE_URL ?? ""

  const cimdUrl = `${baseUrl}/.well-known/client-metadata.json`

  const document = {
    client_id: cimdUrl,
    client_name: "HVAC Copilot Agent",
    client_uri: baseUrl,
    logo_uri: `${baseUrl}/favicon.ico`,
    redirect_uris: [`${baseUrl}/api/auth/callback`],
    grant_types: [
      "authorization_code",
      "refresh_token",
    ],
    token_endpoint_auth_method: "none",
    scope: [
      "openid",
      "inventory:read",
      "pricing:read",
      "orders:read",
      "orders:write",
      "payments:charge",
      "returns:write",
      "refunds:process",
    ].join(" "),
    application_type: "web",
    response_types: [],
    contacts: [],
  }

  return NextResponse.json(document, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
