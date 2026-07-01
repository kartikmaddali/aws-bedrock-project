// Registry of distinct AgentCore agent identities for the A4AA demo.
// Each agent gets its own CIMD document and its own Auth0 principal —
// registering a NEW agent (not yet seen by Auth0) creates a fresh client_id.

export interface AgentDefinition {
  slug: string
  name: string
  description: string
  scopes: string[]
}

export const AGENTS: AgentDefinition[] = [
  {
    slug: "hvac-copilot",
    name: "HVAC Copilot Agent",
    description: "General-purpose AgentCore orchestrator — routes across all action groups.",
    scopes: [
      "openid", "inventory:read", "pricing:read", "orders:read",
      "orders:write", "payments:charge", "returns:write", "refunds:process",
    ],
  },
  {
    slug: "sales-copilot",
    name: "Sales Copilot Agent",
    description: "Read-only agent — inventory search, contractor pricing, order history.",
    scopes: ["openid", "inventory:read", "pricing:read", "orders:read"],
  },
  {
    slug: "transaction-agent",
    name: "Transaction Agent",
    description: "High-value agent — bulk orders and returns, always gated by CIBA.",
    scopes: ["openid", "orders:write", "payments:charge", "returns:write", "refunds:process"],
  },
]

export function getAgent(slug: string): AgentDefinition | undefined {
  return AGENTS.find((a) => a.slug === slug)
}

/** The CIMD URL for a given agent. The legacy "hvac-copilot" agent keeps the
 *  original root-level path for backwards compatibility with prior registration. */
export function getAgentCimdUrl(slug: string): string {
  const base = process.env.APP_BASE_URL ?? process.env.AUTH0_BASE_URL ?? ""
  if (slug === "hvac-copilot") return `${base}/.well-known/client-metadata.json`
  return `${base}/.well-known/agents/${slug}/metadata.json`
}
