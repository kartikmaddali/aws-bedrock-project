"use client"

import useSWR from "swr"
import { Boxes, Plug, RefreshCw, Link2Off, CircleAlert } from "lucide-react"
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
  const { data, isLoading } = useSWR<{ tools: ConnectedTool[]; source: string }>(
    "/api/token-vault",
    fetcher,
  )

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="flex items-center gap-1.5 font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Boxes className="size-3.5" />
          Token Vault
        </h2>
        <GuardrailTooltip
          label="Auth0 Token Vault & My Account API"
          detail="Connection status is read from the Token Vault / My Account API. The agent borrows scoped third-party tokens on Carlos's behalf without ever seeing his credentials."
          side="left"
        >
          <span className="text-[10px] font-medium text-primary">A4AA</span>
        </GuardrailTooltip>
      </div>

      <div className="flex flex-col gap-2">
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
                "flex flex-col gap-2 rounded-lg border border-border bg-card p-3",
                tool.status === "disconnected" && "opacity-70",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Icon className="size-4" />
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-medium">{tool.name}</span>
                    <span className="text-[11px] text-muted-foreground">{tool.category}</span>
                  </div>
                </div>
                <Badge variant={meta.variant} className="text-[10px]">
                  {meta.label}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                <span className="inline-flex items-center gap-1 font-mono">
                  <RefreshCw className="size-3" />
                  {tool.via} · {tool.lastSync}
                </span>
                {tool.scopes.length > 0 && (
                  <span className="truncate font-mono text-primary/80">
                    {tool.scopes.join(" ")}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
