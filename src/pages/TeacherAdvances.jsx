import { useEffect, useMemo, useState } from 'react'
import { invokeFunction } from '../lib/supabase'
import { asignacionesApi } from '../services/api'
import { Button, Card, EmptyState, Field, Toast, useToast } from '../components/UI'
import { formatDate } from '../utils/helpers'
import { useAuth } from '../context/AuthContext'
import { specialtyLabel } from '../utils/academic'

const emptyStudent = () => ({ name:'', percent:'', estado:'Con atraso', situacion:'', observaciones:'' })

const unique = (items) => [...new Set(items.filter(Boolean))]

export default function TeacherAdvances() {
  const { docente } = useAuth()
  const [year, setYear] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [module, setModule] = useState('')
  const [section, setSection] = useState('')
  const [students, setStudents] = useState([emptyStudent()])
  const [assignments, setAssignments] = useState([])
  const [assignmentsLoading, setAssignmentsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast, notify, clear } = useToast()

  useEffect(() => {
    let active = true
    setAssignmentsLoading(true)
    asignacionesApi.list({ activo: 'eq.true' })
      .then(rows => { if (active) setAssignments(rows || []) })
      .catch(() => { if (active) setAssignments([]) })
      .finally(() => { if (active) setAssignmentsLoading(false) })
    return () => { active = false }
  }, [])

  const years = useMemo(() => unique(assignments.map(a => String(a.anio))).sort((a,b) => Number(a)-Number(b)), [assignments])
  const specialties = useMemo(() => unique(assignments.filter(a => String(a.anio) === year).map(a => a.especialidad)).sort(), [assignments, year])
  const sections = useMemo(() => {
    return unique(assignments.filter(a => String(a.anio) === year && a.especialidad === specialty).map(a => a.seccion)).sort()
  }, [assignments, year, specialty])

  // El docente puede seleccionar cualquier módulo que exista en la sección elegida,
  // independientemente del SIGES al que figure asignado en el documento horario.
  const modules = useMemo(() => {
    const rows = assignments.filter(a =>
      String(a.anio) === year &&
      a.especialidad === specialty &&
      a.seccion === section
    )
    const map = new Map()
    rows.forEach(a => {
      const key = `${a.modulo}|${a.anio}|${a.especialidad}|${a.seccion}`
      if (!map.has(key)) map.set(key, { module: a.modulo, year: String(a.anio), specialty: a.especialidad, section: a.seccion })
    })
    return [...map.values()].sort((a,b) => a.module.localeCompare(b.module, 'es'))
  }, [assignments, year, specialty, section])

  useEffect(() => {
    setSpecialty('')
    setModule('')
    setSection('')
  }, [year])

  useEffect(() => {
    setModule('')
    setSection('')
  }, [specialty])


  function setStudent(index,key,value){
    setStudents(list => list.map((s,i) => i===index ? {...s,[key]:value} : s))
  }
  function addStudent(){ setStudents(list => [...list, emptyStudent()]) }
  function removeStudent(i){ setStudents(list => list.length===1 ? list : list.filter((_,idx)=>idx!==i)) }

  const ready = Boolean(docente?.id && year && specialty && module && section)
  const canSave = ready && students.length && students.every(s => s.name.trim() && s.percent !== '' && Number(s.percent) >= 0 && Number(s.percent) <= 100)

  async function save(){
    if (!ready) return notify('Selecciona año, especialidad, módulo y sección antes de guardar.', 'error')
    if (!canSave) return notify('Completa nombre y porcentaje de todos los estudiantes.', 'error')
    setSaving(true)
    try {
      await invokeFunction('teacher-save-advances-v4', {
        assignment: { module, year, specialty, section },
        students: students.map(s => ({ name: s.name.trim(), percent: Number(s.percent), estado: s.estado, situacion: s.situacion.trim(), observaciones: s.observaciones.trim() }))
      })
      notify(`Se registraron ${students.length} estudiante${students.length===1?'':'s'} correctamente.`)
      setStudents([emptyStudent()])
    } catch (e) {
      notify(e.message || 'No fue posible guardar el registro.', 'error')
    } finally { setSaving(false) }
  }

  return <>
    <div className="page-intro">
      <div>
        <p>Registro docente</p>
        <h2>Registrar avance de módulo</h2>
        <span>Selecciona el año, la especialidad y la sección; luego elige el módulo que deseas reportar.</span>
      </div>
      <div className="date-badge">Fecha: {formatDate(new Date())}</div>
    </div>

    {!docente?.id ? <Card><EmptyState title="No se pudo cargar tu usuario" text="Cierra sesión e inicia nuevamente para continuar."/></Card> : <>
      <Card>
        <div className="step-title"><span>01</span><div><strong>Contexto académico</strong><small>Elige el grupo y después selecciona cualquier módulo disponible en esa sección.</small></div></div>
        {assignmentsLoading ? <div className="loading-panel">Cargando asignaciones 2026…</div> : <div className="form-grid four">
          <Field label="Año">
            <select value={year} onChange={e=>setYear(e.target.value)}>
              <option value="">Seleccionar año</option>
              {years.map(y=><option key={y} value={y}>{y}° año</option>)}
            </select>
          </Field>
          <Field label="Especialidad">
            <select value={specialty} onChange={e=>setSpecialty(e.target.value)} disabled={!year || assignmentsLoading}>
              <option value="">Seleccionar especialidad</option>
              {specialties.map(s=><option key={s} value={s}>{specialtyLabel(s)}</option>)}
            </select>
          </Field>
          <Field label="Sección">
            <select value={section} onChange={e=>setSection(e.target.value)} disabled={!year || !specialty || assignmentsLoading}>
              <option value="">Seleccionar sección</option>
              {sections.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Módulo">
            <select value={module} onChange={e=>setModule(e.target.value)} disabled={!year || !specialty || !section || assignmentsLoading}>
              <option value="">Seleccionar módulo</option>
              {modules.map(m=><option key={`${m.module}|${m.year}|${m.specialty}|${m.section}`} value={m.module}>{m.module}</option>)}
            </select>
          </Field>
          <Field label="Docente" className="full">
            <input value={docente ? `${docente.nombre} ${docente.apellido}` : ''} readOnly />
          </Field>
        </div>}
      </Card>

      <Card>
        <div className="section-head"><div><h3>02 · Estudiantes</h3><p>Agrega los estudiantes y describe la situación de cada uno.</p></div><Button variant="ghost" onClick={addStudent}>＋ Agregar estudiante</Button></div>
        {!ready ? <EmptyState title="Completa el contexto académico" text="Selecciona año, especialidad, módulo y sección para continuar."/> : <div className="teacher-entry-list">
          {students.map((s,i)=><div className="teacher-entry" key={i}>
            <div className="teacher-entry-number">{i+1}</div>
            <Field label="Nombre completo"><input value={s.name} onChange={e=>setStudent(i,'name',e.target.value)} placeholder="Nombre y apellidos"/></Field>
            <Field label="% de avance"><input type="number" min="0" max="100" value={s.percent} onChange={e=>setStudent(i,'percent',e.target.value)} placeholder="0 - 100"/></Field>
            <Field label="Estado"><select value={s.estado} onChange={e=>setStudent(i,'estado',e.target.value)}><option>Al día</option><option>Con atraso</option><option>No presentó</option><option>Pendiente</option></select></Field>
            <Field label="Situación / actividad atrasada"><textarea value={s.situacion} onChange={e=>setStudent(i,'situacion',e.target.value)} placeholder="Describe qué actividad tiene pendiente o la situación presentada."/></Field>
            <Field label="Observaciones"><textarea value={s.observaciones} onChange={e=>setStudent(i,'observaciones',e.target.value)} placeholder="Observaciones adicionales."/></Field>
            <button className="danger-link teacher-entry-remove" type="button" onClick={()=>removeStudent(i)} disabled={students.length===1}>Eliminar</button>
          </div>)}
        </div>}
        <div className="save-bar"><span>Docente: <strong>{docente ? `${docente.nombre} ${docente.apellido}` : 'Usuario actual'}</strong></span><Button onClick={save} loading={saving} disabled={!canSave}>Guardar avance</Button></div>
      </Card>
    </>}
    <Toast toast={toast} onClose={clear}/>
  </>
}
