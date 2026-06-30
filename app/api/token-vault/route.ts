import { NextResponse } from "next/server"
import { auth0Config, getSession } from "@/lib/auth0"
import type { ConnectedTool } from "@/lib/types"

export const dynamic = "force-dynamic"

function vaultConfigured() {
  const { domain } = auth0Config()
  return Boolean(domain && process.env.AUTH0_MY_ACCOUNT_TOKEN)
}

// Queries the Auth0 Token Vault / My Account API for the contractor's connected
// software. Falls back to a representative connection set when not configured.
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

  const { domain } = auth0Config()
  const source: "auth0" | "simulated" = vaultConfigured() ? "auth0" : "simulated"

  if (vaultConfigured() && domain) {
    try {
      const resp = await fetch(`https://${domain}/me/v1/connected-accounts`, {
        headers: { Authorization: `Bearer ${process.env.AUTH0_MY_ACCOUNT_TOKEN}` },
      })
      if (resp.ok) {
        const data = await resp.json()
        return NextResponse.json({ tools: data, source: "auth0" })
      }
      console.log("[v0] token vault fetch non-200, simulating:", resp.status)
    } catch (err) {
      console.log("[v0] token vault error, simulating:", (err as Error).message)
    }
  }

  const tools: ConnectedTool[] = [
    {
      id: "google-workspace",
      name: "Google Workspace",
      category: "Email & Calendar",
      status: "connected",
      scopes: ["calendar.events", "gmail.send"],
      via: "Token Vault",
      lastSync: "2 min ago",
    },
    {
      id: "field-erp",
      name: "Apex Field ERP",
      category: "Operations",
      status: "connected",
      scopes: ["jobs:read", "dispatch:write"],
      via: "My Account API",
      lastSync: "just now",
    },
    {
      id: "quickbooks",
      name: "QuickBooks Online",
      category: "Accounting",
      status: "expired",
      scopes: ["invoices:read"],
      via: "Token Vault",
      lastSync: "3 days ago",
    },
    {
      id: "twilio",
      name: "Twilio SMS",
      category: "Notifications",
      status: "disconnected",
      scopes: [],
      via: "Token Vault",
      lastSync: "never",
    },
  ]
  return NextResponse.json({ tools, source })
}
