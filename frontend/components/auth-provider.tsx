"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import {
  getSession,
  loginUser,
  logoutUser,
  registerUser,
  type Session,
} from "@/lib/auth-client"

type AuthContextValue = {
  user: Session | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ error?: string }>
  signup: (email: string, password: string) => Promise<{ error?: string }>
  logout: () => void
  refresh: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    setUser(getSession())
  }, [])

  useEffect(() => {
    setUser(getSession())
    setLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await loginUser(email, password)
    if ("error" in res) return { error: res.error }
    setUser(res.session)
    return {}
  }, [])

  const signup = useCallback(async (email: string, password: string) => {
    const err = await registerUser(email, password)
    if (err) return { error: err }
    return {}
  }, [])

  const logout = useCallback(() => {
    logoutUser()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      signup,
      logout,
      refresh,
    }),
    [user, loading, login, signup, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
