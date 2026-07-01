import { NextResponse } from "next/server"
import { getSession, auth0Config } from "@/lib/auth0"
import { getAgent, getAgentCimdUrl, AGENTS } from "@/lib/agents"
import {
  previewCimdClient,
  registerCimdClient,
  createClientGrant,
  getCimdClientStatus,
  managementApiConfigured,
} from "@/lib/auth0-mgmt"

export const dynamic = "force-dynamic"
export const maxDuration = 20

// GET — check registration status for every agent without registering anything.
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

  if (!managementApiConfigured()) {
    return NextResponse.json({ configured: false, agents: [] })
  }

  const results = await Promise.all(
    AGENTS.map(async (agent) => {
      const cimdUrl = getAgentCimdUrl(agent.slug)
      const status = await getCimdClientStatus(cimdUrl)
      return { slug: agent.slug, name: agent.name, cimdUrl, ...status }
    }),
  )

  return NextResponse.json({ configured: true, agents: results })
}

// POST — orchestrates preview → register → grant for one agent slug.
// Registering a slug Auth0 has never seen creates a brand new client_id.
// Re-registering an existing one is idempotent (no-op, reported as such).
export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

  const { slug } = (await req.json().catch(() => ({}))) as { slug?: string }
  const agent = slug ? getAgent(slug) : undefined
  if (!agent) return NextResponse.json({ error: "unknown agent slug" }, { status: 400 })

  if (!managementApiConfigured()) {
    return NextResponse.json({
      ok: false,
      configured: false,
      steps: [],
      message: "AUTH0_MGMT_CLIENT_ID / AUTH0_MGMT_CLIENT_SECRET not set — cannot perform live registration.",
    })
  }

  const cimdUrl = getAgentCimdUrl(agent.slug)
  const { audience } = auth0Config()
  const steps: { label: string; ok: boolean; detail: string }[] = []

  // ── Pre-check: is this genuinely new? ────────────────────────────────
  const preStatus = await getCimdClientStatus(cimdUrl)
  const isNewAgent = !preStatus.registered

  // ── Step 1: Preview ──────────────────────────────────────────────────
  const preview = await previewCimdClient(cimdUrl)
  steps.push({
    label: "Preview CIMD",
    ok: preview.ok,
    detail: preview.ok
      ? `Validated ${cimdUrl} — client_name: ${preview.mappedFields?.client_name ?? "n/a"}`
      : (preview.errors?.[0] ?? "Preview failed"),
  })
  if (!preview.ok) {
    return NextResponse.json({ ok: false, configured: true, steps, isNewAgent })
  }

  // ── Step 2: Register ─────────────────────────────────────────────────
  const registered = await registerCimdClient(cimdUrl)
  steps.push({
    label: isNewAgent ? "Register NEW agent principal" : "Register CIMD client",
    ok: registered.ok,
    detail: registered.ok
      ? registered.alreadyRegistered
        ? `Already registered — client_id: ${registered.clientId}`
        : `✨ New client created — client_id: ${registered.clientId}`
      : (registered.errors?.[0] ?? "Registration failed"),
  })
  if (!registered.ok || !registered.clientId) {
    return NextResponse.json({ ok: false, configured: true, steps, isNewAgent })
  }

  // ── Step 3: Client Grant ──────────────────────────────────────────────
  const grant = await createClientGrant(registered.clientId, audience ?? "https://api.hvac-copilot.demo", agent.scopes)
  steps.push({
    label: "Authorize API access (client grant)",
    ok: grant.ok,
    detail: grant.ok
      ? grant.alreadyExists
        ? `Already authorized for ${audience ?? "https://api.hvac-copilot.demo"} — no changes needed`
        : `Granted scopes: ${agent.scopes.join(", ")}`
      : (grant.errors?.[0] ?? "Grant failed"),
  })

  return NextResponse.json({
    ok: true,
    configured: true,
    clientId: registered.clientId,
    cimdUrl,
    isNewAgent,
    steps,
  })
}
