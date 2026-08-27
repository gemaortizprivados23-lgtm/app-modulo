import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

function baseDoc(institution, title, meta) {
  const doc = new jsPDF({ unit:'mm', format:'a4', orientation:'portrait' })
  const margin=14
  doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.text(institution, margin, 16)
  doc.setFontSize(14); doc.text(title.toUpperCase(), margin, 24)
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.text(`Fecha de generación: ${new Intl.DateTimeFormat('es-SV',{dateStyle:'medium'}).format(new Date())}`,196,16,{align:'right'})
  let y=32
  meta.forEach((item,index)=>{ const x=margin+(index%2)*92; if(index%2===0&&index>0)y+=6; doc.setFont('helvetica','bold');doc.text(`${item.label}:`,x,y);doc.setFont('helvetica','normal');doc.text(String(item.value||'—'),x+26,y) })
  return {doc,margin,y:y+7}
}
function footer(doc, margin) {
  const pageHeight=doc.internal.pageSize.getHeight(); doc.setFontSize(7);doc.setTextColor(110,120,137)
  doc.text('Firma del docente: ______________________________',margin,pageHeight-12)
  doc.text('Firma de coordinación: ___________________________',112,pageHeight-12)
  doc.text(`Página ${doc.internal.getNumberOfPages()}`,196,pageHeight-6,{align:'right'})
}

export function downloadReportPdf({institution,title,meta,rows,filename}) {
  const {doc,margin,y}=baseDoc(institution,title,meta)
  autoTable(doc,{startY:y,head:[['N°','Estudiante','Fecha','Avance','Descripción','Observaciones']],body:rows.map((r,i)=>[i+1,r.student,r.date,`${r.percent}%`,r.description||'—',r.observations||'—']),theme:'grid',styles:{font:'helvetica',fontSize:6.5,cellPadding:1.8,overflow:'linebreak',valign:'top'},headStyles:{fontStyle:'bold',fillColor:[20,33,61],textColor:255},columnStyles:{0:{cellWidth:8},1:{cellWidth:35},2:{cellWidth:20},3:{cellWidth:16},4:{cellWidth:50},5:{cellWidth:47}},margin:{left:margin,right:margin,bottom:22},didDrawPage:()=>footer(doc,margin)})
  doc.save(filename||'reporte_avances.pdf')
}

export function downloadDelayReportPdf({institution,title,meta,rows,filename}) {
  const {doc,margin,y}=baseDoc(institution,title,meta)
  autoTable(doc,{startY:y,head:[['N°','Estudiante','Fecha','Módulo','Sección','Actividad pendiente','Situación','Acta','Docente guía']],body:rows.map((r,i)=>[i+1,r.student,r.date,r.module,r.section,r.activity,r.situation,r.acta?'Sí':'No',r.guia?'Sí':'No']),theme:'grid',styles:{font:'helvetica',fontSize:7,cellPadding:2,overflow:'linebreak',valign:'top'},headStyles:{fontStyle:'bold',fillColor:[20,33,61],textColor:255},columnStyles:{0:{cellWidth:6},1:{cellWidth:25},2:{cellWidth:18},3:{cellWidth:24},4:{cellWidth:13},5:{cellWidth:32},6:{cellWidth:37},7:{cellWidth:12},8:{cellWidth:15}},margin:{left:margin,right:margin,bottom:22},didDrawPage:()=>footer(doc,margin)})
  doc.save(filename||'reporte_atrasos.pdf')
}
