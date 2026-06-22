import { useState, useEffect } from 'react'
import { reportesAPI, miembrosAPI } from '../api'
import { useAuth } from '../context/AuthContext'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const tiposReporte = [
  { value: 'ofrendas-fecha', label: 'Ofrendas por Fecha' },
  { value: 'ofrendas-miembro', label: 'Ofrendas por Miembro' },
  { value: 'diezmos-fecha', label: 'Diezmos por Fecha' },
  { value: 'diezmos-miembro', label: 'Diezmos por Miembro' },
]

export default function Reportes() {
  const { user } = useAuth()
  const [tipoReporte, setTipoReporte] = useState('ofrendas-fecha')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [id_miembro, setIdMiembro] = useState('')
  const [miembros, setMiembros] = useState([])
  const [resultados, setResultados] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadMiembros()
  }, [])

  const loadMiembros = async () => {
    try {
      const res = await miembrosAPI.getAll()
      setMiembros(res.data.filter(m => m.estado === 'Activo'))
    } catch {
      setMiembros([])
    }
  }

  const isPorMiembro = tipoReporte === 'ofrendas-miembro' || tipoReporte === 'diezmos-miembro'

  const handleGenerar = async () => {
    if (!desde || !hasta) return
    if (isPorMiembro && !id_miembro) return

    setLoading(true)
    setResultados([])
    try {
      const params = { desde, hasta }
      if (isPorMiembro) params.id_miembro = id_miembro

      let res
      switch (tipoReporte) {
        case 'ofrendas-fecha':
          res = await reportesAPI.ofrendasPorFecha(params)
          break
        case 'ofrendas-miembro':
          res = await reportesAPI.ofrendasPorMiembro(params)
          break
        case 'diezmos-fecha':
          res = await reportesAPI.diezmosPorFecha(params)
          break
        case 'diezmos-miembro':
          res = await reportesAPI.diezmosPorMiembro(params)
          break
      }
      setResultados(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const esOfrendas = tipoReporte === 'ofrendas-fecha' || tipoReporte === 'ofrendas-miembro'

  const exportToExcel = () => {
    const data = resultados.map((r, i) => {
      if (esOfrendas) {
        return {
          '#': i + 1,
          Fecha: r.fecha ? new Date(r.fecha).toLocaleDateString() : '—',
          Evento: r.nombre_evento || '—',
          Miembro: r.miembro_nombre || 'Anónimo',
          Monto: r.monto,
          'Método de Pago': r.metodo_pago,
          Referencia: r.referencia || '—',
        }
      }
      return {
        '#': i + 1,
        Fecha: r.fecha ? new Date(r.fecha).toLocaleDateString() : '—',
        Miembro: r.miembro_nombre || 'Anónimo',
        Monto: r.monto,
        'Método de Pago': r.metodo_pago,
        Referencia: r.referencia || '—',
      }
    })

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte')
    XLSX.writeFile(wb, `reporte_${tipoReporte}_${desde}_${hasta}.xlsx`)
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    const title = `Reporte: ${tiposReporte.find(t => t.value === tipoReporte)?.label}`
    doc.text(title, 14, 15)
    doc.setFontSize(10)
    doc.text(`Período: ${desde} al ${hasta}`, 14, 22)

    const columns = esOfrendas
      ? ['#', 'Fecha', 'Evento', 'Miembro', 'Monto', 'Método', 'Referencia']
      : ['#', 'Fecha', 'Miembro', 'Monto', 'Método', 'Referencia']

    const rows = resultados.map((r, i) => {
      if (esOfrendas) {
        return [
          i + 1,
          r.fecha ? new Date(r.fecha).toLocaleDateString() : '—',
          r.nombre_evento || '—',
          r.miembro_nombre || 'Anónimo',
          `L. ${parseFloat(r.monto).toFixed(2)}`,
          r.metodo_pago,
          r.referencia || '—',
        ]
      }
      return [
        i + 1,
        r.fecha ? new Date(r.fecha).toLocaleDateString() : '—',
        r.miembro_nombre || 'Anónimo',
        `L. ${parseFloat(r.monto).toFixed(2)}`,
        r.metodo_pago,
        r.referencia || '—',
      ]
    })

    doc.autoTable({
      startY: 28,
      head: [columns],
      body: rows,
      theme: 'striped',
      styles: { fontSize: 8 },
    })

    doc.save(`reporte_${tipoReporte}_${desde}_${hasta}.pdf`)
  }

  if (user?.rol !== 'Admin' && user?.rol !== 'Pastor') {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
        <div className="text-center text-muted">
          <i className="fas fa-ban fa-3x mb-3"></i>
          <p>No tiene permisos para acceder a esta sección</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm mb-4">
        <div>
          <h1 className="content-header mb-0 text-dark"><i className="fas fa-chart-bar me-2 text-primary"></i>Reportes</h1>
          <nav aria-label="breadcrumb"><ol className="breadcrumb mb-0"><li className="breadcrumb-item"><a href="/">Inicio</a></li><li className="breadcrumb-item active">Reportes</li></ol></nav>
        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-md-3">
              <label className="form-label small">Tipo de Reporte</label>
              <select className="form-select form-select-sm" value={tipoReporte} onChange={(e) => { setTipoReporte(e.target.value); setResultados([]) }}>
                {tiposReporte.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label small">Desde</label>
              <input type="date" className="form-control form-control-sm" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </div>
            <div className="col-md-2">
              <label className="form-label small">Hasta</label>
              <input type="date" className="form-control form-control-sm" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </div>
            {isPorMiembro && (
              <div className="col-md-3">
                <label className="form-label small">Miembro</label>
                <select className="form-select form-select-sm" value={id_miembro} onChange={(e) => setIdMiembro(e.target.value)}>
                  <option value="">— Seleccione —</option>
                  {miembros.map(m => (
                    <option key={m.id_miembro} value={m.id_miembro}>{m.nombres} {m.apellidos}</option>
                  ))}
                </select>
              </div>
            )}
            <div className={`col-md-${isPorMiembro ? '2' : '3'}`}>
              <button className="btn btn-primary btn-sm w-100" onClick={handleGenerar} disabled={loading}>
                {loading ? <><span className="spinner-border spinner-border-sm me-1"></span> Cargando...</> : <><i className="fas fa-search me-1"></i> Generar</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {resultados.length > 0 && (
        <>
          <div className="d-flex justify-content-end gap-2 mb-2">
            <button className="btn btn-success btn-sm" onClick={exportToExcel}>
              <i className="fas fa-file-excel me-1"></i> Exportar Excel
            </button>
            <button className="btn btn-danger btn-sm" onClick={exportToPDF}>
              <i className="fas fa-file-pdf me-1"></i> Exportar PDF
            </button>
          </div>

          <div className="card shadow-sm">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Fecha</th>
                      {esOfrendas && <th>Evento</th>}
                      <th>Miembro</th>
                      <th>Monto</th>
                      <th>Método</th>
                      <th>Referencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultados.map((r, i) => (
                      <tr key={r.id_ofrenda || r.id_diezmo}>
                        <td>{i + 1}</td>
                        <td>{r.fecha ? new Date(r.fecha).toLocaleDateString() : '—'}</td>
                        {esOfrendas && <td>{r.nombre_evento || <span className="text-muted">—</span>}</td>}
                        <td>{r.miembro_nombre || <span className="text-muted">Anónimo</span>}</td>
                        <td className="fw-bold">L. {parseFloat(r.monto).toFixed(2)}</td>
                        <td><span className="badge bg-info">{r.metodo_pago}</span></td>
                        <td>{r.referencia || <span className="text-muted">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {resultados.length === 0 && !loading && (
        <div className="text-center text-muted py-5">
          <i className="fas fa-chart-bar fa-3x mb-3"></i>
          <p>Seleccione los filtros y genere un reporte</p>
        </div>
      )}
    </>
  )
}
