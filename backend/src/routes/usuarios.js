import { Router } from 'express'
import bcrypt from 'bcrypt'
import pool from '../db.js'
import { authenticate } from '../middleware/roles.js'
import { registrarBitacora } from '../middleware/bitacora.js'

const router = Router()
router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    if (req.user.rol !== 'Admin' && req.user.rol !== 'Pastor') {
      return res.status(403).json({ error: 'No tiene permisos' })
    }
    const result = await pool.query(
      "SELECT id_usuario, username, nombre_completo, rol, activo, ultimo_acceso, fecha_creacion FROM usuarios ORDER BY id_usuario"
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    if (req.user.rol !== 'Admin') {
      return res.status(403).json({ error: 'Solo el administrador puede crear usuarios' })
    }
    const { username, password, nombre_completo, rol, id_miembro } = req.body
    if (!username || !password || !nombre_completo || !rol) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' })
    }
    const password_hash = await bcrypt.hash(password, 10)
    const result = await pool.query(
      'INSERT INTO usuarios (username, password_hash, nombre_completo, rol, id_miembro) VALUES ($1,$2,$3,$4,$5) RETURNING id_usuario, username, nombre_completo, rol, activo, fecha_creacion',
      [username, password_hash, nombre_completo, rol, id_miembro || null]
    )
    await registrarBitacora(req, 'INSERT', 'usuarios', result.rows[0].id_usuario, null, result.rows[0])
    res.status(201).json(result.rows[0])
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'El nombre de usuario ya existe' })
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    if (req.user.rol !== 'Admin') {
      return res.status(403).json({ error: 'Solo el administrador puede modificar usuarios' })
    }
    const { id } = req.params
    const { username, password, nombre_completo, rol, activo, id_miembro } = req.body

    const anterior = await pool.query('SELECT * FROM usuarios WHERE id_usuario = $1', [id])
    if (anterior.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' })

    let query, values
    if (password) {
      const password_hash = await bcrypt.hash(password, 10)
      query = 'UPDATE usuarios SET username=$1, password_hash=$2, nombre_completo=$3, rol=$4, activo=$5, id_miembro=$6 WHERE id_usuario=$7 RETURNING id_usuario, username, nombre_completo, rol, activo, fecha_creacion'
      values = [username, password_hash, nombre_completo, rol, activo, id_miembro || null, id]
    } else {
      query = 'UPDATE usuarios SET username=$1, nombre_completo=$2, rol=$3, activo=$4, id_miembro=$5 WHERE id_usuario=$6 RETURNING id_usuario, username, nombre_completo, rol, activo, fecha_creacion'
      values = [username, nombre_completo, rol, activo, id_miembro || null, id]
    }
    const result = await pool.query(query, values)
    await registrarBitacora(req, 'UPDATE', 'usuarios', parseInt(id), anterior.rows[0], result.rows[0])
    res.json(result.rows[0])
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'El nombre de usuario ya existe' })
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    if (req.user.rol !== 'Admin') {
      return res.status(403).json({ error: 'Solo el administrador puede eliminar usuarios' })
    }
    const { id } = req.params
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'No puede eliminarse a sí mismo' })
    }
    const anterior = await pool.query('SELECT * FROM usuarios WHERE id_usuario = $1', [id])
    if (anterior.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' })
    await pool.query('DELETE FROM usuarios WHERE id_usuario = $1', [id])
    await registrarBitacora(req, 'DELETE', 'usuarios', parseInt(id), anterior.rows[0], null)
    res.json({ message: 'Usuario eliminado' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
