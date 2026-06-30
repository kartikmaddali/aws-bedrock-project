"use client"

import {
  ScrollText,
  KeyRound,
  ArrowLeftRight,
  ShieldAlert,
  Bot,
  Boxes,
  UserCheck,
  ShieldCheck,
  GitMerge,
} from "lucide-react"
import { useWorkspace } from "@/components/workspace-provider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { ComplianceKind } from "@/lib/types"

const KIND_META: Record<ComplianceKind, { icon: typeof KeyRound; color: string }> = {
  session: { icon: UserCheck, color: "text-success" },
  "token-exchange": { icon: ArrowLeftRight, color: "text-primary" },
  scope: { icon: KeyRound, color: "text-primary" },
  ciba: { icon: ShieldAlert, color: "text-warning" },
  agent: { icon: Bot, color: "text-foreground" },
  vault: { icon: Boxes, color: "text-primary" },
  guardrail: { icon: ShieldCheck, color: "text-primary" },
  delegation: { icon: GitMerge, color: "text-violet-500" },
}

export function ComplianceLog() {
  const { log } = useWorkspace()

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="flex items-center gap-1.5 font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <ScrollText className="size-3.5" />
          Compliance Log
        </h2>
        <span className="font-mono text-[10px] text-muted-foreground">{log.length} events</span>
      </div>

      <ScrollArea className="h-[calc(100svh-40rem)] min-h-[16rem] rounded-lg border border-border bg-card/60 lg:h-full">
        <ol className="flex flex-col">
          {log.map((entry, i) => {
            const meta = KIND_META[entry.kind]
            const Icon = meta.icon
            return (
              <li
                key={entry.id}
                className={cn(
                  "flex gap-3 px-3 py-2.5",
                  i !== log.length - 1 && "border-b border-border/60",
                )}
              >
                <div className="flex flex-col items-center">
                  <div className={cn("mt-0.5 flex size-6 items-center justify-center rounded-md bg-muted", meta.color)}>
                    <Icon className="size-3.5" />
                  </div>
                  {i !== log.length - 1 && <div className="mt-1 w-px flex-1 bg-border/60" />}
                </div>
                <div className="flex flex-1 flex-col gap-0.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-medium leading-tight">{entry.label}</span>
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                      {entry.ts}
                    </span>
                  </div>
                  <span className="text-[11px] leading-snug text-muted-foreground">
                    {entry.detail}
                  </span>
                  {entry.meta && (
                    <code className="mt-1 block w-fit max-w-full truncate rounded bg-muted/70 px-1.5 py-0.5 font-mono text-[10px] text-primary/90">
                      {entry.meta}
                    </code>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </ScrollArea>
    </div>
  )
}
