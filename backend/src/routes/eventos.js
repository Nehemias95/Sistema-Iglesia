import { Router } from 'express'
import pool from '../db.js'
import { authenticate, blockDelete } from '../middleware/roles.js'
import { registrarBitacora } from '../middleware/bitacora.js'

const router = Router()

router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM eventos ORDER BY fecha_inicio DESC')
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    if (req.user.rol === 'Digitador' || req.user.rol === 'Tesorero') {
      return res.status(403).json({ error: 'No tiene permisos' })
    }
    const { nombre_evento, fecha_inicio, fecha_fin, lugar, id_ministerio, descripcion } = req.body
    const result = await pool.query(
      'INSERT INTO eventos (nombre_evento, fecha_inicio, fecha_fin, lugar, id_ministerio, descripcion) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [nombre_evento, fecha_inicio, fecha_fin, lugar, id_ministerio, descripcion]
    )
    await registrarBitacora(req, 'INSERT', 'eventos', result.rows[0].id_evento, null, result.rows[0])
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    if (req.user.rol === 'Digitador' || req.user.rol === 'Tesorero') {
      return res.status(403).json({ error: 'No tiene permisos' })
    }
    const { id } = req.params
    const { nombre_evento, fecha_inicio, fecha_fin, lugar, id_ministerio, descripcion, estado } = req.body
    const anterior = await pool.query('SELECT * FROM eventos WHERE id_evento = $1', [id])
    const result = await pool.query(
      'UPDATE eventos SET nombre_evento=$1, fecha_inicio=$2, fecha_fin=$3, lugar=$4, id_ministerio=$5, descripcion=$6, estado=$7 WHERE id_evento=$8 RETURNING *',
      [nombre_evento, fecha_inicio, fecha_fin, lugar, id_ministerio, descripcion, estado, id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' })
    await registrarBitacora(req, 'UPDATE', 'eventos', parseInt(id), anterior.rows[0], result.rows[0])
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', blockDelete, async (req, res) => {
  try {
    const anterior = await pool.query('SELECT * FROM eventos WHERE id_evento = $1', [req.params.id])
    await pool.query('DELETE FROM eventos WHERE id_evento = $1', [req.params.id])
    await registrarBitacora(req, 'DELETE', 'eventos', parseInt(req.params.id), anterior.rows[0], null)
    res.json({ message: 'Eliminado correctamente' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
