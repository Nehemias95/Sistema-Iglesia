import { useState, useEffect } from 'react'
import { ofrendasAPI, miembrosAPI, eventosAPI } from '../api'
import Swal from 'sweetalert2'

const emptyForm = { monto: '', id_miembro: '', id_evento: '', metodo_pago: 'Efectivo', referencia: '', observaciones: '' }

export default function Ofrendas() {
  const [items, setItems] = useState([])
  const [miembros, setMiembros] = useState([])
  const [eventos, setEventos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [distribucion, setDistribucion] = useState([])
  const [showCategoriaModal, setShowCategoriaModal] = useState(false)
  const [newCategoria, setNewCategoria] = useState({ nombre_categoria: '', descripcion: '', codigo_contable: '' })

  useEffect(() => { load(); loadMiembros(); loadEventos(); loadCategorias() }, [])

  const load = async () => {
    try { const res = await ofrendasAPI.getAll(); setItems(res.data) }
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
  const loadCategorias = async () => {
    try { const res = await ofrendasAPI.getCategorias(); setCategorias(res.data) }
    catch { setCategorias([]) }
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const montoTotal = parseFloat(form.monto) || 0

  const agregarDistribucion = () => {
    const restante = montoTotal - distribucion.reduce((s, d) => s + (parseFloat(d.monto_asignado) || 0), 0)
    if (restante <= 0) { Swal.fire('Límite', 'Ya distribuyó todo el monto', 'warning'); return }
    setDistribucion([...distribucion, { id_categoria: '', monto_asignado: '', porcentaje: '' }])
  }

  const updateDistribucion = (i, field, value) => {
    const d = [...distribucion]
    d[i][field] = value
    if (field === 'monto_asignado' && montoTotal > 0) {
      d[i].porcentaje = ((parseFloat(value) || 0) / montoTotal * 100).toFixed(2)
    }
    if (field === 'porcentaje' && montoTotal > 0) {
      d[i].monto_asignado = ((parseFloat(value) || 0) / 100 * montoTotal).toFixed(2)
    }
    setDistribucion(d)
  }

  const removeDistribucion = (i) => setDistribucion(distribucion.filter((_, idx) => idx !== i))

  const openCreate = () => {
    setForm(emptyForm); setEditingId(null); setDistribucion([]); setShowModal(true)
  }

  const openEdit = async (item) => {
    setForm({
      monto: item.monto, id_miembro: item.id_miembro || '', id_evento: item.id_evento || '',
      metodo_pago: item.metodo_pago || 'Efectivo', referencia: item.referencia || '', observaciones: item.observaciones || ''
    })
    setEditingId(item.id_ofrenda)
    try {
      const res = await ofrendasAPI.getDistribucion(item.id_ofrenda)
      setDistribucion(res.data.map(d => ({ id_categoria: d.id_categoria, monto_asignado: d.monto_asignado, porcentaje: d.porcentaje })))
    } catch { setDistribucion([]) }
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      const data = {
        ...form, monto: parseFloat(form.monto),
        id_miembro: form.id_miembro || null, id_evento: form.id_evento || null,
        distribucion: distribucion.map(d => ({
          id_categoria: parseInt(d.id_categoria), monto_asignado: parseFloat(d.monto_asignado),
          porcentaje: d.porcentaje ? parseFloat(d.porcentaje) : null
        }))
      }
      if (editingId) { await ofrendasAPI.update(editingId, data); Swal.fire('Actualizado', '', 'success') }
      else { await ofrendasAPI.create(data); Swal.fire('Guardado', '', 'success') }
      setShowModal(false); load()
    } catch (err) { Swal.fire('Error', err.response?.data?.error || err.message, 'error') }
  }

  const handleDelete = async (id, monto) => {
    const r = await Swal.fire({ title: '¿Eliminar?', text: `Ofrenda de L.${monto}`, icon: 'question', showCancelButton: true, confirmButtonText: 'Sí' })
    if (r.isConfirmed) {
      try { await ofrendasAPI.delete(id); Swal.fire('Eliminado', '', 'success'); load() }
      catch { Swal.fire('Error', '', 'error') }
    }
  }

  const handleNewCategoria = async (e) => {
    e.preventDefault()
    try {
      await ofrendasAPI.createCategoria(newCategoria)
      Swal.fire('Categoría creada', '', 'success')
      setShowCategoriaModal(false); setNewCategoria({ nombre_categoria: '', descripcion: '', codigo_contable: '' })
      loadCategorias()
    } catch (err) { Swal.fire('Error', err.response?.data?.error || err.message, 'error') }
  }

  const restante = montoTotal - distribucion.reduce((s, d) => s + (parseFloat(d.monto_asignado) || 0), 0)

  return (
    <>
      <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm mb-4">
        <div>
          <h1 className="content-header mb-0 text-dark"><i className="fas fa-hand-holding-usd me-2 text-primary"></i>Ofrendas</h1>
          <nav aria-label="breadcrumb"><ol className="breadcrumb mb-0"><li className="breadcrumb-item"><a href="/">Inicio</a></li><li className="breadcrumb-item active">Ofrendas</li></ol></nav>
        </div>
        <div>
          <button className="btn btn-outline-success btn-sm me-2 shadow-sm" onClick={() => setShowCategoriaModal(true)}>
            <i className="fas fa-tags me-1"></i> CATEGORÍAS
          </button>
          <button className="btn btn-primary btn-sm shadow-sm fw-bold" onClick={openCreate}>
            <i className="fas fa-plus me-1"></i> NUEVA OFRENDA
          </button>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead><tr><th>#</th><th>Fecha</th><th>Evento</th><th>Monto</th><th>Miembro</th><th>Método</th><th>Acciones</th></tr></thead>
              <tbody>
                {items.length === 0 ? <tr><td colSpan="7" className="text-center text-muted py-4">No hay ofrendas registradas</td></tr>
                  : items.map((item, i) => (
                    <tr key={item.id_ofrenda}>
                      <td>{i + 1}</td>
                      <td>{item.fecha ? new Date(item.fecha).toLocaleDateString() : '—'}</td>
                      <td>{item.nombre_evento || <span className="text-muted">Sin evento</span>}</td>
                      <td className="fw-bold">L. {parseFloat(item.monto).toFixed(2)}</td>
                      <td>{item.id_miembro ? miembros.find(m => m.id_miembro === item.id_miembro)?.nombres || '—' : <span className="text-muted">Anónimo</span>}</td>
                      <td><span className="badge bg-info">{item.metodo_pago}</span></td>
                      <td>
                        <button className="btn btn-outline-primary btn-sm me-1" onClick={() => openEdit(item)} title="Editar"><i className="fas fa-edit"></i></button>
                        <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(item.id_ofrenda, item.monto)} title="Eliminar"><i className="fas fa-trash"></i></button>
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
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-dark text-white py-2">
                <h6 className="modal-title"><i className="fas fa-hand-holding-usd me-2"></i>{editingId ? 'Editar Ofrenda' : 'Nueva Ofrenda'}</h6>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body bg-light">
                  <div className="row g-2">
                    <div className="col-md-4 mb-2">
                      <label className="form-label small">Monto Total (L.)</label>
                      <input name="monto" value={form.monto} onChange={handleChange} type="number" step="0.01" className="form-control form-control-sm" required />
                    </div>
                    <div className="col-md-4 mb-2">
                      <label className="form-label small">Evento / Culto</label>
                      <select name="id_evento" value={form.id_evento} onChange={handleChange} className="form-select form-select-sm">
                        <option value="">— Sin evento —</option>
                        {eventos.filter(e => e.estado !== 'Cancelado').map(e => (
                          <option key={e.id_evento} value={e.id_evento}>{e.nombre_evento}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4 mb-2">
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
                      <textarea name="observaciones" value={form.observaciones} onChange={handleChange} className="form-control form-control-sm" rows="1"></textarea>
                    </div>
                  </div>

                  <hr />
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0"><i className="fas fa-chart-pie me-1"></i>Distribución de la Ofrenda</h6>
                    <div>
                      <small className="text-muted me-2">Total: L.{montoTotal.toFixed(2)}</small>
                      <span className={`badge bg-${restante > 0 ? 'warning' : restante === 0 ? 'success' : 'danger'} me-2`}>
                        Restante: L.{restante.toFixed(2)}
                      </span>
                      <button type="button" className="btn btn-outline-primary btn-sm" onClick={agregarDistribucion}>
                        <i className="fas fa-plus me-1"></i> Agregar
                      </button>
                    </div>
                  </div>

                  {distribucion.map((d, i) => (
                    <div key={i} className="row g-1 mb-1 align-items-end">
                      <div className="col-md-5">
                        <select className="form-select form-select-sm" value={d.id_categoria} onChange={(e) => updateDistribucion(i, 'id_categoria', e.target.value)}>
                          <option value="">— Seleccione categoría —</option>
                          {categorias.map(c => (
                            <option key={c.id_categoria} value={c.id_categoria}>{c.nombre_categoria}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-3">
                        <input type="number" step="0.01" className="form-control form-control-sm" placeholder="Monto" value={d.monto_asignado} onChange={(e) => updateDistribucion(i, 'monto_asignado', e.target.value)} />
                      </div>
                      <div className="col-md-2">
                        <input type="number" step="0.01" className="form-control form-control-sm" placeholder="%" value={d.porcentaje} onChange={(e) => updateDistribucion(i, 'porcentaje', e.target.value)} />
                      </div>
                      <div className="col-md-2">
                        <button type="button" className="btn btn-outline-danger btn-sm w-100" onClick={() => removeDistribucion(i)}><i className="fas fa-times"></i></button>
                      </div>
                    </div>
                  ))}
                  {distribucion.length === 0 && (
                    <p className="text-muted small mb-0">Agregue categorías para distribuir el monto (Fondo General, Ministerio de Alabanza, etc.)</p>
                  )}
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

      {showCategoriaModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 450 }}>
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-dark text-white py-2">
                <h6 className="modal-title"><i className="fas fa-tags me-2"></i>Gestión de Categorías</h6>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowCategoriaModal(false)}></button>
              </div>
              <div className="modal-body bg-light">
                <form onSubmit={handleNewCategoria}>
                  <div className="mb-2">
                    <label className="form-label small">Nombre de Categoría</label>
                    <input value={newCategoria.nombre_categoria} onChange={(e) => setNewCategoria({ ...newCategoria, nombre_categoria: e.target.value })} type="text" className="form-control form-control-sm" required />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small">Código Contable</label>
                    <input value={newCategoria.codigo_contable} onChange={(e) => setNewCategoria({ ...newCategoria, codigo_contable: e.target.value })} type="text" className="form-control form-control-sm" />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small">Descripción</label>
                    <textarea value={newCategoria.descripcion} onChange={(e) => setNewCategoria({ ...newCategoria, descripcion: e.target.value })} className="form-control form-control-sm" rows="1"></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm w-100"><i className="fas fa-save me-1"></i> Crear Categoría</button>
                </form>
                <hr />
                <h6 className="small">Categorías existentes:</h6>
                {categorias.length === 0 ? (
                  <p className="text-muted small">No hay categorías</p>
                ) : (
                  <ul className="list-unstyled mb-0">
                    {categorias.map(c => (
                      <li key={c.id_categoria} className="small py-1 border-bottom">
                        <strong>{c.nombre_categoria}</strong>
                        {c.codigo_contable && <span className="text-muted ms-2">({c.codigo_contable})</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
