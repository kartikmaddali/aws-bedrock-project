"use client"

import { useState } from "react"
import { Link2, User, KeyRound, Bot, Zap, ArrowDown, CheckCircle2, Clock, Braces, X } from "lucide-react"
import { useWorkspace } from "@/components/workspace-provider"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { TokenNode } from "@/lib/types"

function truncate(s: string, max: number) {
  return s.length <= max ? s : `${s.slice(0, max)}…`
}

function SourceBadge({ source }: { source: "auth0" | "simulated" }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded px-1 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide",
      source === "auth0" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
    )}>
      {source === "auth0" ? "LIVE" : "SIM"}
    </span>
  )
}

function TokenPreview({ preview }: { preview: string }) {
  return (
    <code className="mt-1 block w-full truncate rounded bg-muted/70 px-1.5 py-1 font-mono text-[10px] text-primary/80">
      {preview}
    </code>
  )
}

function Claim({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1 font-mono text-[10px] leading-snug">
      <span className="shrink-0 text-muted-foreground">{label}:</span>
      <span className="truncate text-foreground/80">{value}</span>
    </div>
  )
}

function FlowConnector({ label, active, highlight }: { label: string; active: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-2 py-1 pl-3">
      <div className="flex flex-col items-center gap-0.5">
        <div className={cn("w-px", active ? "bg-primary/40" : "bg-border/60")} style={{ height: 8 }} />
        <ArrowDown className={cn("size-3", active ? "text-primary" : "text-border")} />
        <div className={cn("w-px", active ? "bg-primary/40" : "bg-border/60")} style={{ height: 8 }} />
      </div>
      <span className={cn(
        "font-mono text-[10px]",
        highlight ? "font-semibold text-violet-500" : "text-muted-foreground",
        !active && "opacity-50",
      )}>
        {label}
      </span>
    </div>
  )
}

interface TokenPopupData {
  title: string
  json: Record<string, unknown>
}

function TokenJsonDialog({ data, onClose }: { data: TokenPopupData; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono text-sm">
            <Braces className="size-4 text-primary" />
            {data.title} — Decoded Claims
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] rounded-lg border border-border bg-muted/50 p-3">
          <pre className="font-mono text-[11px] leading-relaxed text-foreground/90">
            {JSON.stringify(data.json, null, 2)}
          </pre>
        </ScrollArea>
        <p className="text-[11px] text-muted-foreground">
          JWT payload decoded — signature verification happens server-side.
        </p>
      </DialogContent>
    </Dialog>
  )
}

function ChainNode({
  num, label, type, icon: Icon, node, waiting, waitingLabel, jsonData, children,
}: {
  num: number
  label: string
  type: string
  icon: typeof User
  node: TokenNode | null
  waiting?: boolean
  waitingLabel?: string
  jsonData?: Record<string, unknown>
  children?: React.ReactNode
}) {
  const [showJson, setShowJson] = useState(false)
  const active = node !== null

  return (
    <>
      <div className={cn(
        "rounded-lg border p-3 transition-all duration-500",
        active ? "border-primary/30 bg-card" : "border-border/40 bg-card/30 opacity-60",
      )}>
        <div className="flex items-start gap-2.5">
          <div className="flex flex-col items-center gap-1 pt-0.5">
            <div className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors",
              active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground border border-border",
            )}>
              {active ? <CheckCircle2 className="size-3" /> : num}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <div className="flex items-center gap-1.5">
                <Icon className={cn("size-3.5 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                <span className="text-xs font-semibold leading-tight">{label}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {node && <SourceBadge source={node.source} />}
                <Badge variant="outline" className="font-mono text-[9px] px-1 py-0 h-4">{type}</Badge>
                {active && jsonData && (
                  <button
                    onClick={() => setShowJson(true)}
                    className="flex items-center gap-0.5 rounded border border-primary/30 bg-primary/5 px-1 py-0.5 font-mono text-[9px] text-primary hover:bg-primary/10 transition-colors"
                    title="View full token JSON"
                  >
                    <Braces className="size-2.5" />
                    JSON
                  </button>
                )}
              </div>
            </div>

            {active ? children : (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="size-3" />
                {waitingLabel ?? "Waiting…"}
              </div>
            )}

            {node && <TokenPreview preview={node.preview} />}
            {node && <span className="font-mono text-[9px] text-muted-foreground">{node.ts}</span>}
          </div>
        </div>
      </div>

      {showJson && jsonData && (
        <TokenJsonDialog
          data={{ title: label, json: jsonData }}
          onClose={() => setShowJson(false)}
        />
      )}
    </>
  )
}

export function TokenChain() {
  const { tokenChain, session } = useWorkspace()
  const { oidc, access, obo, stepUp } = tokenChain

  const cimdUrl = typeof window !== "undefined"
    ? `${window.location.origin}/.well-known/client-metadata.json`
    : "/.well-known/client-metadata.json"

  const oidcJson: Record<string, unknown> = {
    sub: session.sub,
    name: session.name,
    email: session.email,
    "https://hvac-copilot.demo/org": session.org,
    "https://hvac-copilot.demo/tier": session.tier,
    iss: `https://${typeof window !== "undefined" ? "your-tenant.auth0.com" : ""}/ `,
    aud: "your-client-id",
    iat: Math.floor(Date.now() / 1000) - 60,
    exp: Math.floor(Date.now() / 1000) + 28740,
  }

  const accessJson: Record<string, unknown> = {
    sub: session.sub,
    iss: "https://your-tenant.auth0.com/",
    aud: "https://api.hvac-copilot.demo",
    scope: (access?.scopes ?? []).join(" "),
    iat: Math.floor(Date.now() / 1000) - 60,
    exp: Math.floor(Date.now() / 1000) + 28740,
  }

  const oboJson: Record<string, unknown> = obo ? {
    sub: obo.sub,
    act: { sub: obo.actSub },
    scope: obo.scope,
    iss: "https://your-tenant.auth0.com/",
    aud: "https://api.hvac-copilot.demo",
    "agent:cimd": cimdUrl,
    iat: Math.floor(Date.now() / 1000) - 30,
    exp: Math.floor(Date.now() / 1000) + 3570,
  } : {}

  const stepUpJson: Record<string, unknown> = stepUp ? {
    sub: session.sub,
    act: { sub: stepUp.actSub },
    scope: stepUp.scope,
    iss: "https://your-tenant.auth0.com/",
    aud: "https://api.hvac-copilot.demo",
    "ciba:approved": true,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 300,
  } : {}

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="flex items-center gap-1.5 font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Link2 className="size-3.5" />
          Token Chain
        </h2>
        <span className="font-mono text-[10px] text-muted-foreground">CIMD · OBO · CIBA</span>
      </div>

      <ScrollArea className="rounded-lg border border-border bg-card/40 p-3" style={{ maxHeight: 520 }}>
        <div className="flex flex-col gap-1">

          <ChainNode num={1} label="OIDC Session" type="id_token" icon={User} node={oidc} jsonData={oidcJson}>
            <div className="flex flex-col gap-0.5">
              <Claim label="sub" value={truncate(session.sub, 28)} />
              <Claim label="name" value={session.name} />
              <Claim label="org" value={`"${session.org}"`} />
              <Claim label="tier" value={session.tier} />
            </div>
          </ChainNode>

          <FlowConnector label="Authorization Code Flow" active={!!oidc} />

          <ChainNode num={2} label="Access Token" type="Bearer" icon={KeyRound} node={access} jsonData={accessJson}>
            <div className="flex flex-col gap-0.5">
              <Claim label="scope" value={(access?.scopes ?? []).slice(0, 4).join(" ")} />
            </div>
          </ChainNode>

          <FlowConnector label="RFC 8693 Token Exchange (OBO)" active={!!obo} highlight />

          <ChainNode
            num={3} label="Agent Delegated Token" type="OBO" icon={Bot}
            node={obo} waitingLabel="Fires on first tool call" jsonData={oboJson}
          >
            <div className="flex flex-col gap-0.5">
              <Claim label="sub" value={truncate(obo?.sub ?? "", 26)} />
              <Claim label="act.sub" value={truncate(obo?.actSub ?? "", 26)} />
              <Claim label="scope" value={obo?.scope ?? ""} />
            </div>
          </ChainNode>

          <FlowConnector label="Auth0 CIBA Step-up" active={!!stepUp} />

          <ChainNode
            num={4} label="Step-up Token" type="CIBA grant" icon={Zap}
            node={stepUp} waitingLabel="Fires on CIBA approval" jsonData={stepUpJson}
          >
            <div className="flex flex-col gap-0.5">
              <Claim label="scope" value={stepUp?.scope ?? ""} />
              <Claim label="act.sub" value={truncate(stepUp?.actSub ?? "", 26)} />
            </div>
          </ChainNode>

        </div>
      </ScrollArea>
    </div>
  )
}
