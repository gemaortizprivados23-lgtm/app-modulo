import { useEffect, useMemo, useState } from 'react'
import { avancesApi, atrasosApi } from '../services/api'
import { Button, Card, EmptyState, Field, Spinner, Toast, useToast } from '../components/UI'
import { formatDate, fullName } from '../utils/helpers'
import { downloadReportPdf, downloadDelayReportPdf } from '../utils/pdf'
import { specialtyLabel } from '../utils/academic'

const institution = import.meta.env.VITE_INSTITUTION_NAME || 'Instituto Nacional de Santiago de Maria'

export default function Reports() {
  const [tab, setTab] = useState('atrasos')
  const [advances, setAdvances] = useState([])
  const [delays, setDelays] = useState([])
  const [loading, setLoading] = useState(true)
  const [f, setF] = useState({ docente:'', año:'', especialidad:'', seccion:'', modulo:'', estudiante:'', inicio:'', fin:'' })
  const { toast, notify, clear } = useToast()

  useEffect(() => {
    Promise.all([avancesApi.list(), atrasosApi.list()])
      .then(([a, d]) => { setAdvances(a); setDelays(d) })
      .catch(e => notify(e.message, 'error'))
      .finally(() => setLoading(false))
  }, [])

  const current = tab === 'atrasos' ? delays : advances
  const opts = key => {
    const values = current.map(x => {
      if (tab === 'atrasos') {
        if (key === 'docente') return fullName(x.docente)
        if (key === 'modulo') return x.modulo_nombre
        if (key === 'estudiante') return x.estudiante_nombre
        return x[key]
      }
      if (key === 'docente') return fullName(x.docente)
      if (key === 'modulo') return `${x.modulo?.codigo} · ${x.modulo?.nombre}`
      if (key === 'estudiante') return fullName(x.estudiante)
      return x[key]
    })
    return [...new Set(values.filter(Boolean))]
  }

  const filtered = useMemo(() => current.filter(x => {
    if (tab === 'atrasos') {
      return (!f.docente || fullName(x.docente) === f.docente) &&
        (!f.año || x.anio === f.año) &&
        (!f.especialidad || x.especialidad === f.especialidad) &&
        (!f.seccion || x.seccion === f.seccion) &&
        (!f.modulo || x.modulo_nombre === f.modulo) &&
        (!f.estudiante || x.estudiante_nombre === f.estudiante) &&
        (!f.inicio || String(x.fecha_registro).slice(0,10) >= f.inicio) &&
        (!f.fin || String(x.fecha_registro).slice(0,10) <= f.fin)
    }
    return (!f.docente || fullName(x.docente) === f.docente) &&
      (!f.año || x.año === f.año) &&
      (!f.especialidad || x.especialidad === f.especialidad) &&
      (!f.seccion || x.seccion === f.seccion) &&
      (!f.modulo || `${x.modulo?.codigo} · ${x.modulo?.nombre}` === f.modulo) &&
      (!f.estudiante || fullName(x.estudiante) === f.estudiante) &&
      (!f.inicio || String(x.fecha_registro).slice(0,10) >= f.inicio) &&
      (!f.fin || String(x.fecha_registro).slice(0,10) <= f.fin)
  }), [current, f, tab])

  const average = tab === 'avances' && filtered.length ? Math.round(filtered.reduce((a,x)=>a+Number(x.porcentaje_avance||0),0)/filtered.length) : 0

  function pdf() {
    if (!filtered.length) return notify('No hay registros para generar el reporte.', 'error')
    const teacher = f.docente || 'Todos'
    const safe = teacher.replace(/[^a-z0-9]+/gi,'_').replace(/^_|_$/g,'').toLowerCase() || 'general'
    if (tab === 'atrasos') {
      downloadDelayReportPdf({
        institution,
        title: 'Reporte de estudiantes con actividades atrasadas',
        meta: [
          { label:'Docente', value:teacher }, { label:'Año', value:f.año||'Todos' },
          { label:'Especialidad', value:specialtyLabel(f.especialidad)||'Todas' }, { label:'Sección', value:f.seccion||'Todas' },
          { label:'Módulo', value:f.modulo||'Todos' }, { label:'Periodo', value:`${f.inicio||'Inicio'} - ${f.fin||'Actual'}` },
        ],
        rows: filtered.map(x => ({ student:x.estudiante_nombre, date:formatDate(x.fecha_registro), module:x.modulo_nombre, section:x.seccion, activity:x.actividad_pendiente, situation:x.situacion, acta:x.acta_situacion, guia:x.informado_docente_guia })),
        filename:`reporte_atrasos_${safe}_${new Date().toISOString().slice(0,10)}.pdf`
      })
      return
    }
    downloadReportPdf({
      institution, title:'Reporte de avances de modulos',
      meta:[{label:'Docente',value:teacher},{label:'Especialidad',value:specialtyLabel(f.especialidad)||'Todas'},{label:'Año',value:f.año||'Todos'},{label:'Seccion',value:f.seccion||'Todas'},{label:'Modulo',value:f.modulo||'Todos'},{label:'Periodo',value:`${f.inicio||'Inicio'} - ${f.fin||'Actual'}`},{label:'Promedio de avance',value:`${average}%`}],
      rows:filtered.map(x=>({student:fullName(x.estudiante),date:formatDate(x.fecha_registro),percent:x.porcentaje_avance,description:x.descripcion_avance||'-',observations:x.observaciones||'-'})),
      filename:`reporte_avances_${safe}_${new Date().toISOString().slice(0,10)}.pdf`
    })
  }

  return <>
    <div className="page-intro">
      <div><p>Consulta y documentación</p><h2>Reportes</h2><span>Consulta todo lo registrado por los docentes y genera PDF o impresión.</span></div>
      <div className="action-row"><Button variant="ghost" onClick={()=>window.print()}>⎙ Imprimir</Button><Button onClick={pdf}>↓ Generar PDF</Button></div>
    </div>
    <Card>
      <div className="segmented report-tabs"><button className={tab==='atrasos'?'active':''} onClick={()=>{setTab('atrasos');setF({docente:'',año:'',especialidad:'',seccion:'',modulo:'',estudiante:'',inicio:'',fin:''})}}>Atrasos de actividades ({delays.length})</button><button className={tab==='avances'?'active':''} onClick={()=>{setTab('avances');setF({docente:'',año:'',especialidad:'',seccion:'',modulo:'',estudiante:'',inicio:'',fin:''})}}>Avances de módulos ({advances.length})</button></div>
    </Card>
    <Card className="report-filters">
      <div className="form-grid four">
        <Select label="Docente" value={f.docente} set={v=>setF({...f,docente:v})} values={opts('docente')}/>
        <Select label="Año" value={f.año} set={v=>setF({...f,año:v})} values={opts('año')}/>
        <Select label="Especialidad" value={f.especialidad} set={v=>setF({...f,especialidad:v})} values={opts('especialidad')} format={specialtyLabel}/>
        <Select label="Sección" value={f.seccion} set={v=>setF({...f,seccion:v})} values={opts('seccion')}/>
        <Select label="Módulo" value={f.modulo} set={v=>setF({...f,modulo:v})} values={opts('modulo')}/>
        <Select label="Estudiante" value={f.estudiante} set={v=>setF({...f,estudiante:v})} values={opts('estudiante')}/>
        <Field label="Fecha inicial"><input type="date" value={f.inicio} onChange={e=>setF({...f,inicio:e.target.value})}/></Field>
        <Field label="Fecha final"><input type="date" value={f.fin} onChange={e=>setF({...f,fin:e.target.value})}/></Field>
      </div>
    </Card>
    <Card className="print-report">
      <div className="report-header"><div><small>{institution.toUpperCase()}</small><h3>{tab==='atrasos'?'REPORTE DE ESTUDIANTES CON ACTIVIDADES ATRASADAS':'REPORTE DE AVANCES DE MÓDULOS'}</h3></div><div className="report-date">Generado: {formatDate(new Date())}</div></div>
      <div className="report-meta"><span><b>Docente:</b> {f.docente||'Todos'}</span><span><b>Especialidad:</b> {specialtyLabel(f.especialidad)||'Todas'}</span><span><b>Año:</b> {f.año||'Todos'}</span><span><b>Sección:</b> {f.seccion||'Todas'}</span><span><b>Módulo:</b> {f.modulo||'Todos'}</span><span><b>Periodo:</b> {f.inicio||'Inicio'} — {f.fin||'Actual'}</span></div>
      {loading?<div className="loading-panel"><Spinner/>Cargando registros…</div>:filtered.length?<>
        <div className="report-summary"><div><span>Estudiantes</span><strong>{new Set(filtered.map(x=>tab==='atrasos'?x.estudiante_nombre:x.estudiante_id)).size}</strong></div><div><span>{tab==='atrasos'?'Casos reportados':'Promedio de avance'}</span><strong>{tab==='atrasos'?filtered.length:`${average}%`}</strong></div><div><span>Registros</span><strong>{filtered.length}</strong></div></div>
        {tab==='atrasos' ? <div className="table-wrap"><table><thead><tr><th>N°</th><th>Estudiante</th><th>Fecha</th><th>Módulo</th><th>Sección</th><th>Actividad pendiente</th><th>Situación</th><th>Acta</th><th>Docente guía</th></tr></thead><tbody>{filtered.map((x,i)=><tr key={x.id}><td>{i+1}</td><td><strong>{x.estudiante_nombre}</strong></td><td>{formatDate(x.fecha_registro)}</td><td>{x.modulo_nombre}</td><td>{x.seccion}</td><td>{x.actividad_pendiente}</td><td>{x.situacion}</td><td>{x.acta_situacion?'Sí':'No'}</td><td>{x.informado_docente_guia?'Sí':'No'}</td></tr>)}</tbody></table></div>
        : <div className="table-wrap"><table><thead><tr><th>N°</th><th>Estudiante</th><th>Fecha</th><th>Avance</th><th>Descripción</th><th>Observaciones</th></tr></thead><tbody>{filtered.map((x,i)=><tr key={x.id}><td>{i+1}</td><td><strong>{fullName(x.estudiante)}</strong></td><td>{formatDate(x.fecha_registro)}</td><td>{x.porcentaje_avance}%</td><td>{x.descripcion_avance||'—'}</td><td>{x.observaciones||'—'}</td></tr>)}</tbody></table></div>}
        <div className="signatures"><div>Firma del docente</div><div>Firma de coordinación</div></div>
      </>:<EmptyState title="Sin registros para este reporte" text={tab==='atrasos'?'Los docentes todavía no han reportado estudiantes con atrasos.':'No hay avances registrados con los filtros seleccionados.'}/>} 
    </Card>
    <Toast toast={toast} onClose={clear}/>
  </>
}
function Select({label,value,set,values,format=(v)=>v}){return <Field label={label}><select value={value} onChange={e=>set(e.target.value)}><option value="">Todos</option>{values.map(v=><option key={v} value={v}>{format(v)}</option>)}</select></Field>}
