"use client"

import { useState } from "react"
import {
  ScrollText, KeyRound, ArrowLeftRight, ShieldAlert,
  Bot, Boxes, UserCheck, ShieldCheck, GitMerge, ChevronDown,
} from "lucide-react"
import { useWorkspace } from "@/components/workspace-provider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { ComplianceKind } from "@/lib/types"

const KIND_META: Record<ComplianceKind, { icon: typeof KeyRound; color: string; short: string }> = {
  session:          { icon: UserCheck,      color: "text-success",      short: "SESSION"     },
  "token-exchange": { icon: ArrowLeftRight, color: "text-primary",      short: "TOKEN-XCHG"  },
  scope:            { icon: KeyRound,       color: "text-primary",      short: "SCOPE"       },
  ciba:             { icon: ShieldAlert,    color: "text-warning",      short: "CIBA"        },
  agent:            { icon: Bot,            color: "text-foreground",   short: "AGENT"       },
  vault:            { icon: Boxes,          color: "text-primary",      short: "VAULT"       },
  guardrail:        { icon: ShieldCheck,    color: "text-primary",      short: "GUARDRAIL"   },
  delegation:       { icon: GitMerge,       color: "text-violet-500",   short: "OBO"         },
}

export function ComplianceLog() {
  const { log } = useWorkspace()
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="flex items-center gap-1.5 font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <ScrollText className="size-3.5" />
          Audit Log
        </h2>
        <span className="font-mono text-[10px] text-muted-foreground">{log.length} events</span>
      </div>

      <ScrollArea className="h-[calc(100svh-40rem)] min-h-[14rem] rounded-lg border border-border bg-card/60 lg:h-full">
        <ol className="flex flex-col">
          {log.map((entry, i) => {
            const meta = KIND_META[entry.kind]
            const Icon = meta.icon
            const isOpen = expanded === entry.id

            return (
              <li key={entry.id} className={cn(i !== log.length - 1 && "border-b border-border/40")}>
                <button
                  onClick={() => setExpanded(isOpen ? null : entry.id)}
                  className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left hover:bg-muted/30 transition-colors"
                >
                  <Icon className={cn("size-3 shrink-0", meta.color)} />
                  <span className={cn("shrink-0 font-mono text-[9px] font-bold uppercase tracking-wide w-16", meta.color)}>
                    {meta.short}
                  </span>
                  <span className="flex-1 truncate text-[11px] font-medium leading-none">
                    {entry.label}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{entry.ts}</span>
                  <ChevronDown className={cn("size-3 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                </button>

                {isOpen && (
                  <div className="flex flex-col gap-1 border-t border-border/40 bg-muted/20 px-2.5 py-2">
                    <p className="text-[11px] leading-snug text-muted-foreground">{entry.detail}</p>
                    {entry.meta && (
                      <code className="block w-full truncate rounded bg-muted/70 px-1.5 py-1 font-mono text-[10px] text-primary/90">
                        {entry.meta}
                      </code>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      </ScrollArea>
    </div>
  )
}
