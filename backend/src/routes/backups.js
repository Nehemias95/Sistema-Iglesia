import { Router } from 'express'
import { join } from 'path'
import pool from '../db.js'
import { authenticate } from '../middleware/roles.js'
import { registrarBitacora } from '../middleware/bitacora.js'
import { crearRespaldo, enviarRespaldoPorCorreo, restaurarRespaldo, listarRespaldos, eliminarRespaldo, getBackupsDir } from '../backup-scheduler.js'
import multer from 'multer'

const router = Router()
router.use(authenticate)

const upload = multer({ dest: getBackupsDir(), limits: { fileSize: 500 * 1024 * 1024 } })

router.get('/', async (req, res) => {
  try {
    if (req.user.rol !== 'Admin') {
      return res.status(403).json({ error: 'Solo el administrador puede ver respaldos' })
    }
    const respaldos = listarRespaldos()
    res.json(respaldos)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    if (req.user.rol !== 'Admin') {
      return res.status(403).json({ error: 'Solo el administrador puede crear respaldos' })
    }
    const result = await crearRespaldo()
    await registrarBitacora(req, 'INSERT', 'backups', null, null, { filename: result.filename })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/restore', upload.single('backup'), async (req, res) => {
  try {
    if (req.user.rol !== 'Admin') {
      return res.status(403).json({ error: 'Solo el administrador puede restaurar respaldos' })
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Debe seleccionar un archivo de respaldo' })
    }
    const filepath = req.file.path
    const backupSeguridad = await restaurarRespaldo(filepath)
    await registrarBitacora(req, 'RESTORE', 'backups', null, null, {
      restaurado: req.file.originalname,
      respaldo_seguridad: backupSeguridad.filename,
    })
    res.json({ message: 'Base de datos restaurada correctamente', respaldo_seguridad: backupSeguridad })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/restore/:filename', async (req, res) => {
  try {
    if (req.user.rol !== 'Admin') {
      return res.status(403).json({ error: 'Solo el administrador puede restaurar respaldos' })
    }
    const filepath = join(getBackupsDir(), req.params.filename)
    const backupSeguridad = await restaurarRespaldo(filepath)
    await registrarBitacora(req, 'RESTORE', 'backups', null, null, {
      restaurado: req.params.filename,
      respaldo_seguridad: backupSeguridad.filename,
    })
    res.json({ message: 'Base de datos restaurada correctamente', respaldo_seguridad: backupSeguridad })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/send/:filename', async (req, res) => {
  try {
    if (req.user.rol !== 'Admin') {
      return res.status(403).json({ error: 'Solo el administrador puede enviar respaldos' })
    }
    const configResult = await pool.query('SELECT clave, valor FROM configuracion')
    const config = {}
    configResult.rows.forEach(row => { config[row.clave] = row.valor })

    const filepath = join(getBackupsDir(), req.params.filename)
    await enviarRespaldoPorCorreo(filepath, req.params.filename, config)
    await registrarBitacora(req, 'EMAIL', 'backups', null, null, { filename: req.params.filename, destinatario: config.backup_email })
    res.json({ message: 'Respaldo enviado por correo correctamente' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:filename', async (req, res) => {
  try {
    if (req.user.rol !== 'Admin') {
      return res.status(403).json({ error: 'Solo el administrador puede eliminar respaldos' })
    }
    eliminarRespaldo(req.params.filename)
    await registrarBitacora(req, 'DELETE', 'backups', null, null, { filename: req.params.filename })
    res.json({ message: 'Respaldo eliminado' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/download/:filename', async (req, res) => {
  try {
    if (req.user.rol !== 'Admin') {
      return res.status(403).json({ error: 'Solo el administrador puede descargar respaldos' })
    }
    const filepath = join(getBackupsDir(), req.params.filename)
    res.download(filepath, req.params.filename)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Soporte para descarga con token en query string (para window.open)
router.get('/public-download/:filename', async (req, res) => {
  try {
    const token = req.query.token
    if (!token) return res.status(401).json({ error: 'Token requerido' })
    const { verifyToken } = await import('../middleware/auth.js')
    const decoded = verifyToken(token)
    if (decoded.rol !== 'Admin') {
      return res.status(403).json({ error: 'No autorizado' })
    }
    const filepath = join(getBackupsDir(), req.params.filename)
    res.download(filepath, req.params.filename)
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' })
  }
})

export default router
