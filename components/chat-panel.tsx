"use client"

import { useRef, useState, useEffect } from "react"
import {
  Send,
  Bot,
  KeyRound,
  Sparkles,
  ShieldAlert,
  Cpu,
  CornerDownLeft,
} from "lucide-react"
import { useWorkspace } from "@/components/workspace-provider"
import { GuardrailTooltip } from "@/components/guardrail-tooltip"
import { CibaDialog, type CibaRequest } from "@/components/ciba-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PORTALS } from "@/lib/theme-config"
import { cn } from "@/lib/utils"
import type { ChatMessage, OboTokenNode } from "@/lib/types"
import type { StepUpResult } from "@/components/ciba-dialog"

const SUGGESTIONS = [
  "Find 3-ton condensers in stock near my hub",
  "Get my Platinum pricing on a Carrier rooftop unit",
  "Order a $4,200 Carrier rooftop system for the Miramar job",
  "Show my recent order history",
]

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
}

export function ChatPanel() {
  const { session, portal, addLog, setStage, setOboToken, setStepUpToken } = useWorkspace()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [activeScopes, setActiveScopes] = useState<string[]>([])
  const [cibaRequest, setCibaRequest] = useState<CibaRequest | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const welcome = PORTALS[portal].welcome

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, busy])

  const runScopedTool = async (toolId: string, scopes: string[]) => {
    try {
      const r = await fetch(`/api/tools/${toolId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ via: "agent" }),
      })
      const data = await r.json()
      if (r.ok) {
        addLog({
          kind: "scope",
          label: `Tool executed: ${toolId}`,
          detail: `Scope check passed; ${scopes.join(", ")} satisfied.`,
          meta: `200 OK · scopes=[${scopes.join(" ")}]`,
        })
      } else {
        addLog({
          kind: "scope",
          label: `Tool blocked: ${toolId}`,
          detail: data.error === "insufficient_scope" ? "Missing required scope — step-up needed." : "Request rejected.",
          meta: `403 ${data.error}`,
        })
      }
    } catch {
      /* network noise ignored in demo */
    }
  }

  const send = async (text: string) => {
    const prompt = text.trim()
    if (!prompt || busy) return
    setInput("")
    setBusy(true)
    setStage("scoped-tools", "active")

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: prompt }
    const pendingId = crypto.randomUUID()
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: pendingId, role: "agent", content: "", pending: true },
    ])

    try {
      const resp = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })

      if (!resp.ok || !resp.body) {
        throw new Error(`HTTP ${resp.status}`)
      }

      // Switch off the dot animation as soon as the first byte arrives.
      setMessages((prev) =>
        prev.map((m) => (m.id === pendingId ? { ...m, pending: false } : m)),
      )

      const reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      const handleSseEvent = (
        event: string,
        data: Record<string, unknown>,
      ) => {
        if (event === "delta") {
          const chunk = data.text as string
          setMessages((prev) =>
            prev.map((m) =>
              m.id === pendingId ? { ...m, content: m.content + chunk } : m,
            ),
          )
        } else if (event === "done") {
          const payload = data as {
            source: "bedrock" | "simulated"
            toolId: string | null
            scopes: string[]
            requiresApproval: boolean
            estimatedValue: number
            sessionAttributes: Record<string, string>
            oboToken: OboTokenNode | null
          }

          setActiveScopes(payload.scopes)
          addLog({
            kind: "agent",
            label:
              payload.source === "bedrock"
                ? "Bedrock AgentCore invoked"
                : "Agent reasoning (simulated)",
            detail:
              "Auth0 identity + CIMD agent principal injected into Bedrock sessionState.sessionAttributes.",
            meta: `sub=${payload.sessionAttributes.sub} cimd=${payload.sessionAttributes["agent:cimd"]?.split("/").pop()}`,
          })
          if (payload.scopes.length) {
            addLog({
              kind: "scope",
              label: "Agent bound to OAuth scopes",
              detail: `Tool "${payload.toolId}" is gated to least-privilege scopes.`,
              meta: `scopes=[${payload.scopes.join(" ")}]`,
            })
          }
          if (payload.oboToken) {
            setOboToken(payload.oboToken)
            addLog({
              kind: "delegation",
              label: "OBO token exchanged (RFC 8693)",
              detail: `Agent delegated token minted — sub bound to user, act bound to CIMD agent principal (${payload.oboToken.source}).`,
              meta: `act.sub=…/client-metadata.json scope=${payload.oboToken.scope}`,
            })
          }

          setMessages((prev) =>
            prev.map((m) =>
              m.id === pendingId
                ? {
                    ...m,
                    pending: false,
                    scopes: payload.scopes,
                    guardrail: payload.requiresApproval,
                  }
                : m,
            ),
          )

          if (payload.requiresApproval) {
            setStage("ciba", "active")
            setCibaRequest({
              toolId: payload.toolId ?? "process_order",
              estimatedValue: payload.estimatedValue,
              bindingMessage: `Approve ${payload.toolId === "handle_return" ? "refund" : "order"} for ${session.org} — $${payload.estimatedValue.toLocaleString()}`,
            })
          } else {
            setStage("scoped-tools", "complete")
            if (payload.toolId) runScopedTool(payload.toolId, payload.scopes)
            setBusy(false)
          }
        } else if (event === "error") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === pendingId
                ? {
                    ...m,
                    pending: false,
                    content:
                      (data.message as string) ||
                      "The agent endpoint is unavailable right now.",
                  }
                : m,
            ),
          )
          setBusy(false)
        }
      }

      const parseLine = (line: string) => {
        if (line.startsWith("event:")) return { type: "event", value: line.slice(6).trim() }
        if (line.startsWith("data:")) return { type: "data", value: line.slice(5).trim() }
        return null
      }

      let currentEvent = ""

      const processChunk = (chunk: string) => {
        const lines = chunk.split("\n")
        for (const line of lines) {
          const parsed = parseLine(line)
          if (!parsed) { currentEvent = ""; continue }
          if (parsed.type === "event") { currentEvent = parsed.value; continue }
          if (parsed.type === "data" && parsed.value) {
            try {
              handleSseEvent(currentEvent, JSON.parse(parsed.value))
            } catch {
              // Incomplete JSON frame — skip.
            }
          }
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const boundary = buffer.lastIndexOf("\n\n")
        if (boundary !== -1) {
          processChunk(buffer.slice(0, boundary + 2))
          buffer = buffer.slice(boundary + 2)
        }
      }
      if (buffer.trim()) processChunk(buffer)
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? { ...m, pending: false, content: "The agent endpoint is unavailable right now." }
            : m,
        ),
      )
      setBusy(false)
    }
  }

  const onCibaResolved = (approved: boolean, stepUp?: StepUpResult) => {
    const req = cibaRequest
    setCibaRequest(null)
    setBusy(false)
    setStage("scoped-tools", "complete")
    if (approved && stepUp) {
      const cimdUrl = typeof window !== "undefined"
        ? `${window.location.origin}/.well-known/client-metadata.json`
        : "/.well-known/client-metadata.json"
      setStepUpToken({
        preview: stepUp.preview,
        ts: new Date().toLocaleTimeString("en-US", { hour12: false }),
        source: stepUp.source,
        scope: stepUp.scope,
        actSub: cimdUrl,
      })
      addLog({
        kind: "delegation",
        label: "Step-up token issued via CIBA",
        detail: `Dispatch Manager approved. Auth0 minted a scoped step-up token for the agent (${stepUp.source}).`,
        meta: `scope=${stepUp.scope} token=${stepUp.preview}`,
      })
    }
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "agent",
        content: approved
          ? `Approved. The step-up token now carries orders:write + payments:charge, so I've placed the order for ${session.org} and emailed the confirmation.`
          : `The Dispatch Manager declined that request, so I did not charge payment. Want me to revise the quote first?`,
        scopes: approved ? ["orders:write", "payments:charge"] : undefined,
      },
    ])
    if (approved && req) runScopedTool(req.toolId, ["orders:write", "payments:charge"])
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card/50">
      {/* Chat header */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="size-4" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">HVAC Copilot</span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Cpu className="size-3" /> AWS Bedrock AgentCore
            </span>
          </div>
        </div>
        <GuardrailTooltip
          label="Active OAuth scope binding"
          detail="These are the exact scopes the agent's current action is bound to. The backend rejects any tool call lacking them."
          side="left"
        >
          <div className="flex items-center gap-1.5">
            <KeyRound className="size-3.5 text-primary" />
            {activeScopes.length === 0 ? (
              <span className="font-mono text-[11px] text-muted-foreground">scopes: []</span>
            ) : (
              <span className="flex flex-wrap gap-1">
                {activeScopes.map((s) => (
                  <Badge key={s} className="font-mono text-[10px]">
                    {s}
                  </Badge>
                ))}
              </span>
            )}
          </div>
        </GuardrailTooltip>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 p-4">
          {/* Whitelabel welcome */}
          <div className="flex gap-3">
            <Avatar size="sm" className="mt-0.5">
              <AvatarFallback className="bg-primary/15 text-primary">
                <Sparkles className="size-3" />
              </AvatarFallback>
            </Avatar>
            <div className="rounded-lg rounded-tl-sm border border-border bg-card px-3.5 py-2.5 text-sm leading-relaxed">
              {welcome}
            </div>
          </div>

          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end gap-3">
                <div className="max-w-[80%] rounded-lg rounded-tr-sm bg-primary px-3.5 py-2.5 text-sm leading-relaxed text-primary-foreground">
                  {m.content}
                </div>
                <Avatar size="sm" className="mt-0.5">
                  <AvatarFallback className="bg-muted text-[10px] font-medium">
                    {initials(session.name)}
                  </AvatarFallback>
                </Avatar>
              </div>
            ) : (
              <div key={m.id} className="flex gap-3">
                <Avatar size="sm" className="mt-0.5">
                  <AvatarFallback className="bg-primary/15 text-primary">
                    <Bot className="size-3" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex max-w-[80%] flex-col gap-1.5">
                  <div
                    className={cn(
                      "rounded-lg rounded-tl-sm border px-3.5 py-2.5 text-sm leading-relaxed",
                      m.guardrail ? "border-warning/40 bg-warning/5" : "border-border bg-card",
                    )}
                  >
                    {m.pending ? (
                      <span className="flex gap-1 py-1">
                        <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
                      </span>
                    ) : (
                      m.content
                    )}
                  </div>
                  {m.scopes && m.scopes.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1">
                      <KeyRound className="size-3 text-muted-foreground" />
                      {m.scopes.map((s) => (
                        <Badge key={s} variant="secondary" className="font-mono text-[10px]">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {m.guardrail && (
                    <span className="flex items-center gap-1 font-mono text-[10px] text-warning">
                      <ShieldAlert className="size-3" /> CIBA guardrail engaged
                    </span>
                  )}
                </div>
              </div>
            ),
          )}
        </div>
      </div>

      {/* Suggestions */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2 px-4 pb-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              disabled={busy}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the copilot to quote, order, or check inventory…"
          disabled={busy}
          className="flex-1"
        />
        <Button type="submit" disabled={busy || !input.trim()} className="gap-1.5">
          <Send data-icon="inline-start" />
          <span className="hidden sm:inline">Send</span>
          <kbd className="hidden items-center gap-0.5 rounded bg-primary-foreground/20 px-1 font-mono text-[10px] sm:inline-flex">
            <CornerDownLeft className="size-2.5" />
          </kbd>
        </Button>
      </form>

      <CibaDialog request={cibaRequest} onResolved={onCibaResolved} />
    </div>
  )
}

function Dot({ delay = "0ms" }: { delay?: string }) {
  return (
    <span
      className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
      style={{ animationDelay: delay }}
    />
  )
}
