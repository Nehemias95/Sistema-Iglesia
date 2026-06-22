import { Router } from 'express'
import pool from '../db.js'
import { authenticate, blockDelete } from '../middleware/roles.js'
import { registrarBitacora } from '../middleware/bitacora.js'

const router = Router()

router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cargos ORDER BY id_cargo')
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
    const { nombre_cargo, descripcion, nivel_jerarquia, requiere_eleccion } = req.body
    const result = await pool.query(
      'INSERT INTO cargos (nombre_cargo, descripcion, nivel_jerarquia, requiere_eleccion) VALUES ($1,$2,$3,$4) RETURNING *',
      [nombre_cargo, descripcion, nivel_jerarquia, requiere_eleccion]
    )
    await registrarBitacora(req, 'INSERT', 'cargos', result.rows[0].id_cargo, null, result.rows[0])
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
    const { nombre_cargo, descripcion, nivel_jerarquia, requiere_eleccion, activo } = req.body
    const anterior = await pool.query('SELECT * FROM cargos WHERE id_cargo = $1', [id])
    const result = await pool.query(
      'UPDATE cargos SET nombre_cargo=$1, descripcion=$2, nivel_jerarquia=$3, requiere_eleccion=$4, activo=$5 WHERE id_cargo=$6 RETURNING *',
      [nombre_cargo, descripcion, nivel_jerarquia, requiere_eleccion, activo, id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' })
    await registrarBitacora(req, 'UPDATE', 'cargos', parseInt(id), anterior.rows[0], result.rows[0])
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', blockDelete, async (req, res) => {
  try {
    const anterior = await pool.query('SELECT * FROM cargos WHERE id_cargo = $1', [req.params.id])
    await pool.query('DELETE FROM cargos WHERE id_cargo = $1', [req.params.id])
    await registrarBitacora(req, 'DELETE', 'cargos', parseInt(req.params.id), anterior.rows[0], null)
    res.json({ message: 'Eliminado correctamente' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
