import { useEffect, useState } from 'react';
import { getMonitorEvents } from '../api/client';

function MonitorPage() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('events');

  const loadData = async () => {
    try {
      const filters = {};
      if (filter) filters.vulnerability = filter;
      const evts = await getMonitorEvents(filters);
      setEvents(evts);
      const statsRes = await fetch('/api/monitor/stats');
      setStats(await statsRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const id = setInterval(loadData, 3000);
    return () => clearInterval(id);
  }, [filter]);

  const clearEvents = async () => {
    await fetch('/api/monitor/events', { method: 'DELETE' });
    loadData();
  };

  const formatTime = (ts) => {
    if (!ts) return '-';
    return new Date(ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div>
      <h2 className="section-title">Monitor de Eventos de Seguridad</h2>
      <p className="section-subtitle">
        Capa de observación: registro de peticiones, fingerprinting de clientes y estadísticas de ataques.
        <br />
        <span className="text-muted">Auto-refresh cada 3s · {events.length} evento(s)</span>
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button onClick={() => setTab('events')}
          className={`state-btn ${tab === 'events' ? 'active-vulnerable' : ''}`}
          style={{ borderColor: tab === 'events' ? 'var(--color-accent)' : undefined,
                   color: tab === 'events' ? 'var(--color-accent)' : undefined,
                   backgroundColor: tab === 'events' ? 'rgba(52,152,219,0.1)' : undefined }}>
          Eventos
        </button>
        <button onClick={() => setTab('stats')}
          className={`state-btn ${tab === 'stats' ? 'active-vulnerable' : ''}`}
          style={{ borderColor: tab === 'stats' ? 'var(--color-accent)' : undefined,
                   color: tab === 'stats' ? 'var(--color-accent)' : undefined,
                   backgroundColor: tab === 'stats' ? 'rgba(52,152,219,0.1)' : undefined }}>
          Estadísticas
        </button>
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={clearEvents} style={{
            padding: '0.5rem 1rem', background: 'transparent',
            border: '1px solid var(--color-vulnerable)', color: 'var(--color-vulnerable)',
            borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem',
          }}>Limpiar eventos</button>
        </div>
      </div>

      {tab === 'stats' && stats && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <StatCard label="Total eventos" value={stats.totalEvents} />
            <StatCard label="Ataques exitosos" value={stats.totalAttacks} color="var(--color-vulnerable)" />
            <StatCard label="Tasa de éxito" value={`${stats.successRate}%`}
              color={stats.successRate > 50 ? 'var(--color-vulnerable)' : 'var(--color-fixed)'} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="card">
              <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>Por vulnerabilidad</h3>
              {Object.entries(stats.byVulnerability || {}).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0',
                  borderBottom: '1px solid var(--border-color)' }}>
                  <span>{k}</span>
                  <span className="mono">{v} <span className="text-muted">
                    ({stats.attacksByVulnerability?.[k] || 0} ataques)</span></span>
                </div>
              ))}
            </div>
            <div className="card">
              <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>Por herramienta cliente</h3>
              {Object.entries(stats.byClientTool || {}).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0',
                  borderBottom: '1px solid var(--border-color)' }}>
                  <span className="mono">{k}</span>
                  <span className="mono">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card mt-2">
            <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>Por estado</h3>
            <div style={{ display: 'flex', gap: '2rem' }}>
              {Object.entries(stats.byState || {}).map(([k, v]) => (
                <div key={k} style={{ textAlign: 'center' }}>
                  <div className={`state-badge state-badge-${k}`} style={{ fontSize: '1.5rem', padding: '0.5rem 1.5rem' }}>
                    {v}
                  </div>
                  <div className="text-muted mt-1" style={{ fontSize: '0.85rem' }}>{k}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'events' && (
        <>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="form-group" style={{ maxWidth: '300px' }}>
              <label>Filtrar por vulnerabilidad</label>
              <select value={filter} onChange={e => setFilter(e.target.value)}>
                <option value="">Todas</option>
                <option value="BOLA">BOLA</option>
                <option value="JWT">JWT</option>
                <option value="CORS">CORS</option>
                <option value="MASS_ASSIGNMENT">Asignación Masiva</option>
                <option value="EXCEPTIONS">Excepciones</option>
                <option value="PROMPT_INJECTION">Inyección de Prompt</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p className="text-muted">Cargando...</p>
          ) : events.length === 0 ? (
            <div className="card"><p className="text-muted">No hay eventos. Ejecuta algún ataque para verlos aquí.</p></div>
          ) : (
            <div className="monitor-table-wrapper">
              <table className="monitor-table">
                <thead>
                  <tr>
                    <th>Hora</th><th>Vuln</th><th>Estado</th><th>Método</th>
                    <th>Endpoint</th><th>Cliente</th><th>Resultado</th><th>Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(e => (
                    <tr key={e.id}>
                      <td className="mono">{formatTime(e.timestamp)}</td>
                      <td><strong>{e.vulnerability}</strong></td>
                      <td><span className={`state-badge state-badge-${e.state}`}>{e.state}</span></td>
                      <td className="mono">{e.method}</td>
                      <td className="mono" style={{ fontSize: '0.8rem' }}>{e.endpoint}</td>
                      <td className="mono" style={{ fontSize: '0.8rem' }}>{e.clientFingerprint?.split('|')[0] || '-'}</td>
                      <td>
                        <span className={`attack-indicator ${e.attackSuccess ? 'attack-success' : 'attack-failed'}`}>
                          {e.attackSuccess ? 'ÉXITO' : 'BLOQ.'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', maxWidth: '300px' }}>{e.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: color || 'var(--text-primary)' }}>
        {value}
      </div>
      <div className="text-muted" style={{ fontSize: '0.85rem' }}>{label}</div>
    </div>
  );
}

export default MonitorPage;
