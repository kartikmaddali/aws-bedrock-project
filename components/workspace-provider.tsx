"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type {
  CarlosClaims,
  ComplianceEntry,
  ComplianceKind,
  StageId,
} from "@/lib/types"
import { PORTALS, type PortalId } from "@/lib/theme-config"

interface WorkspaceContextValue {
  session: CarlosClaims
  auth0Configured: boolean
  portal: PortalId
  setPortal: (p: PortalId) => void
  stages: Record<StageId, "idle" | "active" | "complete">
  setStage: (id: StageId, status: "idle" | "active" | "complete") => void
  log: ComplianceEntry[]
  addLog: (entry: {
    kind: ComplianceKind
    label: string
    detail: string
    meta?: string
  }) => void
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider")
  return ctx
}

function nowStamp() {
  return new Date().toLocaleTimeString("en-US", { hour12: false })
}

export function WorkspaceProvider({
  session,
  auth0Configured,
  children,
}: {
  session: CarlosClaims
  auth0Configured: boolean
  children: ReactNode
}) {
  const [portal, setPortalState] = useState<PortalId>("apex")
  const [stages, setStages] = useState<Record<StageId, "idle" | "active" | "complete">>({
    context: "complete",
    "scoped-tools": "idle",
    ciba: "idle",
  })
  const [log, setLog] = useState<ComplianceEntry[]>(() => [
    {
      id: crypto.randomUUID(),
      ts: nowStamp(),
      kind: "session",
      label: "OIDC session established",
      detail: `Identity resolved for ${session.name} (${session.source === "auth0" ? "live Auth0 tenant" : "simulated tenant"}).`,
      meta: `sub=${session.sub}`,
    },
    {
      id: crypto.randomUUID(),
      ts: nowStamp(),
      kind: "token-exchange",
      label: "Custom claims decrypted",
      detail: "Corporate identity claims parsed from the id_token.",
      meta: `org="${session.org}" tier="${session.tier}"`,
    },
  ])

  const addLog = useCallback(
    (entry: { kind: ComplianceKind; label: string; detail: string; meta?: string }) => {
      setLog((prev) => [
        ...prev,
        { id: crypto.randomUUID(), ts: nowStamp(), ...entry },
      ])
    },
    [],
  )

  const setStage = useCallback(
    (id: StageId, status: "idle" | "active" | "complete") => {
      setStages((prev) => ({ ...prev, [id]: status }))
    },
    [],
  )

  const setPortal = useCallback(
    (p: PortalId) => {
      setPortalState(p)
      addLog({
        kind: "guardrail",
        label: "Whitelabel portal switched",
        detail: `Runtime theme + branding re-pointed to "${PORTALS[p].brand}" from Auth0 custom claim.`,
        meta: `portal=${p}`,
      })
    },
    [addLog],
  )

  const value = useMemo(
    () => ({ session, auth0Configured, portal, setPortal, stages, setStage, log, addLog }),
    [session, auth0Configured, portal, setPortal, stages, setStage, log, addLog],
  )

  return (
    <WorkspaceContext.Provider value={value}>
      <div data-portal={portal} className="min-h-svh bg-background text-foreground">
        {children}
      </div>
    </WorkspaceContext.Provider>
  )
}
