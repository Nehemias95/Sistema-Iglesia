import { useState, useEffect, useRef } from 'react'
import { configuracionAPI } from '../api'
import { useAuth } from '../context/AuthContext'
import Swal from 'sweetalert2'

const fieldDefs = [
  { clave: 'nombre_iglesia', label: 'Nombre de la Iglesia', type: 'text' },
  { clave: 'mision_iglesia', label: 'Misión', type: 'text' },
  { clave: 'email_servidor', label: 'Servidor SMTP', type: 'text' },
  { clave: 'email_puerto', label: 'Puerto SMTP', type: 'number' },
  { clave: 'email_usuario', label: 'Usuario de Correo', type: 'text' },
  { clave: 'email_password', label: 'Contraseña de Correo', type: 'password' },
  { clave: 'email_ssl', label: 'Usar SSL', type: 'checkbox' },
  { clave: 'backup_email', label: 'Correo para Respaldos', type: 'text', help: 'Los respaldos automáticos se enviarán aquí' },
  { clave: 'backup_activo', label: 'Respaldo Automático Diario', type: 'checkbox' },
  { clave: 'backup_hora', label: 'Hora del Respaldo', type: 'text', help: 'Formato HH:MM (ej: 06:00)' },
]

export default function Configuracion() {
  const { user } = useAuth()
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  useEffect(() => {
    if (user?.rol === 'Admin') {
      cargar()
    } else {
      setLoading(false)
    }
  }, [user])

  async function cargar() {
    try {
      const res = await configuracionAPI.getAll()
      setForm(res.data)
    } catch {
      Swal.fire('Error', 'No se pudo cargar la configuración', 'error')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(clave, value) {
    setForm(prev => ({ ...prev, [clave]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await configuracionAPI.update(form)
      window.dispatchEvent(new Event('configUpdated'))
      Swal.fire('Guardado', 'Configuración actualizada correctamente', 'success')
    } catch (err) {
      Swal.fire('Error', err.response?.data?.error || err.message, 'error')
    }
  }

  async function handleLogoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      Swal.fire('Error', 'Solo se permiten imágenes', 'error')
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('logo', file)
      const res = await configuracionAPI.uploadLogo(fd)
      handleChange('logo_iglesia', res.data.ruta)
      window.dispatchEvent(new Event('configUpdated'))
      Swal.fire('Logo subido', '', 'success')
    } catch (err) {
      Swal.fire('Error', err.response?.data?.error || err.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  function removeLogo() {
    handleChange('logo_iglesia', '')
    window.dispatchEvent(new Event('configUpdated'))
  }

  if (user?.rol !== 'Admin') {
    return (
      <div className="text-center py-5">
        <i className="fas fa-exclamation-triangle text-warning fa-3x mb-3"></i>
        <h5>No tiene permisos</h5>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0"><i className="fas fa-cog me-2"></i>Configuración</h4>
      </div>

      <div className="row">
        <div className="col-md-4">
          <div className="card mb-3">
            <div className="card-body text-center">
              <h6 className="card-title"><i className="fas fa-image me-1"></i>Logo / Sello</h6>
              {form.logo_iglesia ? (
                <div className="mb-2">
                  <img src={form.logo_iglesia} alt="Logo" className="img-fluid mb-2" style={{ maxHeight: 120 }} />
                  <div>
                    <button className="btn btn-outline-danger btn-sm me-1" onClick={removeLogo}><i className="fas fa-trash"></i></button>
                    <button className="btn btn-outline-primary btn-sm" onClick={() => fileRef.current.click()}>
                      <i className="fas fa-sync"></i>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-2 p-4 border rounded bg-light">
                  <i className="fas fa-upload fa-2x text-muted"></i>
                  <p className="text-muted small mb-2">Sin logo</p>
                  <button className="btn btn-outline-primary btn-sm" onClick={() => fileRef.current.click()}>
                    <i className="fas fa-upload me-1"></i>Subir Logo
                  </button>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="d-none" onChange={handleLogoUpload} disabled={uploading} />
              {uploading && <div className="spinner-border spinner-border-sm text-primary mt-1"></div>}
            </div>
          </div>
        </div>

        <div className="col-md-8">
          <div className="card">
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                {fieldDefs.map(field => (
                  <div className="mb-3" key={field.clave}>
                    {field.type === 'checkbox' ? (
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id={field.clave}
                          checked={form[field.clave] === 'true'}
                          onChange={e => handleChange(field.clave, e.target.checked ? 'true' : 'false')}
                        />
                        <label className="form-check-label" htmlFor={field.clave}>{field.label}</label>
                      </div>
                    ) : (
                      <>
                        <label className="form-label" htmlFor={field.clave}>{field.label}</label>
                        {field.help && <small className="text-muted d-block mb-1">{field.help}</small>}
                        <input
                          type={field.type}
                          className="form-control"
                          id={field.clave}
                          value={form[field.clave] || ''}
                          onChange={e => handleChange(field.clave, e.target.value)}
                        />
                      </>
                    )}
                  </div>
                ))}
                <button type="submit" className="btn btn-primary">
                  <i className="fas fa-save me-1"></i>Guardar
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
