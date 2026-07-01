"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Bot, CheckCircle2, Circle, ExternalLink, ChevronDown, ChevronUp,
  Zap, Loader2, Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useWorkspace } from "@/components/workspace-provider"
import { AGENTS } from "@/lib/agents"

interface AgentStatus {
  slug: string
  name: string
  cimdUrl: string
  registered: boolean
  clientId?: string
}

export function AgentIdentityCard() {
  const [expanded, setExpanded] = useState(false)
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [statuses, setStatuses] = useState<Record<string, AgentStatus>>({})
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [registeringSlug, setRegisteringSlug] = useState<string | null>(null)
  const { startActivity, addActivityStep, completeActivity } = useWorkspace()

  const refreshStatus = useCallback(async () => {
    setLoadingStatus(true)
    try {
      const resp = await fetch("/api/agent/register")
      const data = await resp.json()
      setConfigured(data.configured)
      if (data.configured) {
        const map: Record<string, AgentStatus> = {}
        for (const a of data.agents as AgentStatus[]) map[a.slug] = a
        setStatuses(map)
      }
    } catch {
      setConfigured(false)
    } finally {
      setLoadingStatus(false)
    }
  }, [])

  useEffect(() => { refreshStatus() }, [refreshStatus])

  const registerAgent = async (slug: string, name: string) => {
    setRegisteringSlug(slug)
    const actId = startActivity(`Register: ${name}`)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    try {
      const resp = await fetch("/api/agent/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      const data = await resp.json()

      if (!data.configured) {
        addActivityStep(actId, { kind: "result", label: "Management API not configured", detail: data.message, status: "error" })
        completeActivity(actId, `${name} — Not Configured`)
        return
      }

      if (data.isNewAgent) {
        addActivityStep(actId, {
          kind: "agentcore",
          label: "New agent detected",
          detail: `No existing Auth0 client found for this CIMD URL — this will create a brand new principal.`,
          status: "done",
        })
      }

      for (const step of data.steps as { label: string; ok: boolean; detail: string }[]) {
        addActivityStep(actId, {
          kind: step.ok ? "obo" : "result",
          label: step.label,
          detail: step.detail,
          source: "auth0",
          status: step.ok ? "done" : "error",
        })
      }

      completeActivity(
        actId,
        data.ok
          ? data.isNewAgent ? `✨ ${name} — New Principal Created` : `${name} — Verified ✓`
          : `${name} — Failed`,
      )
      await refreshStatus()
    } catch (err) {
      clearTimeout(timeout)
      const isTimeout = (err as Error).name === "AbortError"
      addActivityStep(actId, {
        kind: "result",
        label: isTimeout ? "Request timed out after 15s" : "Request failed",
        detail: isTimeout
          ? "Management API did not respond in time — check AUTH0_MGMT_CLIENT_ID/SECRET."
          : (err as Error).message,
        status: "error",
      })
      completeActivity(actId, `${name} — Failed`)
    } finally {
      setRegisteringSlug(null)
    }
  }

  const registeredCount = Object.values(statuses).filter((s) => s.registered).length

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5">
      {/* Header row */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
      >
        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15">
          <Bot className="size-3.5 text-primary" />
        </div>
        <div className="flex flex-1 min-w-0 flex-col leading-tight">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold">Agent Registry</span>
            <Badge variant="outline" className="font-mono text-[9px] px-1 h-4 border-primary/40 text-primary">
              CIMD · A4AA
            </Badge>
          </div>
          <span className="text-[10px] text-muted-foreground truncate">
            {loadingStatus ? "Checking Auth0…" : `${registeredCount}/${AGENTS.length} registered`}
          </span>
        </div>
        {expanded
          ? <ChevronUp className="size-3.5 shrink-0 text-muted-foreground" />
          : <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="border-t border-primary/20 px-3 pb-3 pt-2 flex flex-col gap-2">
          <p className="text-[10px] text-muted-foreground leading-snug">
            Each agent has its own CIMD document — a distinct cryptographic identity in Auth0.
            Registering a new one creates a brand new principal; registering an existing one just re-validates it.
          </p>

          {configured === false && (
            <div className="rounded-md border border-warning/30 bg-warning/5 px-2 py-1.5">
              <p className="text-[10px] text-warning">
                Management API not configured — set AUTH0_MGMT_CLIENT_ID/SECRET to enable live registration.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            {AGENTS.map((agent) => {
              const status = statuses[agent.slug]
              const isRegistering = registeringSlug === agent.slug
              const isRegistered = status?.registered

              return (
                <div key={agent.slug} className="flex flex-col gap-1.5 rounded-md border border-border bg-card p-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isRegistered
                        ? <CheckCircle2 className="size-3 shrink-0 text-success" />
                        : <Circle className="size-3 shrink-0 text-muted-foreground" />}
                      <span className="text-[11px] font-semibold truncate">{agent.name}</span>
                    </div>
                    <button
                      onClick={() => registerAgent(agent.slug, agent.name)}
                      disabled={isRegistering || configured === false}
                      className="flex shrink-0 items-center gap-1 rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-amber-600 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                    >
                      {isRegistering
                        ? <Loader2 className="size-2.5 animate-spin" />
                        : isRegistered
                          ? <Zap className="size-2.5" />
                          : <Sparkles className="size-2.5" />}
                      {isRegistering ? "…" : isRegistered ? "Re-verify" : "Register"}
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-snug">{agent.description}</p>
                  <a
                    href={agent.slug === "hvac-copilot"
                      ? "/.well-known/client-metadata.json"
                      : `/.well-known/agents/${agent.slug}/metadata.json`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-0.5 font-mono text-[9px] text-primary/70 hover:text-primary truncate"
                  >
                    {agent.slug === "hvac-copilot" ? ".../client-metadata.json" : `.../agents/${agent.slug}/metadata.json`}
                    <ExternalLink className="size-2.5 shrink-0" />
                  </a>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
