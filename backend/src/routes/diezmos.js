import { Router } from 'express'
import pool from '../db.js'
import { authenticate } from '../middleware/roles.js'
import { registrarBitacora } from '../middleware/bitacora.js'

const router = Router()

router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*, m.nombres || ' ' || m.apellidos AS miembro_nombre
       FROM diezmos d
       LEFT JOIN miembros m ON d.id_miembro = m.id_miembro
       ORDER BY d.fecha DESC`
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query('SELECT * FROM diezmos WHERE id_diezmo = $1', [id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    if (req.user.rol === 'Digitador') {
      return res.status(403).json({ error: 'No tiene permisos para crear diezmos' })
    }
    const { monto, id_miembro, metodo_pago, referencia, observaciones, fecha } = req.body
    const result = await pool.query(
      `INSERT INTO diezmos (monto, id_miembro, metodo_pago, referencia, observaciones, fecha)
       VALUES ($1,$2,$3,$4,$5,COALESCE($6::timestamp, CURRENT_TIMESTAMP)) RETURNING *`,
      [parseFloat(monto), id_miembro || null, metodo_pago, referencia, observaciones, fecha || null]
    )
    await registrarBitacora(req, 'INSERT', 'diezmos', result.rows[0].id_diezmo, null, result.rows[0])
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
    const { monto, id_miembro, metodo_pago, referencia, observaciones, fecha } = req.body
    const anterior = await pool.query('SELECT * FROM diezmos WHERE id_diezmo = $1', [id])
    const result = await pool.query(
      `UPDATE diezmos SET monto=$1, id_miembro=$2, metodo_pago=$3, referencia=$4, observaciones=$5, fecha=COALESCE($6::timestamp, fecha)
       WHERE id_diezmo=$7 RETURNING *`,
      [parseFloat(monto), id_miembro || null, metodo_pago, referencia, observaciones, fecha || null, id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' })
    await registrarBitacora(req, 'UPDATE', 'diezmos', parseInt(id), anterior.rows[0], result.rows[0])
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    if (req.user.rol !== 'Admin') {
      return res.status(403).json({ error: 'Solo el administrador puede eliminar diezmos' })
    }
    const anterior = await pool.query('SELECT * FROM diezmos WHERE id_diezmo = $1', [req.params.id])
    await pool.query('DELETE FROM diezmos WHERE id_diezmo = $1', [req.params.id])
    await registrarBitacora(req, 'DELETE', 'diezmos', parseInt(req.params.id), anterior.rows[0], null)
    res.json({ message: 'Eliminado correctamente' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
