import { cookies } from "next/headers"
import { getSession, isAuth0Configured, SESSION_COOKIE } from "@/lib/auth0"
import { WorkspaceProvider } from "@/components/workspace-provider"
import { Workspace } from "@/components/workspace"
import { LoginScreen } from "@/components/login-screen"

export const dynamic = "force-dynamic"

export default async function Page() {
  const session = await getSession()
  const auth0Configured = isAuth0Configured()

  if (!session) {
    return <LoginScreen auth0Configured={auth0Configured} />
  }

  const store = await cookies()
  const idTokenRaw = store.get(SESSION_COOKIE)?.value
  const accessTokenRaw = store.get("ha_access_token")?.value

  const idTokenPreview = idTokenRaw
    ? `${idTokenRaw.slice(0, 20)}…${idTokenRaw.slice(-8)}`
    : `eyJhbGciOiJSUzI1NiJ9.${Buffer.from(JSON.stringify({ sub: session.sub })).toString("base64url").slice(0, 16)}…sim_id`

  const accessTokenPreview = accessTokenRaw
    ? `${accessTokenRaw.slice(0, 20)}…${accessTokenRaw.slice(-8)}`
    : `eyJhbGciOiJSUzI1NiJ9.${Buffer.from(JSON.stringify({ sub: session.sub })).toString("base64url").slice(0, 16)}…sim_at`

  return (
    <WorkspaceProvider
      session={session}
      auth0Configured={auth0Configured}
      idTokenPreview={idTokenPreview}
      accessTokenPreview={accessTokenPreview}
      isSimulatedSession={session.source === "simulated"}
    >
      <Workspace />
    </WorkspaceProvider>
  )
}
