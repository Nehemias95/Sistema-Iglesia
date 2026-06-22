import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Swal from 'sweetalert2'

export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(username, password)
    } catch (err) {
      Swal.fire('Error', err.response?.data?.error || 'Credenciales inválidas', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: '#2c3e50' }}>
      <div className="card border-0 shadow" style={{ width: 400 }}>
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 70, height: 70 }}>
              <i className="fas fa-church fa-2x"></i>
            </div>
            <h4 className="mb-1">Iglesia EFESO</h4>
            <small className="text-muted">Sistema de Gestión</small>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small">Usuario</label>
              <input
                type="text"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingrese su usuario"
                required
                autoFocus
              />
            </div>
            <div className="mb-3">
              <label className="form-label small">Contraseña</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingrese su contraseña"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2"></span>Ingresando...</>
              ) : (
                <><i className="fas fa-sign-in-alt me-2"></i>Ingresar</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
