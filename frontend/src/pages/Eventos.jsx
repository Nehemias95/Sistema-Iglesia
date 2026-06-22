import { useState, useEffect } from 'react'
import { eventosAPI, ministeriosAPI } from '../api'
import Swal from 'sweetalert2'

const emptyForm = { nombre_evento: '', fecha_inicio: '', fecha_fin: '', lugar: '', id_ministerio: '', descripcion: '' }

export default function Eventos() {
  const [items, setItems] = useState([])
  const [ministerios, setMinisterios] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => { load(); loadMinisterios() }, [])

  const load = async () => {
    try { const res = await eventosAPI.getAll(); setItems(res.data) }
    catch { setItems([]) }
  }
  const loadMinisterios = async () => {
    try { const res = await ministeriosAPI.getAll(); setMinisterios(res.data) }
    catch { setMinisterios([]) }
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setShowModal(true) }

  const openEdit = (item) => {
    setForm({
      nombre_evento: item.nombre_evento,
      fecha_inicio: item.fecha_inicio ? item.fecha_inicio.slice(0, 16) : '',
      fecha_fin: item.fecha_fin ? item.fecha_fin.slice(0, 16) : '',
      lugar: item.lugar || '', id_ministerio: item.id_ministerio || '',
      descripcion: item.descripcion || ''
    })
    setEditingId(item.id_evento)
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      const data = { ...form, id_ministerio: form.id_ministerio || null }
      if (editingId) { await eventosAPI.update(editingId, data); Swal.fire('Actualizado', '', 'success') }
      else { await eventosAPI.create(data); Swal.fire('Guardado', '', 'success') }
      setShowModal(false); load()
    } catch (err) { Swal.fire('Error', err.response?.data?.error || err.message, 'error') }
  }

  const handleDelete = async (id, nombre) => {
    const r = await Swal.fire({ title: '¿Eliminar?', text: nombre, icon: 'question', showCancelButton: true, confirmButtonText: 'Sí' })
    if (r.isConfirmed) {
      try { await eventosAPI.delete(id); Swal.fire('Eliminado', '', 'success'); load() }
      catch { Swal.fire('Error', '', 'error') }
    }
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm mb-4">
        <div>
          <h1 className="content-header mb-0 text-dark"><i className="fas fa-calendar-alt me-2 text-primary"></i>Eventos</h1>
          <nav aria-label="breadcrumb"><ol className="breadcrumb mb-0"><li className="breadcrumb-item"><a href="/">Inicio</a></li><li className="breadcrumb-item active">Eventos</li></ol></nav>
        </div>
        <button className="btn btn-primary btn-sm shadow-sm fw-bold" onClick={openCreate}><i className="fas fa-plus me-1"></i> NUEVO EVENTO</button>
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead><tr><th>#</th><th>Nombre</th><th>Fecha Inicio</th><th>Lugar</th><th>Ministerio</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {items.length === 0 ? <tr><td colSpan="7" className="text-center text-muted py-4">No hay eventos registrados</td></tr>
                  : items.map((item, i) => (
                    <tr key={item.id_evento}>
                      <td>{i + 1}</td>
                      <td>{item.nombre_evento}</td>
                      <td>{item.fecha_inicio ? new Date(item.fecha_inicio).toLocaleString() : '—'}</td>
                      <td>{item.lugar || '—'}</td>
                      <td>{item.id_ministerio ? ministerios.find(m => m.id_ministerio === item.id_ministerio)?.nombre_ministerio || '—' : '—'}</td>
                      <td><span className={`badge bg-${item.estado === 'Programado' ? 'primary' : item.estado === 'En curso' ? 'success' : item.estado === 'Finalizado' ? 'secondary' : 'danger'}`}>{item.estado}</span></td>
                      <td>
                        <button className="btn btn-outline-primary btn-sm me-1" onClick={() => openEdit(item)} title="Editar"><i className="fas fa-edit"></i></button>
                        <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(item.id_evento, item.nombre_evento)} title="Eliminar"><i className="fas fa-trash"></i></button>
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
                <h6 className="modal-title"><i className="fas fa-calendar-alt me-2"></i>{editingId ? 'Editar Evento' : 'Nuevo Evento'}</h6>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body bg-light">
                  <div className="row g-2">
                    <div className="col-12 mb-2">
                      <label className="form-label small">Nombre del Evento</label>
                      <input name="nombre_evento" value={form.nombre_evento} onChange={handleChange} type="text" className="form-control form-control-sm" required />
                    </div>
                    <div className="col-md-6 mb-2">
                      <label className="form-label small">Fecha de Inicio</label>
                      <input name="fecha_inicio" value={form.fecha_inicio} onChange={handleChange} type="datetime-local" className="form-control form-control-sm" required />
                    </div>
                    <div className="col-md-6 mb-2">
                      <label className="form-label small">Fecha de Fin</label>
                      <input name="fecha_fin" value={form.fecha_fin} onChange={handleChange} type="datetime-local" className="form-control form-control-sm" />
                    </div>
                    <div className="col-md-6 mb-2">
                      <label className="form-label small">Lugar</label>
                      <input name="lugar" value={form.lugar} onChange={handleChange} type="text" className="form-control form-control-sm" />
                    </div>
                    <div className="col-md-6 mb-2">
                      <label className="form-label small">Ministerio</label>
                      <select name="id_ministerio" value={form.id_ministerio} onChange={handleChange} className="form-select form-select-sm">
                        <option value="">— Ninguno —</option>
                        {ministerios.map(m => (
                          <option key={m.id_ministerio} value={m.id_ministerio}>{m.nombre_ministerio}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12 mb-2">
                      <label className="form-label small">Descripción</label>
                      <textarea name="descripcion" value={form.descripcion} onChange={handleChange} className="form-control form-control-sm" rows="2"></textarea>
                    </div>
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
