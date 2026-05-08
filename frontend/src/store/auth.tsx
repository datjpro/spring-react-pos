import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getMe, login as loginApi } from '../services/auth'
import { setApiAccessToken, setApiUnauthorizedHandler } from '../services/api'
import type { UserMeResponse } from '../types/auth'

interface AuthContextValue {
  me: UserMeResponse | null
  token: string | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const TOKEN_STORAGE_KEY = 'pos_access_token'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<UserMeResponse | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setApiUnauthorizedHandler(() => {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      setToken(null)
      setApiAccessToken(null)
      setMe(null)
    })

    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!storedToken) {
      setLoading(false)
      return
    }

    setToken(storedToken)
    setApiAccessToken(storedToken)

    getMe()
      .then((profile) => setMe(profile))
      .catch(() => {
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        setToken(null)
        setApiAccessToken(null)
        setMe(null)
      })
      .finally(() => setLoading(false))

    return () => setApiUnauthorizedHandler(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      me,
      token,
      loading,
      login: async (username, password) => {
        const response = await loginApi({ username, password })
        setToken(response.accessToken)
        setApiAccessToken(response.accessToken)
        localStorage.setItem(TOKEN_STORAGE_KEY, response.accessToken)

        const profile = await getMe()
        setMe(profile)
      },
      logout: () => {
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        setToken(null)
        setApiAccessToken(null)
        setMe(null)
      },
    }),
    [loading, me, token],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
