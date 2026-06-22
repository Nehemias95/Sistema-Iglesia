import { Router } from 'express'
import multer from 'multer'
import { join, dirname, extname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, mkdirSync } from 'fs'
import pool from '../db.js'
import { authenticate, blockDelete } from '../middleware/roles.js'
import { registrarBitacora } from '../middleware/bitacora.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const uploadsDir = join(__dirname, '..', 'uploads', 'miembros')
if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, unique + extname(file.originalname))
  }
})
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } })
const uploadFields = upload.fields([{ name: 'foto', maxCount: 1 }, { name: 'foto_dui', maxCount: 1 }])

function filePath(file) {
  return file ? '/uploads/miembros/' + file.filename : null
}

const router = Router()

router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const esTesorero = req.user.rol === 'Tesorero'
    const campos = esTesorero
      ? 'id_miembro, nombres, apellidos, genero, fecha_registro, estado, activo'
      : '*'
    const result = await pool.query(`SELECT ${campos} FROM miembros ORDER BY id_miembro DESC`)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const esTesorero = req.user.rol === 'Tesorero'
    const campos = esTesorero
      ? 'id_miembro, nombres, apellidos, genero, fecha_registro, estado'
      : '*'
    const result = await pool.query(`SELECT ${campos} FROM miembros WHERE id_miembro = $1`, [id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', uploadFields, async (req, res) => {
  try {
    const { numero_identidad, nombres, apellidos, fecha_nacimiento, genero, direccion, telefono, telefono_contacto, email, actividad_economica, fecha_bautismo, observaciones } = req.body
    const files = req.files
    const foto = filePath(files?.foto?.[0])
    const foto_dui = filePath(files?.foto_dui?.[0])
    const result = await pool.query(
      `INSERT INTO miembros (numero_identidad, nombres, apellidos, fecha_nacimiento, genero, direccion, telefono, telefono_contacto, email, actividad_economica, fecha_bautismo, observaciones, foto, foto_dui)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [numero_identidad, nombres, apellidos, fecha_nacimiento, genero, direccion, telefono, telefono_contacto, email, actividad_economica, fecha_bautismo, observaciones, foto, foto_dui]
    )
    await registrarBitacora(req, 'INSERT', 'miembros', result.rows[0].id_miembro, null, result.rows[0])
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', uploadFields, async (req, res) => {
  try {
    const { id } = req.params
    const { numero_identidad, nombres, apellidos, fecha_nacimiento, genero, direccion, telefono, telefono_contacto, email, actividad_economica, estado, fecha_bautismo, observaciones } = req.body
    const files = req.files
    const foto = filePath(files?.foto?.[0])
    const foto_dui = filePath(files?.foto_dui?.[0])

    const anterior = await pool.query('SELECT * FROM miembros WHERE id_miembro = $1', [id])
    if (anterior.rows.length === 0) return res.status(404).json({ error: 'No encontrado' })

    let query, values
    if (foto && foto_dui) {
      query = `UPDATE miembros SET numero_identidad=$1, nombres=$2, apellidos=$3, fecha_nacimiento=$4, genero=$5, direccion=$6, telefono=$7, telefono_contacto=$8, email=$9, actividad_economica=$10, estado=$11, fecha_bautismo=$12, observaciones=$13, foto=$14, foto_dui=$15 WHERE id_miembro=$16 RETURNING *`
      values = [numero_identidad, nombres, apellidos, fecha_nacimiento, genero, direccion, telefono, telefono_contacto, email, actividad_economica, estado, fecha_bautismo, observaciones, foto, foto_dui, id]
    } else if (foto) {
      query = `UPDATE miembros SET numero_identidad=$1, nombres=$2, apellidos=$3, fecha_nacimiento=$4, genero=$5, direccion=$6, telefono=$7, telefono_contacto=$8, email=$9, actividad_economica=$10, estado=$11, fecha_bautismo=$12, observaciones=$13, foto=$14 WHERE id_miembro=$15 RETURNING *`
      values = [numero_identidad, nombres, apellidos, fecha_nacimiento, genero, direccion, telefono, telefono_contacto, email, actividad_economica, estado, fecha_bautismo, observaciones, foto, id]
    } else if (foto_dui) {
      query = `UPDATE miembros SET numero_identidad=$1, nombres=$2, apellidos=$3, fecha_nacimiento=$4, genero=$5, direccion=$6, telefono=$7, telefono_contacto=$8, email=$9, actividad_economica=$10, estado=$11, fecha_bautismo=$12, observaciones=$13, foto_dui=$14 WHERE id_miembro=$15 RETURNING *`
      values = [numero_identidad, nombres, apellidos, fecha_nacimiento, genero, direccion, telefono, telefono_contacto, email, actividad_economica, estado, fecha_bautismo, observaciones, foto_dui, id]
    } else {
      query = `UPDATE miembros SET numero_identidad=$1, nombres=$2, apellidos=$3, fecha_nacimiento=$4, genero=$5, direccion=$6, telefono=$7, telefono_contacto=$8, email=$9, actividad_economica=$10, estado=$11, fecha_bautismo=$12, observaciones=$13 WHERE id_miembro=$14 RETURNING *`
      values = [numero_identidad, nombres, apellidos, fecha_nacimiento, genero, direccion, telefono, telefono_contacto, email, actividad_economica, estado, fecha_bautismo, observaciones, id]
    }
    const result = await pool.query(query, values)
    await registrarBitacora(req, 'UPDATE', 'miembros', parseInt(id), anterior.rows[0], result.rows[0])
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', blockDelete, async (req, res) => {
  try {
    const { id } = req.params
    const anterior = await pool.query('SELECT * FROM miembros WHERE id_miembro = $1', [id])
    await pool.query('DELETE FROM miembros WHERE id_miembro = $1', [id])
    await registrarBitacora(req, 'DELETE', 'miembros', parseInt(id), anterior.rows[0], null)
    res.json({ message: 'Eliminado correctamente' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
