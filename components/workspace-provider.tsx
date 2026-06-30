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
  TokenChainState,
  OboTokenNode,
  StepUpTokenNode,
  Activity,
  ActivityStep,
  ActivityStepKind,
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
  tokenChain: TokenChainState
  setOboToken: (token: OboTokenNode) => void
  setStepUpToken: (token: StepUpTokenNode) => void
  pendingPrompt: string | null
  triggerPrompt: (text: string) => void
  clearPendingPrompt: () => void
  activeToolId: string | null
  setActiveToolId: (id: string | null) => void
  activities: Activity[]
  startActivity: (title: string) => string
  addActivityStep: (activityId: string, step: Omit<ActivityStep, "id">) => void
  completeActivity: (activityId: string, title?: string) => void
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
  idTokenPreview,
  accessTokenPreview,
  isSimulatedSession,
  children,
}: {
  session: CarlosClaims
  auth0Configured: boolean
  idTokenPreview: string
  accessTokenPreview: string
  isSimulatedSession: boolean
  children: ReactNode
}) {
  const [portal, setPortalState] = useState<PortalId>("apex")
  const [stages, setStages] = useState<Record<StageId, "idle" | "active" | "complete">>({
    context: "complete",
    "scoped-tools": "idle",
    ciba: "idle",
  })
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null)
  const triggerPrompt = useCallback((text: string) => setPendingPrompt(text), [])
  const clearPendingPrompt = useCallback(() => setPendingPrompt(null), [])
  const [activeToolId, setActiveToolId] = useState<string | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])

  const startActivity = useCallback((title: string): string => {
    const id = crypto.randomUUID()
    setActivities((prev) => [{
      id, title, steps: [], status: "running",
      ts: new Date().toLocaleTimeString("en-US", { hour12: false }),
    }, ...prev])
    return id
  }, [])

  const addActivityStep = useCallback((activityId: string, step: Omit<ActivityStep, "id">) => {
    setActivities((prev) => prev.map((a) =>
      a.id === activityId
        ? { ...a, steps: [...a.steps, { ...step, id: crypto.randomUUID() }] }
        : a,
    ))
  }, [])

  const completeActivity = useCallback((activityId: string, title?: string) => {
    setActivities((prev) => prev.map((a) =>
      a.id === activityId
        ? { ...a, status: "complete", ...(title ? { title } : {}) }
        : a,
    ))
  }, [])

  const [tokenChain, setTokenChain] = useState<TokenChainState>({
    oidc: {
      preview: idTokenPreview,
      ts: nowStamp(),
      source: isSimulatedSession ? "simulated" : "auth0",
      sub: session.sub,
      name: session.name,
      org: session.org,
      tier: session.tier,
    },
    access: {
      preview: accessTokenPreview,
      ts: nowStamp(),
      source: isSimulatedSession ? "simulated" : "auth0",
      scopes: ["openid", "profile", "email", "inventory:read", "pricing:read", "orders:read"],
    },
    obo: null,
    stepUp: null,
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

  const setOboToken = useCallback((token: OboTokenNode) => {
    setTokenChain((prev) => ({ ...prev, obo: token }))
  }, [])

  const setStepUpToken = useCallback((token: StepUpTokenNode) => {
    setTokenChain((prev) => ({ ...prev, stepUp: token }))
  }, [])

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
    () => ({
      session,
      auth0Configured,
      portal,
      setPortal,
      stages,
      setStage,
      log,
      addLog,
      tokenChain,
      setOboToken,
      setStepUpToken,
      pendingPrompt,
      triggerPrompt,
      clearPendingPrompt,
      activeToolId,
      setActiveToolId,
      activities,
      startActivity,
      addActivityStep,
      completeActivity,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session, auth0Configured, portal, setPortal, stages, setStage, log, addLog, tokenChain, setOboToken, setStepUpToken, pendingPrompt, triggerPrompt, clearPendingPrompt, activeToolId, setActiveToolId, activities, startActivity, addActivityStep, completeActivity],
  )

  return (
    <WorkspaceContext.Provider value={value}>
      <div data-portal={portal} className="min-h-svh bg-background text-foreground">
        {children}
      </div>
    </WorkspaceContext.Provider>
  )
}
