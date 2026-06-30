# Securing AI Agents at Scale
## How Auth0 and AWS Bedrock Deliver Trusted, Identity-Aware AI

---

# Executive Summary

AI agents are moving from demos into production — placing orders, processing
refunds, querying sensitive data, and acting on behalf of real users. AWS
Bedrock provides world-class AI infrastructure. But infrastructure alone cannot
answer the question every enterprise must ask:

> **"How do we know the agent is acting for the right person, with the right
> permissions, and with a human in the loop when it matters?"**

Auth0 answers that question. This brief shows how Auth0 and AWS Bedrock work
together as complementary layers of a complete, production-grade AI agent
platform — illustrated through a real-world B2B supply chain scenario.

---

# The Fictional Use Case — Apex Cooling & Watsco Supply Hub

## Background

**Watsco** is a national HVAC equipment distributor with 670+ distribution
centers. They are building an AI-powered copilot that allows their contractor
customers to search inventory, get pricing, and place bulk equipment orders —
all through natural language.

**Apex Cooling LLC** is one of Watsco's Platinum-tier contractor customers.
Their field operations manager, **Carlos Mendez**, needs to place equipment
orders, check stock, and process returns — often from job sites on his phone.

Watsco wants to give Carlos an AI agent that:
- Knows who he is and what he is authorized to do
- Applies his Platinum contract pricing automatically
- Requires his Dispatch Manager's sign-off on orders above $2,500
- Leaves a complete audit trail for compliance

---

# The Journey — A Day in Carlos's World

## 7:45 AM — Carlos logs in

Carlos opens the Watsco Supply Hub on his phone. He authenticates via **Auth0**
using his corporate SSO (Okta). Auth0 enriches his identity token with two
custom claims:

```
org  = "Apex Cooling LLC"
tier = "Platinum"
```

These claims are encoded into a signed JWT and stored as a secure session
cookie. Carlos never sees them — but every action he takes will carry this
context.

**Auth0 is doing:** OIDC login, custom claims injection, session management.

---

## 8:10 AM — "Find me 3-ton condensers near my hub"

Carlos types his first request. The app sends it to the Next.js backend, which:

1. Reads Carlos's Auth0 session (org, tier, sub)
2. Forwards it as `sessionAttributes` into **AWS Bedrock AgentCore**
3. Bedrock's Claude model receives the prompt **and** Carlos's identity context

The agent queries the inventory tool, knowing it is answering for a Platinum
contractor at Apex Cooling, and returns results from the nearest distribution
center.

```
Auth0 session → sessionAttributes → Bedrock Agent
                                         ↓
                              Knows: who is asking,
                              what tier they are,
                              what org they belong to
```

**AWS Bedrock is doing:** Natural language understanding, tool orchestration,
inventory query execution.

**Without Auth0:** The agent has no user context. It is anonymous. Platinum
pricing cannot be applied. The agent cannot enforce org-level limits.

---

## 9:30 AM — "Get me Platinum pricing on a Carrier RTU"

Carlos asks for pricing on a rooftop unit. The agent:

1. Identifies the `update_pricing` tool is needed
2. Checks that Carlos's session scope includes `pricing:read`
3. Returns Carrier RTU pricing with Platinum-tier volume discounts applied

The **Token Vault** (Auth0) holds the OAuth token that authorizes the pricing
API call. The token was issued with exactly the scope needed — no more.

**Auth0 is doing:** OAuth scope enforcement, Token Vault (delegated token
storage), least-privilege access control.

**AWS Secrets Manager parallel:** Secrets Manager stores service credentials
(API keys, DB passwords). Token Vault stores *user-delegated* OAuth tokens —
it understands token refresh, scope lifecycle, and user revocation. They solve
different problems.

---

## 11:15 AM — "Order a $42,000 Carrier rooftop system for the Miramar job"

Carlos submits a large bulk order. The agent:

1. Identifies `process_order` requires `orders:write + payments:charge`
2. Detects the value ($42,000) exceeds the $2,500 CIBA threshold
3. Pauses — and triggers **Auth0 CIBA** (Client-Initiated Backchannel
   Authentication)

### What CIBA does:

```
Agent flags high-value action
        ↓
Auth0 sends push notification to Sandra (Dispatch Manager)
        ↓
Sandra sees: "Approve order for Apex Cooling — $42,000"
        ↓
Sandra approves on her phone
        ↓
Auth0 issues a scoped step-up token:
  orders:write + payments:charge
        ↓
Agent proceeds — order placed, confirmation emailed
```

Carlos never had to call Sandra. Sandra never had to log into a portal. The
approval is cryptographically tied to her identity, timestamped, and logged.

**Auth0 is doing:** CIBA backchannel authorization, step-up token issuance,
human-in-the-loop enforcement.

**AWS equivalent:** No native equivalent. SNS + Lambda + custom polling can
approximate the notification flow, but it is not an OIDC standard, not
auditable as an authorization event, and not revocable via a standard token
endpoint.

---

## 2:00 PM — Compliance review

Watsco's compliance officer opens the audit panel. Every action is logged:

| Time | Event | Detail |
|------|-------|--------|
| 07:45 | OIDC session established | sub=auth0\|carlos-apex, source=live |
| 07:45 | Custom claims decrypted | org="Apex Cooling" tier="Platinum" |
| 08:10 | Bedrock AgentCore invoked | Identity forwarded via sessionAttributes |
| 08:10 | Agent bound to scopes | inventory:read |
| 09:30 | Token Vault access | pricing:read satisfied |
| 11:15 | CIBA guardrail engaged | value=$42,000 > threshold |
| 11:17 | Step-up token issued | orders:write + payments:charge |
| 11:17 | Order executed | Apex Cooling, Miramar job |

Every entry is generated automatically by the Auth0 + Bedrock integration.
No manual logging code required.

---

# Architecture — The Two Layers

```
┌──────────────────────────────────────────────────────┐
│                  Watsco Supply Hub                    │
│                   (Next.js App)                       │
└──────────────┬───────────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────────┐
│              AUTH0 IDENTITY LAYER                     │
│                                                       │
│  • OIDC Login + Custom Claims (org, tier)             │
│  • Token Vault — OAuth delegation per user            │
│  • CIBA — async human approval for high-value actions │
│  • Fine-Grained Authorization (FGA)                   │
│  • Compliance audit log                               │
│                                                       │
│  Answers: WHO is asking? Are they ALLOWED?            │
│           Does a HUMAN need to approve?               │
└──────────────┬───────────────────────────────────────┘
               │  sessionAttributes (sub, org, tier)
               │  scoped OAuth tokens
┌──────────────▼───────────────────────────────────────┐
│              AWS BEDROCK LAYER                        │
│                                                       │
│  • Bedrock Agent (Claude Sonnet 3.5/3.7)             │
│  • AgentCore — tool orchestration + memory            │
│  • Knowledge Bases — RAG over product catalog         │
│  • Guardrails — content safety, PII redaction         │
│  • Action Groups — inventory, pricing, orders         │
│                                                       │
│  Answers: WHAT should the agent do?                   │
│           HOW should it respond?                      │
└──────────────────────────────────────────────────────┘
```

---

# Feature Complement Map

| Capability | Auth0 | AWS Bedrock | How They Work Together |
|---|---|---|---|
| **User identity** | OIDC login, custom claims | — | Auth0 establishes who the user is |
| **Agent identity** | — | IAM roles for Bedrock | AWS controls service-to-service trust |
| **User context in agent** | sessionAttributes forwarding | sessionState API | Auth0 claims ride into Bedrock via sessionState |
| **Credential storage** | Token Vault (OAuth tokens) | Secrets Manager (API keys, secrets) | Complementary — different credential types |
| **Access control** | FGA (relationship-based, user context) | IAM + AgentCore policies (role-based) | Auth0 for business rules, IAM for infra rules |
| **Human approval** | CIBA (OIDC standard, push approval) | No native equivalent | Auth0 fills this gap |
| **Content safety** | — | Bedrock Guardrails | AWS owns this layer entirely |
| **RAG / knowledge** | — | Knowledge Bases | AWS owns this layer entirely |
| **Audit trail** | Auth0 logs + custom compliance log | CloudTrail | Auth0 captures identity events, CloudTrail captures AWS API events |

---

# Why Both — The Gap Without Each

## Without Auth0

- Agent has no user context — cannot apply org-specific pricing or limits
- No standard mechanism for human approval of high-value actions
- OAuth token lifecycle (refresh, revocation, scope) must be built from scratch
- No fine-grained "can this user's agent do this specific action" decision layer
- Compliance audit trail covers infrastructure events only — not identity events

## Without AWS Bedrock

- No hosted Claude model — must self-host or use a different provider
- No managed RAG pipeline for the product catalog
- No built-in content filtering or PII redaction
- Agent orchestration and tool execution must be built from scratch
- No managed memory or multi-turn session persistence for the agent

---

# The One-Line Pitch

> **"AWS Bedrock is where the intelligence lives.
> Auth0 is where the trust lives.
> Production AI agents need both."**

---

# Suggested Next Steps

1. **Live demo** — Run the Watsco Supply Hub against a real Bedrock Agent to
   show the identity chain end-to-end (15 min)

2. **CIBA walkthrough** — Trigger a high-value order approval live to show the
   push notification + step-up token flow (5 min)

3. **Architecture review** — Map Auth0 + Bedrock layers against your team's
   existing AWS footprint and identify integration points (30 min)

4. **POC scoping** — Define a target use case from your own product roadmap
   and scope a joint POC using this reference implementation as the starting
   point

---

*Built on: Next.js 16 · React 19 · AWS Bedrock AgentCore · Auth0 OIDC + CIBA ·
Tailwind CSS · shadcn/ui*

*Reference implementation available at request.*
