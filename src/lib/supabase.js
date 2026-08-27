const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

const STORAGE_KEY = 'app-modulo-session'

export function getSession() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') } catch { return null }
}
export function setSession(session) {
  if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  else localStorage.removeItem(STORAGE_KEY)
}

async function request(path, options = {}) {
  if (!supabaseConfigured) throw new Error('Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env')
  const session = getSession()
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  const response = await fetch(`${SUPABASE_URL}${path}`, { ...options, headers })
  const text = await response.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!response.ok) {
    const message = data?.message || data?.msg || data?.error_description || data?.error || `Error ${response.status}`
    throw new Error(message)
  }
  return data
}

export async function authSignIn(email, password) {
  const data = await request('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email, password }) })
  setSession(data)
  return data
}
export async function authSignUp(email, password, metadata = {}) {
  const data = await request('/auth/v1/signup', { method: 'POST', body: JSON.stringify({ email, password, data: metadata }) })
  if (data?.access_token) setSession(data)
  return data
}
export async function authResetPassword(email) {
  return request('/auth/v1/recover', { method: 'POST', body: JSON.stringify({ email }) })
}
export async function authSignOut() { setSession(null) }
export async function authUser() {
  const session = getSession()
  if (!session?.access_token) return null
  try { return await request('/auth/v1/user') } catch { setSession(null); return null }
}

export async function query(table, params = {}) {
  const qs = new URLSearchParams(params)
  return request(`/rest/v1/${table}?${qs.toString()}`, { headers: { Prefer: 'return=representation' } })
}
export async function insert(table, body) {
  return request(`/rest/v1/${table}`, { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(body) })
}
export async function update(table, filters, body) {
  const qs = new URLSearchParams(filters)
  return request(`/rest/v1/${table}?${qs.toString()}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(body) })
}
export async function remove(table, filters) {
  const qs = new URLSearchParams(filters)
  return request(`/rest/v1/${table}?${qs.toString()}`, { method: 'DELETE', headers: { Prefer: 'return=representation' } })
}

export { SUPABASE_URL, SUPABASE_ANON_KEY }

export async function invokeFunction(functionName, body = {}) {
  if (!supabaseConfigured) throw new Error('Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env')
  const session = getSession()
  if (!session?.access_token) throw new Error('Tu sesión ha expirado. Inicia sesión nuevamente.')
  return request(`/functions/v1/${functionName}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(body),
  })
}
export async function invokePublicFunction(functionName, body = {}) {
  if (!supabaseConfigured) throw new Error('Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env')
  return request(`/functions/v1/${functionName}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
