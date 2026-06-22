import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'iglesia-efeso-secret-key-2026'

export function generateToken(user) {
  return jwt.sign(
    { id: user.id_usuario, username: user.username, rol: user.rol, nombre: user.nombre_completo },
    JWT_SECRET,
    { expiresIn: '8h' }
  )
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET)
}
