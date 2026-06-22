import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import { miembrosAPI, ministeriosAPI, ofrendasAPI, eventosAPI } from '../api'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ miembros: 0, ministerios: 0, ofrendas: 0, eventos: 0 })

  useEffect(() => {
    const load = async () => {
      try {
        const [m, min, of, ev] = await Promise.all([
          miembrosAPI.getAll(), ministeriosAPI.getAll(),
          user?.rol !== 'Digitador' ? ofrendasAPI.getAll() : { data: [] },
          eventosAPI.getAll()
        ])
        const totalOfrendas = of.data.reduce((s, o) => s + parseFloat(o.monto || 0), 0)
        setStats({
          miembros: m.data.length,
          ministerios: min.data.length,
          ofrendas: totalOfrendas,
          eventos: ev.data.length
        })
      } catch { /* ignore */ }
    }
    load()
  }, [])

  const cards = [
    { label: 'Miembros', value: stats.miembros, icon: 'fa-users', color: 'bg-primary', visible: true },
    { label: 'Ministerios', value: stats.ministerios, icon: 'fa-church', color: 'bg-success', visible: true },
    { label: 'Ofrendas', value: user?.rol === 'Tesorero' ? '—' : `L. ${stats.ofrendas.toFixed(2)}`, icon: 'fa-hand-holding-usd', color: 'bg-warning text-white', visible: user?.rol !== 'Digitador' },
    { label: 'Eventos', value: stats.eventos, icon: 'fa-calendar-alt', color: 'bg-info', visible: user?.rol !== 'Digitador' },
  ]

  return (
    <>
      <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm mb-4">
        <div>
          <h1 className="content-header mb-0 text-dark">
            <i className="fas fa-home me-2 text-primary"></i>Inicio
          </h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item active">Dashboard</li>
            </ol>
          </nav>
        </div>
        <small className="text-muted">
          <i className="fas fa-user me-1"></i>
          {user?.nombre} ({user?.rol})
        </small>
      </div>

      <div className="row g-3 mb-4">
        {cards.filter(c => c.visible).map((card, i) => (
          <div className="col-md-3" key={i}>
            <div className={`card ${card.color} p-3`}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-0">{card.label}</h6>
                  <h2 className="mb-0">{card.value}</h2>
                </div>
                <i className={`fas ${card.icon} fa-2x opacity-50`}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <h5 className="card-title">
            <i className="fas fa-calendar-alt me-2 text-primary"></i>
            Próximos Eventos
          </h5>
          <p className="text-muted mb-0">No hay eventos próximos registrados.</p>
        </div>
      </div>
    </>
  )
}
