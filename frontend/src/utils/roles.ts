export type AppRole = 'ADMIN' | 'MANAGER' | 'STAFF'

const rank: Record<AppRole, number> = {
  STAFF: 1,
  MANAGER: 2,
  ADMIN: 3,
}

export function normalizeRole(role: string | null | undefined): AppRole | null {
  if (role === 'ADMIN' || role === 'MANAGER' || role === 'STAFF') return role
  return null
}

export function hasMinimumRole(role: string | null | undefined, minimumRole: AppRole) {
  const normalized = normalizeRole(role)
  if (!normalized) return false
  return rank[normalized] >= rank[minimumRole]
}

export function hasAnyRole(role: string | null | undefined, roles: AppRole[]) {
  const normalized = normalizeRole(role)
  if (!normalized) return false
  return roles.includes(normalized)
}
