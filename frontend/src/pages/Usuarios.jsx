import { useState, useEffect } from 'react'
import { usuariosAPI } from '../api'
import { useAuth } from '../context/AuthContext'
import Swal from 'sweetalert2'

const emptyForm = { username: '', password: '', nombre_completo: '', rol: 'Digitador', id_miembro: '' }

export default function Usuarios() {
  const { user } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    try {
      const res = await usuariosAPI.getAll()
      setUsuarios(res.data)
    } catch { }
  }

  function openCreate() {
    setForm(emptyForm)
    setEditingId(null)
    setShowModal(true)
  }

  function openEdit(u) {
    setForm({ username: u.username, password: '', nombre_completo: u.nombre_completo, rol: u.rol, id_miembro: u.id_miembro || '' })
    setEditingId(u.id_usuario)
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      if (editingId) {
        await usuariosAPI.update(editingId, { ...form, activo: true })
        Swal.fire('Actualizado', '', 'success')
      } else {
        if (!form.password) return Swal.fire('Error', 'La contraseña es requerida', 'error')
        await usuariosAPI.create(form)
        Swal.fire('Creado', '', 'success')
      }
      setShowModal(false)
      cargar()
    } catch (err) {
      Swal.fire('Error', err.response?.data?.error || err.message, 'error')
    }
  }

  async function handleDelete(id, username) {
    const confirm = await Swal.fire({ title: '¿Eliminar usuario?', text: username, icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33' })
    if (!confirm.isConfirmed) return
    try {
      await usuariosAPI.delete(id)
      Swal.fire('Eliminado', '', 'success')
      cargar()
    } catch (err) {
      Swal.fire('Error', err.response?.data?.error || err.message, 'error')
    }
  }

  const rolBadge = (rol) => {
    const colors = { Admin: 'danger', Pastor: 'primary', Tesorero: 'warning', Digitador: 'secondary' }
    return <span className={`badge bg-${colors[rol] || 'secondary'}`}>{rol}</span>
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0"><i className="fas fa-users-cog me-2"></i>Usuarios</h4>
        {user?.rol === 'Admin' && (
          <button className="btn btn-primary" onClick={openCreate}><i className="fas fa-plus me-1"></i>Nuevo Usuario</button>
        )}
      </div>

      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-sm">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Nombre</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Último Acceso</th>
                  {user?.rol === 'Admin' && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id_usuario}>
                    <td>{u.username}</td>
                    <td>{u.nombre_completo}</td>
                    <td>{rolBadge(u.rol)}</td>
                    <td>{u.activo ? <span className="badge bg-success">Activo</span> : <span className="badge bg-secondary">Inactivo</span>}</td>
                    <td>{u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleString() : '—'}</td>
                    {user?.rol === 'Admin' && (
                      <td>
                        <button className="btn btn-outline-primary btn-sm me-1" onClick={() => openEdit(u)} title="Editar"><i className="fas fa-edit"></i></button>
                        <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(u.id_usuario, u.username)} title="Eliminar"><i className="fas fa-trash"></i></button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingId ? 'Editar Usuario' : 'Nuevo Usuario'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Usuario</label>
                    <input type="text" className="form-control" required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">{editingId ? 'Nueva Contraseña (dejar vacío para mantener)' : 'Contraseña'}</label>
                    <input type="password" className="form-control" required={!editingId} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Nombre Completo</label>
                    <input type="text" className="form-control" required value={form.nombre_completo} onChange={e => setForm({ ...form, nombre_completo: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Rol</label>
                    <select className="form-select" required value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}>
                      <option value="Admin">Admin</option>
                      <option value="Pastor">Pastor</option>
                      <option value="Tesorero">Tesorero</option>
                      <option value="Digitador">Digitador</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">{editingId ? 'Actualizar' : 'Crear'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
