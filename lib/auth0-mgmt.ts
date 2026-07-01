import { auth0Config } from "./auth0"

// ---------------------------------------------------------------------------
// Auth0 Management API client — used to register CIMD clients and grant
// them API access programmatically ("on the fly"), gated by a privileged
// M2M application (AUTH0_MGMT_CLIENT_ID/SECRET) rather than the Dashboard.
// ---------------------------------------------------------------------------

let mgmtToken: { token: string; expiresAt: number } | null = null

async function getManagementToken(): Promise<string | null> {
  const { domain } = auth0Config()
  const clientId = process.env.AUTH0_MGMT_CLIENT_ID
  const clientSecret = process.env.AUTH0_MGMT_CLIENT_SECRET
  if (!domain || !clientId || !clientSecret) return null

  if (mgmtToken && mgmtToken.expiresAt > Date.now()) return mgmtToken.token

  try {
    const resp = await fetch(`https://${domain}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        audience: `https://${domain}/api/v2/`,
      }),
    })
    const data = await resp.json()
    if (!resp.ok || !data.access_token) {
      console.log("[v0] Management API token fetch failed:", data)
      return null
    }
    mgmtToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 }
    return mgmtToken.token
  } catch (err) {
    console.log("[v0] Management API token error:", (err as Error).message)
    return null
  }
}

export interface CimdPreviewResult {
  ok: boolean
  mappedFields?: Record<string, unknown>
  warnings?: string[]
  errors?: string[]
}

/** POST /api/v2/clients/cimd/preview — validate a CIMD URL + document. */
export async function previewCimdClient(cimdUrl: string): Promise<CimdPreviewResult> {
  const { domain } = auth0Config()
  const token = await getManagementToken()
  if (!domain || !token) return { ok: false, errors: ["Management API not configured"] }

  try {
    const resp = await fetch(`https://${domain}/api/v2/clients/cimd/preview`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ external_client_id: cimdUrl }),
    })
    const data = await resp.json()
    if (!resp.ok) return { ok: false, errors: [data.message ?? JSON.stringify(data)] }
    return { ok: true, mappedFields: data.mapped_fields, warnings: data.validation?.warnings ?? [] }
  } catch (err) {
    return { ok: false, errors: [(err as Error).message] }
  }
}

export interface CimdRegisterResult {
  ok: boolean
  clientId?: string
  alreadyRegistered?: boolean
  errors?: string[]
}

/**
 * Register (or find existing) CIMD client.
 * Checks /api/v2/clients?external_client_id=... first — registration is
 * idempotent from the demo's perspective.
 */
export async function registerCimdClient(cimdUrl: string): Promise<CimdRegisterResult> {
  const { domain } = auth0Config()
  const token = await getManagementToken()
  if (!domain || !token) return { ok: false, errors: ["Management API not configured"] }

  try {
    const existing = await fetch(
      `https://${domain}/api/v2/clients?external_client_id=${encodeURIComponent(cimdUrl)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (existing.ok) {
      const existingData = await existing.json()
      if (Array.isArray(existingData) && existingData.length > 0) {
        return { ok: true, clientId: existingData[0].client_id, alreadyRegistered: true }
      }
    }
  } catch {
    // fall through to registration attempt
  }

  try {
    const resp = await fetch(`https://${domain}/api/v2/clients/cimd/register`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ external_client_id: cimdUrl }),
    })
    const data = await resp.json()
    if (!resp.ok) return { ok: false, errors: [data.message ?? JSON.stringify(data)] }
    return { ok: true, clientId: data.client_id }
  } catch (err) {
    return { ok: false, errors: [(err as Error).message] }
  }
}

export interface ClientGrantResult {
  ok: boolean
  grantId?: string
  errors?: string[]
}

/** POST /api/v2/client-grants — authorize the CIMD client for API scopes. */
export async function createClientGrant(
  clientId: string,
  audience: string,
  scopes: string[],
): Promise<ClientGrantResult> {
  const { domain } = auth0Config()
  const token = await getManagementToken()
  if (!domain || !token) return { ok: false, errors: ["Management API not configured"] }

  try {
    const resp = await fetch(`https://${domain}/api/v2/client-grants`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, audience, scope: scopes }),
    })
    const data = await resp.json()
    if (!resp.ok) return { ok: false, errors: [data.message ?? JSON.stringify(data)] }
    return { ok: true, grantId: data.id }
  } catch (err) {
    return { ok: false, errors: [(err as Error).message] }
  }
}

export function managementApiConfigured(): boolean {
  return Boolean(
    process.env.AUTH0_MGMT_CLIENT_ID &&
    process.env.AUTH0_MGMT_CLIENT_SECRET &&
    auth0Config().domain,
  )
}
