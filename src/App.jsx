import { HashRouter, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppLayout from './layouts/AppLayout'
import { Login, Register, ForgotPassword } from './pages/AuthPages'
import Dashboard from './pages/Dashboard'
import { Students, Modules, Teachers } from './pages/CrudPages'
import Advances from './pages/Advances'
import TeacherAdvances from './pages/TeacherAdvances'
import TeacherDelays from './pages/TeacherDelays'
import History from './pages/History'
import Reports from './pages/Reports'
import Profile from './pages/Profile'
import { supabaseConfigured } from './lib/supabase'
import './App.css'

function ProtectedLayout() {
  const { user, loading, isAdmin } = useAuth()
  const navigate = useNavigate()
  const path = useLocation().pathname
  if (loading) return <div className="loading-screen"><div className="brand-mark">AM</div><span>Verificando sesión…</span></div>
  if (!user) return <Navigate to="/login" replace />
  const adminOnly = ['/dashboard','/estudiantes','/docentes','/modulos','/historial','/reportes','/perfil']
  if (!isAdmin && adminOnly.includes(path)) return <Navigate to="/avances" replace />
  return <AppLayout path={path} navigate={navigate}><Outlet /></AppLayout>
}

function SetupNotice() {
  return <div className="setup-screen"><div className="setup-card"><div className="brand-mark">AM</div><h1>App Módulos</h1><p>El proyecto está listo, pero todavía necesita las credenciales públicas de tu proyecto Supabase.</p><ol><li>Copia <code>.env.example</code> como <code>.env</code>.</li><li>Coloca la URL del proyecto y la anon key pública.</li><li>Ejecuta el SQL de <code>supabase/schema.sql</code> en Supabase.</li><li>Ejecuta <code>npm install</code> y luego <code>npm run dev</code>.</li></ol><strong>No coloques service_role ni claves privadas en el frontend.</strong></div></div>
}

function AppRoutes() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  if (!supabaseConfigured) return <SetupNotice />
  return <Routes>
    <Route path="/login" element={<Login navigate={navigate} />} />
    <Route path="/register" element={<Navigate to="/login" replace />} />
    <Route path="/forgot-password" element={<ForgotPassword navigate={navigate} />} />
    <Route element={<ProtectedLayout />}>
      <Route path="/dashboard" element={<Dashboard navigate={navigate} />} />
      <Route path="/estudiantes" element={<Students />} />
      <Route path="/docentes" element={<Teachers />} />
      <Route path="/modulos" element={<Modules />} />
      <Route path="/avances" element={isAdmin ? <Advances navigate={navigate} /> : <TeacherAdvances />} />
      <Route path="/historial" element={<History />} />
      <Route path="/reportes" element={<Reports />} />
      <Route path="/perfil" element={<Profile />} />
    </Route>
    <Route path="/" element={<Navigate to="/avances" replace />} />
    <Route path="*" element={<Navigate to="/avances" replace />} />
  </Routes>
}

export default function App() { return <HashRouter><AuthProvider><AppRoutes /></AuthProvider></HashRouter> }
