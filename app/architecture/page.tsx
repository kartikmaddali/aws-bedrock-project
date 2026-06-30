import {
  Cpu, ShieldCheck, ArrowRight, CheckCircle2,
  XCircle, Bot, User, Database, Link2,
  GitMerge, ShieldAlert, Boxes, Network, LayoutDashboard,
} from "lucide-react"

export const metadata = { title: "Architecture — AWS AgentCore × Auth0 A4AA" }

// ── Shared primitives ─────────────────────────────────────────────────────────

function Section({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="flex flex-col gap-6">
      {children}
    </section>
  )
}

function SectionHeading({ label, title, subtitle }: { label: string; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">{label}</span>
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <p className="text-muted-foreground leading-relaxed">{subtitle}</p>
    </div>
  )
}

function Divider() {
  return <div className="border-t border-border" />
}

// ── Section 1: Hero ───────────────────────────────────────────────────────────

function Hero() {
  return (
    <div className="rounded-xl border border-border bg-card p-8 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/15">
          <Cpu className="size-5 text-amber-500" />
        </div>
        <span className="font-mono text-sm font-semibold text-amber-500">AWS Bedrock AgentCore</span>
        <span className="text-muted-foreground">×</span>
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15">
          <ShieldCheck className="size-5 text-primary" />
        </div>
        <span className="font-mono text-sm font-semibold text-primary">Auth0 A4AA</span>
      </div>
      <h1 className="text-3xl font-bold tracking-tight">
        Securing AI Agents with Identity
      </h1>
      <p className="max-w-2xl text-lg text-muted-foreground leading-relaxed">
        AWS Bedrock AgentCore orchestrates what the agent does. Auth0 secures who it is,
        whose behalf it acts on, and whether each action is authorized — without AWS needing
        to own identity or enterprise access control.
      </p>
      <div className="flex flex-wrap gap-3 pt-2">
        {[
          { label: "CIMD", desc: "Agent identity standard" },
          { label: "OBO", desc: "Delegated authorization" },
          { label: "CIBA", desc: "Human-in-the-loop approval" },
          { label: "Token Vault", desc: "Third-party token management" },
        ].map((c) => (
          <div key={c.label} className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1">
            <span className="font-mono text-xs font-bold text-primary">{c.label}</span>
            <span className="text-xs text-muted-foreground">{c.desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Section 2: Responsibility Split ──────────────────────────────────────────

const AWS_ROWS = [
  { icon: Cpu,      label: "Agent Orchestration",    desc: "Prompt routing, reasoning, tool selection via LLM" },
  { icon: Bot,      label: "Action Group Execution",  desc: "Invoke sub-agents / tools with business logic" },
  { icon: Database, label: "Session & Memory",        desc: "Session state, knowledge base, conversation history" },
  { icon: ArrowRight, label: "ReturnControl",         desc: "Hand back to the client for human-in-the-loop steps" },
  { icon: Network,  label: "Streaming Responses",     desc: "SSE chunks delivered to the UI in real-time" },
]

const AUTH0_ROWS = [
  { icon: User,       label: "Enterprise User Identity",  desc: "OIDC login, any IdP, custom claims (org, tier) into AgentCore sessionAttributes" },
  { icon: Link2,      label: "Agent Identity (CIMD)",     desc: "Agent registers via hosted metadata doc — CIMD URL becomes the agent's client_id in Auth0" },
  { icon: GitMerge,   label: "Delegated Auth (OBO)",      desc: "RFC 8693 token exchange — agent gets a token scoped to exactly one tool, on behalf of the user" },
  { icon: ShieldAlert, label: "Human Approval (CIBA)",    desc: "Backchannel push to Dispatch Manager — step-up token only minted after explicit approval" },
  { icon: Boxes,      label: "Token Vault",               desc: "Agent borrows third-party tokens (ERP, calendar) without ever seeing user credentials" },
]

function ResponsibilitySplit() {
  return (
    <Section id="responsibility">
      <SectionHeading
        label="01 — Division of Responsibilities"
        title="Who does what"
        subtitle="AgentCore owns the intelligence. Auth0 owns the identity and authorization. Neither duplicates the other."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {/* AWS column */}
        <div className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <div className="flex items-center gap-2">
            <Cpu className="size-5 text-amber-500" />
            <span className="font-semibold text-amber-500">AWS Bedrock AgentCore</span>
            <span className="ml-auto rounded bg-amber-500/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-amber-600">SIMULATED</span>
          </div>
          <p className="text-xs text-muted-foreground">Handles reasoning, orchestration, and execution.</p>
          <div className="flex flex-col gap-2">
            {AWS_ROWS.map((r) => {
              const Icon = r.icon
              return (
                <div key={r.label} className="flex gap-3 rounded-lg bg-amber-500/5 px-3 py-2.5">
                  <Icon className="size-4 shrink-0 text-amber-500 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold">{r.label}</span>
                    <span className="text-xs text-muted-foreground leading-snug">{r.desc}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Auth0 column */}
        <div className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            <span className="font-semibold text-primary">Auth0 A4AA</span>
            <span className="ml-auto rounded bg-success/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-success">LIVE</span>
          </div>
          <p className="text-xs text-muted-foreground">Handles identity, delegation, and access control.</p>
          <div className="flex flex-col gap-2">
            {AUTH0_ROWS.map((r) => {
              const Icon = r.icon
              return (
                <div key={r.label} className="flex gap-3 rounded-lg bg-primary/5 px-3 py-2.5">
                  <Icon className="size-4 shrink-0 text-primary mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold">{r.label}</span>
                    <span className="text-xs text-muted-foreground leading-snug">{r.desc}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Section>
  )
}

// ── Section 3: Better Together Flow ──────────────────────────────────────────

const FLOW_STEPS = [
  {
    n: "01",
    title: "User Authentication",
    aws: "AgentCore receives sessionAttributes containing the user's identity — no Auth0 SDK needed in the agent.",
    auth0: "Auth0 OIDC login mints an id_token with custom claims (org=Apex Cooling, tier=Platinum). These flow directly into AgentCore's session.",
    tokens: ["id_token", "access_token"],
    color: "blue",
  },
  {
    n: "02",
    title: "Agent Identity (CIMD)",
    aws: "AgentCore agent is represented as a CIMD principal — its metadata document URL is its client_id in Auth0.",
    auth0: "CIMD document hosted on the app domain. Auth0 tenant admin registers it once via Dynamic Client Registration (RFC 7591). The URL becomes the agent's cryptographic identity.",
    tokens: ["CIMD URL = client_id"],
    color: "violet",
  },
  {
    n: "03",
    title: "Scoped Tool Execution (OBO)",
    aws: "AgentCore selects an action group (e.g. search_inventory). The tool call is only executed if the OBO token carries the right scope.",
    auth0: "RFC 8693 token exchange: user's access_token → delegated OBO token scoped to exactly this tool. The Auth0 Action writes the full AgentCore context into the act claim.",
    tokens: ["OBO token: sub=user, act=agent, scope=inventory:read"],
    color: "green",
  },
  {
    n: "04",
    title: "Human-in-the-Loop (CIBA)",
    aws: "AgentCore emits ReturnControl when it needs human approval. The client polls for the decision before letting the agent proceed.",
    auth0: "Auth0 CIBA: backchannel push to Dispatch Manager's device. Only after approval does Auth0 mint a step-up token carrying orders:write + payments:charge.",
    tokens: ["Step-up token: scope=orders:write payments:charge"],
    color: "orange",
  },
]

const COLOR_MAP: Record<string, { border: string; bg: string; text: string; badge: string }> = {
  blue:   { border: "border-blue-500/30",   bg: "bg-blue-500/5",   text: "text-blue-500",   badge: "bg-blue-500/15 text-blue-600"   },
  violet: { border: "border-violet-500/30", bg: "bg-violet-500/5", text: "text-violet-500", badge: "bg-violet-500/15 text-violet-600" },
  green:  { border: "border-success/30",    bg: "bg-success/5",    text: "text-success",    badge: "bg-success/15 text-success"      },
  orange: { border: "border-warning/30",    bg: "bg-warning/5",    text: "text-warning",    badge: "bg-warning/15 text-warning"      },
}

function BetterTogetherFlow() {
  return (
    <Section id="flow">
      <SectionHeading
        label="02 — The Better Together Flow"
        title="How they hand off to each other"
        subtitle="Each step shows exactly where AgentCore stops and Auth0 starts — and why the handoff matters."
      />
      <div className="flex flex-col gap-4">
        {FLOW_STEPS.map((step, i) => {
          const c = COLOR_MAP[step.color]
          return (
            <div key={step.n} className={`rounded-xl border ${c.border} ${c.bg} p-5`}>
              <div className="flex items-start gap-4">
                <span className={`font-mono text-2xl font-black ${c.text} shrink-0 leading-none mt-1`}>{step.n}</span>
                <div className="flex-1 flex flex-col gap-4">
                  <h3 className="text-base font-bold">{step.title}</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                      <div className="flex items-center gap-1.5">
                        <Cpu className="size-3.5 text-amber-500" />
                        <span className="text-[11px] font-bold uppercase tracking-wide text-amber-500">AgentCore</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{step.aws}</p>
                    </div>
                    <div className="flex flex-col gap-1.5 rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="size-3.5 text-primary" />
                        <span className="text-[11px] font-bold uppercase tracking-wide text-primary">Auth0</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{step.auth0}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {step.tokens.map((t) => (
                      <code key={t} className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold ${c.badge}`}>
                        {t}
                      </code>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Section>
  )
}

// ── Section 4: Auth0 Value Props ──────────────────────────────────────────────

const VALUE_PROPS = [
  {
    icon: Link2,
    title: "CIMD — Agent Identity Standard",
    tagline: "The agent has a passport, not just a name.",
    what: "Client ID Metadata Document hosted on a secure domain. The URL itself is the agent's cryptographic identity in Auth0.",
    why: "IAM roles identify AWS resources. CIMD identifies agents across any system — AWS, on-prem, SaaS. Enterprises register trusted agents once via Dynamic Client Registration.",
    demo: "https://aws-bedrock-project.vercel.app/.well-known/client-metadata.json",
    demoLabel: "Live CIMD document",
    iam: "IAM roles are AWS-scoped and can't represent cross-system agent identity",
  },
  {
    icon: GitMerge,
    title: "OBO — Delegated Authorization",
    tagline: "The agent proves who it's acting for.",
    what: "RFC 8693 token exchange: user's token → delegated token with sub=user and act=agent. Scoped to exactly the tool being invoked.",
    why: "Without OBO, the agent either has full user privileges (too broad) or its own fixed permissions (loses user context). OBO gives least-privilege delegation.",
    demo: '{ "sub": "carlos", "act": { "sub": "cimd-url", "urn:amazon:bedrock:action_group": "search_inventory" }, "scope": "inventory:read" }',
    demoLabel: "OBO token act claim",
    iam: "IAM can't express 'this Lambda is acting on behalf of this specific enterprise user with their delegated consent'",
  },
  {
    icon: ShieldAlert,
    title: "CIBA — Human-in-the-Loop Approval",
    tagline: "High-value actions wait for a human.",
    what: "Client-Initiated Backchannel Authentication. Agent triggers a push to the Dispatch Manager's device. Auth0 polls until approved — then mints a step-up token.",
    why: "AI agents can make mistakes on high-value actions. CIBA adds a human checkpoint that's cryptographically enforced — the agent literally cannot charge payment without the step-up token.",
    demo: "orders:write + payments:charge only issued after Dispatch Manager taps Approve",
    demoLabel: "Step-up scope gate",
    iam: "IAM has no concept of backchannel push approval or step-up token issuance based on human decision",
  },
  {
    icon: Boxes,
    title: "Token Vault — Third-Party Token Management",
    tagline: "The agent borrows access, never holds credentials.",
    what: "Auth0 stores scoped third-party tokens (ERP, calendar, accounting) linked to the user. The agent borrows them on demand via the My Account API.",
    why: "The agent doesn't store passwords or long-lived credentials. It requests a time-limited scoped token per action. The user can revoke any connection at any time.",
    demo: "Google Workspace, Apex Field ERP, QuickBooks — all connected via Token Vault",
    demoLabel: "Connected integrations",
    iam: "IAM Secrets Manager stores credentials but doesn't handle user-delegated third-party OAuth tokens or per-user consent management",
  },
]

function ValueProps() {
  return (
    <Section id="value-props">
      <SectionHeading
        label="03 — Auth0 Value Propositions"
        title="What Auth0 adds that AWS can't"
        subtitle="Four capabilities that complement AgentCore — each solving a problem that IAM or Cognito alone cannot address in enterprise agentic flows."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {VALUE_PROPS.map((v) => {
          const Icon = v.icon
          return (
            <div key={v.title} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="size-5 text-primary" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-sm font-bold leading-tight">{v.title}</h3>
                  <p className="text-xs italic text-muted-foreground">{v.tagline}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">What it does</p>
                  <p className="text-xs leading-relaxed text-foreground/80">{v.what}</p>
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Why it matters</p>
                  <p className="text-xs leading-relaxed text-foreground/80">{v.why}</p>
                </div>
                <code className="block rounded-lg border border-border bg-muted/50 p-2.5 font-mono text-[10px] leading-relaxed text-primary/80 break-all">
                  {v.demo}
                </code>
              </div>

              <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-2.5">
                <XCircle className="size-3.5 shrink-0 text-destructive mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-snug">
                  <span className="font-semibold text-destructive">Why not IAM: </span>
                  {v.iam}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </Section>
  )
}

// ── Section 5: Token Chain Explained ─────────────────────────────────────────

const TOKEN_NODES = [
  {
    n: 1,
    label: "id_token",
    title: "OIDC Session",
    color: "blue",
    owner: "auth0",
    when: "On login",
    claims: ["sub: user identity", "org: Apex Cooling LLC", "tier: Platinum"],
    meaning: "Proves who Carlos is. Custom claims flow directly into AgentCore sessionAttributes — no DB lookup, no separate profile API.",
  },
  {
    n: 2,
    label: "access_token",
    title: "Bearer Token",
    color: "blue",
    owner: "auth0",
    when: "On login",
    claims: ["scope: openid inventory:read pricing:read orders:read", "aud: api.hvac-copilot.demo"],
    meaning: "Defines what Carlos is allowed to do. The agent cannot exceed these scopes — OBO narrows them further per tool call.",
  },
  {
    n: 3,
    label: "OBO token",
    title: "Agent Delegated Token",
    color: "violet",
    owner: "auth0",
    when: "Per tool call",
    claims: [
      "sub: auth0|carlos (user)",
      "act.sub: cimd-url (agent)",
      "act.urn:amazon:bedrock:action_group: search_inventory",
      "scope: inventory:read (narrowed)",
    ],
    meaning: "Cryptographic proof that this specific agent, in this specific action group, is acting on behalf of this specific user, with least-privilege scope. Verifiable by any downstream API without calling AWS.",
  },
  {
    n: 4,
    label: "step-up token",
    title: "CIBA Step-up",
    color: "orange",
    owner: "auth0",
    when: "After CIBA approval",
    claims: [
      "scope: orders:write payments:charge",
      "act.sub: cimd-url",
      "ciba:approved: true",
    ],
    meaning: "Only issued after Dispatch Manager explicitly approved. The agent was unable to charge payment before this token existed — authorization is cryptographically enforced, not policy-based.",
  },
]

function TokenChainExplained() {
  return (
    <Section id="token-chain">
      <SectionHeading
        label="04 — The Token Chain"
        title="Every token tells a story"
        subtitle="Four tokens. Each one a cryptographic proof of a different security guarantee. Together they form an auditable, verifiable delegation chain."
      />
      <div className="flex flex-col gap-3">
        {TOKEN_NODES.map((node, i) => {
          const c = COLOR_MAP[node.color]
          return (
            <div key={node.n} className="flex gap-4">
              {/* Left: connector */}
              <div className="flex flex-col items-center">
                <div className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 ${c.border} font-mono text-sm font-black ${c.text}`}>
                  {node.n}
                </div>
                {i < TOKEN_NODES.length - 1 && (
                  <div className="mt-1 w-px flex-1 bg-border/50" style={{ minHeight: 16 }} />
                )}
              </div>

              {/* Right: content */}
              <div className={`flex-1 mb-3 rounded-xl border ${c.border} ${c.bg} p-4`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-bold">{node.title}</h3>
                      <code className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${c.badge}`}>{node.label}</code>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Issued by Auth0 · {node.when}</p>
                  </div>
                  <ShieldCheck className={`size-5 shrink-0 ${c.text}`} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Key Claims</p>
                    <div className="flex flex-col gap-1">
                      {node.claims.map((claim) => (
                        <code key={claim} className="block truncate rounded bg-muted/50 px-2 py-1 font-mono text-[10px] text-foreground/70">
                          {claim}
                        </code>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Security Guarantee</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{node.meaning}</p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Section>
  )
}

// ── Section 6: Why not just IAM ───────────────────────────────────────────────

const COMPARISON = [
  { capability: "Enterprise SSO (any IdP)",      iam: false, cognito: "partial", auth0: true  },
  { capability: "Agent Identity (CIMD)",          iam: false, cognito: false,     auth0: true  },
  { capability: "Cross-system OBO delegation",    iam: false, cognito: false,     auth0: true  },
  { capability: "CIBA backchannel approval",      iam: false, cognito: false,     auth0: true  },
  { capability: "Third-party Token Vault",        iam: false, cognito: false,     auth0: true  },
  { capability: "Multi-tenant white-labeling",    iam: false, cognito: "partial", auth0: true  },
  { capability: "Custom claims in tokens",        iam: false, cognito: "partial", auth0: true  },
  { capability: "AWS resource authorization",     iam: true,  cognito: true,      auth0: false },
]

function Check({ val }: { val: boolean | "partial" }) {
  if (val === true)      return <CheckCircle2 className="size-4 text-success mx-auto" />
  if (val === "partial") return <span className="text-[11px] text-warning font-medium">Partial</span>
  return <XCircle className="size-4 text-destructive/60 mx-auto" />
}

function WhyNotIam() {
  return (
    <Section id="comparison">
      <SectionHeading
        label="05 — Capability Comparison"
        title="Why Auth0, not just IAM or Cognito?"
        subtitle="IAM and Cognito are excellent at what they do. Auth0 fills the enterprise identity and agentic authorization gaps they don't cover."
      />
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Capability</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">IAM</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cognito</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-primary">Auth0</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map((row, i) => (
              <tr key={row.capability} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                <td className="px-4 py-2.5 text-xs font-medium">{row.capability}</td>
                <td className="px-4 py-2.5 text-center"><Check val={row.iam} /></td>
                <td className="px-4 py-2.5 text-center"><Check val={row.cognito} /></td>
                <td className="px-4 py-2.5 text-center bg-primary/5"><Check val={row.auth0} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
        <p className="text-sm leading-relaxed">
          <span className="font-bold text-primary">The right answer is both.</span>{" "}
          Use IAM for AWS resource authorization. Use Auth0 for enterprise identity, agent identity,
          delegated authorization, and human-in-the-loop approval. They complement — not compete.
          Auth0 issues the tokens; AgentCore uses them.
        </p>
      </div>
    </Section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

import { PublicHeader } from "@/components/public-header"

export default function ArchitecturePage() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <PublicHeader />
      {/* Section nav */}
      <div className="sticky top-14 z-20 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center gap-1 overflow-x-auto px-6 py-2">
          {[
            { href: "#responsibility", label: "01 Responsibilities" },
            { href: "#flow",           label: "02 Better Together" },
            { href: "#value-props",    label: "03 Auth0 Value Props" },
            { href: "#token-chain",    label: "04 Token Chain" },
            { href: "#comparison",     label: "05 vs IAM" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-md px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>

      <main className="mx-auto flex max-w-4xl flex-col gap-12 px-4 py-10 sm:px-6">
        <Hero />
        <Divider />
        <ResponsibilitySplit />
        <Divider />
        <BetterTogetherFlow />
        <Divider />
        <ValueProps />
        <Divider />
        <TokenChainExplained />
        <Divider />
        <WhyNotIam />

        <div className="pb-10 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
          >
            <LayoutDashboard className="size-4" />
            Back to Live Demo
          </a>
        </div>
      </main>
    </div>
  )
}
