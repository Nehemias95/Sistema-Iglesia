import { Router } from 'express'
import pool from '../db.js'
import { authenticate } from '../middleware/roles.js'

const router = Router()
router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    if (req.user.rol !== 'Admin' && req.user.rol !== 'Pastor') {
      return res.status(403).json({ error: 'No tiene permisos para ver la bitácora' })
    }
    const { limit, offset, tabla, usuario } = req.query
    let query = `SELECT b.* FROM bitacora b WHERE 1=1`
    const params = []
    let paramIdx = 1

    if (tabla) {
      query += ` AND b.tabla = $${paramIdx++}`
      params.push(tabla)
    }
    if (usuario) {
      query += ` AND b.id_usuario = $${paramIdx++}`
      params.push(parseInt(usuario))
    }

    query += ' ORDER BY b.fecha DESC'

    const lim = parseInt(limit) || 100
    const off = parseInt(offset) || 0
    query += ` LIMIT $${paramIdx++} OFFSET $${paramIdx++}`
    params.push(lim, off)

    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
