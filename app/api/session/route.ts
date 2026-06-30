import { NextResponse } from "next/server"
import { getSession, isAuth0Configured } from "@/lib/auth0"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getSession()
  return NextResponse.json({
    session,
    auth0Configured: isAuth0Configured(),
  })
}
