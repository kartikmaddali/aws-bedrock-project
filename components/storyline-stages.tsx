"use client"

import { Check, Loader2, PlayCircle, ChevronRight, Sunrise, KeySquare, ShieldAlert } from "lucide-react"
import { useWorkspace } from "@/components/workspace-provider"
import { cn } from "@/lib/utils"
import type { StageId } from "@/lib/types"

const STAGES: {
  id: StageId
  n: number
  title: string
  what: string
  why: string
  icon: typeof Sunrise
  actions: { label: string; prompt: string; hint: string }[]
}[] = [
  {
    id: "context",
    n: 1,
    title: "Identity Context",
    what: "Carlos logs in via Auth0 OIDC.",
    why: "Custom claims (org, tier) are injected into AgentCore sessionAttributes — no DB lookup needed.",
    icon: Sunrise,
    actions: [],
  },
  {
    id: "scoped-tools",
    n: 2,
    title: "Scoped Tool Calls",
    what: "Agent invokes an Action Group.",
    why: "Each call triggers an OBO token exchange — the agent gets a delegated token scoped to exactly that tool.",
    icon: KeySquare,
    actions: [
      {
        label: "Get Platinum pricing",
        prompt: "Get my Platinum pricing on a Carrier rooftop unit",
        hint: "scope: pricing:read",
      },
      {
        label: "Search 3-ton condensers",
        prompt: "Find 3-ton condensers in stock near my hub",
        hint: "scope: inventory:read",
      },
      {
        label: "View order history",
        prompt: "Show my recent order history",
        hint: "scope: orders:read",
      },
    ],
  },
  {
    id: "ciba",
    n: 3,
    title: "CIBA Step-up",
    what: "High-value order triggers Auth0 CIBA.",
    why: "AgentCore returns control. Auth0 pushes to Dispatch Manager. Approval mints orders:write + payments:charge.",
    icon: ShieldAlert,
    actions: [
      {
        label: "Place $4,200 order",
        prompt: "Order a $4,200 Carrier rooftop system for the Miramar job",
        hint: "triggers CIBA → Approve / Deny",
      },
    ],
  },
]

export function StorylineStages() {
  const { stages, triggerPrompt } = useWorkspace()

  return (
    <div className="flex flex-col gap-2">
      <h2 className="px-1 font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Demo Script
      </h2>

      <ol className="flex flex-col gap-2">
        {STAGES.map((s, idx) => {
          const status = stages[s.id]
          const isComplete = status === "complete"
          const isActive = status === "active"
          const isIdle = status === "idle"
          const Icon = s.icon
          const prevComplete = idx === 0 || stages[STAGES[idx - 1].id] === "complete"

          return (
            <li key={s.id} className={cn(
              "rounded-lg border transition-all duration-300",
              isComplete && "border-success/30 bg-success/5",
              isActive && "border-primary/50 bg-primary/5",
              isIdle && "border-border/50 bg-card/40",
            )}>
              {/* Stage header */}
              <div className="flex items-start gap-3 p-3">
                <div className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5",
                  isComplete && "bg-success/20 text-success",
                  isActive && "bg-primary text-primary-foreground",
                  isIdle && "bg-muted text-muted-foreground border border-border",
                )}>
                  {isComplete ? <Check className="size-3.5" /> :
                   isActive  ? <Loader2 className="size-3.5 animate-spin" /> :
                               <Icon className="size-3.5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] text-muted-foreground">0{s.n}</span>
                    <span className="text-sm font-semibold">{s.title}</span>
                    {isComplete && (
                      <span className="ml-auto rounded-full bg-success/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-success">
                        DONE
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-foreground/80 leading-snug">{s.what}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground leading-snug">{s.why}</p>
                </div>
              </div>

              {/* Action buttons */}
              {s.actions.length > 0 && !isComplete && (
                <div className="flex flex-col gap-1.5 border-t border-border/40 px-3 pb-3 pt-2">
                  {!prevComplete ? (
                    // Hard lock — show why it's locked
                    <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-2.5 py-2">
                      <span className="text-[11px] text-muted-foreground">
                        Complete Stage 0{idx} first to unlock this step.
                      </span>
                    </div>
                  ) : (
                    <>
                      <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                        Run this step
                      </span>
                      {s.actions.map((a) => (
                        <button
                          key={a.prompt}
                          onClick={() => triggerPrompt(a.prompt)}
                          className="group flex w-full items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-2.5 py-2 text-left transition-all hover:border-primary/60 hover:bg-primary/10"
                        >
                          <PlayCircle className="size-3.5 shrink-0 text-primary" />
                          <div className="flex flex-1 flex-col min-w-0">
                            <span className="text-[11px] font-semibold text-foreground leading-none">
                              {a.label}
                            </span>
                            <span className="font-mono text-[9px] text-muted-foreground mt-0.5">
                              {a.hint}
                            </span>
                          </div>
                          <ChevronRight className="size-3 shrink-0 text-primary/60 group-hover:text-primary transition-colors" />
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* Completed — next step prompt */}
              {isComplete && s.actions.length > 0 && (
                <div className="border-t border-success/20 px-3 pb-2.5 pt-2 flex flex-col gap-1">
                  <span className="font-mono text-[10px] text-success/80">✓ OBO token issued — scopes verified</span>
                  {idx < STAGES.length - 1 && (
                    <span className="text-[10px] text-muted-foreground">
                      Stage 0{idx + 2} is now unlocked ↓
                    </span>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
