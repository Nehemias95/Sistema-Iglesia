import 'dotenv/config'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { ensureDatabase } from './db.js'
import pkg from 'pg'
const { Pool } = pkg

const __dirname = dirname(fileURLToPath(import.meta.url))
const sqlPath = join(__dirname, '..', 'db', 'migrate.sql')

async function migrate() {
  try {
    await ensureDatabase()

    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'iglesia_efeso',
    })

    const sql = readFileSync(sqlPath, 'utf-8')
    console.log('Ejecutando migración de base de datos...')
    await pool.query(sql)
    console.log('Migración completada exitosamente.')
    await pool.end()
  } catch (err) {
    console.error('Error en migración:', err.message)
    process.exit(1)
  }
}

migrate()
