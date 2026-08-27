import { useEffect, useMemo, useState } from 'react'
import { avancesApi, docentesApi, estudiantesApi, modulosApi } from '../services/api'
import { Button, Card, EmptyState, Field, Spinner, Toast, useToast } from '../components/UI'
import { formatDate } from '../utils/helpers'
import { useAuth } from '../context/AuthContext'
import { ASSIGNMENTS } from '../data/assignments'
import { specialtyLabel } from '../utils/academic'

export default function Advances({ navigate }) {
  const { docente, user, isAdmin } = useAuth()
  const [students, setStudents] = useState([])
  const [modules, setModules] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState('multiple')
  const [setup, setSetup] = useState({ año: '', especialidad: '', seccion: '', modulo: '', docente: docente?.id || '' })
  const [selected, setSelected] = useState({})
  const [single, setSingle] = useState({ estudiante: '', porcentaje: '', descripcion: '', observaciones: '' })
  const { toast, notify, clear } = useToast()

  useEffect(() => {
    Promise.all([estudiantesApi.list(), modulosApi.list(), docentesApi.list()])
      .then(([s, m, t]) => {
        setStudents(s)
        setModules(m)
        setTeachers(t)
        // En administración no seleccionamos docente automáticamente: la persona
        // administradora debe elegir para quién se registra el avance.
        if (!isAdmin) {
          setSetup(x => ({ ...x, docente: docente?.id || t.find(d => d.id === user?.id)?.id || '' }))
        } else {
          setSetup(x => ({ ...x, docente: '' }))
        }
      })
      .catch(e => notify(e.message, 'error'))
      .finally(() => setLoading(false))
  }, [docente, user, isAdmin])

  const filtered = useMemo(() => students.filter(s =>
    (!setup.año || s.año === setup.año) &&
    (!setup.especialidad || s.especialidad === setup.especialidad) &&
    (!setup.seccion || s.seccion === setup.seccion) &&
    s.activo !== false
  ), [students, setup])

  const ready = Boolean(setup.año && setup.especialidad && setup.seccion && setup.modulo && setup.docente)
  // El administrador trabaja con todo el catálogo académico, no con la asignación
  // del docente conectado. Los docentes normales no usan esta página.
  const years = [...new Set(modules.map(m => String(m.año)).filter(Boolean))].sort((a, b) => Number(a) - Number(b))

  // En administración se muestran únicamente las seis especialidades de bachillerato
  // solicitadas. NOCTURNO se integra en General y SOST no se muestra como especialidad.
  const allowedSpecialties = ['ADM', 'AUTO', 'SAL', 'SOFT', 'TURISMO', 'GRAL']
  const normalizeSpecialty = value => value === 'NOCTURNO' ? 'GRAL' : value
  const specs = [...new Set([
    ...modules
      .filter(m => !setup.año || String(m.año) === String(setup.año))
      .map(m => normalizeSpecialty(m.especialidad)),
    ...ASSIGNMENTS
      .filter(a => !setup.año || String(a.year) === String(setup.año))
      .map(a => normalizeSpecialty(a.specialty))
  ])]
    .filter(v => allowedSpecialties.includes(v))
    .sort((a, b) => specialtyLabel(a).localeCompare(specialtyLabel(b), 'es'))

  const specialtyMatches = (value, selected) => {
    if (!selected) return true
    if (selected === 'GRAL') return value === 'GRAL' || value === 'NOCTURNO'
    return value === selected
  }

  const mods = modules
    .filter(m => (!setup.año || String(m.año) === String(setup.año)) && specialtyMatches(m.especialidad, setup.especialidad))
    .sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es'))

  const secs = [...new Set([
    ...students
      .filter(s => (!setup.año || String(s.año) === String(setup.año)) && specialtyMatches(s.especialidad, setup.especialidad))
      .map(s => s.seccion),
    ...ASSIGNMENTS
      .filter(a => (!setup.año || String(a.year) === String(setup.año)) && specialtyMatches(a.specialty, setup.especialidad))
      .map(a => a.section)
  ].filter(Boolean))].sort()

  function toggle(id) {
    setSelected(x => ({ ...x, [id]: x[id] ? undefined : { checked: true, porcentaje: '', descripcion: '', observaciones: '' } }))
  }

  async function save() {
    const rows = mode === 'single'
      ? [{ id: single.estudiante, checked: true, ...single }]
      : Object.entries(selected).filter(([, value]) => value?.checked).map(([id, value]) => ({ id, ...value }))

    if (!rows.length || !rows[0].id) return notify('Selecciona al menos un estudiante.', 'error')
    for (const row of rows) {
      if (row.porcentaje === '' || Number(row.porcentaje) < 0 || Number(row.porcentaje) > 100) {
        return notify('El porcentaje debe estar entre 0 y 100.', 'error')
      }
    }

    setSaving(true)
    try {
      await avancesApi.createMany(rows.map(row => ({
        estudiante_id: row.id,
        docente_id: setup.docente,
        modulo_id: setup.modulo,
        año: setup.año,
        especialidad: setup.especialidad,
        seccion: setup.seccion,
        descripcion_avance: row.descripcion || '',
        porcentaje_avance: Number(row.porcentaje),
        observaciones: row.observaciones || '',
      })))
      notify('Avance registrado correctamente.')
      setSelected({})
      setSingle({ estudiante: '', porcentaje: '', descripcion: '', observaciones: '' })
    } catch (e) {
      notify(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="page-intro">
        <div><p>Registro académico</p><h2>Registrar avance de módulo</h2><span>Registra uno o varios estudiantes en una sola operación.</span></div>
        <button className="btn btn-ghost" onClick={() => navigate('/historial')}>Ver historial</button>
      </div>

      <Card>
        <div className="step-title"><span>01</span><div><strong>Contexto académico</strong><small>Selecciona los datos antes de registrar el avance.</small></div></div>
        <div className="form-grid four">
          <Field label="Año">
            <select value={setup.año} onChange={e => setSetup({ ...setup, año: e.target.value, especialidad: '', modulo: '', seccion: '' })}>
              <option value="">Seleccionar año</option>
              {years.map(v => <option key={v} value={v}>{v}° año</option>)}
            </select>
          </Field>
          <Field label="Especialidad">
            <select value={setup.especialidad} disabled={!setup.año} onChange={e => setSetup({ ...setup, especialidad: e.target.value, modulo: '', seccion: '' })}>
              <option value="">Seleccionar especialidad</option>
              {specs.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
          <Field label="Sección">
            <select value={setup.seccion} disabled={!setup.año || !setup.especialidad} onChange={e => setSetup({ ...setup, seccion: e.target.value })}>
              <option value="">Seleccionar sección</option>
              {secs.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
          <Field label="Módulo">
            <select value={setup.modulo} disabled={!setup.año || !setup.especialidad} onChange={e => setSetup({ ...setup, modulo: e.target.value })}>
              <option value="">Seleccionar módulo</option>
              {mods.map(v => <option key={v.id} value={v.id}>{v.codigo} · {v.nombre}</option>)}
            </select>
          </Field>
          <Field label="Docente">
            <select value={setup.docente} onChange={e => setSetup({ ...setup, docente: e.target.value })}>
              <option value="">Seleccionar docente</option>
              {teachers.filter(t => t.activo !== false).map(v => <option key={v.id} value={v.id}>{v.nombre} {v.apellido}</option>)}
            </select>
          </Field>
        </div>
      </Card>

      <Card>
        <div className="section-head">
          <div><h3>02 · Registro de avances</h3><p>Fecha de registro: <strong>{formatDate(new Date())}</strong> · se genera automáticamente en la base de datos.</p></div>
          <div className="segmented"><button className={mode === 'multiple' ? 'active' : ''} onClick={() => setMode('multiple')}>Varios estudiantes</button><button className={mode === 'single' ? 'active' : ''} onClick={() => setMode('single')}>Uno</button></div>
        </div>

        {!ready ? <EmptyState title="Completa el contexto académico" text="Selecciona año, especialidad, sección, módulo y docente para continuar." /> : loading ? <div className="loading-panel"><Spinner />Cargando estudiantes…</div> : mode === 'single' ? <SingleForm students={filtered} value={single} setValue={setSingle} /> : (
          <div className="table-wrap">
            <table className="advance-table"><thead><tr><th></th><th>Estudiante</th><th>Porcentaje</th><th>Descripción del avance</th><th>Observaciones</th></tr></thead>
              <tbody>{filtered.map(student => {
                const value = selected[student.id] || {}
                return <tr key={student.id}>
                  <td><input type="checkbox" checked={!!value.checked} onChange={() => toggle(student.id)} /></td>
                  <td><strong>{student.apellidos}, {student.nombres}</strong></td>
                  <td><input type="number" min="0" max="100" placeholder="0–100" disabled={!value.checked} value={value.porcentaje ?? ''} onChange={e => setSelected(x => ({ ...x, [student.id]: { ...value, checked: true, porcentaje: e.target.value } }))} /></td>
                  <td><input placeholder="¿Qué logró el estudiante?" disabled={!value.checked} value={value.descripcion ?? ''} onChange={e => setSelected(x => ({ ...x, [student.id]: { ...value, checked: true, descripcion: e.target.value } }))} /></td>
                  <td><input placeholder="Observaciones" disabled={!value.checked} value={value.observaciones ?? ''} onChange={e => setSelected(x => ({ ...x, [student.id]: { ...value, checked: true, observaciones: e.target.value } }))} /></td>
                </tr>
              })}</tbody>
            </table>
          </div>
        )}
        {ready && <div className="save-bar"><span>{mode === 'multiple' ? `${Object.values(selected).filter(Boolean).length} estudiante(s) seleccionado(s)` : single.estudiante ? '1 estudiante seleccionado' : 'Selecciona un estudiante'}</span><Button loading={saving} onClick={save}>Guardar avance</Button></div>}
      </Card>
      <Toast toast={toast} onClose={clear} />
    </>
  )
}

function SingleForm({ students, value, setValue }) {
  return <div className="form-grid">
    <Field label="Estudiante"><select value={value.estudiante} onChange={e => setValue({ ...value, estudiante: e.target.value })}><option value="">Seleccionar estudiante</option>{students.map(s => <option key={s.id} value={s.id}>{s.apellidos}, {s.nombres}</option>)}</select></Field>
    <Field label="Porcentaje de avance"><input type="number" min="0" max="100" value={value.porcentaje} onChange={e => setValue({ ...value, porcentaje: e.target.value })} placeholder="0–100" /></Field>
    <Field label="Descripción del avance"><textarea value={value.descripcion} onChange={e => setValue({ ...value, descripcion: e.target.value })} placeholder="Describe el avance realizado…" /></Field>
    <Field label="Observaciones"><textarea value={value.observaciones} onChange={e => setValue({ ...value, observaciones: e.target.value })} placeholder="Observaciones adicionales…" /></Field>
  </div>
}
