import { useEffect, useMemo, useState } from 'react'
import { avancesApi, atrasosApi } from '../services/api'
import { Card, ConfirmDialog, EmptyState, Spinner, Toast, useToast } from '../components/UI'
import { formatDate, fullName } from '../utils/helpers'
import { specialtyLabel } from '../utils/academic'

export default function History(){
  const [tab,setTab]=useState('atrasos')
  const [items,setItems]=useState([])
  const [loading,setLoading]=useState(true)
  const [q,setQ]=useState('')
  const [filters,setFilters]=useState({docente:'',modulo:'',seccion:'',año:'',fecha:''})
  const [removeId,setRemoveId]=useState(null)
  const [removeType,setRemoveType]=useState('atraso')
  const {toast,notify,clear}=useToast()
  const load=()=>{setLoading(true);Promise.all([avancesApi.list(),atrasosApi.list()]).then(([adv,delays])=>setItems(tab==='atrasos'?delays:adv)).catch(e=>notify(e.message,'error')).finally(()=>setLoading(false))}
  useEffect(load,[tab])
  const vals=k=>[...new Set(items.map(x=>tab==='atrasos'?(k==='docente'?fullName(x.docente):k==='modulo'?x.modulo_nombre:x[k]):(k==='docente'?fullName(x.docente):k==='modulo'?`${x.modulo?.codigo} · ${x.modulo?.nombre}`:x[k])).filter(Boolean))]
  const filtered=useMemo(()=>items.filter(x=>{
    const text=tab==='atrasos'?`${x.estudiante_nombre} ${x.situacion} ${x.actividad_pendiente} ${x.modulo_nombre}`:`${fullName(x.estudiante)} ${x.descripcion_avance} ${x.observaciones}`
    return text.toLowerCase().includes(q.toLowerCase())&&(!filters.docente||(tab==='atrasos'?fullName(x.docente):fullName(x.docente))===filters.docente)&&(!filters.modulo||(tab==='atrasos'?x.modulo_nombre:`${x.modulo?.codigo} · ${x.modulo?.nombre}`)===filters.modulo)&&(!filters.seccion||x.seccion===filters.seccion)&&(!filters.año||(tab==='atrasos'?x.anio:x.año)===filters.año)&&(!filters.fecha||String(x.fecha_registro).slice(0,10)===filters.fecha)
  }),[items,q,filters,tab])
  async function del(){try{if(removeType==='atraso')await atrasosApi.remove(removeId);else await avancesApi.remove(removeId);notify('Registro eliminado.');setRemoveId(null);load()}catch(e){notify(e.message,'error')}}
  function switchTab(value){setTab(value);setQ('');setFilters({docente:'',modulo:'',seccion:'',año:'',fecha:''})}
  return <>
    <div className="page-intro"><div><p>Seguimiento</p><h2>Historial</h2><span>Consulta y administra los registros de avances y atrasos de actividades.</span></div><span className="count-badge">{filtered.length} registros</span></div>
    <Card><div className="segmented report-tabs"><button className={tab==='atrasos'?'active':''} onClick={()=>switchTab('atrasos')}>Atrasos de actividades</button><button className={tab==='avances'?'active':''} onClick={()=>switchTab('avances')}>Avances de módulos</button></div></Card>
    <Card><div className="toolbar"><input className="search" placeholder={tab==='atrasos'?'⌕ Buscar estudiante, actividad o situación…':'⌕ Buscar estudiante o descripción…'} value={q} onChange={e=>setQ(e.target.value)}/><select value={filters.docente} onChange={e=>setFilters({...filters,docente:e.target.value})}><option value="">Docente</option>{vals('docente').map(v=><option key={v}>{v}</option>)}</select><select value={filters.modulo} onChange={e=>setFilters({...filters,modulo:e.target.value})}><option value="">Módulo</option>{vals('modulo').map(v=><option key={v}>{v}</option>)}</select><select value={filters.seccion} onChange={e=>setFilters({...filters,seccion:e.target.value})}><option value="">Sección</option>{vals('seccion').map(v=><option key={v}>{v}</option>)}</select><select value={filters.año} onChange={e=>setFilters({...filters,año:e.target.value})}><option value="">Año</option>{vals('año').map(v=><option key={v}>{v}</option>)}</select><input type="date" value={filters.fecha} onChange={e=>setFilters({...filters,fecha:e.target.value})}/></div>{loading?<div className="loading-panel"><Spinner/>Cargando historial…</div>:filtered.length?<div className="table-wrap">{tab==='atrasos'?<table><thead><tr><th>Fecha</th><th>Estudiante</th><th>Especialidad</th><th>Módulo</th><th>Sección</th><th>Docente</th><th>Actividad</th><th>Situación</th><th>Acta</th><th>Docente guía</th><th></th></tr></thead><tbody>{filtered.map(x=><tr key={x.id}><td>{formatDate(x.fecha_registro)}</td><td><strong>{x.estudiante_nombre}</strong></td><td>{specialtyLabel(x.especialidad)}</td><td>{x.modulo_nombre}</td><td>{x.seccion}</td><td>{fullName(x.docente)}</td><td>{x.actividad_pendiente}</td><td className="description-cell">{x.situacion}</td><td>{x.acta_situacion?'Sí':'No'}</td><td>{x.informado_docente_guia?'Sí':'No'}</td><td><button className="danger-link" onClick={()=>{setRemoveId(x.id);setRemoveType('atraso')}}>Eliminar</button></td></tr>)}</tbody></table>:<table><thead><tr><th>Fecha</th><th>Estudiante</th><th>Especialidad</th><th>Módulo</th><th>Docente</th><th>Sección</th><th>Avance</th><th>Descripción</th><th></th></tr></thead><tbody>{filtered.map(x=><tr key={x.id}><td>{formatDate(x.fecha_registro)}</td><td><strong>{fullName(x.estudiante)}</strong></td><td>{specialtyLabel(x.especialidad)}</td><td>{x.modulo?.codigo}</td><td>{fullName(x.docente)}</td><td>{x.seccion}</td><td><span className="progress-pill">{x.porcentaje_avance}%</span></td><td className="description-cell">{x.descripcion_avance||'—'}</td><td><button className="danger-link" onClick={()=>{setRemoveId(x.id);setRemoveType('avance')}}>Eliminar</button></td></tr>)}</tbody></table>}</div>:<EmptyState title="No hay resultados" text="No existen registros que coincidan con los filtros actuales."/>}</Card>
    <ConfirmDialog open={!!removeId} message={removeType==='atraso'?'Se eliminará este registro de atraso.':'Se eliminará este registro de avance.'} onCancel={()=>setRemoveId(null)} onConfirm={del}/><Toast toast={toast} onClose={clear}/>
  </>
}
