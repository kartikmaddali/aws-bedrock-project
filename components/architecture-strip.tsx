"use client"

import { User, ShieldCheck, Cpu, Wrench, Database, ArrowRight, Circle } from "lucide-react"
import { useWorkspace } from "@/components/workspace-provider"
import { TOOLS } from "@/lib/tools"
import { cn } from "@/lib/utils"

interface ArchNode {
  id: string
  label: string
  sublabel: string
  icon: typeof User
  badge?: string
  badgeLive?: boolean
}

const NODES: ArchNode[] = [
  {
    id: "user",
    label: "User",
    sublabel: "Carlos · Auth0 OIDC",
    icon: User,
  },
  {
    id: "auth0",
    label: "Auth0",
    sublabel: "id_token · OBO · CIBA",
    icon: ShieldCheck,
  },
  {
    id: "agentcore",
    label: "AWS AgentCore",
    sublabel: "Orchestrator Agent",
    icon: Cpu,
    badge: "SIMULATED",
    badgeLive: false,
  },
  {
    id: "subagent",
    label: "Action Group",
    sublabel: "Tool sub-agent",
    icon: Wrench,
  },
  {
    id: "resource",
    label: "AirFlow APIs",
    sublabel: "Inventory · Orders · Pricing",
    icon: Database,
  },
]

export function ArchitectureStrip() {
  const { stages, activeToolId, auth0Configured } = useWorkspace()

  const activeTool = activeToolId ? TOOLS.find((t) => t.id === activeToolId) : null
  const agentActive = stages["scoped-tools"] === "active" || stages["ciba"] === "active"
  const toolActive = !!activeToolId

  function isNodeActive(id: string): boolean {
    switch (id) {
      case "user": return true
      case "auth0": return true
      case "agentcore": return agentActive || stages["scoped-tools"] === "complete" || stages["ciba"] === "complete"
      case "subagent": return toolActive
      case "resource": return toolActive
      default: return false
    }
  }

  return (
    <div className="border-b border-border bg-muted/30 px-4 py-2 sm:px-6">
      <div className="mx-auto flex max-w-[1600px] items-center gap-1 overflow-x-auto">
        {/* Architecture label */}
        <span className="mr-3 shrink-0 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Stack
        </span>

        {NODES.map((node, i) => {
          const active = isNodeActive(node.id)
          const Icon = node.icon
          const isAgentCore = node.id === "agentcore"
          const isSubAgent = node.id === "subagent"

          return (
            <div key={node.id} className="flex items-center gap-1 shrink-0">
              {/* Node */}
              <div
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-all duration-300",
                  active
                    ? "border-primary/40 bg-card shadow-sm"
                    : "border-border/40 bg-card/30 opacity-50",
                  isAgentCore && agentActive && "border-amber-500/50 bg-amber-500/5",
                )}
              >
                <div className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded",
                  active ? "text-primary" : "text-muted-foreground",
                  isAgentCore && agentActive && "text-amber-500",
                )}>
                  <Icon className="size-3.5" />
                </div>

                <div className="flex flex-col leading-none">
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "text-[11px] font-semibold",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}>
                      {isSubAgent && activeTool ? activeTool.name : node.label}
                    </span>
                    {/* Badges */}
                    {isAgentCore && (
                      <span className="rounded bg-amber-500/15 px-1 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-amber-600">
                        SIM
                      </span>
                    )}
                    {node.id === "auth0" && (
                      <span className={cn(
                        "rounded px-1 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide",
                        auth0Configured
                          ? "bg-success/15 text-success"
                          : "bg-muted text-muted-foreground",
                      )}>
                        {auth0Configured ? "LIVE" : "SIM"}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {isSubAgent && activeTool ? activeTool.id : node.sublabel}
                  </span>
                </div>

                {/* Pulse dot when actively running */}
                {active && (isAgentCore || isSubAgent) && agentActive && (
                  <Circle className="size-1.5 shrink-0 animate-pulse fill-primary text-primary" />
                )}
              </div>

              {/* Arrow connector */}
              {i < NODES.length - 1 && (
                <ArrowRight className={cn(
                  "size-3 shrink-0 transition-colors",
                  isNodeActive(NODES[i + 1].id) ? "text-primary/60" : "text-border",
                )} />
              )}
            </div>
          )
        })}

        {/* OBO / CIBA indicators */}
        <div className="ml-auto flex shrink-0 items-center gap-2 pl-4">
          {stages["scoped-tools"] !== "idle" && (
            <span className="rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 font-mono text-[10px] text-primary">
              OBO ✓
            </span>
          )}
          {stages["ciba"] !== "idle" && (
            <span className="rounded-full border border-warning/30 bg-warning/5 px-2 py-0.5 font-mono text-[10px] text-warning">
              CIBA {stages["ciba"] === "complete" ? "✓" : "…"}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
