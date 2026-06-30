"use client"

import { AppHeader } from "@/components/app-header"
import { AgentIdentityCard } from "@/components/agent-identity-card"
import { StorylineStages } from "@/components/storyline-stages"
import { TokenChain } from "@/components/token-chain"
import { ChatPanel } from "@/components/chat-panel"
import { BehindTheScenes } from "@/components/behind-the-scenes"

export function Workspace() {
  return (
    <>
      <AppHeader />
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[17rem_minmax(0,1fr)_25rem] lg:gap-5">

        {/* Left rail: agent identity chip + demo script */}
        <aside className="flex flex-col gap-3 lg:order-1">
          <AgentIdentityCard />
          <StorylineStages />
        </aside>

        {/* Center: chat */}
        <section className="order-first h-[calc(100svh-6rem)] min-h-[32rem] lg:order-2 lg:h-[calc(100svh-6rem)]">
          <ChatPanel />
        </section>

        {/* Right rail: token chain + behind the scenes */}
        <aside className="flex flex-col gap-4 lg:order-3 lg:h-[calc(100svh-6rem)]">
          <TokenChain />
          <div className="flex-1 min-h-0">
            <BehindTheScenes />
          </div>
        </aside>

      </div>
    </>
  )
}
