"use client"

import { Check, Loader2, Sunrise, KeySquare, ShieldAlert, PlayCircle } from "lucide-react"
import { useWorkspace } from "@/components/workspace-provider"
import { GuardrailTooltip } from "@/components/guardrail-tooltip"
import { cn } from "@/lib/utils"
import type { StageId } from "@/lib/types"

const STAGES: {
  id: StageId
  n: number
  title: string
  blurb: string
  icon: typeof Sunrise
  guardrail: string
  actions: { label: string; prompt: string }[]
}[] = [
  {
    id: "context",
    n: 1,
    title: "Morning Context",
    blurb: "Carlos logs in → Auth0 custom claims injected into AgentCore sessionAttributes.",
    icon: Sunrise,
    guardrail:
      "Auth0 OIDC login mints an id_token carrying corporate identity claims (org, tier). These flow directly into AWS AgentCore sessionState.sessionAttributes — no separate profile lookup.",
    actions: [],
  },
  {
    id: "scoped-tools",
    n: 2,
    title: "Scoped Tools",
    blurb: "AgentCore action groups gated by least-privilege OBO tokens.",
    icon: KeySquare,
    guardrail:
      "Each AgentCore action group (sub-agent tool) is gated by an OBO-exchanged token scoped to exactly that operation. The orchestrator cannot invoke a tool beyond its delegated scope.",
    actions: [
      { label: "Get Platinum pricing", prompt: "Get my Platinum pricing on a Carrier rooftop unit" },
      { label: "Search 3-ton condensers", prompt: "Find 3-ton condensers in stock near my hub" },
      { label: "View order history", prompt: "Show my recent order history" },
    ],
  },
  {
    id: "ciba",
    n: 3,
    title: "CIBA Climax",
    blurb: "AgentCore ReturnControl → Auth0 CIBA → step-up token → execute.",
    icon: ShieldAlert,
    guardrail:
      "AgentCore returns control to the client for CIBA approval. Auth0 pushes to the Dispatch Manager's device. Only after approval does Auth0 mint a step-up token (orders:write + payments:charge) — the agent never had those scopes before.",
    actions: [
      { label: "Place $4,200 order → triggers CIBA", prompt: "Order a $4,200 Carrier rooftop system for the Miramar job" },
    ],
  },
]

export function StorylineStages() {
  const { stages, triggerPrompt } = useWorkspace()

  return (
    <div className="flex flex-col gap-2">
      <h2 className="px-1 font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Storyline
      </h2>
      <ol className="flex flex-col gap-2">
        {STAGES.map((s) => {
          const status = stages[s.id]
          const Icon = s.icon
          const isActive = status === "active"
          const isComplete = status === "complete"

          return (
            <li key={s.id}>
              <GuardrailTooltip label={s.title} detail={s.guardrail} side="right">
                <div
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                    isActive && "border-primary/60 bg-brand-soft",
                    isComplete && "border-border bg-card",
                    status === "idle" && "border-border/60 bg-card/40 opacity-70",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-md",
                      isComplete && "bg-success/20 text-success",
                      isActive && "bg-primary text-primary-foreground",
                      status === "idle" && "bg-muted text-muted-foreground",
                    )}
                  >
                    {isComplete ? (
                      <Check className="size-4" />
                    ) : isActive ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Icon className="size-4" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 w-full min-w-0">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <span className="font-mono text-[11px] text-muted-foreground">
                        0{s.n}
                      </span>
                      {s.title}
                    </span>
                    <span className="text-xs leading-snug text-muted-foreground">
                      {s.blurb}
                    </span>
                    {s.actions.length > 0 && (
                      <div className="flex flex-col gap-1 mt-0.5">
                        {s.actions.map((a) => (
                          <button
                            key={a.prompt}
                            onClick={() => triggerPrompt(a.prompt)}
                            className="flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-2 py-1 text-left text-[11px] font-medium text-primary transition-colors hover:bg-primary/10 hover:border-primary/50"
                          >
                            <PlayCircle className="size-3 shrink-0" />
                            {a.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </GuardrailTooltip>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
