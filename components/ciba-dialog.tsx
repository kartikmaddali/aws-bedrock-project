"use client"

import { useEffect, useRef, useState } from "react"
import { ShieldAlert, Loader2, CheckCircle2, XCircle, Radio } from "lucide-react"
import { useWorkspace } from "@/components/workspace-provider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { CibaInitResponse, CibaPollResponse } from "@/lib/types"

export interface CibaRequest {
  toolId: string
  bindingMessage: string
  estimatedValue: number
}

type Phase = "initiating" | "pending" | "approved" | "denied" | "expired"

export interface StepUpResult {
  preview: string
  scope: string
  source: "auth0" | "simulated"
}

export function CibaDialog({
  request,
  onResolved,
}: {
  request: CibaRequest | null
  onResolved: (approved: boolean, stepUp?: StepUpResult) => void
}) {
  const { addLog, setStage } = useWorkspace()
  const [phase, setPhase] = useState<Phase>("initiating")
  const [authReqId, setAuthReqId] = useState<string | null>(null)
  const [polls, setPolls] = useState(0)
  const [source, setSource] = useState<"auth0" | "simulated">("simulated")
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const open = request !== null

  useEffect(() => {
    if (!request) return
    let cancelled = false
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
      if (cancelled) return
      setAuthReqId(data.authReqId)
      setSource(data.source)
      setPhase("pending")
      addLog({
        kind: "ciba",
        label: "CIBA backchannel initiated",
        detail: `Push sent to Dispatch Manager for approval (${data.source === "auth0" ? "live Auth0" : "simulated"}).`,
        meta: `auth_req_id=${data.authReqId.slice(0, 22)}… interval=${data.interval}s`,
      })

      const intervalMs = Math.max(1500, data.interval * 1000)
      const poll = async () => {
        if (cancelled) return
        setPolls((p) => p + 1)
        const r = await fetch(`/api/ciba?authReqId=${encodeURIComponent(data.authReqId)}`)
        const pd: CibaPollResponse = await r.json()
        if (cancelled) return
        if (pd.status === "pending") {
          addLog({
            kind: "ciba",
            label: "Polling backchannel token endpoint",
            detail: "Awaiting authorization_pending → grant.",
            meta: `grant=urn:openid:params:grant-type:ciba`,
          })
          timer.current = setTimeout(poll, intervalMs)
          return
        }
        if (pd.status === "approved") {
          setPhase("approved")
          addLog({
            kind: "ciba",
            label: "Backchannel approval granted",
            detail: "Dispatch Manager approved. Scoped step-up token minted: orders:write payments:charge.",
            meta: pd.tokenPreview ? `access_token=${pd.tokenPreview}` : undefined,
          })
          setStage("ciba", "complete")
          const stepUp: StepUpResult = {
            preview: pd.tokenPreview ?? `eyJhbGci…${crypto.randomUUID().slice(0, 6)}`,
            scope: "orders:write payments:charge",
            source: pd.source,
          }
          setTimeout(() => !cancelled && onResolved(true, stepUp), 1100)
        } else {
          setPhase(pd.status === "denied" ? "denied" : "expired")
          addLog({
            kind: "ciba",
            label: `Backchannel ${pd.status}`,
            detail: "The high-value action was not authorized.",
          })
          setTimeout(() => !cancelled && onResolved(false, undefined), 1100)
        }
      }
      timer.current = setTimeout(poll, intervalMs)
    }
    init()

    return () => {
      cancelled = true
      if (timer.current) clearTimeout(timer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request])

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 font-mono text-[11px] font-semibold tracking-wide text-warning">
            <ShieldAlert className="size-4" />
            [Auth0 A4AA Guardrail] Activated
          </div>
          <DialogTitle className="text-balance">
            Awaiting Backchannel Approval from Dispatch Manager
          </DialogTitle>
          <DialogDescription className="text-pretty">
            {request?.bindingMessage}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/50 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">Threshold tripped</span>
            <Badge variant="destructive" className="font-mono text-[10px]">
              ${request?.estimatedValue.toLocaleString()} &gt; $2,500
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            {phase === "approved" ? (
              <CheckCircle2 className="size-5 text-success" />
            ) : phase === "denied" || phase === "expired" ? (
              <XCircle className="size-5 text-destructive" />
            ) : (
              <Loader2 className="size-5 animate-spin text-primary" />
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {phase === "initiating" && "Initiating backchannel request…"}
                {phase === "pending" && "Push delivered — awaiting decision"}
                {phase === "approved" && "Approved — minting scoped token"}
                {phase === "denied" && "Approval denied"}
                {phase === "expired" && "Request expired"}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {source === "auth0" ? "Live Auth0 CIBA" : "Simulated CIBA"} · poll #{polls}
              </span>
            </div>
          </div>

          {authReqId && (
            <div className="flex items-center gap-1.5 border-t border-border/60 pt-3 font-mono text-[10px] text-muted-foreground">
              <Radio className="size-3 text-warning" />
              tracking: <span className="truncate text-primary/90">{authReqId}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
