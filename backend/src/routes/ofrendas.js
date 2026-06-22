import { Router } from 'express'
import pool from '../db.js'
import { authenticate } from '../middleware/roles.js'
import { registrarBitacora } from '../middleware/bitacora.js'

const router = Router()

router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    if (req.user.rol === 'Digitador') {
      return res.status(403).json({ error: 'No tiene permisos para ver ofrendas' })
    }
    const result = await pool.query(
      `SELECT o.*, e.nombre_evento
       FROM ofrendas o
       LEFT JOIN eventos e ON o.id_evento = e.id_evento
       ORDER BY o.fecha DESC`
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    if (req.user.rol === 'Digitador') {
      return res.status(403).json({ error: 'No tiene permisos' })
    }
    const { id } = req.params
    const result = await pool.query('SELECT * FROM ofrendas WHERE id_ofrenda = $1', [id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    if (req.user.rol === 'Digitador') {
      return res.status(403).json({ error: 'No tiene permisos para crear ofrendas' })
    }
    const { monto, id_miembro, id_evento, metodo_pago, referencia, observaciones, distribucion } = req.body

    const ofrenda = await pool.query(
      `INSERT INTO ofrendas (monto, id_miembro, id_evento, metodo_pago, referencia, observaciones)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [monto, id_miembro || null, id_evento || null, metodo_pago, referencia, observaciones]
    )
    const ofrendaId = ofrenda.rows[0].id_ofrenda

    if (distribucion && distribucion.length > 0) {
      for (const d of distribucion) {
        await pool.query(
          'INSERT INTO ofrendas_categorias (id_ofrenda, id_categoria, monto_asignado, porcentaje) VALUES ($1,$2,$3,$4)',
          [ofrendaId, d.id_categoria, d.monto_asignado, d.porcentaje]
        )
      }
    }

    await registrarBitacora(req, 'INSERT', 'ofrendas', ofrendaId, null, ofrenda.rows[0])
    res.status(201).json(ofrenda.rows[0])
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
    const { monto, id_miembro, id_evento, metodo_pago, referencia, observaciones, distribucion } = req.body
    const anterior = await pool.query('SELECT * FROM ofrendas WHERE id_ofrenda = $1', [id])
    const result = await pool.query(
      'UPDATE ofrendas SET monto=$1, id_miembro=$2, id_evento=$3, metodo_pago=$4, referencia=$5, observaciones=$6 WHERE id_ofrenda=$7 RETURNING *',
      [monto, id_miembro || null, id_evento || null, metodo_pago, referencia, observaciones, id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' })

    if (distribucion) {
      await pool.query('DELETE FROM ofrendas_categorias WHERE id_ofrenda = $1', [id])
      for (const d of distribucion) {
        await pool.query(
          'INSERT INTO ofrendas_categorias (id_ofrenda, id_categoria, monto_asignado, porcentaje) VALUES ($1,$2,$3,$4)',
          [id, d.id_categoria, d.monto_asignado, d.porcentaje]
        )
      }
    }

    await registrarBitacora(req, 'UPDATE', 'ofrendas', parseInt(id), anterior.rows[0], result.rows[0])
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    if (req.user.rol !== 'Admin') {
      return res.status(403).json({ error: 'Solo el administrador puede eliminar ofrendas' })
    }
    const anterior = await pool.query('SELECT * FROM ofrendas WHERE id_ofrenda = $1', [req.params.id])
    await pool.query('DELETE FROM ofrendas WHERE id_ofrenda = $1', [req.params.id])
    await registrarBitacora(req, 'DELETE', 'ofrendas', parseInt(req.params.id), anterior.rows[0], null)
    res.json({ message: 'Eliminado correctamente' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id/distribucion', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT oc.*, c.nombre_categoria
       FROM ofrendas_categorias oc
       JOIN categorias_ofrendas c ON oc.id_categoria = c.id_categoria
       WHERE oc.id_ofrenda = $1`,
      [req.params.id]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/categorias', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categorias_ofrendas WHERE activo = true ORDER BY nombre_categoria')
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/categorias', async (req, res) => {
  try {
    if (req.user.rol === 'Digitador') {
      return res.status(403).json({ error: 'No tiene permisos' })
    }
    const { nombre_categoria, descripcion, codigo_contable } = req.body
    const result = await pool.query(
      'INSERT INTO categorias_ofrendas (nombre_categoria, descripcion, codigo_contable) VALUES ($1,$2,$3) RETURNING *',
      [nombre_categoria, descripcion, codigo_contable]
    )
    await registrarBitacora(req, 'INSERT', 'categorias_ofrendas', result.rows[0].id_categoria, null, result.rows[0])
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
