"use client"

import { useState } from "react"
import { Bot, CheckCircle2, ExternalLink, Code2, ChevronDown, ChevronUp, FileJson } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

const CIMD_URL = "https://aws-bedrock-project.vercel.app/.well-known/client-metadata.json"

const DCR_REQUEST = {
  endpoint: "POST https://your-tenant.auth0.com/oidc/register",
  note: "Dynamic Client Registration (RFC 7591) — agent auto-registers on first use",
  body: {
    client_id: CIMD_URL,
    client_name: "HVAC Copilot Agent",
    client_uri: "https://aws-bedrock-project.vercel.app",
    grant_types: ["authorization_code", "refresh_token"],
    redirect_uris: ["https://aws-bedrock-project.vercel.app/api/auth/callback"],
    token_endpoint_auth_method: "none",
    application_type: "web",
  },
}

const DCR_RESPONSE = {
  client_id: CIMD_URL,
  client_name: "HVAC Copilot Agent",
  app_type: "regular_web",
  external_client_id: CIMD_URL,
  registration_note: "In production AWS hosts this document. The CIMD URL becomes the agent client_id in Auth0.",
}

type ModalType = "dcr" | "cimd" | null

function CodeBlock({ content }: { content: string }) {
  return (
    <ScrollArea className="max-h-72 rounded-lg border border-border bg-muted/50">
      <pre className="p-3 font-mono text-[11px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
        {content}
      </pre>
    </ScrollArea>
  )
}

export function AgentIdentityCard() {
  const [expanded, setExpanded] = useState(false)
  const [modal, setModal] = useState<ModalType>(null)

  return (
    <>
      <div className="rounded-lg border border-success/30 bg-success/5">
        {/* Header row */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
        >
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success/20">
            <CheckCircle2 className="size-3.5 text-success" />
          </div>
          <div className="flex flex-1 min-w-0 flex-col leading-tight">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold">Agent Registered</span>
              <Badge variant="outline" className="font-mono text-[9px] px-1 h-4 border-success/40 text-success">
                CIMD ✓
              </Badge>
            </div>
            <span className="text-[10px] text-muted-foreground truncate">
              Auth0 A4AA · HVAC Copilot Agent
            </span>
          </div>
          {expanded
            ? <ChevronUp className="size-3.5 shrink-0 text-muted-foreground" />
            : <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />}
        </button>

        {expanded && (
          <div className="border-t border-success/20 px-3 pb-3 pt-2 flex flex-col gap-2">
            {/* CIMD identity */}
            <div className="flex flex-col gap-1 rounded-md bg-muted/50 p-2">
              <div className="flex items-center gap-1.5">
                <Bot className="size-3 text-primary" />
                <span className="text-[11px] font-semibold">HVAC Copilot Agent</span>
              </div>
              <div className="flex flex-col gap-0.5 font-mono text-[10px]">
                <div className="flex gap-1">
                  <span className="text-muted-foreground w-16 shrink-0">client_id</span>
                  <a
                    href={CIMD_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-primary/80 hover:text-primary flex items-center gap-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    …/client-metadata.json
                    <ExternalLink className="size-2.5 shrink-0" />
                  </a>
                </div>
                <div className="flex gap-1">
                  <span className="text-muted-foreground w-16 shrink-0">grants</span>
                  <span className="text-foreground/80">authorization_code · refresh_token</span>
                </div>
                <div className="flex gap-1">
                  <span className="text-muted-foreground w-16 shrink-0">auth_method</span>
                  <span className="text-foreground/80">none (PKCE)</span>
                </div>
              </div>
            </div>

            {/* What CIMD enables */}
            <p className="text-[10px] text-muted-foreground leading-snug">
              The CIMD URL is this agent's <span className="text-foreground">cryptographic identity</span> in Auth0.
              In production, AWS hosts this document per agent — enterprises register it once via DCR.
            </p>

            {/* Action buttons */}
            <div className="flex gap-1.5">
              <button
                onClick={() => setModal("dcr")}
                className="flex flex-1 items-center justify-center gap-1.5 rounded border border-primary/30 bg-primary/5 px-2 py-1.5 text-[10px] font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                <Code2 className="size-3" />
                View DCR API Call
              </button>
              <button
                onClick={() => setModal("cimd")}
                className="flex flex-1 items-center justify-center gap-1.5 rounded border border-border bg-card px-2 py-1.5 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <FileJson className="size-3" />
                View CIMD Doc
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DCR API Call Modal */}
      {modal === "dcr" && (
        <Dialog open onOpenChange={() => setModal(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-mono text-sm">
                <Code2 className="size-4 text-primary" />
                Dynamic Client Registration (RFC 7591)
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2">
                <p className="font-mono text-[10px] text-amber-600 font-semibold">{DCR_REQUEST.endpoint}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{DCR_REQUEST.note}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide">Request Body</p>
                <CodeBlock content={JSON.stringify(DCR_REQUEST.body, null, 2)} />
              </div>
              <div>
                <p className="text-[11px] font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide">Auth0 Response</p>
                <CodeBlock content={JSON.stringify(DCR_RESPONSE, null, 2)} />
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                In this demo, registration was done manually in the Auth0 dashboard.
                In production, an enterprise tenant admin calls this endpoint once to authorize the AWS agent.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* CIMD Document Modal */}
      {modal === "cimd" && (
        <Dialog open onOpenChange={() => setModal(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-mono text-sm">
                <FileJson className="size-4 text-primary" />
                CIMD Document — Hosted Agent Metadata
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                <a
                  href={CIMD_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 font-mono text-[11px] text-primary hover:underline"
                >
                  {CIMD_URL}
                  <ExternalLink className="size-3" />
                </a>
                <p className="text-[10px] text-muted-foreground mt-1">
                  This URL is the agent's <strong>client_id</strong> in Auth0. Auth0 fetches it to validate registration.
                </p>
              </div>
              <CodeBlock content={JSON.stringify({
                client_id: CIMD_URL,
                client_name: "HVAC Copilot Agent",
                client_uri: "https://aws-bedrock-project.vercel.app",
                grant_types: ["authorization_code", "refresh_token"],
                redirect_uris: ["https://aws-bedrock-project.vercel.app/api/auth/callback"],
                token_endpoint_auth_method: "none",
                application_type: "web",
                scope: "openid inventory:read pricing:read orders:read orders:write payments:charge returns:write refunds:process",
              }, null, 2)} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
