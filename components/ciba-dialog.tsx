"use client"

import { useEffect, useRef, useState } from "react"
import {
  ShieldAlert, Loader2, CheckCircle2, XCircle,
  Radio, Bot, User, Zap, Check, X,
} from "lucide-react"
import { useWorkspace } from "@/components/workspace-provider"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TOOLS, CIBA_THRESHOLD_USD } from "@/lib/tools"
import type { CibaInitResponse, CibaPollResponse } from "@/lib/types"

export interface CibaRequest {
  toolId: string
  bindingMessage: string
  estimatedValue: number
}

export interface StepUpResult {
  preview: string
  scope: string
  source: "auth0" | "simulated"
}

type Phase = "initiating" | "pending" | "approved" | "denied" | "expired"

function ContextRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="w-16 shrink-0 text-[11px] text-muted-foreground">{label}</span>
      <div className="flex flex-col text-[11px]">{children}</div>
    </div>
  )
}

export function CibaDialog({
  request,
  onResolved,
}: {
  request: CibaRequest | null
  onResolved: (approved: boolean, stepUp?: StepUpResult) => void
}) {
  const { addLog, setStage, session } = useWorkspace()
  const [phase, setPhase] = useState<Phase>("initiating")
  const [authReqId, setAuthReqId] = useState<string | null>(null)
  const [polls, setPolls] = useState(0)
  const [source, setSource] = useState<"auth0" | "simulated">("simulated")
  const cancelledRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const tool = request ? TOOLS.find((t) => t.id === request.toolId) : null
  const cimdUrl = typeof window !== "undefined"
    ? `${window.location.origin}/.well-known/client-metadata.json`
    : "/.well-known/client-metadata.json"

  // Resolve immediately via button — cancels polling.
  const handleDecision = (approved: boolean) => {
    cancelledRef.current = true
    if (timerRef.current) clearTimeout(timerRef.current)
    const stepUp: StepUpResult = {
      preview: `eyJhbGciOiJSUzI1NiJ9.${btoa(JSON.stringify({ scope: "orders:write payments:charge", act: { sub: cimdUrl } })).slice(0, 16)}…sim_su`,
      scope: "orders:write payments:charge",
      source,
    }
    setPhase(approved ? "approved" : "denied")
    addLog({
      kind: "ciba",
      label: approved ? "Backchannel approval granted" : "Backchannel denied",
      detail: approved
        ? "Dispatch Manager approved. Scoped step-up token minted: orders:write payments:charge."
        : "Dispatch Manager denied the high-value action.",
      meta: approved ? `scope=orders:write payments:charge token=${stepUp.preview}` : undefined,
    })
    if (approved) setStage("ciba", "complete")
    setTimeout(() => onResolved(approved, approved ? stepUp : undefined), 900)
  }

  useEffect(() => {
    if (!request) return
    cancelledRef.current = false
    setPhase("initiating")
    setPolls(0)
    setAuthReqId(null)

    const init = async () => {
      const resp = await fetch("/api/ciba", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ binding_message: request.bindingMessage }),
      })
      const data: CibaInitResponse = await resp.json()
      if (cancelledRef.current) return
      setAuthReqId(data.authReqId)
      setSource(data.source)
      setPhase("pending")
      addLog({
        kind: "ciba",
        label: "CIBA backchannel initiated",
        detail: `Push sent to Dispatch Manager (${data.source === "auth0" ? "live Auth0" : "simulated"}).`,
        meta: `auth_req_id=${data.authReqId.slice(0, 22)}… interval=${data.interval}s`,
      })

      // For live Auth0 — poll the token endpoint. Simulated stays pending until
      // the presenter clicks Approve/Deny.
      if (data.source === "auth0") {
        const intervalMs = Math.max(2000, data.interval * 1000)
        const poll = async () => {
          if (cancelledRef.current) return
          setPolls((p) => p + 1)
          const r = await fetch(`/api/ciba?authReqId=${encodeURIComponent(data.authReqId)}`)
          const pd: CibaPollResponse = await r.json()
          if (cancelledRef.current) return
          if (pd.status === "pending") {
            timerRef.current = setTimeout(poll, intervalMs)
            return
          }
          if (pd.status === "approved") {
            setPhase("approved")
            const stepUp: StepUpResult = {
              preview: pd.tokenPreview ?? `eyJhbGci…${crypto.randomUUID().slice(0, 6)}`,
              scope: "orders:write payments:charge",
              source: pd.source,
            }
            addLog({
              kind: "ciba",
              label: "Backchannel approval granted",
              detail: "Dispatch Manager approved via Auth0 push. Step-up token issued.",
              meta: pd.tokenPreview ? `access_token=${pd.tokenPreview}` : undefined,
            })
            setStage("ciba", "complete")
            setTimeout(() => !cancelledRef.current && onResolved(true, stepUp), 900)
          } else {
            setPhase(pd.status === "denied" ? "denied" : "expired")
            addLog({ kind: "ciba", label: `Backchannel ${pd.status}`, detail: "Action not authorized." })
            setTimeout(() => !cancelledRef.current && onResolved(false, undefined), 900)
          }
        }
        timerRef.current = setTimeout(poll, intervalMs)
      }
    }
    init()

    return () => {
      cancelledRef.current = true
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request])

  const isPending = phase === "initiating" || phase === "pending"
  const isResolved = phase === "approved" || phase === "denied" || phase === "expired"

  return (
    <Dialog open={request !== null} onOpenChange={() => {}}>
      <DialogContent showCloseButton={false} className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 font-mono text-[11px] font-semibold tracking-wide text-warning">
            <ShieldAlert className="size-4" />
            [Auth0 CIBA Guardrail] Activated
          </div>
          <DialogTitle>Dispatch Manager Approval Required</DialogTitle>
        </DialogHeader>

        {/* Request context */}
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Request Context
          </p>

          <ContextRow label="Agent">
            <span className="flex items-center gap-1.5 font-medium">
              <Bot className="size-3 text-primary" /> HVAC Copilot Agent
            </span>
            <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[280px]">
              {cimdUrl}
            </span>
          </ContextRow>

          <ContextRow label="User">
            <span className="flex items-center gap-1.5 font-medium">
              <User className="size-3 text-primary" /> {session.name}
            </span>
            <span className="text-muted-foreground">{session.org} · {session.tier}</span>
          </ContextRow>

          <ContextRow label="Action">
            <span className="font-medium">{tool?.name ?? request?.toolId}</span>
            <span className="text-muted-foreground leading-snug">{request?.bindingMessage}</span>
          </ContextRow>

          <ContextRow label="Amount">
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-destructive">
                ${request?.estimatedValue.toLocaleString()}
              </span>
              <Badge variant="destructive" className="font-mono text-[9px]">
                &gt; ${CIBA_THRESHOLD_USD.toLocaleString()} threshold
              </Badge>
            </div>
          </ContextRow>

          <ContextRow label="Scopes">
            <div className="flex flex-wrap gap-1">
              {(tool?.scopes ?? ["orders:write", "payments:charge"]).map((s) => (
                <Badge key={s} variant="outline" className="font-mono text-[9px]">{s}</Badge>
              ))}
            </div>
          </ContextRow>
        </div>

        {/* Status */}
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
          <div className="flex items-center gap-2.5">
            {phase === "approved" ? (
              <CheckCircle2 className="size-5 shrink-0 text-success" />
            ) : phase === "denied" || phase === "expired" ? (
              <XCircle className="size-5 shrink-0 text-destructive" />
            ) : (
              <Loader2 className="size-5 shrink-0 animate-spin text-warning" />
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {phase === "initiating" && "Initiating backchannel request…"}
                {phase === "pending" && "Push delivered — awaiting Dispatch Manager decision"}
                {phase === "approved" && "Approved — step-up token minted"}
                {phase === "denied" && "Denied — action blocked"}
                {phase === "expired" && "Request expired"}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {source === "auth0" ? "Live Auth0 CIBA" : "Simulated CIBA"}
                {polls > 0 && ` · poll #${polls}`}
              </span>
            </div>
          </div>

          {authReqId && (
            <div className="flex items-center gap-1.5 border-t border-border/60 pt-2 font-mono text-[10px] text-muted-foreground">
              <Radio className="size-3 text-warning shrink-0" />
              <span className="truncate">auth_req_id: {authReqId}</span>
            </div>
          )}
        </div>

        {/* Approve / Deny buttons — shown while pending */}
        {isPending && (
          <div className="flex gap-3">
            <Button
              className="flex-1 gap-2 bg-success hover:bg-success/90 text-success-foreground"
              onClick={() => handleDecision(true)}
            >
              <Check className="size-4" />
              Approve
            </Button>
            <Button
              variant="destructive"
              className="flex-1 gap-2"
              onClick={() => handleDecision(false)}
            >
              <X className="size-4" />
              Deny
            </Button>
          </div>
        )}

        {isResolved && (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-border py-2 text-sm text-muted-foreground">
            <Zap className="size-4" />
            {phase === "approved" ? "Executing with step-up token…" : "Action cancelled"}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
