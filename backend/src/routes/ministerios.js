import { Router } from 'express'
import pool from '../db.js'
import { authenticate, blockDelete } from '../middleware/roles.js'
import { registrarBitacora } from '../middleware/bitacora.js'

const router = Router()

router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, l.nombres || ' ' || l.apellidos as lider_nombre
       FROM ministerios m
       LEFT JOIN miembros l ON m.lider_id = l.id_miembro
       ORDER BY m.nombre_ministerio`
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ministerios WHERE id_ministerio = $1', [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id/miembros', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT mm.*, mi.nombres, mi.apellidos, mi.telefono, mi.foto
       FROM miembros_ministerios mm
       JOIN miembros mi ON mm.id_miembro = mi.id_miembro
       WHERE mm.id_ministerio = $1 AND mm.activo = true
       ORDER BY mm.rol NULLS LAST`,
      [req.params.id]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/:id/miembros', async (req, res) => {
  try {
    if (req.user.rol === 'Digitador') {
      return res.status(403).json({ error: 'No tiene permisos' })
    }
    const { id_miembro, rol } = req.body
    const result = await pool.query(
      'INSERT INTO miembros_ministerios (id_ministerio, id_miembro, rol) VALUES ($1,$2,$3) RETURNING *',
      [req.params.id, id_miembro, rol]
    )
    await registrarBitacora(req, 'INSERT', 'miembros_ministerios', result.rows[0].id_miembro_ministerio, null, result.rows[0])
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id/miembros/:idmm', async (req, res) => {
  try {
    if (req.user.rol === 'Digitador') {
      return res.status(403).json({ error: 'No tiene permisos' })
    }
    const { rol } = req.body
    const anterior = await pool.query('SELECT * FROM miembros_ministerios WHERE id_miembro_ministerio=$1', [req.params.idmm])
    const result = await pool.query(
      'UPDATE miembros_ministerios SET rol=$1 WHERE id_miembro_ministerio=$2 RETURNING *',
      [rol, req.params.idmm]
    )
    await registrarBitacora(req, 'UPDATE', 'miembros_ministerios', parseInt(req.params.idmm), anterior.rows[0], result.rows[0])
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id/miembros/:idmm', async (req, res) => {
  try {
    if (req.user.rol !== 'Admin' && req.user.rol !== 'Pastor') {
      return res.status(403).json({ error: 'No tiene permisos' })
    }
    const anterior = await pool.query('SELECT * FROM miembros_ministerios WHERE id_miembro_ministerio=$1', [req.params.idmm])
    await pool.query('UPDATE miembros_ministerios SET activo=false WHERE id_miembro_ministerio=$1', [req.params.idmm])
    await registrarBitacora(req, 'DELETE', 'miembros_ministerios', parseInt(req.params.idmm), anterior.rows[0], null)
    res.json({ message: 'Miembro eliminado del ministerio' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    if (req.user.rol === 'Digitador') {
      return res.status(403).json({ error: 'No tiene permisos' })
    }
    const { nombre_ministerio, descripcion, lider_id } = req.body
    const result = await pool.query(
      'INSERT INTO ministerios (nombre_ministerio, descripcion, lider_id) VALUES ($1,$2,$3) RETURNING *',
      [nombre_ministerio, descripcion, lider_id || null]
    )
    await registrarBitacora(req, 'INSERT', 'ministerios', result.rows[0].id_ministerio, null, result.rows[0])
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
    const { nombre_ministerio, descripcion, estado, lider_id } = req.body
    const anterior = await pool.query('SELECT * FROM ministerios WHERE id_ministerio = $1', [id])
    const result = await pool.query(
      'UPDATE ministerios SET nombre_ministerio=$1, descripcion=$2, estado=$3, lider_id=$4 WHERE id_ministerio=$5 RETURNING *',
      [nombre_ministerio, descripcion, estado, lider_id || null, id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' })
    await registrarBitacora(req, 'UPDATE', 'ministerios', parseInt(id), anterior.rows[0], result.rows[0])
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', blockDelete, async (req, res) => {
  try {
    const anterior = await pool.query('SELECT * FROM ministerios WHERE id_ministerio = $1', [req.params.id])
    await pool.query('DELETE FROM ministerios WHERE id_ministerio = $1', [req.params.id])
    await registrarBitacora(req, 'DELETE', 'ministerios', parseInt(req.params.id), anterior.rows[0], null)
    res.json({ message: 'Eliminado correctamente' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
