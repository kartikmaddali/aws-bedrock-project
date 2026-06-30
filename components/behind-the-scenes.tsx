"use client"

import { useState } from "react"
import {
  ArrowRight, Cpu, GitMerge, ShieldAlert, Wrench,
  CheckCircle2, XCircle, Loader2, ChevronDown, ChevronRight,
  Telescope, User,
} from "lucide-react"
import { useWorkspace } from "@/components/workspace-provider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { Activity, ActivityStep, ActivityStepKind } from "@/lib/types"

// ── Step metadata ─────────────────────────────────────────────────────────────

const STEP_META: Record<ActivityStepKind, {
  icon: typeof ArrowRight
  color: string
  bg: string
  label: string
}> = {
  user:      { icon: User,        color: "text-blue-500",   bg: "bg-blue-500/10",   label: "User"      },
  agentcore: { icon: Cpu,         color: "text-amber-500",  bg: "bg-amber-500/10",  label: "AgentCore" },
  obo:       { icon: GitMerge,    color: "text-violet-500", bg: "bg-violet-500/10", label: "Auth0 OBO" },
  ciba:      { icon: ShieldAlert, color: "text-warning",    bg: "bg-warning/10",    label: "Auth0 CIBA"},
  tool:      { icon: Wrench,      color: "text-success",    bg: "bg-success/10",    label: "Tool"      },
  result:    { icon: CheckCircle2,color: "text-success",    bg: "bg-success/10",    label: "Result"    },
}

// ── Single step ───────────────────────────────────────────────────────────────

function Step({ step, isLast }: { step: ActivityStep; isLast: boolean }) {
  const meta = STEP_META[step.kind]
  const Icon = meta.icon

  return (
    <div className="flex gap-2.5">
      {/* Connector */}
      <div className="flex flex-col items-center">
        <div className={cn("flex size-5 shrink-0 items-center justify-center rounded-full", meta.bg)}>
          {step.status === "running"
            ? <Loader2 className={cn("size-3 animate-spin", meta.color)} />
            : step.status === "error"
              ? <XCircle className="size-3 text-destructive" />
              : <Icon className={cn("size-3", meta.color)} />
          }
        </div>
        {!isLast && <div className="mt-0.5 w-px flex-1 bg-border/40" />}
      </div>

      {/* Content */}
      <div className={cn("flex-1 pb-2.5", isLast && "pb-0")}>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={cn("text-[10px] font-bold uppercase tracking-wide", meta.color)}>
            {meta.label}
          </span>
          {step.source && (
            <span className={cn(
              "rounded px-1 py-0.5 font-mono text-[9px] font-bold",
              step.source === "auth0" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
            )}>
              {step.source === "auth0" ? "LIVE" : "SIM"}
            </span>
          )}
        </div>
        <p className="text-xs font-medium leading-snug text-foreground/90">{step.label}</p>
        {step.detail && (
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{step.detail}</p>
        )}
        {step.meta && (
          <code className="mt-1 block w-full break-all rounded bg-muted/50 px-1.5 py-1 font-mono text-[10px] text-primary/80">
            {step.meta}
          </code>
        )}
      </div>
    </div>
  )
}

// ── Activity card ─────────────────────────────────────────────────────────────

function ActivityCard({ activity }: { activity: Activity }) {
  const [open, setOpen] = useState(activity.status === "running")
  const isRunning = activity.status === "running"

  return (
    <div className={cn(
      "rounded-lg border transition-colors",
      isRunning ? "border-primary/40 bg-primary/5" : "border-border bg-card/60",
    )}>
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
      >
        <div className="flex size-5 shrink-0 items-center justify-center">
          {isRunning
            ? <Loader2 className="size-4 animate-spin text-primary" />
            : activity.status === "error"
              ? <XCircle className="size-4 text-destructive" />
              : <CheckCircle2 className="size-4 text-success" />
          }
        </div>
        <div className="flex flex-1 min-w-0 flex-col leading-tight">
          <span className="text-xs font-semibold truncate">{activity.title}</span>
          <span className="text-[10px] text-muted-foreground">
            {activity.steps.length} step{activity.steps.length !== 1 ? "s" : ""} · {activity.ts}
          </span>
        </div>
        {open
          ? <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
          : <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
        }
      </button>

      {/* Steps */}
      {open && activity.steps.length > 0 && (
        <div className="border-t border-border/50 px-3 pt-3 pb-2">
          {activity.steps.map((step, i) => (
            <Step key={step.id} step={step} isLast={i === activity.steps.length - 1} />
          ))}
        </div>
      )}

      {open && activity.steps.length === 0 && (
        <div className="border-t border-border/50 px-3 py-3">
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Loader2 className="size-3 animate-spin" /> Processing…
          </span>
        </div>
      )}
    </div>
  )
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export function BehindTheScenes() {
  const { activities } = useWorkspace()

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="flex items-center gap-1.5 font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Telescope className="size-3.5" />
          Behind the Scenes
        </h2>
        <span className="font-mono text-[10px] text-muted-foreground">
          {activities.length} action{activities.length !== 1 ? "s" : ""}
        </span>
      </div>

      <ScrollArea className="h-[calc(100svh-40rem)] min-h-[14rem] lg:h-full rounded-lg">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-card/40 py-10 text-center">
            <Telescope className="size-8 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">
              Run a Demo Script action to see the handshake flow here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {activities.map((a) => (
              <ActivityCard key={a.id} activity={a} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
