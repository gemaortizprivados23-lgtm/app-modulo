import { useState } from 'react'
import { authResetPassword, supabaseConfigured } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Button, Field } from '../components/UI'

function AuthFrame({ children, title, subtitle }) {
  return <div className="auth-page"><div className="auth-brand"><div className="brand-mark">AM</div><strong>App Módulos</strong></div><div className="auth-card"><div className="auth-icon">AM</div><h1>{title}</h1><p>{subtitle}</p>{!supabaseConfigured && <div className="setup-alert">Configura primero <code>.env</code> con las variables públicas de Supabase.</div>}{children}</div><small className="auth-footer">Sistema de registro y reporte de avances de módulos</small></div>
}

export function Login({ navigate }) {
  const { signIn } = useAuth()
  const [identifier,setIdentifier]=useState('')
  const [password,setPassword]=useState('')
  const [error,setError]=useState('')
  const [loading,setLoading]=useState(false)
  async function submit(e){
    e.preventDefault(); setError(''); setLoading(true)
    try { await signIn(identifier,password); navigate('/avances') }
    catch(err){ setError(err.message || 'No fue posible iniciar sesión.') }
    finally { setLoading(false) }
  }
  return <AuthFrame title="Bienvenido" subtitle="Ingresa con tu código SIGES de 9 dígitos y tu contraseña.">
    <form onSubmit={submit}>
      <Field label="Usuario"><input value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder="Ej. 001089633" required autoComplete="username" /></Field>
      <Field label="Contraseña"><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••••••" required minLength="6" autoComplete="current-password" /></Field>
      {error&&<div className="form-error">{error}</div>}
      <Button type="submit" loading={loading} disabled={!supabaseConfigured}>Iniciar sesión</Button>
    </form>
    <div className="auth-note">Los docentes utilizan su código SIGES de 9 dígitos. No necesitan validar ni confirmar un correo electrónico.</div>
  </AuthFrame>
}
export function Register({ navigate }) { return <AuthFrame title="Registro restringido" subtitle="Las cuentas ya fueron preparadas por la administración."><div className="form-success">Solicita al administrador tus credenciales de acceso.</div><div className="auth-links"><button onClick={()=>navigate('/login')}>Volver al inicio de sesión</button></div></AuthFrame> }
export function ForgotPassword({ navigate }) { const [email,setEmail]=useState('');const [message,setMessage]=useState('');const [error,setError]=useState('');async function submit(e){e.preventDefault();try{await authResetPassword(email);setMessage('Si el correo existe, recibirás instrucciones para recuperar la contraseña.')}catch(err){setError(err.message)}} return <AuthFrame title="Recuperar contraseña" subtitle="Esta opción es solo para la cuenta administrativa."><form onSubmit={submit}><Field label="Correo electrónico"><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></Field>{error&&<div className="form-error">{error}</div>}{message&&<div className="form-success">{message}</div>}<Button type="submit" disabled={!supabaseConfigured}>Enviar instrucciones</Button></form><div className="auth-links"><button onClick={()=>navigate('/login')}>Volver al inicio de sesión</button></div></AuthFrame> }
