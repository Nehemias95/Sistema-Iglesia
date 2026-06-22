import { verifyToken } from './auth.js'

export function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'No autorizado' })

    const decoded = verifyToken(token)
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido' })
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' })
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No tiene permisos para esta acción' })
    }
    next()
  }
}

export function blockDelete(req, res, next) {
  if (req.user?.rol === 'Pastor' || req.user?.rol === 'Tesorero' || req.user?.rol === 'Digitador') {
    return res.status(403).json({ error: 'No tiene permisos para eliminar registros' })
  }
  next()
}

export function blockDeleteOfrendas(req, res, next) {
  if (req.user?.rol === 'Tesorero' || req.user?.rol === 'Pastor') {
    return res.status(403).json({ error: 'No tiene permisos para eliminar ofrendas' })
  }
  next()
}
