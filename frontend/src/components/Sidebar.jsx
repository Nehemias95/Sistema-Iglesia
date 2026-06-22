import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { configuracionAPI } from '../api'

const menuItems = [
  { path: '/', icon: 'fa-home', label: 'Inicio', roles: ['Admin', 'Pastor', 'Tesorero', 'Digitador'] },
  { path: '/miembros', icon: 'fa-users', label: 'Miembros', roles: ['Admin', 'Pastor', 'Tesorero', 'Digitador'] },
  { path: '/cargos', icon: 'fa-user-tag', label: 'Cargos', roles: ['Admin', 'Pastor'] },
  { path: '/privilegios', icon: 'fa-shield-alt', label: 'Privilegios', roles: ['Admin', 'Pastor'] },
  { path: '/ministerios', icon: 'fa-church', label: 'Ministerios', roles: ['Admin', 'Pastor', 'Tesorero'] },
  { path: '/ofrendas', icon: 'fa-hand-holding-usd', label: 'Ofrendas', roles: ['Admin', 'Pastor', 'Tesorero'] },
  { path: '/diezmos', icon: 'fa-hand-holding-heart', label: 'Diezmos', roles: ['Admin', 'Pastor', 'Tesorero'] },
  { path: '/eventos', icon: 'fa-calendar-alt', label: 'Eventos', roles: ['Admin', 'Pastor'] },
  { path: '/asistencia', icon: 'fa-clipboard-check', label: 'Asistencia', roles: ['Admin', 'Pastor'] },
  { path: '/reportes', icon: 'fa-chart-bar', label: 'Reportes', roles: ['Admin', 'Pastor'] },
  { sep: true },
  { path: '/usuarios', icon: 'fa-users-cog', label: 'Usuarios', roles: ['Admin'] },
  { path: '/configuracion', icon: 'fa-cog', label: 'Configuración', roles: ['Admin'] },
  { path: '/bitacora', icon: 'fa-history', label: 'Bitácora', roles: ['Admin', 'Pastor'] },
]

export default function Sidebar({ darkMode, setDarkMode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [iglesia, setIglesia] = useState({ nombre: 'Iglesia EFESO', logo: null, mision: '' })

  useEffect(() => {
    fetchConfig()
    window.addEventListener('configUpdated', fetchConfig)
    return () => window.removeEventListener('configUpdated', fetchConfig)
  }, [])

  async function fetchConfig() {
    try {
      const res = await configuracionAPI.getAll()
      setIglesia({
        nombre: res.data.nombre_iglesia || 'Iglesia EFESO',
        logo: res.data.logo_iglesia || null,
        mision: res.data.mision_iglesia || ''
      })
    } catch {}
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const visibleItems = menuItems.filter(item => {
    if (item.sep) return true
    return item.roles.includes(user?.rol)
  })

  return (
    <nav id="sidebar">
      <div className="sidebar-header">
        {iglesia.logo && (
          <div className="mb-2">
            <img src={iglesia.logo} alt="Logo" className="img-fluid" style={{ maxHeight: 50 }} />
          </div>
        )}
        <h5 className="mb-0">{iglesia.nombre}</h5>
        <small className="text-info">Sistema de Gestión</small>
        {iglesia.mision && (
          <div className="mt-1">
            <span className="badge bg-info text-dark" style={{ fontSize: '0.65rem' }}>{iglesia.mision}</span>
          </div>
        )}
        <div className="user-info mt-2">
          <i className="fas fa-user-circle me-1"></i>
          <span className="fw-semibold">{user?.nombre}</span>
          <small className="d-block text-white-50">{user?.rol}</small>
        </div>
        <div className="d-flex gap-2 mt-2 justify-content-center">
          <button className="btn btn-outline-light btn-sm" onClick={() => setDarkMode(!darkMode)} title="Modo oscuro">
            <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
          <button className="btn btn-outline-danger btn-sm" onClick={handleLogout} title="Cerrar sesión">
            <i className="fas fa-sign-out-alt"></i> Salir
          </button>
        </div>
      </div>
      <ul className="nav flex-column mt-1">
        {visibleItems.map((item, i) => {
          if (item.sep) {
            return <li key={`sep-${i}`} className="nav-item"><hr className="my-1 mx-3" style={{ borderColor: 'rgba(255,255,255,0.15)' }} /></li>
          }
          return (
            <li className="nav-item" key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''}`
                }
              >
                <i className={`fas ${item.icon} me-2`}></i>
                {item.label}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
