import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { authSignIn, authSignOut, authSignUp, authUser, getSession, setSession, invokePublicFunction } from '../lib/supabase'
import { docentesApi } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [docente, setDocente] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const refresh = async () => {
    const current = await authUser()
    setUser(current)
    const admin = (current?.email || '').toLowerCase() === 'angelelcielo@gmail.com'
    setIsAdmin(admin)
    if (current?.id) {
      try {
        const rows = await docentesApi.get(current.id)
        if (rows?.[0]) setDocente({ ...rows[0], codigo_siges: current.user_metadata?.codigo_siges || rows[0].codigo_siges || '' })
        else {
          const created = await docentesApi.create({ id: current.id, nombre: current.user_metadata?.nombre || 'Docente', apellido: current.user_metadata?.apellido || '', correo: current.email || '' })
          setDocente(created?.[0] ? { ...created[0], codigo_siges: current.user_metadata?.codigo_siges || '' } : null)
        }
      } catch { setDocente(null) }
    } else setDocente(null)
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  const value = useMemo(() => ({
    user, docente, loading,
    signIn: async (identifier, password) => {
      const value = String(identifier || '').trim()
      const data = /^\d{9}$/.test(value)
        ? await invokePublicFunction('teacher-login-siges', { siges: value, password })
        : await authSignIn(value.toLowerCase(), password)
      setSession(data)
      setUser(data.user)
      await refresh()
      return data
    },
    signUp: async (email, password, metadata) => authSignUp(email, password, metadata),
    signOut: async () => { await authSignOut(); setSession(null); setUser(null); setDocente(null); setIsAdmin(false) },
    session: getSession(),
    refresh,
    isAdmin,
  }), [user, docente, loading, isAdmin])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export function useAuth() { return useContext(AuthContext) }
