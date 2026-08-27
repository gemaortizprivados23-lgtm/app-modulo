export const SPECIALTY_LABELS = {
  ADM: 'Administrativo Contable',
  AUTO: 'Mantenimiento Automotriz',
  SAL: 'Salud',
  SOFT: 'Desarrollo de Software',
  TURISMO: 'Servicios Turísticos',
  GRAL: 'General',
  NOCTURNO: 'General',
}

export function specialtyLabel(value) {
  return SPECIALTY_LABELS[value] || value || ''
}
