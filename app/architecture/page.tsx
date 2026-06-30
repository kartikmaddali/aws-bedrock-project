import {
  Cpu, ShieldCheck, ArrowRight, CheckCircle2,
  Bot, User, Database, Link2,
  GitMerge, ShieldAlert, Boxes, Network, LayoutDashboard,
  FlaskConical, SlidersHorizontal, GitBranch, Scale,
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
    why: "AWS AgentCore orchestrates agent actions, but enterprise customers need to know which agent they're trusting. CIMD gives each agent a verifiable, portable identity that works across AWS and any other system — no SDK required.",
    demo: "https://aws-bedrock-project.vercel.app/.well-known/client-metadata.json",
    demoLabel: "Live CIMD document",
    extend: "Extends AgentCore with a trust anchor: enterprises explicitly register which AWS agents are authorized to operate in their Auth0 tenant via Dynamic Client Registration.",
  },
  {
    icon: GitMerge,
    title: "OBO — Delegated Authorization",
    tagline: "The agent proves who it's acting for.",
    what: "RFC 8693 token exchange: user's access token → delegated token with sub=user and act=agent. Scoped to exactly the tool being invoked.",
    why: "Without OBO, the agent either inherits full user privileges (too broad) or holds its own fixed permissions (loses user context). OBO gives cryptographically-enforced least-privilege delegation per action group.",
    demo: '{ "sub": "carlos", "act": { "sub": "cimd-url", "urn:amazon:bedrock:action_group": "search_inventory" }, "scope": "inventory:read" }',
    demoLabel: "OBO token act claim",
    extend: "Extends AgentCore's ReturnControl with a verifiable delegation chain — downstream APIs can validate the full user→agent→action hierarchy without calling back to AWS.",
  },
  {
    icon: ShieldAlert,
    title: "CIBA — Human-in-the-Loop Approval",
    tagline: "High-value actions wait for a human.",
    what: "Client-Initiated Backchannel Authentication. Agent triggers a push to the Dispatch Manager's device. Auth0 polls until approved — then mints a step-up token.",
    why: "AI agents can make costly mistakes on high-value actions. CIBA adds a cryptographically-enforced human checkpoint — the agent cannot charge payment without the step-up token, full stop.",
    demo: "orders:write + payments:charge only issued after Dispatch Manager taps Approve",
    demoLabel: "Step-up scope gate",
    extend: "Maps naturally to AgentCore's ReturnControl: when AgentCore hands control back to the client, Auth0 CIBA is the mechanism that resolves the human decision and issues the authorization token.",
  },
  {
    icon: Boxes,
    title: "Token Vault — Third-Party Token Management",
    tagline: "The agent borrows access, never holds credentials.",
    what: "Auth0 stores scoped third-party OAuth tokens (ERP, calendar, accounting) linked to the user. The agent borrows them on demand via the My Account API.",
    why: "Enterprise contractors connect to dozens of SaaS tools. The agent needs scoped access to each — without storing passwords or long-lived secrets. Users can revoke any connection at any time.",
    demo: "Google Workspace, Apex Field ERP, QuickBooks — all connected via Token Vault",
    demoLabel: "Connected integrations",
    extend: "Extends AgentCore action groups to reach any third-party API — the agent calls the Token Vault, gets a scoped token, executes the action. No secrets stored in the agent runtime.",
  },
]

function ValueProps() {
  return (
    <Section id="value-props">
      <SectionHeading
        label="03 — Auth0 Value Propositions"
        title="What Auth0 adds to the AgentCore stack"
        subtitle="Four capabilities purpose-built for enterprise identity and agentic authorization — each one extending what AgentCore can do, not replacing it."
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

              <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-2.5">
                <ArrowRight className="size-3.5 shrink-0 text-primary mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-snug">
                  <span className="font-semibold text-primary">Extends AgentCore: </span>
                  {v.extend}
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

const CEDAR_POLICY = `// Amazon Verified Permissions — Cedar policy
// Governs what AgentCore action groups can execute

permit (
  principal == HvacAgent::"hvac-copilot",
  action    == Action::"search_inventory",
  resource
)
when {
  context.auth.scope.contains("inventory:read") &&
  context.agent.cimd == "https://aws-bedrock-project.vercel.app
                         /.well-known/client-metadata.json"  &&
  context.user.tier  in ["Gold", "Platinum"]
};

permit (
  principal == HvacAgent::"hvac-copilot",
  action    == Action::"process_order",
  resource
)
when {
  context.auth.scope.contains("orders:write")    &&
  context.auth.scope.contains("payments:charge") &&
  context.ciba.approved == true                  &&
  context.order.value   <= context.user.credit_limit
};`

const AUTHZ_STACK = [
  { layer: "Identity",       tech: "Auth0 OIDC",                 q: "Who is the user?",                 color: "blue"   },
  { layer: "Delegation",     tech: "Auth0 OBO (RFC 8693)",        q: "Which agent, on whose behalf?",    color: "violet" },
  { layer: "Coarse-grained", tech: "Scoped tokens",               q: "What operations are allowed?",     color: "green"  },
  { layer: "Fine-grained",   tech: "Amazon Verified Permissions", q: "Does context satisfy the policy?", color: "amber"  },
]

const STACK_COLORS: Record<string, string> = {
  blue:   "border-blue-500/40 bg-blue-500/10 text-blue-500",
  violet: "border-violet-500/40 bg-violet-500/10 text-violet-500",
  green:  "border-success/40 bg-success/10 text-success",
  amber:  "border-amber-500/40 bg-amber-500/10 text-amber-500",
}

function FineGrainedAuth() {
  return (
    <Section id="fga">
      <div className="flex items-start justify-between gap-4">
        <SectionHeading
          label="06 — Fine-Grained Authorization"
          title="Amazon Verified Permissions + Cedar"
          subtitle="Scoped tokens answer what the agent can do. Cedar policies answer whether the full request context — agent identity, user attributes, approval state — satisfies the authorization rule."
        />
        <div className="shrink-0 flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-3 py-1.5">
          <FlaskConical className="size-3.5 text-warning" />
          <span className="font-mono text-[10px] font-bold text-warning uppercase tracking-wide">Not in this demo</span>
        </div>
      </div>

      {/* Authorization stack */}
      <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Complete authorization stack — each layer answers a different question
        </p>
        {AUTHZ_STACK.map((row, i) => (
          <div key={row.layer} className="flex items-center gap-3">
            <span className="w-5 shrink-0 font-mono text-[11px] text-muted-foreground">{i + 1}</span>
            <div className={`flex flex-1 items-center justify-between gap-3 rounded-lg border px-3 py-2 ${STACK_COLORS[row.color]}`}>
              <div className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-[10px] font-bold uppercase tracking-wide opacity-70">{row.layer}</span>
                <code className="font-mono text-[11px] font-semibold">{row.tech}</code>
              </div>
              <span className="text-[11px] text-muted-foreground italic">{row.q}</span>
            </div>
          </div>
        ))}
      </div>

      {/* AVP main panel */}
      <div className="flex flex-col gap-5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
              <Scale className="size-6 text-amber-500" />
            </div>
            <div>
              <h3 className="text-base font-bold">Amazon Verified Permissions</h3>
              <p className="text-xs text-muted-foreground">AWS · Cedar policy language · ABAC/RBAC</p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-amber-500/15 px-2.5 py-1 font-mono text-[10px] font-bold text-amber-600">AWS Native</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">What it adds</p>
            <p className="text-xs leading-relaxed text-foreground/80">
              Cedar is a purpose-built, human-readable policy language. Each AgentCore action group
              is governed by a Cedar policy that evaluates the complete request context:
              agent CIMD identity, user tier, OAuth scopes, CIBA approval status, and business-level
              attributes like order value vs. credit limit.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Why it fits AgentCore</p>
            <div className="flex flex-col gap-1.5">
              {[
                "Policies live outside the agent — no hardcoded authz logic in the action group",
                "CIMD URL is the Cedar principal — agent identity in every policy evaluation",
                "Auth0 OBO token claims (scope, act, ciba.approved) feed directly into Cedar context",
                "Audit trail via AWS CloudTrail — every policy decision logged",
              ].map((item) => (
                <div key={item} className="flex items-start gap-1.5">
                  <CheckCircle2 className="size-3 shrink-0 text-amber-500 mt-0.5" />
                  <span className="text-xs text-muted-foreground leading-snug">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Cedar policies for this demo</p>
          <pre className="overflow-x-auto rounded-lg border border-amber-500/20 bg-background/60 p-4 font-mono text-[10px] leading-relaxed text-foreground/80">
            {CEDAR_POLICY}
          </pre>
        </div>
      </div>

      {/* Honest Auth0 FGA callout */}
      <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <GitBranch className="size-4 text-primary" />
          <span className="text-sm font-bold">What about Auth0 FGA?</span>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Auth0 FGA is built on <span className="text-foreground font-medium">OpenFGA</span> (open source, CNCF sandbox project — the same
          Zanzibar/ReBAC model Google uses for Drive and Docs sharing). It is <span className="text-foreground font-medium">completely
          IdP-independent</span> — it works equally well with Amazon Cognito, Azure AD, Okta, or any JWT issuer.
          The "Auth0" in the name refers to the managed hosting only, not an identity dependency.
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          AVP and Auth0 FGA solve <span className="text-foreground font-medium">fundamentally different authorization problems</span> and
          can coexist in the same system:
        </p>
        <div className="grid gap-3 sm:grid-cols-2 text-xs">
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="font-semibold text-amber-600 mb-1">Amazon Verified Permissions (ABAC)</p>
            <p className="text-muted-foreground leading-snug mb-2">
              Policy rules evaluated against attributes and context. Best for: agent authorization,
              role-based rules, business logic gates.
            </p>
            <code className="block font-mono text-[10px] text-amber-700/80">
              permit if user.tier == "Platinum" AND ciba.approved == true
            </code>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <p className="font-semibold text-primary mb-1">Auth0 FGA / OpenFGA (ReBAC)</p>
            <p className="text-muted-foreground leading-snug mb-2">
              Relationship graph traversal. Best for: resource ownership, multi-tenant data isolation,
              sharing models. Works with any IdP.
            </p>
            <code className="block font-mono text-[10px] text-primary/80">
              carlos → member → apex-cooling → owner → order#4200
            </code>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground leading-snug italic">
          For this AWS-native demo, AVP is the natural fit. In a multi-cloud deployment or where
          resource sharing graphs are complex, OpenFGA/Auth0 FGA would sit alongside AVP —
          not replace it.
        </p>
      </div>
    </Section>
  )
}

// ── Section 7: Security layers ────────────────────────────────────────────────

const LAYERS = [
  {
    icon: Network,
    label: "AWS IAM",
    color: "amber",
    domain: "AWS Resource Authorization",
    desc: "Controls which AWS principals can invoke Lambda functions, read from S3, call API Gateway, or access Bedrock itself. The foundation of every AWS deployment.",
    owns: [
      "Lambda invocation policies",
      "S3 bucket access",
      "Bedrock model permissions",
      "API Gateway resource policies",
    ],
    relationship: "AgentCore runs under an IAM role. Auth0 tokens are passed alongside — each doing its own job.",
  },
  {
    icon: User,
    label: "Amazon Cognito",
    color: "blue",
    domain: "App-level User Authentication",
    desc: "User pools and identity pools for AWS-native applications. Great for consumer apps built entirely on AWS infrastructure.",
    owns: [
      "User registration & sign-in",
      "Social identity federation",
      "AWS credentials via identity pools",
      "JWT issuance for AWS-hosted apps",
    ],
    relationship: "For enterprise B2B scenarios needing custom claims, multi-tenant branding, CIMD, OBO, and CIBA — Auth0 A4AA extends beyond Cognito's scope.",
  },
  {
    icon: ShieldCheck,
    label: "Auth0 A4AA",
    color: "primary",
    domain: "Enterprise Identity + Agentic Authorization",
    desc: "Purpose-built for enterprise B2B identity and AI agent authorization. Handles identity federation, agent registration, delegated authorization, and human-in-the-loop approvals.",
    owns: [
      "Enterprise SSO (any IdP, any protocol)",
      "Agent identity via CIMD standard",
      "OBO delegated token exchange",
      "CIBA backchannel human approval",
      "Token Vault for third-party SaaS",
      "Multi-tenant whitelabeling via claims",
    ],
    relationship: "Issues the tokens that AgentCore action groups consume. The token chain proves authorization at every layer — verifiable without calling back to AWS.",
  },
]

const COLOR_LAYER: Record<string, { border: string; bg: string; text: string; label: string }> = {
  amber:   { border: "border-amber-500/30",   bg: "bg-amber-500/5",   text: "text-amber-500",  label: "bg-amber-500/15 text-amber-600"  },
  blue:    { border: "border-blue-500/30",    bg: "bg-blue-500/5",    text: "text-blue-500",   label: "bg-blue-500/15 text-blue-600"    },
  primary: { border: "border-primary/30",     bg: "bg-primary/5",     text: "text-primary",    label: "bg-primary/15 text-primary"      },
}

function SecurityLayers() {
  return (
    <Section id="comparison">
      <SectionHeading
        label="05 — The Security Stack"
        title="Three layers, each in its place"
        subtitle="AWS IAM, Amazon Cognito, and Auth0 A4AA are complementary — not competing. Enterprise agentic applications typically use all three."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {LAYERS.map((layer) => {
          const Icon = layer.icon
          const c = COLOR_LAYER[layer.color]
          return (
            <div key={layer.label} className={`flex flex-col gap-4 rounded-xl border ${c.border} ${c.bg} p-5`}>
              <div className="flex items-center gap-2.5">
                <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg bg-background/50`}>
                  <Icon className={`size-4 ${c.text}`} />
                </div>
                <div>
                  <p className={`text-sm font-bold ${c.text}`}>{layer.label}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">{layer.domain}</p>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground">{layer.desc}</p>

              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-0.5">Owns</p>
                {layer.owns.map((item) => (
                  <div key={item} className="flex items-start gap-1.5">
                    <CheckCircle2 className={`size-3 shrink-0 mt-0.5 ${c.text}`} />
                    <span className="text-xs text-foreground/80">{item}</span>
                  </div>
                ))}
              </div>

              <div className={`rounded-lg border ${c.border} bg-background/40 p-2.5 mt-auto`}>
                <p className="text-[11px] leading-snug text-muted-foreground">
                  <span className={`font-semibold ${c.text}`}>In this demo: </span>
                  {layer.relationship}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm leading-relaxed text-center">
          <span className="font-bold">The right answer is all three, layered.</span>
          {" "}AWS IAM secures the AWS infrastructure. Amazon Cognito handles AWS-native app auth.
          Auth0 A4AA adds enterprise identity federation, agent identity, delegated authorization,
          and human-in-the-loop approval — the capabilities that enterprise agentic applications
          need and that are outside AWS IAM and Cognito's scope by design.
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
            { href: "#comparison",     label: "05 Security Stack" },
            { href: "#fga",            label: "06 FGA" },
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
        <SecurityLayers />
        <Divider />
        <FineGrainedAuth />

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
