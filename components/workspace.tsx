"use client"

import { AppHeader } from "@/components/app-header"
import { StorylineStages } from "@/components/storyline-stages"
import { TokenVault } from "@/components/token-vault"
import { TokenChain } from "@/components/token-chain"
import { ChatPanel } from "@/components/chat-panel"
import { ComplianceLog } from "@/components/compliance-log"

export function Workspace() {
  return (
    <>
      <AppHeader />
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[18rem_minmax(0,1fr)_24rem] lg:gap-5">
        {/* Left rail: storyline + token vault */}
        <aside className="flex flex-col gap-5 lg:order-1">
          <StorylineStages />
          <TokenVault />
        </aside>

        {/* Center: chat */}
        <section className="order-first h-[calc(100svh-7rem)] min-h-[32rem] lg:order-2 lg:h-[calc(100svh-7rem)]">
          <ChatPanel />
        </section>

        {/* Right rail: token chain + compliance log */}
        <aside className="flex flex-col gap-5 lg:order-3 lg:h-[calc(100svh-7rem)]">
          <TokenChain />
          <div className="flex-1 min-h-0">
            <ComplianceLog />
          </div>
        </aside>
      </div>
    </>
  )
}
