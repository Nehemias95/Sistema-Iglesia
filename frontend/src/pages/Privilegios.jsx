import { useState, useEffect } from 'react'
import { privilegiosAPI } from '../api'
import Swal from 'sweetalert2'

const emptyForm = { nombre_privilegio: '', descripcion: '', nivel_acceso: 1 }

export default function Privilegios() {
  const [items, setItems] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    try { const res = await privilegiosAPI.getAll(); setItems(res.data) }
    catch { setItems([]) }
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setShowModal(true) }
  const openEdit = (item) => {
    setForm({ nombre_privilegio: item.nombre_privilegio, descripcion: item.descripcion || '', nivel_acceso: item.nivel_acceso || 1 })
    setEditingId(item.id_privilegio)
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      if (editingId) { await privilegiosAPI.update(editingId, form); Swal.fire('Actualizado', '', 'success') }
      else { await privilegiosAPI.create(form); Swal.fire('Guardado', '', 'success') }
      setShowModal(false); load()
    } catch (err) { Swal.fire('Error', err.response?.data?.error || err.message, 'error') }
  }

  const handleDelete = async (id, nombre) => {
    const r = await Swal.fire({ title: '¿Eliminar?', text: nombre, icon: 'question', showCancelButton: true, confirmButtonText: 'Sí' })
    if (r.isConfirmed) { try { await privilegiosAPI.delete(id); Swal.fire('Eliminado', '', 'success'); load() } catch { Swal.fire('Error', '', 'error') } }
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm mb-4">
        <div>
          <h1 className="content-header mb-0 text-dark"><i className="fas fa-shield-alt me-2 text-primary"></i>Privilegios</h1>
          <nav aria-label="breadcrumb"><ol className="breadcrumb mb-0"><li className="breadcrumb-item"><a href="/">Inicio</a></li><li className="breadcrumb-item active">Privilegios</li></ol></nav>
        </div>
        <button className="btn btn-primary btn-sm shadow-sm fw-bold" onClick={openCreate}><i className="fas fa-plus me-1"></i> NUEVO PRIVILEGIO</button>
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead><tr><th>#</th><th>Nombre</th><th>Nivel Acceso</th><th>Acciones</th></tr></thead>
              <tbody>
                {items.length === 0 ? <tr><td colSpan="4" className="text-center text-muted py-4">No hay privilegios registrados</td></tr>
                  : items.map((item, i) => (
                    <tr key={item.id_privilegio}>
                      <td>{i + 1}</td><td>{item.nombre_privilegio}</td><td>{item.nivel_acceso}</td>
                      <td>
                        <button className="btn btn-outline-primary btn-sm me-1" onClick={() => openEdit(item)} title="Editar"><i className="fas fa-edit"></i></button>
                        <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(item.id_privilegio, item.nombre_privilegio)} title="Eliminar"><i className="fas fa-trash"></i></button>
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
                <h6 className="modal-title"><i className="fas fa-shield-alt me-2"></i>{editingId ? 'Editar Privilegio' : 'Nuevo Privilegio'}</h6>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body bg-light">
                  <div className="mb-2">
                    <label className="form-label small">Nombre del Privilegio</label>
                    <input name="nombre_privilegio" value={form.nombre_privilegio} onChange={handleChange} type="text" className="form-control form-control-sm" required />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small">Nivel de Acceso</label>
                    <input name="nivel_acceso" value={form.nivel_acceso} onChange={handleChange} type="number" className="form-control form-control-sm" />
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
    </>
  )
}
