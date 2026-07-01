import { NextResponse } from "next/server"
import { getAgent, getAgentCimdUrl } from "@/lib/agents"

export const dynamic = "force-dynamic"

// Serves a per-agent CIMD document. Each distinct agent slug gets its own
// hosted metadata document — and therefore its own client_id when registered
// in Auth0 for the first time.
export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params
  const agent = getAgent(slug)
  if (!agent) return NextResponse.json({ error: "unknown agent" }, { status: 404 })

  const baseUrl = process.env.APP_BASE_URL ?? process.env.AUTH0_BASE_URL ?? ""
  const cimdUrl = getAgentCimdUrl(slug)

  const document = {
    client_id: cimdUrl,
    client_name: agent.name,
    client_uri: baseUrl,
    logo_uri: `${baseUrl}/favicon.ico`,
    description: agent.description,
    redirect_uris: [`${baseUrl}/api/auth/callback`],
    grant_types: ["authorization_code", "refresh_token"],
    token_endpoint_auth_method: "none",
    scope: agent.scopes.join(" "),
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
