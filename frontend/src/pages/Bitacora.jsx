import { useState, useEffect } from 'react'
import { bitacoraAPI } from '../api'
import { useAuth } from '../context/AuthContext'

const ACCIONES = { INSERT: 'Creó', UPDATE: 'Modificó', DELETE: 'Eliminó' }
const COLOR_ACCION = { INSERT: 'success', UPDATE: 'primary', DELETE: 'danger' }

export default function Bitacora() {
  const { user } = useAuth()
  const [registros, setRegistros] = useState([])
  const [tablaFiltro, setTablaFiltro] = useState('')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    try {
      const params = {}
      if (tablaFiltro) params.tabla = tablaFiltro
      const res = await bitacoraAPI.getAll(params)
      setRegistros(res.data)
    } catch { }
  }

  function formatearDatos(obj) {
    if (!obj) return '—'
    try {
      const data = typeof obj === 'string' ? JSON.parse(obj) : obj
      return Object.entries(data).slice(0, 5).map(([k, v]) => `${k}: ${v}`).join(', ')
    } catch {
      return String(obj).slice(0, 100)
    }
  }

  const tablas = ['miembros', 'cargos', 'privilegios', 'ministerios', 'miembros_ministerios', 'ofrendas', 'categorias_ofrendas', 'eventos', 'asistencia', 'usuarios']

  if (user?.rol !== 'Admin' && user?.rol !== 'Pastor') {
    return <div className="alert alert-danger">No tiene permisos para ver la bitácora.</div>
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0"><i className="fas fa-history me-2"></i>Bitácora</h4>
        <div className="d-flex gap-2">
          <select className="form-select form-select-sm" value={tablaFiltro} onChange={e => setTablaFiltro(e.target.value)} style={{ width: 'auto' }}>
            <option value="">Todas las tablas</option>
            {tablas.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className="btn btn-outline-secondary btn-sm" onClick={cargar}><i className="fas fa-sync"></i></button>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive" style={{ maxHeight: '70vh' }}>
            <table className="table table-hover table-sm mb-0">
              <thead className="sticky-top bg-white">
                <tr>
                  <th>Fecha</th>
                  <th>Usuario</th>
                  <th>Acción</th>
                  <th>Tabla</th>
                  <th>ID</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {registros.map(r => (
                  <tr key={r.id_bitacora}>
                    <td className="text-nowrap">{new Date(r.fecha).toLocaleString()}</td>
                    <td>{r.nombre_usuario || r.username}</td>
                    <td><span className={`badge bg-${COLOR_ACCION[r.accion] || 'secondary'}`}>{ACCIONES[r.accion] || r.accion}</span></td>
                    <td><code>{r.tabla}</code></td>
                    <td>{r.id_registro || '—'}</td>
                    <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      title={r.datos_nuevos ? JSON.stringify(r.datos_nuevos, null, 2) : (r.datos_anteriores ? JSON.stringify(r.datos_anteriores, null, 2) : '')}>
                      {r.accion === 'INSERT' ? formatearDatos(r.datos_nuevos) : r.accion === 'DELETE' ? formatearDatos(r.datos_anteriores) : formatearDatos(r.datos_nuevos)}
                    </td>
                  </tr>
                ))}
                {registros.length === 0 && (
                  <tr><td colSpan="6" className="text-center text-muted py-3">No hay registros en la bitácora</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
