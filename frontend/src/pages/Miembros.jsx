import { useState, useEffect, useRef } from 'react'
import { miembrosAPI } from '../api'
import Swal from 'sweetalert2'
import { useAuth } from '../context/AuthContext'

const emptyForm = {
  numero_identidad: '', nombres: '', apellidos: '', fecha_nacimiento: '',
  genero: 'Masculino', direccion: '', telefono: '', telefono_contacto: '',
  email: '', actividad_economica: '', fecha_bautismo: '', observaciones: ''
}

export default function Miembros() {
  const { user } = useAuth()
  const [miembros, setMiembros] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [fotoFile, setFotoFile] = useState(null)
  const [fotoActual, setFotoActual] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => { loadMiembros() }, [])

  const loadMiembros = async () => {
    try { const res = await miembrosAPI.getAll(); setMiembros(res.data) }
    catch { setMiembros([]) }
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleFotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFotoFile(file)
      setFotoPreview(URL.createObjectURL(file))
    }
  }

  const openCreate = () => {
    setForm(emptyForm); setEditingId(null); setFotoFile(null); setFotoPreview(null); setFotoActual(null)
    setShowModal(true)
  }

  const openEdit = (m) => {
    setForm({
      numero_identidad: m.numero_identidad || '',
      nombres: m.nombres || '',
      apellidos: m.apellidos || '',
      fecha_nacimiento: m.fecha_nacimiento ? m.fecha_nacimiento.split('T')[0] : '',
      genero: m.genero || 'Masculino',
      direccion: m.direccion || '',
      telefono: m.telefono || '',
      telefono_contacto: m.telefono_contacto || '',
      email: m.email || '',
      actividad_economica: m.actividad_economica || '',
      fecha_bautismo: m.fecha_bautismo ? m.fecha_bautismo.split('T')[0] : '',
      observaciones: m.observaciones || ''
    })
    setEditingId(m.id_miembro)
    setFotoFile(null)
    setFotoPreview(m.foto ? m.foto : null)
    setFotoActual(m.foto || null)
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (fotoFile) fd.append('foto', fotoFile)
      if (editingId) {
        fd.append('estado', 'Activo')
        await miembrosAPI.update(editingId, fd)
        Swal.fire('Actualizado', '', 'success')
      } else {
        await miembrosAPI.create(fd)
        Swal.fire('Guardado', '', 'success')
      }
      setShowModal(false)
      loadMiembros()
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'No se pudo guardar'
      Swal.fire('Error', msg, 'error')
    }
  }

  const handleDelete = async (id, nombre) => {
    const result = await Swal.fire({
      title: '¿Eliminar?', text: `Se eliminará a ${nombre}`, icon: 'question',
      showCancelButton: true, confirmButtonText: 'Sí, eliminar'
    })
    if (result.isConfirmed) {
      try { await miembrosAPI.delete(id); Swal.fire('Eliminado', '', 'success'); loadMiembros() }
      catch { Swal.fire('Error', 'No se pudo eliminar', 'error') }
    }
  }

  const fotoUrl = (foto) => foto ? (foto.startsWith('http') ? foto : `http://localhost:3001${foto}`) : null

  return (
    <>
      <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm mb-4">
        <div>
          <h1 className="content-header mb-0 text-dark"><i className="fas fa-users me-2 text-primary"></i>Miembros</h1>
          <nav aria-label="breadcrumb"><ol className="breadcrumb mb-0"><li className="breadcrumb-item"><a href="/">Inicio</a></li><li className="breadcrumb-item active">Miembros</li></ol></nav>
        </div>
        <button className="btn btn-primary btn-sm shadow-sm fw-bold" onClick={openCreate}>
          <i className="fas fa-plus me-1"></i> NUEVO MIEMBRO
        </button>
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead><tr><th>Foto</th><th>#</th><th>Identidad</th><th>Nombres</th><th>Apellidos</th><th>Teléfono</th><th>Contacto</th><th>Actividad</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {miembros.length === 0 ? (
                  <tr><td colSpan="10" className="text-center text-muted py-4">No hay miembros registrados</td></tr>
                ) : (
                  miembros.map((m, i) => (
                    <tr key={m.id_miembro}>
                      <td>
                        {m.foto ? (
                          <img src={fotoUrl(m.foto)} alt={m.nombres} className="rounded-circle" style={{ width: 40, height: 40, objectFit: 'cover' }} />
                        ) : (
                          <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white" style={{ width: 40, height: 40 }}>
                            <i className="fas fa-user"></i>
                          </div>
                        )}
                      </td>
                      <td>{i + 1}</td>
                      <td>{m.numero_identidad}</td>
                      <td>{m.nombres}</td>
                      <td>{m.apellidos}</td>
                      <td>{m.telefono}</td>
                      <td>{m.telefono_contacto}</td>
                      <td>{m.actividad_economica}</td>
                      <td><span className={`badge bg-${m.estado === 'Activo' ? 'success' : m.estado === 'Inactivo' ? 'secondary' : 'warning'}`}>{m.estado}</span></td>
                      <td>
                        <button className="btn btn-outline-primary btn-sm me-1" onClick={() => openEdit(m)} title="Editar"><i className="fas fa-edit"></i></button>
                        {user?.rol === 'Admin' && (
                          <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(m.id_miembro, m.nombres)} title="Eliminar"><i className="fas fa-trash"></i></button>
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

      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-dark text-white py-2">
                <h6 className="modal-title"><i className={`fas ${editingId ? 'fa-user-edit' : 'fa-user-plus'} me-2`}></i>{editingId ? 'Editar Miembro' : 'Nuevo Miembro'}</h6>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body bg-light">
                  <div className="text-center mb-3">
                    <div className="d-flex flex-column align-items-center">
                      {fotoPreview ? (
                        <img src={fotoUrl(fotoPreview) || fotoPreview} alt="Preview" className="rounded-circle mb-2" style={{ width: 100, height: 100, objectFit: 'cover' }} />
                      ) : (
                        <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white mb-2" style={{ width: 100, height: 100 }}>
                          <i className="fas fa-user fa-3x"></i>
                        </div>
                      )}
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFotoChange} className="form-control form-control-sm" style={{ maxWidth: 250 }} />
                      <small className="text-muted">Foto para carnet de membresía (máx 2MB)</small>
                    </div>
                  </div>
                  <div className="row g-2">
                    <div className="col-md-4 mb-2">
                      <label className="form-label small">Número de Identidad</label>
                      <input name="numero_identidad" value={form.numero_identidad} onChange={handleChange} type="text" className="form-control form-control-sm" placeholder="0000-0000-00000" required />
                    </div>
                    <div className="col-md-4 mb-2">
                      <label className="form-label small">Género</label>
                      <select name="genero" value={form.genero} onChange={handleChange} className="form-select form-select-sm">
                        <option>Masculino</option><option>Femenino</option>
                      </select>
                    </div>
                    <div className="col-md-4 mb-2">
                      <label className="form-label small">Fecha de Nacimiento</label>
                      <input name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={handleChange} type="date" className="form-control form-control-sm" />
                    </div>
                    <div className="col-md-6 mb-2">
                      <label className="form-label small">Nombres</label>
                      <input name="nombres" value={form.nombres} onChange={handleChange} type="text" className="form-control form-control-sm" required />
                    </div>
                    <div className="col-md-6 mb-2">
                      <label className="form-label small">Apellidos</label>
                      <input name="apellidos" value={form.apellidos} onChange={handleChange} type="text" className="form-control form-control-sm" required />
                    </div>
                    <div className="col-md-6 mb-2">
                      <label className="form-label small">Teléfono</label>
                      <input name="telefono" value={form.telefono} onChange={handleChange} type="text" className="form-control form-control-sm" placeholder="Propio" />
                    </div>
                    <div className="col-md-6 mb-2">
                      <label className="form-label small">Teléfono de Contacto</label>
                      <input name="telefono_contacto" value={form.telefono_contacto} onChange={handleChange} type="text" className="form-control form-control-sm" placeholder="Familiar/encargado" />
                    </div>
                    <div className="col-md-6 mb-2">
                      <label className="form-label small">Email</label>
                      <input name="email" value={form.email} onChange={handleChange} type="email" className="form-control form-control-sm" />
                    </div>
                    <div className="col-md-6 mb-2">
                      <label className="form-label small">Actividad Económica</label>
                      <input name="actividad_economica" value={form.actividad_economica} onChange={handleChange} type="text" className="form-control form-control-sm" placeholder="Oficio / Profesión" />
                    </div>
                    <div className="col-md-6 mb-2">
                      <label className="form-label small">Fecha de Bautismo</label>
                      <input name="fecha_bautismo" value={form.fecha_bautismo} onChange={handleChange} type="date" className="form-control form-control-sm" />
                    </div>
                    <div className="col-12 mb-2">
                      <label className="form-label small">Dirección</label>
                      <textarea name="direccion" value={form.direccion} onChange={handleChange} className="form-control form-control-sm" rows="2"></textarea>
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
