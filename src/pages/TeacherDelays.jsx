import { useMemo, useState } from 'react'
import { atrasosApi } from '../services/api'
import { Button, Card, EmptyState, Field, Toast, useToast } from '../components/UI'
import { formatDate } from '../utils/helpers'
import { useAuth } from '../context/AuthContext'

function newStudent() {
  return { estudiante_nombre: '', situacion: '', acta_situacion: false, informado_docente_guia: false }
}

export default function TeacherDelays() {
  const { docente } = useAuth()
  const [form, setForm] = useState({
    modulo_nombre: '',
    seccion: '',
    anio: '',
    especialidad: '',
    actividad_pendiente: '',
    observaciones: '',
  })
  const [students, setStudents] = useState([newStudent()])
  const [saving, setSaving] = useState(false)
  const { toast, notify, clear } = useToast()

  const canSave = useMemo(() => Boolean(
    form.modulo_nombre.trim() && form.seccion.trim() && form.actividad_pendiente.trim() &&
    docente?.id && students.length && students.every(s => s.estudiante_nombre.trim() && s.situacion.trim())
  ), [form, students, docente])

  function updateStudent(index, key, value) {
    setStudents(current => current.map((row, i) => i === index ? { ...row, [key]: value } : row))
  }

  function addStudent() { setStudents(current => [...current, newStudent()]) }
  function removeStudent(index) {
    setStudents(current => current.length === 1 ? current : current.filter((_, i) => i !== index))
  }

  async function save() {
    if (!canSave) {
      notify('Completa módulo, sección, actividad y la situación de cada estudiante.', 'error')
      return
    }
    setSaving(true)
    try {
      await atrasosApi.createMany(students.map(student => ({
        docente_id: docente.id,
        modulo_nombre: form.modulo_nombre.trim(),
        seccion: form.seccion.trim(),
        anio: form.anio.trim() || null,
        especialidad: form.especialidad.trim() || null,
        actividad_pendiente: form.actividad_pendiente.trim(),
        estudiante_nombre: student.estudiante_nombre.trim(),
        situacion: student.situacion.trim(),
        observaciones: form.observaciones.trim() || null,
        acta_situacion: student.acta_situacion,
        informado_docente_guia: student.informado_docente_guia,
      })))
      notify(`Se registraron ${students.length} estudiante${students.length === 1 ? '' : 's'} con atraso.`)
      setForm({ modulo_nombre: '', seccion: '', anio: '', especialidad: '', actividad_pendiente: '', observaciones: '' })
      setStudents([newStudent()])
    } catch (e) {
      notify(e.message || 'No fue posible guardar el registro.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return <>
    <div className="page-intro">
      <div>
        <p>Registro docente</p>
        <h2>Reportar estudiantes con actividades atrasadas</h2>
        <span>Registra el módulo, la sección y la situación de cada estudiante.</span>
      </div>
      <div className="date-badge">Fecha: {formatDate(new Date())}</div>
    </div>

    <Card>
      <div className="step-title"><span>01</span><div><strong>Datos del módulo</strong><small>Estos datos se guardarán automáticamente con tu usuario.</small></div></div>
      <div className="form-grid four">
        <Field label="Nombre del módulo"><input value={form.modulo_nombre} onChange={e => setForm({ ...form, modulo_nombre: e.target.value })} placeholder="Ej. Desarrollo de aplicaciones" /></Field>
        <Field label="Sección"><input value={form.seccion} onChange={e => setForm({ ...form, seccion: e.target.value })} placeholder="Ej. 3°A" /></Field>
        <Field label="Año"><input value={form.anio} onChange={e => setForm({ ...form, anio: e.target.value })} placeholder="Ej. Tercer año" /></Field>
        <Field label="Especialidad"><input value={form.especialidad} onChange={e => setForm({ ...form, especialidad: e.target.value })} placeholder="Ej. Desarrollo de Software" /></Field>
        <Field label="Actividad pendiente" className="full"><input value={form.actividad_pendiente} onChange={e => setForm({ ...form, actividad_pendiente: e.target.value })} placeholder="Ej. Entrega de proyecto de unidad 2" /></Field>
        <Field label="Observaciones generales"><textarea value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} placeholder="Información adicional del grupo o de la actividad." /></Field>

      </div>
    </Card>

    <Card>
      <div className="section-head">
        <div><h3>02 · Estudiantes con atraso</h3><p>Agrega cada estudiante y describe su situación particular.</p></div>
        <Button variant="ghost" onClick={addStudent}>＋ Agregar estudiante</Button>
      </div>
      <div className="delay-list">
        {students.map((student, index) => <div className="delay-row" key={index}>
          <div className="delay-number">{index + 1}</div>
          <Field label="Nombre completo"><input value={student.estudiante_nombre} onChange={e => updateStudent(index, 'estudiante_nombre', e.target.value)} placeholder="Nombre y apellidos" /></Field>
          <Field label="Situación del estudiante"><textarea value={student.situacion} onChange={e => updateStudent(index, 'situacion', e.target.value)} placeholder="Describe la actividad que no realizó, dificultad presentada, incumplimiento u otra situación relevante." /></Field>
          <div className="followup-flags">
            <label className="check-card compact"><input type="checkbox" checked={student.acta_situacion} onChange={e => updateStudent(index, 'acta_situacion', e.target.checked)}/><span><strong>Acta levantada</strong><small>Ya se levantó acta de la situación.</small></span></label>
            <label className="check-card compact"><input type="checkbox" checked={student.informado_docente_guia} onChange={e => updateStudent(index, 'informado_docente_guia', e.target.checked)}/><span><strong>Docente guía informado</strong><small>Ya fue informado el docente guía.</small></span></label>
          </div>
          <button className="danger-link delay-remove" type="button" onClick={() => removeStudent(index)} disabled={students.length === 1}>Eliminar</button>
        </div>)}
      </div>
      {!students.length && <EmptyState title="Agrega un estudiante" text="Cada registro debe incluir nombre y situación." />}
      <div className="save-bar"><span>Docente: <strong>{docente ? `${docente.nombre} ${docente.apellido}` : 'Usuario actual'}</strong></span><Button onClick={save} loading={saving} disabled={!canSave}>Guardar reporte de atraso</Button></div>
    </Card>
    <Toast toast={toast} onClose={clear} />
  </>
}
