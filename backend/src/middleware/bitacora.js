import pool from '../db.js'

export async function registrarBitacora(req, accion, tabla, id_registro = null, datos_anteriores = null, datos_nuevos = null) {
  try {
    const ip = req.ip || req.connection?.remoteAddress || null
    await pool.query(
      `INSERT INTO bitacora (id_usuario, username, nombre_usuario, accion, tabla, id_registro, datos_anteriores, datos_nuevos, direccion_ip)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        req.user?.id || null,
        req.user?.username || null,
        req.user?.nombre || null,
        accion,
        tabla,
        id_registro,
        datos_anteriores ? JSON.stringify(datos_anteriores) : null,
        datos_nuevos ? JSON.stringify(datos_nuevos) : null,
        ip
      ]
    )
  } catch (err) {
    console.error('Error al registrar en bitácora:', err.message)
  }
}
