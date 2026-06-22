import { execSync } from 'child_process'
import { createWriteStream, existsSync, mkdirSync, readdirSync, statSync, unlinkSync, createReadStream } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createGzip, createGunzip } from 'zlib'
import { pipeline } from 'stream/promises'
import nodemailer from 'nodemailer'

const __dirname = dirname(fileURLToPath(import.meta.url))
const backupsDir = join(__dirname, '..', 'backups')
if (!existsSync(backupsDir)) mkdirSync(backupsDir, { recursive: true })

const DB = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || '5432',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  name: process.env.DB_NAME || 'iglesia_efeso',
}

export function getBackupsDir() {
  return backupsDir
}

export async function crearRespaldo() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const filename = `iglesia_efeso_${timestamp}.sql`
  const filepath = join(backupsDir, filename)
  const gzpath = filepath + '.gz'

  const env = { ...process.env, PGPASSWORD: DB.password }
  const dumpArgs = [
    'pg_dump',
    '-h', DB.host,
    '-p', DB.port,
    '-U', DB.user,
    '-d', DB.name,
    '--no-owner',
    '--no-acl',
    '-f', filepath,
  ]

  try {
    execSync(dumpArgs.join(' '), { env, stdio: 'inherit' })
  } catch (err) {
    throw new Error(`Error al ejecutar pg_dump: ${err.message}`)
  }

  const readStream = createReadStream(filepath)
  const writeStream = createWriteStream(gzpath)
  const gzip = createGzip()
  await pipeline(readStream, gzip, writeStream)

  try { unlinkSync(filepath) } catch {}

  return { filename: filename + '.gz', filepath: gzpath }
}

export async function enviarRespaldoPorCorreo(filepath, filename, config) {
  const { email_servidor, email_puerto, email_usuario, email_password, email_ssl, backup_email } = config
  if (!email_servidor || !email_usuario || !email_password || !backup_email) {
    throw new Error('Configuración de correo incompleta. Verifique SMTP y correo de respaldo.')
  }

  const transporter = nodemailer.createTransport({
    host: email_servidor,
    port: parseInt(email_puerto || '587'),
    secure: email_ssl === 'true',
    auth: { user: email_usuario, pass: email_password },
  })

  const info = await transporter.sendMail({
    from: `"Iglesia EFESO" <${email_usuario}>`,
    to: backup_email,
    subject: `Respaldo de base de datos - ${new Date().toLocaleDateString('es-SV')}`,
    text: `Respaldo de "${DB.name}" generado el ${new Date().toLocaleString('es-SV')}.`,
    attachments: [{ filename, path: filepath }],
  })

  return info
}

export async function restaurarRespaldo(filepath) {
  if (!existsSync(filepath)) {
    throw new Error(`Archivo de respaldo no encontrado: ${filepath}`)
  }

  const backupSeguridad = await crearRespaldo()

  let sqlFile = filepath
  if (filepath.endsWith('.gz')) {
    sqlFile = filepath.replace('.gz', '')
    const readStream = createReadStream(filepath)
    const writeStream = createWriteStream(sqlFile)
    const gunzip = createGunzip()
    await pipeline(readStream, gunzip, writeStream)
  }

  try {
    const env = { ...process.env, PGPASSWORD: DB.password }
    execSync(`psql -h ${DB.host} -p ${DB.port} -U ${DB.user} -d postgres -c "DROP DATABASE IF EXISTS \\"${DB.name}\\""`, { env, stdio: 'inherit' })
    execSync(`psql -h ${DB.host} -p ${DB.port} -U ${DB.user} -d postgres -c "CREATE DATABASE \\"${DB.name}\\""`, { env, stdio: 'inherit' })
    execSync(`psql -h ${DB.host} -p ${DB.port} -U ${DB.user} -d "${DB.name}" -f "${sqlFile}"`, { env, stdio: 'inherit' })
  } finally {
    if (sqlFile !== filepath) {
      try { unlinkSync(sqlFile) } catch {}
    }
  }

  return backupSeguridad
}

export function listarRespaldos() {
  const files = readdirSync(backupsDir)
    .filter(f => f.endsWith('.sql') || f.endsWith('.sql.gz'))
    .map(f => {
      const st = statSync(join(backupsDir, f))
      return {
        filename: f,
        size: st.size,
        created: st.birthtime || st.mtime,
        fecha: st.mtime,
      }
    })
    .sort((a, b) => b.fecha - a.fecha)
  return files
}

export function eliminarRespaldo(filename) {
  const filepath = join(backupsDir, filename)
  if (!existsSync(filepath)) {
    throw new Error(`Archivo no encontrado: ${filename}`)
  }
  unlinkSync(filepath)
}

import cron from 'node-cron'
import pool from './db.js'

export function iniciarProgramador(app) {
  cron.schedule('0 6 * * *', async () => {
    console.log('[Backup Automático] Iniciando respaldo diario...')
    try {
      const configResult = await pool.query('SELECT clave, valor FROM configuracion')
      const config = {}
      configResult.rows.forEach(row => { config[row.clave] = row.valor })

      if (config.backup_activo !== 'true') {
        console.log('[Backup Automático] Respaldo automático desactivado.')
        return
      }

      const result = await crearRespaldo()
      console.log(`[Backup Automático] Respaldo creado: ${result.filename}`)

      if (config.backup_email) {
        try {
          await enviarRespaldoPorCorreo(result.filepath, result.filename, config)
          console.log(`[Backup Automático] Enviado a ${config.backup_email}`)
        } catch (emailErr) {
          console.error('[Backup Automático] Error al enviar por correo:', emailErr.message)
        }
      }

      // Limpiar respaldos antiguos (mantener últimos 30 días)
      const respaldos = listarRespaldos()
      if (respaldos.length > 30) {
        const aEliminar = respaldos.slice(30)
        for (const r of aEliminar) {
          try { eliminarRespaldo(r.filename) } catch {}
        }
        console.log(`[Backup Automático] Eliminados ${aEliminar.length} respaldos antiguos`)
      }
    } catch (err) {
      console.error('[Backup Automático] Error:', err.message)
    }
  })

  console.log('[Backup Automático] Programado para las 06:00 AM diariamente')
}
