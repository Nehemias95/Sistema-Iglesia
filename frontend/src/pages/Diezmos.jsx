import { useState, useEffect } from 'react'
import { diezmosAPI, miembrosAPI } from '../api'
import { useAuth } from '../context/AuthContext'
import Swal from 'sweetalert2'

const emptyForm = { monto: '', id_miembro: '', metodo_pago: 'Efectivo', referencia: '', observaciones: '' }

export default function Diezmos() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [miembros, setMiembros] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => { load(); loadMiembros() }, [])

  const load = async () => {
    try { const res = await diezmosAPI.getAll(); setItems(res.data) }
    catch { setItems([]) }
  }
  const loadMiembros = async () => {
    try { const res = await miembrosAPI.getAll(); setMiembros(res.data.filter(m => m.estado === 'Activo')) }
    catch { setMiembros([]) }
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const openCreate = () => {
    setForm(emptyForm); setEditingId(null); setShowModal(true)
  }

  const openEdit = (item) => {
    setForm({
      monto: item.monto, id_miembro: item.id_miembro || '',
      metodo_pago: item.metodo_pago || 'Efectivo', referencia: item.referencia || '', observaciones: item.observaciones || ''
    })
    setEditingId(item.id_diezmo)
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      const data = {
        ...form, monto: parseFloat(form.monto),
        id_miembro: form.id_miembro || null
      }
      if (editingId) { await diezmosAPI.update(editingId, data); Swal.fire('Actualizado', '', 'success') }
      else { await diezmosAPI.create(data); Swal.fire('Guardado', '', 'success') }
      setShowModal(false); load()
    } catch (err) { Swal.fire('Error', err.response?.data?.error || err.message, 'error') }
  }

  const handleDelete = async (id, monto) => {
    const r = await Swal.fire({ title: '¿Eliminar?', text: `Diezmo de L.${monto}`, icon: 'question', showCancelButton: true, confirmButtonText: 'Sí' })
    if (r.isConfirmed) {
      try { await diezmosAPI.delete(id); Swal.fire('Eliminado', '', 'success'); load() }
      catch { Swal.fire('Error', '', 'error') }
    }
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm mb-4">
        <div>
          <h1 className="content-header mb-0 text-dark"><i className="fas fa-hand-holding-heart me-2 text-primary"></i>Diezmos</h1>
          <nav aria-label="breadcrumb"><ol className="breadcrumb mb-0"><li className="breadcrumb-item"><a href="/">Inicio</a></li><li className="breadcrumb-item active">Diezmos</li></ol></nav>
        </div>
        <div>
          <button className="btn btn-primary btn-sm shadow-sm fw-bold" onClick={openCreate}>
            <i className="fas fa-plus me-1"></i> NUEVO DIEZMO
          </button>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead><tr><th>#</th><th>Fecha</th><th>Monto</th><th>Miembro</th><th>Método</th><th>Acciones</th></tr></thead>
              <tbody>
                {items.length === 0 ? <tr><td colSpan="6" className="text-center text-muted py-4">No hay diezmos registrados</td></tr>
                  : items.map((item, i) => (
                    <tr key={item.id_diezmo}>
                      <td>{i + 1}</td>
                      <td>{item.fecha ? new Date(item.fecha).toLocaleDateString() : '—'}</td>
                      <td className="fw-bold">L. {parseFloat(item.monto).toFixed(2)}</td>
                      <td>{item.miembro_nombre || <span className="text-muted">Anónimo</span>}</td>
                      <td><span className="badge bg-info">{item.metodo_pago}</span></td>
                      <td>
                        <button className="btn btn-outline-primary btn-sm me-1" onClick={() => openEdit(item)} title="Editar"><i className="fas fa-edit"></i></button>
                        {user?.rol === 'Admin' && (
                          <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(item.id_diezmo, item.monto)} title="Eliminar"><i className="fas fa-trash"></i></button>
                        )}
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
                <h6 className="modal-title"><i className="fas fa-hand-holding-heart me-2"></i>{editingId ? 'Editar Diezmo' : 'Nuevo Diezmo'}</h6>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body bg-light">
                  <div className="row g-2">
                    <div className="col-md-6 mb-2">
                      <label className="form-label small">Monto (L.)</label>
                      <input name="monto" value={form.monto} onChange={handleChange} type="number" step="0.01" className="form-control form-control-sm" required />
                    </div>
                    <div className="col-md-6 mb-2">
                      <label className="form-label small">Método de Pago</label>
                      <select name="metodo_pago" value={form.metodo_pago} onChange={handleChange} className="form-select form-select-sm">
                        <option>Efectivo</option><option>Transferencia</option><option>Cheque</option><option>Tarjeta</option><option>Otro</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-2">
                      <label className="form-label small">Miembro (opcional)</label>
                      <select name="id_miembro" value={form.id_miembro} onChange={handleChange} className="form-select form-select-sm">
                        <option value="">— Anónimo —</option>
                        {miembros.map(m => (
                          <option key={m.id_miembro} value={m.id_miembro}>{m.nombres} {m.apellidos}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-2">
                      <label className="form-label small">Referencia</label>
                      <input name="referencia" value={form.referencia} onChange={handleChange} type="text" className="form-control form-control-sm" />
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
