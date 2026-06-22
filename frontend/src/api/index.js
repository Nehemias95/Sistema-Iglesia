import axios from 'axios'

const API = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  perfil: () => API.get('/auth/perfil'),
}

export const miembrosAPI = {
  getAll: () => API.get('/miembros'),
  getById: (id) => API.get(`/miembros/${id}`),
  create: (data) => API.post('/miembros', data, data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}),
  update: (id, data) => API.put(`/miembros/${id}`, data, data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}),
  delete: (id) => API.delete(`/miembros/${id}`),
}

export const cargosAPI = {
  getAll: () => API.get('/cargos'),
  create: (data) => API.post('/cargos', data),
  update: (id, data) => API.put(`/cargos/${id}`, data),
  delete: (id) => API.delete(`/cargos/${id}`),
}

export const privilegiosAPI = {
  getAll: () => API.get('/privilegios'),
  create: (data) => API.post('/privilegios', data),
  update: (id, data) => API.put(`/privilegios/${id}`, data),
  delete: (id) => API.delete(`/privilegios/${id}`),
}

export const ministeriosAPI = {
  getAll: () => API.get('/ministerios'),
  getById: (id) => API.get(`/ministerios/${id}`),
  create: (data) => API.post('/ministerios', data),
  update: (id, data) => API.put(`/ministerios/${id}`, data),
  delete: (id) => API.delete(`/ministerios/${id}`),
  getMiembros: (id) => API.get(`/ministerios/${id}/miembros`),
  addMiembro: (id, data) => API.post(`/ministerios/${id}/miembros`, data),
  updateMiembro: (id, idmm, data) => API.put(`/ministerios/${id}/miembros/${idmm}`, data),
  removeMiembro: (id, idmm) => API.delete(`/ministerios/${id}/miembros/${idmm}`),
}

export const ofrendasAPI = {
  getAll: () => API.get('/ofrendas'),
  getById: (id) => API.get(`/ofrendas/${id}`),
  create: (data) => API.post('/ofrendas', data),
  update: (id, data) => API.put(`/ofrendas/${id}`, data),
  delete: (id) => API.delete(`/ofrendas/${id}`),
  getDistribucion: (id) => API.get(`/ofrendas/${id}/distribucion`),
  getCategorias: () => API.get('/ofrendas/categorias'),
  createCategoria: (data) => API.post('/ofrendas/categorias', data),
}

export const eventosAPI = {
  getAll: () => API.get('/eventos'),
  create: (data) => API.post('/eventos', data),
  update: (id, data) => API.put(`/eventos/${id}`, data),
  delete: (id) => API.delete(`/eventos/${id}`),
}

export const asistenciaAPI = {
  getAll: () => API.get('/asistencia'),
  create: (data) => API.post('/asistencia', data),
  update: (id, data) => API.put(`/asistencia/${id}`, data),
  delete: (id) => API.delete(`/asistencia/${id}`),
}

export const usuariosAPI = {
  getAll: () => API.get('/usuarios'),
  create: (data) => API.post('/usuarios', data),
  update: (id, data) => API.put(`/usuarios/${id}`, data),
  delete: (id) => API.delete(`/usuarios/${id}`),
}

export const diezmosAPI = {
  getAll: () => API.get('/diezmos'),
  getById: (id) => API.get(`/diezmos/${id}`),
  create: (data) => API.post('/diezmos', data),
  update: (id, data) => API.put(`/diezmos/${id}`, data),
  delete: (id) => API.delete(`/diezmos/${id}`),
}

export const bitacoraAPI = {
  getAll: (params) => API.get('/bitacora', { params }),
}

export const configuracionAPI = {
  getAll: () => API.get('/configuracion'),
  update: (data) => API.put('/configuracion', data),
  uploadLogo: (data) => API.post('/configuracion/upload-logo', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
}

export const reportesAPI = {
  ofrendasPorFecha: (params) => API.get('/reportes/ofrendas-por-fecha', { params }),
  ofrendasPorMiembro: (params) => API.get('/reportes/ofrendas-por-miembro', { params }),
  diezmosPorFecha: (params) => API.get('/reportes/diezmos-por-fecha', { params }),
  diezmosPorMiembro: (params) => API.get('/reportes/diezmos-por-miembro', { params }),
}
