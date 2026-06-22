import { Router } from 'express'
import pool from '../db.js'
import { authenticate } from '../middleware/roles.js'

const router = Router()

router.use(authenticate)

function checkRole(req, res, next) {
  if (req.user.rol === 'Digitador' || req.user.rol === 'Tesorero') {
    return res.status(403).json({ error: 'No tiene permisos para generar reportes' })
  }
  next()
}

router.get('/ofrendas-por-fecha', checkRole, async (req, res) => {
  try {
    const { desde, hasta } = req.query
    if (!desde || !hasta) {
      return res.status(400).json({ error: 'Los parámetros desde y hasta son requeridos' })
    }
    const result = await pool.query(
      `SELECT o.*, m.nombres || ' ' || m.apellidos AS miembro_nombre, e.nombre_evento
       FROM ofrendas o
       LEFT JOIN miembros m ON o.id_miembro = m.id_miembro
       LEFT JOIN eventos e ON o.id_evento = e.id_evento
       WHERE o.fecha::date >= $1 AND o.fecha::date <= $2
       ORDER BY o.fecha DESC`,
      [desde, hasta]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/ofrendas-por-miembro', checkRole, async (req, res) => {
  try {
    const { id_miembro, desde, hasta } = req.query
    if (!id_miembro) {
      return res.status(400).json({ error: 'El parámetro id_miembro es requerido' })
    }
    if (!desde || !hasta) {
      return res.status(400).json({ error: 'Los parámetros desde y hasta son requeridos' })
    }
    const result = await pool.query(
      `SELECT o.*, m.nombres || ' ' || m.apellidos AS miembro_nombre, e.nombre_evento
       FROM ofrendas o
       LEFT JOIN miembros m ON o.id_miembro = m.id_miembro
       LEFT JOIN eventos e ON o.id_evento = e.id_evento
       WHERE o.id_miembro = $1 AND o.fecha::date >= $2 AND o.fecha::date <= $3
       ORDER BY o.fecha DESC`,
      [id_miembro, desde, hasta]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/diezmos-por-fecha', checkRole, async (req, res) => {
  try {
    const { desde, hasta } = req.query
    if (!desde || !hasta) {
      return res.status(400).json({ error: 'Los parámetros desde y hasta son requeridos' })
    }
    const result = await pool.query(
      `SELECT d.*, m.nombres || ' ' || m.apellidos AS miembro_nombre
       FROM diezmos d
       LEFT JOIN miembros m ON d.id_miembro = m.id_miembro
       WHERE d.fecha::date >= $1 AND d.fecha::date <= $2
       ORDER BY d.fecha DESC`,
      [desde, hasta]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/diezmos-por-miembro', checkRole, async (req, res) => {
  try {
    const { id_miembro, desde, hasta } = req.query
    if (!id_miembro) {
      return res.status(400).json({ error: 'El parámetro id_miembro es requerido' })
    }
    if (!desde || !hasta) {
      return res.status(400).json({ error: 'Los parámetros desde y hasta son requeridos' })
    }
    const result = await pool.query(
      `SELECT d.*, m.nombres || ' ' || m.apellidos AS miembro_nombre
       FROM diezmos d
       LEFT JOIN miembros m ON d.id_miembro = m.id_miembro
       WHERE d.id_miembro = $1 AND d.fecha::date >= $2 AND d.fecha::date <= $3
       ORDER BY d.fecha DESC`,
      [id_miembro, desde, hasta]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
