import { ApiWorkbench, JsonForm } from '../components/ApiWorkbench'
import { getMe, refreshToken } from '../services/auth'

export function AuthToolsPage() {
  return (
    <ApiWorkbench
      eyebrow="Authentication"
      title="Auth Tools"
      actions={[
        { name: 'Get current user', description: 'GET /users/me', run: () => getMe() },
      ]}
    >
      <JsonForm
        title="Refresh access token"
        initialValue={{ refreshToken: 'paste-refresh-token-here' }}
        onSubmit={(value) => refreshToken(value.refreshToken)}
      />
    </ApiWorkbench>
  )
}
