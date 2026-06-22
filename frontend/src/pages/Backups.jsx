import { useState, useEffect, useRef } from 'react'
import { backupsAPI } from '../api'
import Swal from 'sweetalert2'

export default function Backups() {
  const [respaldos, setRespaldos] = useState([])
  const [creando, setCreando] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const fileRef = useRef()

  useEffect(() => { load() }, [])

  const load = async () => {
    try { const r = await backupsAPI.getAll(); setRespaldos(r.data) }
    catch { setRespaldos([]) }
  }

  const crear = async () => {
    setCreando(true)
    try {
      const r = await backupsAPI.create()
      Swal.fire('Respaldo creado', `Archivo: ${r.data.filename}`, 'success')
      load()
    } catch (err) {
      Swal.fire('Error', err.response?.data?.error || err.message, 'error')
    } finally {
      setCreando(false)
    }
  }

  const descargar = (filename) => {
    const token = localStorage.getItem('token')
    window.open(`/api/backups/public-download/${filename}?token=${token}`, '_blank')
  }

  const enviar = async (filename) => {
    const result = await Swal.fire({
      title: '¿Enviar por correo?',
      text: `Se enviará ${filename} al correo configurado`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar',
    })
    if (!result.isConfirmed) return
    try {
      await backupsAPI.send(filename)
      Swal.fire('Enviado', 'Respaldo enviado por correo', 'success')
    } catch (err) {
      Swal.fire('Error', err.response?.data?.error || err.message, 'error')
    }
  }

  const restaurar = async (filename) => {
    const result = await Swal.fire({
      title: '¿Restaurar base de datos?',
      html: `<p>Se restaurarán todos los datos desde <b>${filename}</b>.</p>
             <p class="text-danger fw-bold">Esta acción eliminará los datos actuales y los reemplazará con los del respaldo.</p>
             <p>Se creará un respaldo automático de seguridad antes de restaurar.</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, restaurar',
      confirmButtonColor: '#dc3545',
      cancelButtonText: 'Cancelar',
    })
    if (!result.isConfirmed) return

    setRestoring(true)
    try {
      const r = await backupsAPI.restore(filename)
      Swal.fire({
        title: 'Base de datos restaurada',
        html: `Se creó un respaldo de seguridad: <b>${r.data.respaldo_seguridad.filename}</b>`,
        icon: 'success',
      })
      load()
    } catch (err) {
      Swal.fire('Error', err.response?.data?.error || err.message, 'error')
    } finally {
      setRestoring(false)
    }
  }

  const restaurarArchivo = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const result = await Swal.fire({
      title: '¿Restaurar desde archivo?',
      html: `<p>Se restaurarán todos los datos desde <b>${file.name}</b>.</p>
             <p class="text-danger fw-bold">Esta acción eliminará los datos actuales.</p>
             <p>Se creará un respaldo automático de seguridad antes de restaurar.</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, restaurar',
      confirmButtonColor: '#dc3545',
    })
    if (!result.isConfirmed) { e.target.value = ''; return }

    setRestoring(true)
    try {
      const fd = new FormData()
      fd.append('backup', file)
      const r = await backupsAPI.restoreUpload(fd)
      Swal.fire({
        title: 'Base de datos restaurada',
        html: `Se creó un respaldo de seguridad: <b>${r.data.respaldo_seguridad.filename}</b>`,
        icon: 'success',
      })
      load()
    } catch (err) {
      Swal.fire('Error', err.response?.data?.error || err.message, 'error')
    } finally {
      setRestoring(false)
      e.target.value = ''
    }
  }

  const eliminar = async (filename) => {
    const result = await Swal.fire({
      title: '¿Eliminar respaldo?',
      text: `Se eliminará ${filename}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
    })
    if (!result.isConfirmed) return
    try {
      await backupsAPI.delete(filename)
      Swal.fire('Eliminado', '', 'success')
      load()
    } catch (err) {
      Swal.fire('Error', err.response?.data?.error || err.message, 'error')
    }
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const formatDate = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleString('es-SV')
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm mb-4">
        <div>
          <h1 className="content-header mb-0 text-dark"><i className="fas fa-database me-2 text-primary"></i>Respaldos</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><a href="/">Inicio</a></li>
              <li className="breadcrumb-item active">Respaldos</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-info btn-sm" onClick={() => fileRef.current.click()} disabled={restoring}>
            <i className="fas fa-upload me-1"></i> Restaurar Archivo
          </button>
          <input ref={fileRef} type="file" accept=".sql,.gz,.sql.gz" className="d-none" onChange={restaurarArchivo} />
          <button className="btn btn-primary btn-sm" onClick={crear} disabled={creando}>
            {creando ? (
              <><span className="spinner-border spinner-border-sm me-1"></span> Creando...</>
            ) : (
              <><i className="fas fa-plus me-1"></i> Crear Respaldo</>
            )}
          </button>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Archivo</th>
                  <th>Fecha</th>
                  <th>Tamaño</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {respaldos.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center text-muted py-4">
                      <i className="fas fa-inbox fa-2x d-block mb-2"></i>
                      No hay respaldos. Cree el primero.
                    </td>
                  </tr>
                ) : (
                  respaldos.map((r) => (
                    <tr key={r.filename}>
                      <td><code>{r.filename}</code></td>
                      <td>{formatDate(r.fecha)}</td>
                      <td>{formatSize(r.size)}</td>
                      <td>
                        <button className="btn btn-outline-success btn-sm me-1" onClick={() => descargar(r.filename)} title="Descargar">
                          <i className="fas fa-download"></i>
                        </button>
                        <button className="btn btn-outline-info btn-sm me-1" onClick={() => enviar(r.filename)} title="Enviar por correo">
                          <i className="fas fa-envelope"></i>
                        </button>
                        <button className="btn btn-outline-danger btn-sm me-1" onClick={() => restaurar(r.filename)} title="Restaurar">
                          <i className="fas fa-undo"></i>
                        </button>
                        <button className="btn btn-outline-secondary btn-sm" onClick={() => eliminar(r.filename)} title="Eliminar">
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
