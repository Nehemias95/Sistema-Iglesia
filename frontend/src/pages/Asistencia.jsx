import { useState, useEffect } from 'react'
import { asistenciaAPI, miembrosAPI, eventosAPI } from '../api'
import Swal from 'sweetalert2'

const emptyForm = { id_miembro: '', id_evento: '', estado_asistencia: 'Presente', hora_llegada: '', observaciones: '' }

export default function Asistencia() {
  const [items, setItems] = useState([])
  const [miembros, setMiembros] = useState([])
  const [eventos, setEventos] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => { load(); loadMiembros(); loadEventos() }, [])

  const load = async () => {
    try { const res = await asistenciaAPI.getAll(); setItems(res.data) }
    catch { setItems([]) }
  }
  const loadMiembros = async () => {
    try { const res = await miembrosAPI.getAll(); setMiembros(res.data.filter(m => m.estado === 'Activo')) }
    catch { setMiembros([]) }
  }
  const loadEventos = async () => {
    try { const res = await eventosAPI.getAll(); setEventos(res.data) }
    catch { setEventos([]) }
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setShowModal(true) }

  const openEdit = (item) => {
    setForm({
      id_miembro: item.id_miembro, id_evento: item.id_evento,
      estado_asistencia: item.estado_asistencia || 'Presente',
      hora_llegada: item.hora_llegada || '',
      observaciones: item.observaciones || ''
    })
    setEditingId(item.id_asistencia)
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      if (editingId) { await asistenciaAPI.update(editingId, form); Swal.fire('Actualizado', '', 'success') }
      else { await asistenciaAPI.create(form); Swal.fire('Guardado', '', 'success') }
      setShowModal(false); load()
    } catch (err) { Swal.fire('Error', err.response?.data?.error || err.message, 'error') }
  }

  const handleDelete = async (id) => {
    const r = await Swal.fire({ title: '¿Eliminar?', icon: 'question', showCancelButton: true, confirmButtonText: 'Sí' })
    if (r.isConfirmed) {
      try { await asistenciaAPI.delete(id); Swal.fire('Eliminado', '', 'success'); load() }
      catch { Swal.fire('Error', '', 'error') }
    }
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm mb-4">
        <div>
          <h1 className="content-header mb-0 text-dark"><i className="fas fa-clipboard-check me-2 text-primary"></i>Asistencia</h1>
          <nav aria-label="breadcrumb"><ol className="breadcrumb mb-0"><li className="breadcrumb-item"><a href="/">Inicio</a></li><li className="breadcrumb-item active">Asistencia</li></ol></nav>
        </div>
        <button className="btn btn-primary btn-sm shadow-sm fw-bold" onClick={openCreate}><i className="fas fa-plus me-1"></i> REGISTRAR ASISTENCIA</button>
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead><tr><th>#</th><th>Miembro</th><th>Evento</th><th>Estado</th><th>Hora Llegada</th><th>Acciones</th></tr></thead>
              <tbody>
                {items.length === 0 ? <tr><td colSpan="6" className="text-center text-muted py-4">No hay asistencias registradas</td></tr>
                  : items.map((item, i) => (
                    <tr key={item.id_asistencia}>
                      <td>{i + 1}</td>
                      <td>{item.miembro_nombre || '—'}</td>
                      <td>{item.nombre_evento || '—'}</td>
                      <td>
                        <span className={`badge bg-${item.estado_asistencia === 'Presente' ? 'success' : item.estado_asistencia === 'Justificado' ? 'warning' : 'danger'}`}>
                          {item.estado_asistencia}
                        </span>
                      </td>
                      <td>{item.hora_llegada || '—'}</td>
                      <td>
                        <button className="btn btn-outline-primary btn-sm me-1" onClick={() => openEdit(item)} title="Editar"><i className="fas fa-edit"></i></button>
                        <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(item.id_asistencia)} title="Eliminar"><i className="fas fa-trash"></i></button>
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
                <h6 className="modal-title"><i className="fas fa-clipboard-check me-2"></i>{editingId ? 'Editar Asistencia' : 'Registrar Asistencia'}</h6>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body bg-light">
                  <div className="row g-2">
                    <div className="col-md-6 mb-2">
                      <label className="form-label small">Miembro</label>
                      <select name="id_miembro" value={form.id_miembro} onChange={handleChange} className="form-select form-select-sm" required>
                        <option value="">— Seleccione —</option>
                        {miembros.map(m => (
                          <option key={m.id_miembro} value={m.id_miembro}>{m.nombres} {m.apellidos}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-2">
                      <label className="form-label small">Evento</label>
                      <select name="id_evento" value={form.id_evento} onChange={handleChange} className="form-select form-select-sm" required>
                        <option value="">— Seleccione —</option>
                        {eventos.map(e => (
                          <option key={e.id_evento} value={e.id_evento}>{e.nombre_evento}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-2">
                      <label className="form-label small">Estado</label>
                      <select name="estado_asistencia" value={form.estado_asistencia} onChange={handleChange} className="form-select form-select-sm">
                        <option>Presente</option><option>Ausente</option><option>Justificado</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-2">
                      <label className="form-label small">Hora de Llegada</label>
                      <input name="hora_llegada" value={form.hora_llegada} onChange={handleChange} type="time" className="form-control form-control-sm" />
                    </div>
                    <div className="col-12 mb-2">
                      <label className="form-label small">Observaciones</label>
                      <textarea name="observaciones" value={form.observaciones} onChange={handleChange} className="form-control form-control-sm" rows="2"></textarea>
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
