"use client"

import { Check, Loader2, Sunrise, KeySquare, ShieldAlert } from "lucide-react"
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
}[] = [
  {
    id: "context",
    n: 1,
    title: "Morning Context",
    blurb: "Carlos logs in; custom claims hydrate the agent.",
    icon: Sunrise,
    guardrail:
      "Auth0 OIDC login mints an id_token carrying corporate identity claims that pass straight to the whitelabeled AI.",
  },
  {
    id: "scoped-tools",
    n: 2,
    title: "Scoped Tools",
    blurb: "Agent bound by least-privilege OAuth scopes.",
    icon: KeySquare,
    guardrail:
      "Every tool call is gated by the exact scopes on the access token. The agent can only do what the token permits.",
  },
  {
    id: "ciba",
    n: 3,
    title: "CIBA Climax",
    blurb: "High-value action pauses for backchannel approval.",
    icon: ShieldAlert,
    guardrail:
      "Actions above $2,500 trigger Auth0 CIBA — the app polls the backchannel token endpoint until the Dispatch Manager approves.",
  },
]

export function StorylineStages() {
  const { stages } = useWorkspace()

  return (
    <div className="flex flex-col gap-2">
      <h2 className="px-1 font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Storyline
      </h2>
      <ol className="flex flex-col gap-2">
        {STAGES.map((s) => {
          const status = stages[s.id]
          const Icon = s.icon
          return (
            <li key={s.id}>
              <GuardrailTooltip label={s.title} detail={s.guardrail} side="right">
                <div
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                    status === "active" && "border-primary/60 bg-brand-soft",
                    status === "complete" && "border-border bg-card",
                    status === "idle" && "border-border/60 bg-card/40 opacity-70",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-md",
                      status === "complete" && "bg-success/20 text-success",
                      status === "active" && "bg-primary text-primary-foreground",
                      status === "idle" && "bg-muted text-muted-foreground",
                    )}
                  >
                    {status === "complete" ? (
                      <Check className="size-4" />
                    ) : status === "active" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Icon className="size-4" />
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <span className="font-mono text-[11px] text-muted-foreground">
                        0{s.n}
                      </span>
                      {s.title}
                    </span>
                    <span className="text-xs leading-snug text-muted-foreground">
                      {s.blurb}
                    </span>
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
