import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../context/AuthContext'

const titles = { '/dashboard':'Dashboard','/estudiantes':'Estudiantes','/docentes':'Docentes','/modulos':'Módulos','/avances':'Registrar avance','/historial':'Historial de avances','/reportes':'Reportes','/perfil':'Mi perfil' }
export default function AppLayout({ path, navigate, children }) {
  const [open, setOpen] = useState(false); const { docente, isAdmin, user } = useAuth()
  return <div className="app-shell"><Sidebar path={path} navigate={navigate} mobileOpen={open} closeMobile={() => setOpen(false)} /><div className="main"><header className="topbar"><button className="menu-btn" onClick={() => setOpen(true)}>☰</button><div><span className="eyebrow">GESTIÓN ACADÉMICA</span><h1>{titles[path] || 'App Módulos'}</h1></div><div className="top-user"><div className="avatar">{(docente?.nombre || 'U').charAt(0)}</div><span>{docente ? `${docente.nombre}${isAdmin ? ' · Administrador' : ''}` : (user?.email || 'Usuario')}</span></div></header><main className="content">{children}</main></div></div>
}
