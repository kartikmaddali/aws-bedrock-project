import { Wind, ShieldCheck, KeyRound, Cpu, ArrowRight, FlaskConical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const POINTS = [
  { icon: ShieldCheck, text: "Custom claims drive runtime whitelabeling" },
  { icon: KeyRound, text: "Least-privilege scoped agent tools" },
  { icon: Cpu, text: "AWS Bedrock AgentCore delegated identity" },
]

export function LoginScreen({ auth0Configured }: { auth0Configured: boolean }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Wind className="size-6" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-heading text-lg font-semibold">AirFlow HVAC Copilot</span>
            <span className="text-xs text-muted-foreground">Auth0 for AI Agents × AWS Bedrock</span>
          </div>
        </div>

        <h1 className="font-heading text-xl font-semibold text-balance">
          Carlos&apos;s field desk at Apex Cooling LLC
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
          Sign in to start the workday. The copilot pulls live inventory, contractor
          pricing, and places bulk orders — all gated by Auth0 A4AA guardrails.
        </p>

        <ul className="mt-6 flex flex-col gap-3">
          {POINTS.map((p) => (
            <li key={p.text} className="flex items-center gap-3 text-sm">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-brand-soft text-primary">
                <p.icon className="size-4" />
              </span>
              {p.text}
            </li>
          ))}
        </ul>

        <Button
          className="mt-7 w-full gap-2"
          size="lg"
          nativeButton={false}
          render={<a href="/api/auth/login" />}
        >
          {auth0Configured ? "Log in with Auth0 as Carlos" : "Start demo as Carlos"}
          <ArrowRight data-icon="inline-end" />
        </Button>

        <div className="mt-4 flex items-center justify-center">
          <Badge variant={auth0Configured ? "secondary" : "outline"} className="gap-1 font-mono text-[10px]">
            {auth0Configured ? <ShieldCheck data-icon="inline-start" /> : <FlaskConical data-icon="inline-start" />}
            {auth0Configured
              ? "Live Auth0 tenant detected"
              : "No tenant configured — simulated session"}
          </Badge>
        </div>
      </div>
    </main>
  )
}
