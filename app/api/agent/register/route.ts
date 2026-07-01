import { NextResponse } from "next/server"
import { getSession, getCimdUrl, auth0Config } from "@/lib/auth0"
import {
  previewCimdClient,
  registerCimdClient,
  createClientGrant,
  managementApiConfigured,
} from "@/lib/auth0-mgmt"

export const dynamic = "force-dynamic"
export const maxDuration = 20

// Orchestrates the on-the-fly CIMD registration flow:
//   1. Preview  — validate the CIMD URL + document
//   2. Register — POST /api/v2/clients/cimd/register (idempotent)
//   3. Grant    — authorize the CIMD client for the HVAC Copilot API scopes
//
// Gated by a privileged Management API M2M app (AUTH0_MGMT_CLIENT_ID/SECRET) —
// this is the "trusted backend" performing registration on the agent's behalf,
// not the agent registering itself anonymously.
export async function POST() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

  if (!managementApiConfigured()) {
    return NextResponse.json({
      ok: false,
      configured: false,
      steps: [],
      message: "AUTH0_MGMT_CLIENT_ID / AUTH0_MGMT_CLIENT_SECRET not set — cannot perform live registration.",
    })
  }

  const cimdUrl = getCimdUrl()
  const { audience } = auth0Config()
  const steps: { label: string; ok: boolean; detail: string }[] = []

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
    return NextResponse.json({ ok: false, configured: true, steps })
  }

  // ── Step 2: Register ─────────────────────────────────────────────────
  const registered = await registerCimdClient(cimdUrl)
  steps.push({
    label: "Register CIMD client",
    ok: registered.ok,
    detail: registered.ok
      ? registered.alreadyRegistered
        ? `Already registered — client_id: ${registered.clientId}`
        : `Registered — client_id: ${registered.clientId}`
      : (registered.errors?.[0] ?? "Registration failed"),
  })
  if (!registered.ok || !registered.clientId) {
    return NextResponse.json({ ok: false, configured: true, steps })
  }

  // ── Step 3: Client Grant ──────────────────────────────────────────────
  const scopes = [
    "inventory:read", "pricing:read", "orders:read",
    "orders:write", "payments:charge", "returns:write", "refunds:process",
  ]
  const grant = await createClientGrant(registered.clientId, audience ?? "https://api.hvac-copilot.demo", scopes)
  steps.push({
    label: "Authorize API access (client grant)",
    ok: grant.ok,
    detail: grant.ok
      ? grant.alreadyExists
        ? `Already authorized for ${audience ?? "https://api.hvac-copilot.demo"} — no changes needed`
        : `Granted scopes: ${scopes.join(", ")}`
      : (grant.errors?.[0] ?? "Grant failed"),
  })

  return NextResponse.json({
    ok: true,
    configured: true,
    clientId: registered.clientId,
    cimdUrl,
    steps,
  })
}
