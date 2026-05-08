import { ApiWorkbench, JsonForm } from '../components/ApiWorkbench'
import { createUser, getUsers, updateUser, updateUserActive } from '../services/users'

export function UsersPage() {
  return (
    <ApiWorkbench
      eyebrow="System"
      title="Users"
      actions={[
        { name: 'List users', description: 'GET /users', run: () => getUsers() },
        { name: 'Update user #2', description: 'PUT /users/{id}', run: () => updateUser(2, { role: 'STAFF', branchId: null, active: true }) },
        { name: 'Activate user #2', description: 'PATCH /users/{id}/active', run: () => updateUserActive(2, true) },
      ]}
    >
      <JsonForm
        title="Create user"
        initialValue={{ username: 'staff_new', password: 'P@ssw0rd', role: 'STAFF', branchId: null, active: true }}
        onSubmit={(value) => createUser(value)}
      />
    </ApiWorkbench>
  )
}
