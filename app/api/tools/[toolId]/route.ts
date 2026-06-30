import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { decodeJwt } from "jose"
import { getSession } from "@/lib/auth0"
import { getTool } from "@/lib/tools"

export const dynamic = "force-dynamic"

// Mirrors the original Express `POST /api/tools/:toolId` handler: verifies the
// session, enforces the tool's required OAuth scopes, then executes.
export async function POST(
  req: Request,
  ctx: { params: Promise<{ toolId: string }> },
) {
  const { toolId } = await ctx.params
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
  }

  const tool = getTool(toolId)
  if (!tool) return NextResponse.json({ error: "Tool not found" }, { status: 404 })

  // Resolve granted scopes from the live access token when present, otherwise
  // from the simulated session claims.
  const store = await cookies()
  const accessToken = store.get("ha_access_token")?.value
  let granted: string[] = []
  if (accessToken) {
    try {
      const payload = decodeJwt(accessToken) as { scope?: string }
      granted = (payload.scope ?? "").split(" ").filter(Boolean)
    } catch {
      granted = []
    }
  } else {
    granted = String(session.raw.scope ?? "").split(" ").filter(Boolean)
  }

  const hasScopes = tool.scopes.every((s) => granted.includes(s))
  if (!hasScopes) {
    return NextResponse.json(
      { error: "insufficient_scope", required: tool.scopes, granted },
      { status: 403 },
    )
  }

  const args = await req.json().catch(() => ({}))
  return NextResponse.json({
    result: {
      success: true,
      tool: tool.id,
      scopesUsed: tool.scopes,
      org: session.org,
      message: `${tool.name} executed for ${session.org}`,
      args,
      timestamp: new Date().toISOString(),
    },
  })
}
