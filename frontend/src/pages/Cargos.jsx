import { useState, useEffect } from 'react'
import { cargosAPI } from '../api'
import Swal from 'sweetalert2'

const emptyForm = {
  nombre_cargo: '', descripcion: '', nivel_jerarquia: 0, requiere_eleccion: false
}

export default function Cargos() {
  const [items, setItems] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const res = await cargosAPI.getAll()
      setItems(res.data)
    } catch { setItems([]) }
  }

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm({ ...form, [e.target.name]: value })
  }

  const openCreate = () => {
    setForm(emptyForm)
    setEditingId(null)
    setShowModal(true)
  }

  const openEdit = (item) => {
    setForm({
      nombre_cargo: item.nombre_cargo || '',
      descripcion: item.descripcion || '',
      nivel_jerarquia: item.nivel_jerarquia || 0,
      requiere_eleccion: item.requiere_eleccion || false
    })
    setEditingId(item.id_cargo)
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await cargosAPI.update(editingId, { ...form, activo: true })
        Swal.fire('Actualizado', 'Cargo actualizado', 'success')
      } else {
        await cargosAPI.create(form)
        Swal.fire('Guardado', 'Cargo creado', 'success')
      }
      setShowModal(false)
      load()
    } catch (err) {
      Swal.fire('Error', err.response?.data?.error || err.message, 'error')
    }
  }

  const handleDelete = async (id, nombre) => {
    const result = await Swal.fire({
      title: '¿Eliminar cargo?',
      text: `Se eliminará "${nombre}"`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar'
    })
    if (result.isConfirmed) {
      try {
        await cargosAPI.delete(id)
        Swal.fire('Eliminado', 'Cargo eliminado', 'success')
        load()
      } catch { Swal.fire('Error', 'No se pudo eliminar', 'error') }
    }
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm mb-4">
        <div>
          <h1 className="content-header mb-0 text-dark">
            <i className="fas fa-user-tag me-2 text-primary"></i>Cargos
          </h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><a href="/">Inicio</a></li>
              <li className="breadcrumb-item active">Cargos</li>
            </ol>
          </nav>
        </div>
        <button className="btn btn-primary btn-sm shadow-sm fw-bold" onClick={openCreate}>
          <i className="fas fa-plus me-1"></i> NUEVO CARGO
        </button>
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" width="100%">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Nivel</th>
                  <th>Requiere Elección</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan="6" className="text-center text-muted py-4">No hay cargos registrados</td></tr>
                ) : (
                  items.map((item, i) => (
                    <tr key={item.id_cargo}>
                      <td>{i + 1}</td>
                      <td>{item.nombre_cargo}</td>
                      <td>{item.nivel_jerarquia}</td>
                      <td>{item.requiere_eleccion ? <span className="badge bg-success">Sí</span> : <span className="badge bg-secondary">No</span>}</td>
                      <td><span className={`badge bg-${item.activo ? 'success' : 'secondary'}`}>{item.activo ? 'Activo' : 'Inactivo'}</span></td>
                      <td>
                        <button className="btn btn-outline-primary btn-sm me-1" onClick={() => openEdit(item)} title="Editar"><i className="fas fa-edit"></i></button>
                        <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(item.id_cargo, item.nombre_cargo)} title="Eliminar"><i className="fas fa-trash"></i></button>
                      </td>
                    </tr>
                  ))
                )}
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
                <h6 className="modal-title"><i className={`fas ${editingId ? 'fa-edit' : 'fa-plus'} me-2`}></i>{editingId ? 'Editar Cargo' : 'Nuevo Cargo'}</h6>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body bg-light">
                  <div className="mb-2">
                    <label className="form-label small">Nombre del Cargo</label>
                    <input name="nombre_cargo" value={form.nombre_cargo} onChange={handleChange} type="text" className="form-control form-control-sm" required />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small">Nivel de Jerarquía</label>
                    <input name="nivel_jerarquia" value={form.nivel_jerarquia} onChange={handleChange} type="number" className="form-control form-control-sm" />
                  </div>
                  <div className="mb-2">
                    <div className="form-check">
                      <input name="requiere_eleccion" checked={form.requiere_eleccion} onChange={handleChange} type="checkbox" className="form-check-input" id="reqEleccion" />
                      <label className="form-check-label small" htmlFor="reqEleccion">Requiere elección</label>
                    </div>
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
