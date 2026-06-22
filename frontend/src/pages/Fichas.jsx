import { useState, useEffect } from 'react'
import { miembrosAPI, configuracionAPI } from '../api'
import Swal from 'sweetalert2'

const fotoUrl = (foto) => foto ? (foto.startsWith('http') ? foto : `http://localhost:3001${foto}`) : null

export default function Fichas() {
  const [miembros, setMiembros] = useState([])
  const [iglesia, setIglesia] = useState({ nombre: 'Iglesia EFESO', logo: null })
  const [selected, setSelected] = useState(null)
  const [showFicha, setShowFicha] = useState(false)
  const [view, setView] = useState('lista')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadMiembros()
    loadConfig()
  }, [])

  const loadMiembros = async () => {
    try { const r = await miembrosAPI.getAll(); setMiembros(r.data) }
    catch { setMiembros([]) }
  }

  const loadConfig = async () => {
    try {
      const r = await configuracionAPI.getAll()
      setIglesia({
        nombre: r.data.nombre_iglesia || 'Iglesia EFESO',
        logo: r.data.logo_iglesia || null
      })
    } catch {}
  }

  const openFicha = (m) => {
    setSelected(m)
    setShowFicha(true)
  }

  const filtered = miembros.filter(m =>
    !search || m.nombres?.toLowerCase().includes(search.toLowerCase()) ||
    m.apellidos?.toLowerCase().includes(search.toLowerCase()) ||
    m.numero_identidad?.includes(search)
  )

  const printFicha = () => window.print()

  return (
    <>
      <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm mb-4 no-print">
        <div>
          <h1 className="content-header mb-0 text-dark"><i className="fas fa-id-card me-2 text-primary"></i>Fichas de Miembros</h1>
          <nav aria-label="breadcrumb"><ol className="breadcrumb mb-0"><li className="breadcrumb-item"><a href="/">Inicio</a></li><li className="breadcrumb-item active">Fichas</li></ol></nav>
        </div>
        <div className="d-flex gap-2">
          <button className={`btn btn-sm fw-bold ${view === 'blanco' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => setView(view === 'blanco' ? 'lista' : 'blanco')}>
            <i className="fas fa-file-alt me-1"></i> Ficha en Blanco
          </button>
        </div>
      </div>

      {view === 'blanco' ? (
        <div id="ficha-blanca">
          <div className="d-flex justify-content-center mb-3 no-print">
            <button className="btn btn-primary" onClick={printFicha}><i className="fas fa-print me-1"></i> Imprimir Ficha en Blanco</button>
          </div>
          <div className="d-flex justify-content-center">
            <div className="bg-white p-4 shadow-sm rounded" style={{ width: 800, maxWidth: '100%' }}>
              <div className="text-center border-bottom pb-3 mb-3">
                {iglesia.logo && <img src={fotoUrl(iglesia.logo)} alt="Logo" style={{ maxHeight: 60 }} className="mb-2" />}
                <h4 className="mb-0">{iglesia.nombre}</h4>
                <small className="text-muted">FICHA DE REGISTRO DE MIEMBRO</small>
              </div>
              <div className="row g-3">
                <div className="col-md-8">
                  <div className="row g-2">
                    <div className="col-6"><label className="form-label small fw-semibold">Nombres:</label><div className="border-bottom border-dark mt-1" style={{ height: 24 }}></div></div>
                    <div className="col-6"><label className="form-label small fw-semibold">Apellidos:</label><div className="border-bottom border-dark mt-1" style={{ height: 24 }}></div></div>
                    <div className="col-6"><label className="form-label small fw-semibold">Número de Identidad:</label><div className="border-bottom border-dark mt-1" style={{ height: 24 }}></div></div>
                    <div className="col-3"><label className="form-label small fw-semibold">Género:</label><div className="border-bottom border-dark mt-1" style={{ height: 24 }}></div></div>
                    <div className="col-3"><label className="form-label small fw-semibold">Edad:</label><div className="border-bottom border-dark mt-1" style={{ height: 24 }}></div></div>
                    <div className="col-6"><label className="form-label small fw-semibold">Fecha de Nacimiento:</label><div className="border-bottom border-dark mt-1" style={{ height: 24 }}></div></div>
                    <div className="col-6"><label className="form-label small fw-semibold">Teléfono:</label><div className="border-bottom border-dark mt-1" style={{ height: 24 }}></div></div>
                    <div className="col-6"><label className="form-label small fw-semibold">Teléfono de Contacto:</label><div className="border-bottom border-dark mt-1" style={{ height: 24 }}></div></div>
                    <div className="col-6"><label className="form-label small fw-semibold">Email:</label><div className="border-bottom border-dark mt-1" style={{ height: 24 }}></div></div>
                    <div className="col-6"><label className="form-label small fw-semibold">Actividad Económica:</label><div className="border-bottom border-dark mt-1" style={{ height: 24 }}></div></div>
                    <div className="col-6"><label className="form-label small fw-semibold">Fecha de Bautismo:</label><div className="border-bottom border-dark mt-1" style={{ height: 24 }}></div></div>
                    <div className="col-12"><label className="form-label small fw-semibold">Dirección:</label><div className="border-bottom border-dark mt-1" style={{ height: 32 }}></div></div>
                    <div className="col-12"><label className="form-label small fw-semibold">Observaciones:</label><div className="border-bottom border-dark mt-1" style={{ height: 32 }}></div></div>
                  </div>
                </div>
                <div className="col-md-4 text-center">
                  <label className="form-label small fw-semibold">Fotografía</label>
                  <div className="border border-dark mx-auto" style={{ width: 120, height: 150 }}></div>
                  <label className="form-label small fw-semibold mt-2">Copia del DUI</label>
                  <div className="border border-dark mx-auto" style={{ width: 120, height: 90 }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-3 no-print">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Buscar por nombre, apellido o identidad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: 400 }}
            />
          </div>

          <div className="card shadow-sm no-print">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead><tr><th>#</th><th>Identidad</th><th>Nombres</th><th>Apellidos</th><th>Teléfono</th><th>Estado</th><th>Acción</th></tr></thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan="7" className="text-center text-muted py-4">No hay miembros</td></tr>
                    ) : (
                      filtered.map((m, i) => (
                        <tr key={m.id_miembro}>
                          <td>{i + 1}</td>
                          <td>{m.numero_identidad}</td>
                          <td>{m.nombres}</td>
                          <td>{m.apellidos}</td>
                          <td>{m.telefono}</td>
                          <td><span className={`badge bg-${m.estado === 'Activo' ? 'success' : 'secondary'}`}>{m.estado}</span></td>
                          <td>
                            <button className="btn btn-outline-info btn-sm me-1" onClick={() => openFicha(m)} title="Ver Ficha">
                              <i className="fas fa-id-card me-1"></i> Ficha
                            </button>
                            {m.foto_dui && (
                              <a href={fotoUrl(m.foto_dui)} target="_blank" rel="noopener noreferrer" className="btn btn-outline-warning btn-sm" title="Descargar DUI">
                                <i className="fas fa-download me-1"></i> DUI
                              </a>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {showFicha && selected && (
        <>
          <div className="modal-backdrop fade show no-print" onClick={() => setShowFicha(false)}></div>
          <div className="modal fade show d-block no-print" tabIndex="-1" onClick={() => setShowFicha(false)}>
            <div className="modal-dialog modal-lg modal-dialog-centered" onClick={e => e.stopPropagation()}>
              <div className="modal-content border-0 shadow">
                <div className="modal-header bg-dark text-white py-2 no-print">
                  <h6 className="modal-title"><i className="fas fa-id-card me-2"></i>Ficha de {selected.nombres} {selected.apellidos}</h6>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowFicha(false)}></button>
                </div>
                <div className="modal-body p-0" id="ficha-impresa">
                  <div className="p-4">
                    <div className="text-center border-bottom pb-3 mb-3">
                      {iglesia.logo && <img src={fotoUrl(iglesia.logo)} alt="Logo" style={{ maxHeight: 50 }} className="mb-2" />}
                      <h4 className="mb-0">{iglesia.nombre}</h4>
                      <small className="text-muted">FICHA DE MIEMBRO</small>
                    </div>
                    <div className="row g-3">
                      <div className="col-md-8">
                        <table className="table table-sm table-borderless mb-0">
                          <tbody>
                            <tr><td className="fw-semibold text-muted" style={{ width: '40%' }}>Nombres:</td><td>{selected.nombres}</td></tr>
                            <tr><td className="fw-semibold text-muted">Apellidos:</td><td>{selected.apellidos}</td></tr>
                            <tr><td className="fw-semibold text-muted">N° Identidad:</td><td>{selected.numero_identidad}</td></tr>
                            <tr><td className="fw-semibold text-muted">Género:</td><td>{selected.genero}</td></tr>
                            <tr><td className="fw-semibold text-muted">Fecha de Nacimiento:</td><td>{selected.fecha_nacimiento ? selected.fecha_nacimiento.split('T')[0] : '—'}</td></tr>
                            <tr><td className="fw-semibold text-muted">Teléfono:</td><td>{selected.telefono || '—'}</td></tr>
                            <tr><td className="fw-semibold text-muted">Teléfono Contacto:</td><td>{selected.telefono_contacto || '—'}</td></tr>
                            <tr><td className="fw-semibold text-muted">Email:</td><td>{selected.email || '—'}</td></tr>
                            <tr><td className="fw-semibold text-muted">Actividad Económica:</td><td>{selected.actividad_economica || '—'}</td></tr>
                            <tr><td className="fw-semibold text-muted">Fecha de Bautismo:</td><td>{selected.fecha_bautismo ? selected.fecha_bautismo.split('T')[0] : '—'}</td></tr>
                            <tr><td className="fw-semibold text-muted">Dirección:</td><td>{selected.direccion || '—'}</td></tr>
                            <tr><td className="fw-semibold text-muted">Fecha de Registro:</td><td>{selected.fecha_registro ? selected.fecha_registro.split('T')[0] : '—'}</td></tr>
                            <tr><td className="fw-semibold text-muted">Estado:</td><td><span className={`badge bg-${selected.estado === 'Activo' ? 'success' : 'secondary'}`}>{selected.estado}</span></td></tr>
                            {selected.observaciones && <tr><td className="fw-semibold text-muted">Observaciones:</td><td>{selected.observaciones}</td></tr>}
                          </tbody>
                        </table>
                      </div>
                      <div className="col-md-4 text-center">
                        {selected.foto ? (
                          <div className="mb-3">
                            <label className="form-label small fw-semibold text-muted">Fotografía</label>
                            <img src={fotoUrl(selected.foto)} alt={selected.nombres} className="border rounded d-block mx-auto" style={{ width: 120, height: 150, objectFit: 'cover' }} />
                          </div>
                        ) : (
                          <div className="mb-3">
                            <label className="form-label small fw-semibold text-muted">Fotografía</label>
                            <div className="bg-light border rounded d-flex align-items-center justify-content-center text-muted mx-auto" style={{ width: 120, height: 150 }}>
                              <i className="fas fa-user fa-3x"></i>
                            </div>
                          </div>
                        )}
                        {selected.foto_dui && (
                          <div>
                            <label className="form-label small fw-semibold text-muted">Copia del DUI</label>
                            <img src={fotoUrl(selected.foto_dui)} alt="DUI" className="border rounded d-block mx-auto" style={{ width: 120, height: 80, objectFit: 'cover' }} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light py-2 no-print">
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowFicha(false)}>Cerrar</button>
                  <button className="btn btn-primary btn-sm" onClick={printFicha}><i className="fas fa-print me-1"></i> Imprimir</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          #ficha-impresa { padding: 0 !important; }
          .modal-content { box-shadow: none !important; border: none !important; }
          #ficha-blanca .border-bottom { border-color: #000 !important; }
          .table td, .table th { padding: 0.25rem !important; }
        }
        @page { margin: 1.5cm; }
      `}</style>
    </>
  )
}
