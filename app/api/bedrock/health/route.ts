import { NextResponse } from "next/server"
import {
  BedrockAgentClient,
  GetAgentCommand,
} from "@aws-sdk/client-bedrock-agent"
import { getSession } from "@/lib/auth0"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
  }

  const region = process.env.AWS_REGION
  const agentId = process.env.AWS_BEDROCK_AGENT_ID
  const aliasId = process.env.AWS_BEDROCK_AGENT_ALIAS_ID

  if (!region || !agentId || !aliasId) {
    return NextResponse.json({
      status: "unconfigured",
      message: "AWS_REGION, AWS_BEDROCK_AGENT_ID, and AWS_BEDROCK_AGENT_ALIAS_ID must all be set.",
      missing: [
        !region && "AWS_REGION",
        !agentId && "AWS_BEDROCK_AGENT_ID",
        !aliasId && "AWS_BEDROCK_AGENT_ALIAS_ID",
      ].filter(Boolean),
    })
  }

  try {
    const client = new BedrockAgentClient({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      },
    })

    const cmd = new GetAgentCommand({ agentId })
    const res = await client.send(cmd)
    const agent = res.agent

    return NextResponse.json({
      status: "ok",
      region,
      agentId,
      aliasId,
      agentName: agent?.agentName,
      agentStatus: agent?.agentStatus,
      foundationModel: agent?.foundationModel,
    })
  } catch (err) {
    const error = err as Error & { name?: string }
    return NextResponse.json(
      {
        status: "error",
        region,
        agentId,
        aliasId,
        error: error.name ?? "UnknownError",
        message: error.message,
      },
      { status: 502 },
    )
  }
}
