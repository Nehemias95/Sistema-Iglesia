import { Router } from 'express'
import bcrypt from 'bcrypt'
import pool from '../db.js'
import { generateToken, verifyToken } from '../middleware/auth.js'

const router = Router()

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' })
    }

    const result = await pool.query(
      'SELECT * FROM usuarios WHERE username = $1 AND activo = true',
      [username]
    )

    const user = result.rows[0]
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    // Actualizar último acceso
    await pool.query(
      'UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id_usuario = $1',
      [user.id_usuario]
    )

    const token = generateToken(user)
    res.json({
      token,
      user: {
        id: user.id_usuario,
        username: user.username,
        nombre: user.nombre_completo,
        rol: user.rol
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/perfil', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'No autorizado' })

    const decoded = verifyToken(token)
    const result = await pool.query(
      'SELECT id_usuario, username, nombre_completo, rol, ultimo_acceso, fecha_creacion FROM usuarios WHERE id_usuario = $1',
      [decoded.id]
    )

    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' })
  }
})

export default router
