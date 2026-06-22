import { useState, useEffect } from 'react'
import { ministeriosAPI, miembrosAPI } from '../api'
import Swal from 'sweetalert2'

const emptyForm = { nombre_ministerio: '', descripcion: '', lider_id: '' }
const rolesDirectiva = ['Presidente', 'Vicepresidente', 'Secretario', 'Tesorero', 'Vocal']

export default function Ministerios() {
  const [items, setItems] = useState([])
  const [miembros, setMiembros] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [showMiembros, setShowMiembros] = useState(null)
  const [miembrosMin, setMiembrosMin] = useState([])
  const [agregarMiembro, setAgregarMiembro] = useState({ id_miembro: '', rol: '' })

  useEffect(() => { load(); loadMiembros() }, [])

  const load = async () => {
    try { const res = await ministeriosAPI.getAll(); setItems(res.data) }
    catch { setItems([]) }
  }
  const loadMiembros = async () => {
    try { const res = await miembrosAPI.getAll(); setMiembros(res.data.filter(m => m.estado === 'Activo')) }
    catch { setMiembros([]) }
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setShowModal(true) }

  const openEdit = (item) => {
    setForm({ nombre_ministerio: item.nombre_ministerio, descripcion: item.descripcion || '', lider_id: item.lider_id || '' })
    setEditingId(item.id_ministerio)
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      const data = { ...form, lider_id: form.lider_id || null }
      if (editingId) { await ministeriosAPI.update(editingId, data); Swal.fire('Actualizado', '', 'success') }
      else { await ministeriosAPI.create(data); Swal.fire('Guardado', '', 'success') }
      setShowModal(false); load()
    } catch (err) { Swal.fire('Error', err.response?.data?.error || err.message, 'error') }
  }

  const handleDelete = async (id, nombre) => {
    const r = await Swal.fire({ title: '¿Eliminar?', text: nombre, icon: 'question', showCancelButton: true, confirmButtonText: 'Sí' })
    if (r.isConfirmed) {
      try { await ministeriosAPI.delete(id); Swal.fire('Eliminado', '', 'success'); load() }
      catch { Swal.fire('Error', '', 'error') }
    }
  }

  const abrirMiembros = async (ministerio) => {
    setShowMiembros(ministerio)
    try { const res = await ministeriosAPI.getMiembros(ministerio.id_ministerio); setMiembrosMin(res.data) }
    catch { setMiembrosMin([]) }
  }

  const agregarMiembroMin = async () => {
    if (!agregarMiembro.id_miembro) { Swal.fire('Seleccione un miembro', '', 'warning'); return }
    try {
      await ministeriosAPI.addMiembro(showMiembros.id_ministerio, agregarMiembro)
      Swal.fire('Agregado', '', 'success')
      setAgregarMiembro({ id_miembro: '', rol: '' })
      const res = await ministeriosAPI.getMiembros(showMiembros.id_ministerio)
      setMiembrosMin(res.data)
    } catch (err) { Swal.fire('Error', err.response?.data?.error || err.message, 'error') }
  }

  const quitarMiembro = async (idmm, nombre) => {
    const r = await Swal.fire({ title: '¿Quitar?', text: nombre, icon: 'question', showCancelButton: true, confirmButtonText: 'Sí' })
    if (r.isConfirmed) {
      try {
        await ministeriosAPI.removeMiembro(showMiembros.id_ministerio, idmm)
        setMiembrosMin(miembrosMin.filter(m => m.id_miembro_ministerio !== idmm))
        Swal.fire('Quitado', '', 'success')
      } catch { Swal.fire('Error', '', 'error') }
    }
  }

  const rolesOrdenados = (items) => {
    const conRol = items.filter(m => m.rol && rolesDirectiva.includes(m.rol))
    const sinRol = items.filter(m => !m.rol || !rolesDirectiva.includes(m.rol))
    conRol.sort((a, b) => rolesDirectiva.indexOf(a.rol) - rolesDirectiva.indexOf(b.rol))
    return [...conRol, ...sinRol]
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm mb-4">
        <div>
          <h1 className="content-header mb-0 text-dark"><i className="fas fa-church me-2 text-primary"></i>Ministerios</h1>
          <nav aria-label="breadcrumb"><ol className="breadcrumb mb-0"><li className="breadcrumb-item"><a href="/">Inicio</a></li><li className="breadcrumb-item active">Ministerios</li></ol></nav>
        </div>
        <button className="btn btn-primary btn-sm shadow-sm fw-bold" onClick={openCreate}><i className="fas fa-plus me-1"></i> NUEVO MINISTERIO</button>
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead><tr><th>#</th><th>Nombre</th><th>Líder</th><th>Estado</th><th>Miembros</th><th>Acciones</th></tr></thead>
              <tbody>
                {items.length === 0 ? <tr><td colSpan="6" className="text-center text-muted py-4">No hay ministerios registrados</td></tr>
                  : items.map((item, i) => (
                    <tr key={item.id_ministerio}>
                      <td>{i + 1}</td>
                      <td><strong>{item.nombre_ministerio}</strong></td>
                      <td>{item.lider_nombre || <span className="text-muted">—</span>}</td>
                      <td><span className={`badge bg-${item.estado === 'Activo' ? 'success' : 'secondary'}`}>{item.estado}</span></td>
                      <td>
                        <button className="btn btn-outline-info btn-sm" onClick={() => abrirMiembros(item)}>
                          <i className="fas fa-users me-1"></i> Directiva
                        </button>
                      </td>
                      <td>
                        <button className="btn btn-outline-primary btn-sm me-1" onClick={() => openEdit(item)} title="Editar"><i className="fas fa-edit"></i></button>
                        <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(item.id_ministerio, item.nombre_ministerio)} title="Eliminar"><i className="fas fa-trash"></i></button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-dark text-white py-2">
                <h6 className="modal-title"><i className="fas fa-church me-2"></i>{editingId ? 'Editar Ministerio' : 'Nuevo Ministerio'}</h6>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body bg-light">
                  <div className="mb-2">
                    <label className="form-label small">Nombre del Ministerio</label>
                    <input name="nombre_ministerio" value={form.nombre_ministerio} onChange={handleChange} type="text" className="form-control form-control-sm" required />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small">Líder</label>
                    <select name="lider_id" value={form.lider_id} onChange={handleChange} className="form-select form-select-sm">
                      <option value="">— Sin líder —</option>
                      {miembros.map(m => (
                        <option key={m.id_miembro} value={m.id_miembro}>{m.nombres} {m.apellidos}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-2">
                    <label className="form-label small">Descripción</label>
                    <textarea name="descripcion" value={form.descripcion} onChange={handleChange} className="form-control form-control-sm" rows="2"></textarea>
                  </div>
                </div>
                <div className="modal-footer bg-light py-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>Cerrar</button>
                  <button type="submit" className="btn btn-primary btn-sm px-3"><i className="fas fa-save me-1"></i> Guardar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showMiembros && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-dark text-white py-2">
                <h6 className="modal-title"><i className="fas fa-users me-2"></i>Directiva: {showMiembros.nombre_ministerio}</h6>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowMiembros(null)}></button>
              </div>
              <div className="modal-body bg-light">
                <div className="row g-2 mb-3 align-items-end">
                  <div className="col-md-5">
                    <label className="form-label small">Agregar Miembro</label>
                    <select className="form-select form-select-sm" value={agregarMiembro.id_miembro} onChange={(e) => setAgregarMiembro({ ...agregarMiembro, id_miembro: e.target.value })}>
                      <option value="">— Seleccione —</option>
                      {miembros.filter(m => !miembrosMin.some(mm => mm.id_miembro === m.id_miembro)).map(m => (
                        <option key={m.id_miembro} value={m.id_miembro}>{m.nombres} {m.apellidos}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small">Rol</label>
                    <select className="form-select form-select-sm" value={agregarMiembro.rol} onChange={(e) => setAgregarMiembro({ ...agregarMiembro, rol: e.target.value })}>
                      <option value="">— Sin rol —</option>
                      {rolesDirectiva.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <button className="btn btn-primary btn-sm w-100" onClick={agregarMiembroMin}><i className="fas fa-plus me-1"></i> Agregar</button>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-sm table-hover mb-0">
                    <thead><tr><th>Miembro</th><th>Rol</th><th>Teléfono</th><th>Acción</th></tr></thead>
                    <tbody>
                      {rolesOrdenados(miembrosMin).map(mm => (
                        <tr key={mm.id_miembro_ministerio}>
                          <td>
                            <div className="d-flex align-items-center">
                              {mm.foto ? (
                                <img src={`http://localhost:3001${mm.foto}`} alt="" className="rounded-circle me-2" style={{ width: 30, height: 30, objectFit: 'cover' }} />
                              ) : (
                                <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white me-2" style={{ width: 30, height: 30, fontSize: 12 }}>
                                  <i className="fas fa-user"></i>
                                </div>
                              )}
                              <span>{mm.nombres} {mm.apellidos}</span>
                            </div>
                          </td>
                          <td>
                            {mm.rol ? (
                              <span className={`badge bg-${rolesDirectiva.includes(mm.rol) ? 'primary' : 'secondary'}`}>{mm.rol}</span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td>{mm.telefono || '—'}</td>
                          <td>
                            <button className="btn btn-outline-danger btn-sm" onClick={() => quitarMiembro(mm.id_miembro_ministerio, mm.nombres)} title="Quitar">
                              <i className="fas fa-user-minus"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                      {miembrosMin.length === 0 && (
                        <tr><td colSpan="4" className="text-center text-muted py-3">No hay miembros en este ministerio</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer bg-light py-2">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowMiembros(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
