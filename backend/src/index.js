import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { ensureDatabase, getPool } from './db.js'

import authRouter from './routes/auth.js'
import miembrosRouter from './routes/miembros.js'
import cargosRouter from './routes/cargos.js'
import privilegiosRouter from './routes/privilegios.js'
import ministeriosRouter from './routes/ministerios.js'
import ofrendasRouter from './routes/ofrendas.js'
import eventosRouter from './routes/eventos.js'
import asistenciaRouter from './routes/asistencia.js'
import usuariosRouter from './routes/usuarios.js'
import bitacoraRouter from './routes/bitacora.js'
import diezmosRouter from './routes/diezmos.js'
import configuracionRouter from './routes/configuracion.js'
import reportesRouter from './routes/reportes.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(morgan('dev'))
app.use(express.json())

app.use('/uploads', express.static(join(__dirname, '..', 'uploads')))

app.get('/api', (req, res) => {
  res.json({ message: 'API Iglesia EFESO v1.0' })
})

app.get('/api/health', async (req, res) => {
  try {
    const pool = getPool()
    await pool.query('SELECT 1')
    res.json({ status: 'ok', database: 'conectada' })
  } catch (err) {
    res.status(503).json({ status: 'error', database: err.message })
  }
})

app.use('/api/auth', authRouter)
app.use('/api/miembros', miembrosRouter)
app.use('/api/cargos', cargosRouter)
app.use('/api/privilegios', privilegiosRouter)
app.use('/api/ministerios', ministeriosRouter)
app.use('/api/ofrendas', ofrendasRouter)
app.use('/api/eventos', eventosRouter)
app.use('/api/asistencia', asistenciaRouter)
app.use('/api/usuarios', usuariosRouter)
app.use('/api/diezmos', diezmosRouter)
app.use('/api/configuracion', configuracionRouter)
app.use('/api/bitacora', bitacoraRouter)
app.use('/api/reportes', reportesRouter)

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Error interno del servidor' })
})

async function start() {
  try {
    await ensureDatabase()
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`)
    })
  } catch (err) {
    console.error('Error al iniciar el servidor:', err.message)
    process.exit(1)
  }
}

start()
