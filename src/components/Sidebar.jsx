import { useAuth } from '../context/AuthContext'

const adminLinks = [
  ['dashboard','Dashboard','⌂'],['estudiantes','Estudiantes','◉'],['docentes','Docentes','♙'],['modulos','Módulos','▦'],['avances','Registrar avance','＋'],['historial','Historial','≡'],['reportes','Reportes','▤'],
]
const teacherLinks = [['avances','Registrar avance','＋']]

export default function Sidebar({ path, navigate, mobileOpen, closeMobile }) {
  const { docente, user, signOut, isAdmin } = useAuth()
  return <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
    <div className="brand"><div className="brand-mark">AM</div><div><strong>App Módulos</strong><span>Gestión académica</span></div><button className="mobile-close" onClick={closeMobile}>×</button></div>
    <nav>{(isAdmin ? adminLinks : teacherLinks).map(([to,label,icon]) => <button key={to} className={path === `/${to}` ? 'active' : ''} onClick={() => {navigate(`/${to}`); closeMobile()}}><span>{icon}</span>{label}</button>)}</nav>
    <div className="sidebar-bottom">{isAdmin && <button onClick={() => navigate('/perfil')} className={path === '/perfil' ? 'active' : ''}><span>◌</span>Mi perfil</button>}<div className="user-mini"><div className="avatar">{(docente?.nombre || user?.email || 'U').charAt(0).toUpperCase()}</div><div><strong>{docente ? `${docente.nombre} ${docente.apellido}` : (user?.email || 'Usuario')}</strong><span>{isAdmin ? (docente?.correo || user?.email) : `Usuario SIGES: ${docente?.codigo_siges || '—'}`}</span></div></div><button className="logout" onClick={signOut}><span>↪</span>Cerrar sesión</button></div>
  </aside>
}
