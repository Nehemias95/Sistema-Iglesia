import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Miembros from './pages/Miembros'
import Cargos from './pages/Cargos'
import Privilegios from './pages/Privilegios'
import Ministerios from './pages/Ministerios'
import Ofrendas from './pages/Ofrendas'
import Eventos from './pages/Eventos'
import Asistencia from './pages/Asistencia'
import Usuarios from './pages/Usuarios'
import Bitacora from './pages/Bitacora'
import Diezmos from './pages/Diezmos'
import Configuracion from './pages/Configuracion'
import Reportes from './pages/Reportes'
import Fichas from './pages/Fichas'
import Backups from './pages/Backups'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="d-flex justify-content-center align-items-center min-vh-100"><div className="spinner-border text-primary"></div></div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="d-flex justify-content-center align-items-center min-vh-100"><div className="spinner-border text-primary"></div></div>
  if (user) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
      <Route path="/miembros" element={<PrivateRoute><Layout><Miembros /></Layout></PrivateRoute>} />
      <Route path="/cargos" element={<PrivateRoute><Layout><Cargos /></Layout></PrivateRoute>} />
      <Route path="/privilegios" element={<PrivateRoute><Layout><Privilegios /></Layout></PrivateRoute>} />
      <Route path="/ministerios" element={<PrivateRoute><Layout><Ministerios /></Layout></PrivateRoute>} />
      <Route path="/ofrendas" element={<PrivateRoute><Layout><Ofrendas /></Layout></PrivateRoute>} />
      <Route path="/eventos" element={<PrivateRoute><Layout><Eventos /></Layout></PrivateRoute>} />
      <Route path="/asistencia" element={<PrivateRoute><Layout><Asistencia /></Layout></PrivateRoute>} />
      <Route path="/usuarios" element={<PrivateRoute><Layout><Usuarios /></Layout></PrivateRoute>} />
      <Route path="/diezmos" element={<PrivateRoute><Layout><Diezmos /></Layout></PrivateRoute>} />
      <Route path="/bitacora" element={<PrivateRoute><Layout><Bitacora /></Layout></PrivateRoute>} />
      <Route path="/configuracion" element={<PrivateRoute><Layout><Configuracion /></Layout></PrivateRoute>} />
      <Route path="/reportes" element={<PrivateRoute><Layout><Reportes /></Layout></PrivateRoute>} />
      <Route path="/fichas" element={<PrivateRoute><Layout><Fichas /></Layout></PrivateRoute>} />
      <Route path="/backups" element={<PrivateRoute><Layout><Backups /></Layout></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
