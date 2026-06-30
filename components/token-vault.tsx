"use client"

import { useState } from "react"
import useSWR from "swr"
import { Boxes, Plug, RefreshCw, Link2Off, CircleAlert, ChevronDown, ChevronUp } from "lucide-react"
import { GuardrailTooltip } from "@/components/guardrail-tooltip"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { ConnectedTool } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const STATUS: Record<
  ConnectedTool["status"],
  { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: typeof Plug }
> = {
  connected: { label: "Connected", variant: "secondary", icon: Plug },
  expired: { label: "Token expired", variant: "destructive", icon: CircleAlert },
  disconnected: { label: "Not linked", variant: "outline", icon: Link2Off },
}

export function TokenVault() {
  const [collapsed, setCollapsed] = useState(true)
  const { data, isLoading } = useSWR<{ tools: ConnectedTool[]; source: string }>(
    "/api/token-vault",
    fetcher,
  )

  const connectedCount = data?.tools.filter((t) => t.status === "connected").length ?? 0

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="flex items-center gap-1.5 font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Boxes className="size-3.5" />
          Token Vault
        </h2>
        <div className="flex items-center gap-2">
          <GuardrailTooltip
            label="Auth0 Token Vault & My Account API"
            detail="Connection status is read from the Token Vault / My Account API. The agent borrows scoped third-party tokens on Carlos's behalf without ever seeing his credentials."
            side="left"
          >
            <span className="text-[10px] font-medium text-primary">A4AA</span>
          </GuardrailTooltip>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex items-center gap-1 rounded px-1 py-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {collapsed ? (
              <><span>{connectedCount} connected</span><ChevronDown className="size-3" /></>
            ) : (
              <ChevronUp className="size-3" />
            )}
          </button>
        </div>
      </div>

      {!collapsed && <div className="flex flex-col gap-2">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}

        {data?.tools.map((tool) => {
          const meta = STATUS[tool.status]
          const Icon = meta.icon
          return (
            <div
              key={tool.id}
              className={cn(
                "flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2",
                tool.status === "disconnected" && "opacity-50",
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                <div className="flex flex-col leading-tight min-w-0">
                  <span className="text-xs font-medium truncate">{tool.name}</span>
                  {tool.scopes.length > 0 && (
                    <span className="truncate font-mono text-[10px] text-primary/70">
                      {tool.scopes.join(" ")}
                    </span>
                  )}
                </div>
              </div>
              <Badge variant={meta.variant} className="shrink-0 text-[10px]">
                {meta.label}
              </Badge>
            </div>
          )
        })}
      </div>}
    </div>
  )
}
