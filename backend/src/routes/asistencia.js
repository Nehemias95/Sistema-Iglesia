import { Router } from 'express'
import pool from '../db.js'
import { authenticate, blockDelete } from '../middleware/roles.js'
import { registrarBitacora } from '../middleware/bitacora.js'

const router = Router()

router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, m.nombres || ' ' || m.apellidos as miembro_nombre, e.nombre_evento
       FROM asistencia a
       JOIN miembros m ON a.id_miembro = m.id_miembro
       JOIN eventos e ON a.id_evento = e.id_evento
       ORDER BY a.fecha_registro DESC`
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    if (req.user.rol === 'Digitador') {
      return res.status(403).json({ error: 'No tiene permisos' })
    }
    const { id_miembro, id_evento, estado_asistencia, hora_llegada, observaciones } = req.body
    const result = await pool.query(
      'INSERT INTO asistencia (id_miembro, id_evento, estado_asistencia, hora_llegada, observaciones) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [id_miembro, id_evento, estado_asistencia, hora_llegada, observaciones]
    )
    await registrarBitacora(req, 'INSERT', 'asistencia', result.rows[0].id_asistencia, null, result.rows[0])
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    if (req.user.rol === 'Digitador') {
      return res.status(403).json({ error: 'No tiene permisos' })
    }
    const { id } = req.params
    const { estado_asistencia, hora_llegada, observaciones } = req.body
    const anterior = await pool.query('SELECT * FROM asistencia WHERE id_asistencia = $1', [id])
    const result = await pool.query(
      'UPDATE asistencia SET estado_asistencia=$1, hora_llegada=$2, observaciones=$3 WHERE id_asistencia=$4 RETURNING *',
      [estado_asistencia, hora_llegada, observaciones, id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' })
    await registrarBitacora(req, 'UPDATE', 'asistencia', parseInt(id), anterior.rows[0], result.rows[0])
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', blockDelete, async (req, res) => {
  try {
    const anterior = await pool.query('SELECT * FROM asistencia WHERE id_asistencia = $1', [req.params.id])
    await pool.query('DELETE FROM asistencia WHERE id_asistencia = $1', [req.params.id])
    await registrarBitacora(req, 'DELETE', 'asistencia', parseInt(req.params.id), anterior.rows[0], null)
    res.json({ message: 'Eliminado correctamente' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
