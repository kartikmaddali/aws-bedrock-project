"use client"

import { Wind, LayoutDashboard, Network } from "lucide-react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function PublicHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wind className="size-4" />
          </div>
          <span className="font-heading text-sm font-semibold">HVAC Copilot</span>
          <span className="hidden text-[11px] text-muted-foreground sm:block">AWS AgentCore × Auth0 A4AA</span>
        </div>

        <nav className="ml-2 flex items-center gap-1">
          <a
            href="/"
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              pathname === "/" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            <LayoutDashboard className="size-3.5" />
            Live Demo
          </a>
          <a
            href="/architecture"
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              pathname === "/architecture" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            <Network className="size-3.5" />
            Architecture
          </a>
        </nav>
      </div>
    </header>
  )
}
