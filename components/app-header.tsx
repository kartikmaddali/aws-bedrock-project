"use client"

import { ChevronsUpDown, Wind, LogOut, BadgeCheck, FlaskConical } from "lucide-react"
import { useWorkspace } from "@/components/workspace-provider"
import { GuardrailTooltip } from "@/components/guardrail-tooltip"
import { PORTAL_LIST, PORTALS } from "@/lib/theme-config"
import { ORG_CLAIM, TIER_CLAIM } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function AppHeader() {
  const { portal, setPortal, session, auth0Configured } = useWorkspace()
  const active = PORTALS[portal]

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 sm:px-6">
        {/* Brand / logo tile */}
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Wind className="size-5" />
          </div>
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="font-heading text-sm font-semibold tracking-tight">
              {active.brand}
            </span>
            <span className="text-[11px] text-muted-foreground">{active.tagline}</span>
          </div>
        </div>

        {/* Whitelabel portal selector */}
        <div className="ml-1 sm:ml-3">
          <GuardrailTooltip
            label="Custom-claim-driven whitelabeling"
            detail="The active org from Carlos's token decides branding & theme. Switching portals simulates a different tenant claim re-skinning the same agent at runtime."
            side="bottom"
          >
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm" className="gap-2">
                    <span className="flex size-4 items-center justify-center rounded bg-primary text-[9px] font-bold text-primary-foreground">
                      {active.monogram}
                    </span>
                    <span className="hidden max-w-40 truncate sm:inline">{active.label}</span>
                    <ChevronsUpDown className="size-3.5 opacity-60" />
                  </Button>
                }
              />
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Whitelabel Portal</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {PORTAL_LIST.map((p) => (
                    <DropdownMenuItem
                      key={p.id}
                      onClick={() => setPortal(p.id)}
                      className="gap-2"
                    >
                      <span className="flex size-5 items-center justify-center rounded bg-muted text-[10px] font-bold text-foreground">
                        {p.monogram}
                      </span>
                      <span className="flex flex-col">
                        <span className="text-sm">{p.label}</span>
                        <span className="text-[11px] text-muted-foreground">{p.tagline}</span>
                      </span>
                      {p.id === portal && <BadgeCheck className="ml-auto size-4 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </GuardrailTooltip>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {/* Auth source badge */}
          <Badge
            variant={auth0Configured ? "secondary" : "outline"}
            className="hidden gap-1 font-mono text-[10px] md:inline-flex"
          >
            {auth0Configured ? (
              <BadgeCheck data-icon="inline-start" />
            ) : (
              <FlaskConical data-icon="inline-start" />
            )}
            {auth0Configured ? "Live Auth0 tenant" : "Simulated tenant"}
          </Badge>

          {/* Carlos avatar + claims hover card */}
          <HoverCard>
            <HoverCardTrigger
              render={
                <button
                  className="flex items-center gap-2 rounded-full outline-none ring-ring focus-visible:ring-2"
                  aria-label="View identity claims"
                />
              }
            >
              <Avatar size="default" className="ring-2 ring-primary/40">
                <AvatarFallback className="bg-primary/15 font-medium text-primary">
                  {initials(session.name)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden flex-col items-start leading-tight lg:flex">
                <span className="text-sm font-medium">{session.name}</span>
                <span className="text-[11px] text-muted-foreground">
                  {session.tier} · {session.org}
                </span>
              </span>
            </HoverCardTrigger>
            <HoverCardContent align="end" className="w-80">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 font-mono text-[10px] font-semibold tracking-wide text-primary">
                  <BadgeCheck className="size-3.5" />
                  [Auth0 A4AA Guardrail] — Decrypted OIDC Claims
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Corporate identity flows straight from Carlos&apos;s id_token into
                  the whitelabeled agent. No separate profile lookup required.
                </p>
                <div className="flex flex-col gap-1.5 rounded-md bg-muted/60 p-2.5 font-mono text-[11px]">
                  <ClaimRow k="name" v={session.name} />
                  <ClaimRow k="email" v={session.email} />
                  <ClaimRow k={ORG_CLAIM} v={session.org} highlight />
                  <ClaimRow k={TIER_CLAIM} v={session.tier} highlight />
                  <ClaimRow k="sub" v={session.sub} />
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>

          <GuardrailTooltip
            label="Federated logout"
            detail="Clears the local session and, on a live tenant, redirects through Auth0's /v2/logout to terminate the IdP session."
            side="bottom"
          >
            <Button variant="ghost" size="icon-sm" nativeButton={false} render={<a href="/api/auth/logout" aria-label="Log out" />}>
              <LogOut />
            </Button>
          </GuardrailTooltip>
        </div>
      </div>
    </header>
  )
}

function ClaimRow({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-muted-foreground">{k}</span>
      <span className={highlight ? "text-right text-primary" : "text-right text-foreground"}>
        {v}
      </span>
    </div>
  )
}
