import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
  type InvokeAgentCommandInput,
  type ReturnControlPayload,
} from "@aws-sdk/client-bedrock-agent-runtime"
import {
  getSession,
  getAccessToken,
  exchangeOboToken,
  getCimdUrl,
} from "@/lib/auth0"
import { TOOLS, CIBA_THRESHOLD_USD } from "@/lib/tools"
import type { ToolDefinition, OboTokenNode } from "@/lib/types"

export const dynamic = "force-dynamic"
export const maxDuration = 60

// ── SSE helpers ───────────────────────────────────────────────────────────────

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

function makeStream(
  produce: (emit: (event: string, data: unknown) => void) => Promise<void>,
): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseEvent(event, data)))
      }
      try {
        await produce(emit)
      } catch (err) {
        emit("error", { message: (err as Error).message ?? "Unknown error" })
      } finally {
        controller.close()
      }
    },
  })
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}

// ── AWS detection ─────────────────────────────────────────────────────────────

function awsConfigured() {
  return Boolean(
    process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_REGION &&
      process.env.AWS_BEDROCK_AGENT_ID &&
      process.env.AWS_BEDROCK_AGENT_ALIAS_ID,
  )
}

// ── Tool resolution from ReturnControlPayload ─────────────────────────────────

function toolFromReturnControl(
  payload: ReturnControlPayload,
): { tool: ToolDefinition | null; value: number } {
  const input = payload.invocationInputs?.[0]?.functionInvocationInput
  if (!input?.function) return { tool: null, value: 0 }

  const tool = TOOLS.find((t) => t.id === input.function) ?? null
  let value = 0

  // Try to extract a dollar value from the function parameters.
  const params = input.parameters ?? []
  for (const p of params) {
    const raw = String(p.value ?? "")
    const parsed = parseFloat(raw.replace(/[$,]/g, ""))
    if (!isNaN(parsed) && parsed > value) value = parsed
  }

  // Default high-value floor for order/return tools when no explicit value found.
  if (!value && tool?.valueCeiling) value = 4200

  return { tool, value }
}

// ── Simulated fallback ────────────────────────────────────────────────────────

function routePrompt(prompt: string): { tool: ToolDefinition | null; value: number } {
  const p = prompt.toLowerCase()
  const valueMatch = p.match(/\$?\s?([\d,]+(?:\.\d+)?)\s?(k|thousand)?/)
  let value = 0
  if (valueMatch) {
    value = parseFloat(valueMatch[1].replace(/,/g, ""))
    if (valueMatch[2]) value *= 1000
  }
  const find = (id: string) => TOOLS.find((t) => t.id === id) ?? null

  if (/(return|refund)/.test(p)) return { tool: find("handle_return"), value }
  if (/(order|buy|purchase|place|carrier|system|unit)/.test(p)) {
    if (!value) value = 4200
    return { tool: find("process_order"), value }
  }
  if (/(price|pricing|quote|cost)/.test(p)) return { tool: find("update_pricing"), value }
  if (/(history|past|invoice|previous)/.test(p)) return { tool: find("view_order_history"), value }
  return { tool: find("search_inventory"), value }
}

function simulatedReply(
  prompt: string,
  tool: ToolDefinition | null,
  value: number,
  org: string,
): string {
  if (!tool) return "I can help with that, but I couldn't map it to a connected tool."
  if (tool.id === "process_order") {
    return `I've staged a bulk equipment order for ${org}${
      value ? ` totaling about $${value.toLocaleString()}` : ""
    }. Because this exceeds the $${CIBA_THRESHOLD_USD.toLocaleString()} ceiling, I need backchannel sign-off from your Dispatch Manager before charging payment.`
  }
  if (tool.id === "update_pricing") {
    return `Here is your Platinum-tier contractor pricing for ${org}. Volume discounts are already applied — want me to turn this into a bulk order?`
  }
  if (tool.id === "search_inventory") {
    return `I'm querying live stock across Watsco's 670+ distribution centers for ${org}. Several matching SKUs are in stock at your regional hub.`
  }
  if (tool.id === "view_order_history") {
    return `Pulling ${org}'s recent purchase orders, shipment status, and invoices now.`
  }
  if (tool.id === "handle_return") {
    return `I can process that return for ${org}. Refunds touch payment rails, so this also needs an approval step.`
  }
  return `Working on it for ${org}.`
}

// ── Bedrock streaming invoke ──────────────────────────────────────────────────

async function invokeBedrockStreaming(
  prompt: string,
  sessionAttributes: Record<string, string>,
  emit: (event: string, data: unknown) => void,
): Promise<{ toolFound: ToolDefinition | null; value: number; responded: boolean }> {
  const client = new BedrockAgentRuntimeClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
  })

  const commandInput: InvokeAgentCommandInput = {
    agentId: process.env.AWS_BEDROCK_AGENT_ID,
    agentAliasId: process.env.AWS_BEDROCK_AGENT_ALIAS_ID,
    sessionId: sessionAttributes.sub || crypto.randomUUID(),
    inputText: prompt,
    sessionState: { sessionAttributes },
  }

  // Attach guardrail if configured.
  if (process.env.AWS_BEDROCK_GUARDRAIL_ID) {
    commandInput.guardrailConfiguration = {
      guardrailId: process.env.AWS_BEDROCK_GUARDRAIL_ID,
      guardrailVersion: process.env.AWS_BEDROCK_GUARDRAIL_VERSION ?? "DRAFT",
    }
  }

  const command = new InvokeAgentCommand(commandInput)
  const response = await client.send(command)

  let responded = false
  let toolFound: ToolDefinition | null = null
  let value = 0

  if (response.completion) {
    for await (const event of response.completion) {
      // Text chunk — stream immediately to the client.
      if (event.chunk?.bytes) {
        const text = new TextDecoder().decode(event.chunk.bytes)
        if (text) {
          emit("delta", { text })
          responded = true
        }
      }

      // Return Control — agent wants to invoke a tool.
      if (event.returnControl) {
        const resolved = toolFromReturnControl(event.returnControl)
        toolFound = resolved.tool
        value = resolved.value
        responded = true
      }
    }
  }

  return { toolFound, value, responded }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) {
    return new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401 })
  }

  const body = await req.json().catch(() => ({})) as { prompt?: string }
  const prompt = body.prompt?.trim()
  if (!prompt) {
    return new Response(JSON.stringify({ error: "missing prompt" }), { status: 400 })
  }

  return makeStream(async (emit) => {
    let tool: ToolDefinition | null = null
    let estimatedValue = 0
    let source: "bedrock" | "simulated" = "simulated"

    const sessionAttributes: Record<string, string> = {
      sub: session.sub,
      org: session.org,
      tier: session.tier,
      "auth0:source": session.source,
      "agent:cimd": getCimdUrl(),
    }

    if (awsConfigured()) {
      try {
        const result = await invokeBedrockStreaming(prompt, sessionAttributes, emit)
        if (result.responded) {
          source = "bedrock"
          tool = result.toolFound
          estimatedValue = result.value
        }
      } catch (err) {
        console.log("[bedrock] invoke failed, falling back:", (err as Error).message)
        // Fall through to simulated path.
      }
    }

    if (source === "simulated") {
      const routed = routePrompt(prompt)
      tool = routed.tool
      estimatedValue = routed.value
      const text = simulatedReply(prompt, tool, estimatedValue, session.org)
      const words = text.split(" ")
      for (let i = 0; i < words.length; i++) {
        emit("delta", { text: (i === 0 ? "" : " ") + words[i] })
        await new Promise((r) => setTimeout(r, 30))
      }
    }

    const scopes = tool?.scopes ?? []
    const requiresApproval = Boolean(tool?.requiresApproval && estimatedValue >= CIBA_THRESHOLD_USD)

    sessionAttributes["agent:scopes"] = scopes.join(" ")
    sessionAttributes["guardrail:ciba"] = String(requiresApproval)

    // ── OBO token exchange (RFC 8693) ─────────────────────────────────────
    // Exchange the user's access_token for a delegated token scoped to exactly
    // what this tool needs. Simulated when BEDROCK_AGENT_CLIENT_SECRET is absent.
    let oboToken: OboTokenNode | null = null
    if (tool && scopes.length > 0) {
      const userAccessToken = await getAccessToken()
      const subjectToken = userAccessToken ?? "simulated_subject_token"
      const exchanged = await exchangeOboToken(subjectToken, scopes.join(" "))
      oboToken = {
        preview: exchanged.preview,
        ts: new Date().toLocaleTimeString("en-US", { hour12: false }),
        source: exchanged.source,
        sub: session.sub,
        actSub: getCimdUrl(),
        scope: scopes.join(" "),
        toolId: tool.id,
      }
      // Thread the OBO token preview into Bedrock session state.
      sessionAttributes["obo:token_preview"] = exchanged.preview
      sessionAttributes["obo:scope"] = scopes.join(" ")
    }

    emit("done", {
      source,
      toolId: tool?.id ?? null,
      scopes,
      requiresApproval,
      estimatedValue,
      sessionAttributes,
      oboToken,
    })
  })
}
