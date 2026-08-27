export const formatDate = (value) => value ? new Intl.DateTimeFormat('es-SV', { dateStyle: 'medium' }).format(new Date(value)) : '—'
export const formatDateTime = (value) => value ? new Intl.DateTimeFormat('es-SV', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'
export const fullName = (person) => person ? `${person.nombres || person.nombre || ''} ${person.apellidos || person.apellido || ''}`.trim() : '—'
export const unique = (items) => [...new Set(items.filter(Boolean))]
export const years = ['1', '2', '3']
