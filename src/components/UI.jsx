import { useEffect, useState } from 'react'

export function Button({ children, variant='primary', type='button', loading=false, ...props }) {
  return <button className={`btn btn-${variant}`} type={type} disabled={loading || props.disabled} {...props}>{loading ? 'Procesando…' : children}</button>
}
export function Card({ children, className='' }) { return <section className={`card ${className}`}>{children}</section> }
export function Modal({ open, title, children, onClose, wide=false }) {
  if (!open) return null
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><div className={`modal ${wide ? 'modal-wide' : ''}`}><div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose} aria-label="Cerrar">×</button></div>{children}</div></div>
}
export function ConfirmDialog({ open, title='Confirmar acción', message, onCancel, onConfirm, loading }) {
  return <Modal open={open} title={title} onClose={onCancel}><p className="muted">{message}</p><div className="modal-actions"><Button variant="ghost" onClick={onCancel}>Cancelar</Button><Button variant="danger" loading={loading} onClick={onConfirm}>Eliminar</Button></div></Modal>
}
export function EmptyState({ title='Sin registros', text='No hay información para mostrar.' }) { return <div className="empty"><div className="empty-icon">⌁</div><strong>{title}</strong><span>{text}</span></div> }
export function Spinner() { return <span className="spinner" aria-label="Cargando" /> }
export function Toast({ toast, onClose }) {
  useEffect(() => { if (!toast) return; const t = setTimeout(onClose, 3800); return () => clearTimeout(t) }, [toast, onClose])
  if (!toast) return null
  return <div className={`toast toast-${toast.type || 'success'}`}><span>{toast.type === 'error' ? '!' : '✓'}</span><div>{toast.message}</div><button onClick={onClose}>×</button></div>
}
export function useToast() {
  const [toast, setToast] = useState(null)
  return { toast, notify: (message, type='success') => setToast({ message, type }), clear: () => setToast(null) }
}
export function Field({ label, error, children, hint }) { return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}{error && <em>{error}</em>}</label> }
export function StatCard({ label, value, icon, detail }) { return <Card className="stat-card"><div className="stat-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</div></Card> }
