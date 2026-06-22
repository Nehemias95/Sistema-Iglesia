import pkg from 'pg'
const { Pool } = pkg

let pool

export function getPool() {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'iglesia_efeso',
    })

    pool.on('error', (err) => {
      console.error('Error inesperado en el pool de PostgreSQL:', err.message)
    })
  }
  return pool
}

export async function ensureDatabase() {
  const dbName = process.env.DB_NAME || 'iglesia_efeso'

  const tempPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres',
  })

  try {
    const res = await tempPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]
    )
    if (res.rows.length === 0) {
      await tempPool.query(`CREATE DATABASE "${dbName}"`)
      console.log(`Base de datos "${dbName}" creada.`)
    } else {
      console.log(`Base de datos "${dbName}" ya existe.`)
    }
  } finally {
    await tempPool.end()
  }
}

export default getPool()
