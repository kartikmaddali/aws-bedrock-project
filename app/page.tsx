import { getSession, isAuth0Configured } from "@/lib/auth0"
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

  return (
    <WorkspaceProvider session={session} auth0Configured={auth0Configured}>
      <Workspace />
    </WorkspaceProvider>
  )
}
