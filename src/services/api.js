import { insert, query, update, remove, invokeFunction } from '../lib/supabase'

const selectAll = '*'

export const estudiantesApi = {
  list: () => query('estudiantes', { select: selectAll, order: 'apellidos.asc,nombres.asc' }),
  create: (data) => insert('estudiantes', data),
  update: (id, data) => update('estudiantes', { id: `eq.${id}` }, data),
  remove: (id) => remove('estudiantes', { id: `eq.${id}` }),
}
export const modulosApi = {
  list: () => query('modulos', { select: selectAll, order: 'año.asc,codigo.asc' }),
  create: (data) => insert('modulos', data),
  update: (id, data) => update('modulos', { id: `eq.${id}` }, data),
  remove: (id) => remove('modulos', { id: `eq.${id}` }),
}
export const docentesApi = {
  list: () => query('docentes', { select: selectAll, order: 'apellido.asc,nombre.asc' }),
  get: (id) => query('docentes', { select: selectAll, id: `eq.${id}` }),
  create: (data) => insert('docentes', data),
  update: (id, data) => update('docentes', { id: `eq.${id}` }, data),
  createAccount: (data) => invokeFunction('admin-create-teacher-v2', data),
  provision2026: (teachers) => invokeFunction('admin-provision-2026-clean', { teachers }),
}
export const asignacionesApi = {
  list: (params = {}) => query('asignaciones_docentes_2026', { select: 'codigo_siges,modulo,anio,especialidad,seccion,activo', order: 'anio.asc,especialidad.asc,seccion.asc,modulo.asc', ...params }),
}
export const atrasosApi = {
  list: () => query('atrasos_actividades', { select: '*,docente:docentes(id,nombre,apellido,correo)', order: 'fecha_registro.desc,created_at.desc' }),
  create: (data) => insert('atrasos_actividades', data),
  createMany: (data) => insert('atrasos_actividades', data),
  update: (id, data) => update('atrasos_actividades', { id: `eq.${id}` }, data),
  remove: (id) => remove('atrasos_actividades', { id: `eq.${id}` }),
}
export const avancesApi = {
  list: () => query('avances', { select: '*,estudiante:estudiantes(id,nombres,apellidos,año,especialidad,seccion),docente:docentes(id,nombre,apellido,correo),modulo:modulos(id,codigo,nombre,especialidad,año)', order: 'fecha_registro.desc' }),
  create: (data) => insert('avances', data),
  createMany: (data) => insert('avances', data),
  update: (id, data) => update('avances', { id: `eq.${id}` }, data),
  remove: (id) => remove('avances', { id: `eq.${id}` }),
}
