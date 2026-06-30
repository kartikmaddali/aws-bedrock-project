"use client"

import { ShieldCheck } from "lucide-react"
import type { ReactNode } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

// Reusable [Auth0 A4AA Guardrail] annotation. Wraps any UI element to explain
// the underlying security mechanic to stakeholders touring Carlos's workday.
export function GuardrailTooltip({
  children,
  label,
  detail,
  side = "top",
}: {
  children: ReactNode
  label: string
  detail: string
  side?: "top" | "bottom" | "left" | "right"
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<span className="inline-flex cursor-help items-center" />}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-72 bg-card text-card-foreground ring-1 ring-border">
        <div className="flex flex-col gap-1 p-0.5">
          <span className="flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-wide text-primary">
            <ShieldCheck className="size-3" />
            [Auth0 A4AA Guardrail]
          </span>
          <span className="text-xs font-medium text-foreground">{label}</span>
          <span className="text-xs leading-relaxed text-muted-foreground">{detail}</span>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
