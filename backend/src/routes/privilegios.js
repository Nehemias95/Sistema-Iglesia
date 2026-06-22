import { Router } from 'express'
import pool from '../db.js'
import { authenticate, blockDelete } from '../middleware/roles.js'
import { registrarBitacora } from '../middleware/bitacora.js'

const router = Router()

router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM privilegios ORDER BY id_privilegio')
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    if (req.user.rol !== 'Admin' && req.user.rol !== 'Pastor') {
      return res.status(403).json({ error: 'No tiene permisos' })
    }
    const { nombre_privilegio, descripcion, nivel_acceso } = req.body
    const result = await pool.query(
      'INSERT INTO privilegios (nombre_privilegio, descripcion, nivel_acceso) VALUES ($1,$2,$3) RETURNING *',
      [nombre_privilegio, descripcion, nivel_acceso]
    )
    await registrarBitacora(req, 'INSERT', 'privilegios', result.rows[0].id_privilegio, null, result.rows[0])
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    if (req.user.rol !== 'Admin' && req.user.rol !== 'Pastor') {
      return res.status(403).json({ error: 'No tiene permisos' })
    }
    const { id } = req.params
    const { nombre_privilegio, descripcion, nivel_acceso } = req.body
    const anterior = await pool.query('SELECT * FROM privilegios WHERE id_privilegio = $1', [id])
    const result = await pool.query(
      'UPDATE privilegios SET nombre_privilegio=$1, descripcion=$2, nivel_acceso=$3 WHERE id_privilegio=$4 RETURNING *',
      [nombre_privilegio, descripcion, nivel_acceso, id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' })
    await registrarBitacora(req, 'UPDATE', 'privilegios', parseInt(id), anterior.rows[0], result.rows[0])
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', blockDelete, async (req, res) => {
  try {
    const anterior = await pool.query('SELECT * FROM privilegios WHERE id_privilegio = $1', [req.params.id])
    await pool.query('DELETE FROM privilegios WHERE id_privilegio = $1', [req.params.id])
    await registrarBitacora(req, 'DELETE', 'privilegios', parseInt(req.params.id), anterior.rows[0], null)
    res.json({ message: 'Eliminado correctamente' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
