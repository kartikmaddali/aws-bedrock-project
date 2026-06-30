// Shared types for the AirFlow HVAC Copilot — Auth0 for AI Agents x AWS Bedrock AgentCore.

// Namespaced custom-claim keys. Kept here (client-safe) so both server code and
// client components can reference them without pulling in `next/headers`.
//
// NOTE: Auth0 requires custom claims to be namespaced with a URI, but the URI is
// only a unique identifier — it is never fetched and does not need to be a real
// domain. We deliberately use a non-routable `.demo` namespace to make clear this
// is a demonstration app, not affiliated with any real company.
export const ORG_CLAIM = "https://hvac-copilot.demo/org"
export const TIER_CLAIM = "https://hvac-copilot.demo/tier"

export interface CarlosClaims {
  sub: string
  name: string
  email: string
  picture?: string
  /** Custom claim: corporate org passed straight to the whitelabeled AI. */
  org: string
  /** Custom claim: loyalty / contract tier. */
  tier: string
  /** Whether the active session was minted by a real Auth0 tenant or simulated. */
  source: "auth0" | "simulated"
  /** Raw decoded token claims, for the audit panel. */
  raw: Record<string, unknown>
}

export interface ToolDefinition {
  id: string
  name: string
  description: string
  scopes: string[]
  requiresApproval: boolean
  /** Approximate USD value the tool can transact, used to trip the CIBA threshold. */
  valueCeiling?: number
}

export type ComplianceKind =
  | "session"
  | "token-exchange"
  | "scope"
  | "ciba"
  | "agent"
  | "vault"
  | "guardrail"
  | "delegation"

export interface ComplianceEntry {
  id: string
  ts: string
  kind: ComplianceKind
  label: string
  detail: string
  /** Optional machine-readable payload shown in monospace. */
  meta?: string
}

export type StageId = "context" | "scoped-tools" | "ciba"

export interface StageState {
  id: StageId
  status: "idle" | "active" | "complete"
}

export interface ChatMessage {
  id: string
  role: "user" | "agent" | "system"
  content: string
  /** Scopes that the agent action was bound by. */
  scopes?: string[]
  /** Whether this message triggered the CIBA guardrail. */
  guardrail?: boolean
  pending?: boolean
}

// ── Activity Feed ─────────────────────────────────────────────────────────────

export type ActivityStepKind = "user" | "agentcore" | "obo" | "ciba" | "tool" | "result"

export interface ActivityStep {
  id: string
  kind: ActivityStepKind
  label: string
  detail?: string
  meta?: string
  source?: "auth0" | "simulated"
  status: "running" | "done" | "error"
}

export interface Activity {
  id: string
  title: string
  steps: ActivityStep[]
  status: "running" | "complete" | "error"
  ts: string
}

// ── Token Chain ───────────────────────────────────────────────────────────────

export interface TokenNode {
  preview: string
  ts: string
  source: "auth0" | "simulated"
}

export interface OidcTokenNode extends TokenNode {
  sub: string
  name: string
  org: string
  tier: string
}

export interface AccessTokenNode extends TokenNode {
  scopes: string[]
}

export interface OboTokenNode extends TokenNode {
  sub: string
  actSub: string
  scope: string
  toolId: string
  actClaim?: Record<string, unknown>
}

export interface StepUpTokenNode extends TokenNode {
  scope: string
  actSub: string
}

export interface TokenChainState {
  oidc: OidcTokenNode | null
  access: AccessTokenNode | null
  obo: OboTokenNode | null
  stepUp: StepUpTokenNode | null
}

// ── Agent response ─────────────────────────────────────────────────────────────

export interface AgentResponsePayload {
  message: string
  scopes: string[]
  toolId: string | null
  requiresApproval: boolean
  estimatedValue: number
  source: "bedrock" | "simulated"
  sessionAttributes: Record<string, string>
}

export interface CibaInitResponse {
  authReqId: string
  interval: number
  expiresIn: number
  source: "auth0" | "simulated"
}

export interface CibaPollResponse {
  status: "pending" | "approved" | "denied" | "expired"
  authReqId: string
  /** Present once approved — the freshly minted, scoped access token (redacted). */
  tokenPreview?: string
  source: "auth0" | "simulated"
}

export interface ConnectedTool {
  id: string
  name: string
  category: string
  status: "connected" | "disconnected" | "expired"
  scopes: string[]
  via: "Token Vault" | "My Account API"
  lastSync: string
}
