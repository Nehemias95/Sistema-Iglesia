import { Router } from 'express'
import multer from 'multer'
import { join, dirname, extname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, mkdirSync } from 'fs'
import pool from '../db.js'
import { authenticate } from '../middleware/roles.js'
import { registrarBitacora } from '../middleware/bitacora.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const logoDir = join(__dirname, '..', 'uploads', 'logo')
if (!existsSync(logoDir)) mkdirSync(logoDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, logoDir),
  filename: (req, file, cb) => {
    const unique = 'logo-' + Date.now() + extname(file.originalname)
    cb(null, unique)
  }
})
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } })

const router = Router()
router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT clave, valor FROM configuracion ORDER BY id_config')
    const config = {}
    result.rows.forEach(row => { config[row.clave] = row.valor })
    res.json(config)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/', async (req, res) => {
  try {
    if (req.user.rol !== 'Admin') {
      return res.status(403).json({ error: 'No tiene permisos' })
    }
    const entries = Object.entries(req.body)
    if (entries.length === 0) {
      return res.status(400).json({ error: 'No hay datos para actualizar' })
    }
    for (const [clave, valor] of entries) {
      await pool.query(
        'UPDATE configuracion SET valor = $1 WHERE clave = $2',
        [String(valor), clave]
      )
    }
    await registrarBitacora(req, 'UPDATE', 'configuracion', null, null, req.body)
    res.json({ message: 'Configuración actualizada' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/upload-logo', upload.single('logo'), async (req, res) => {
  try {
    if (req.user.rol !== 'Admin') {
      return res.status(403).json({ error: 'No tiene permisos' })
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No se seleccionó ningún archivo' })
    }
    const ruta = '/uploads/logo/' + req.file.filename
    await pool.query(
      "UPDATE configuracion SET valor = $1 WHERE clave = 'logo_iglesia'",
      [ruta]
    )
    await registrarBitacora(req, 'UPDATE', 'configuracion', null, null, { logo_iglesia: ruta })
    res.json({ ruta })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
