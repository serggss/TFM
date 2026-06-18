import { useEffect, useState } from 'react';

const LEVEL_CONFIG = {
  0: { label: 'Sin actividad', color: 'var(--text-muted)', bg: 'var(--bg-primary)' },
  1: { label: 'Básico', color: 'var(--color-fixed)', bg: 'rgba(46,204,113,0.1)' },
  2: { label: 'Intermedio', color: 'var(--color-partial)', bg: 'rgba(243,156,18,0.1)' },
  3: { label: 'Intermedio-alto', color: 'var(--color-vulnerable)', bg: 'rgba(231,76,60,0.1)' },
  4: { label: 'Avanzado', color: '#e74c3c', bg: 'rgba(231,76,60,0.2)' },
};

function LevelGauge({ level, score }) {
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG[0];
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: 120, height: 120, borderRadius: '50%', margin: '0 auto 0.75rem',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        border: `4px solid ${cfg.color}`, backgroundColor: cfg.bg,
      }}>
        <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: cfg.color }}>
          {level}
        </div>
        <div style={{ fontSize: '0.75rem', color: cfg.color, fontWeight: 600 }}>{Math.round(score * 100)}%</div>
      </div>
      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: cfg.color }}>{cfg.label}</div>
    </div>
  );
}

function ProgressionMatrix({ progressions }) {
  const vulns = Object.keys(progressions);
  if (vulns.length === 0) return null;

  const states = ['vulnerable', 'partial (acceso)', 'partial (bypass)', 'fixed'];
  const stateColors = {
    'vulnerable': 'var(--color-vulnerable)',
    'partial (acceso)': 'var(--color-partial)',
    'partial (bypass)': '#e74c3c',
    'fixed': 'var(--color-fixed)',
  };

  return (
    <div className="monitor-table-wrapper">
      <table className="monitor-table">
        <thead>
          <tr>
            <th>Vulnerabilidad</th>
            {states.map(s => <th key={s} style={{ textAlign: 'center' }}>{s}</th>)}
            <th>Nivel máximo</th>
          </tr>
        </thead>
        <tbody>
          {vulns.map(vuln => {
            const p = progressions[vuln];
            return (
              <tr key={vuln}>
                <td><strong>{vuln}</strong></td>
                <td style={{ textAlign: 'center' }}>
                  {p.triedVulnerable
                    ? <span style={{ color: stateColors['vulnerable'], fontWeight: 700 }}>&#x2714;</span>
                    : <span className="text-muted">—</span>}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {p.triedPartial
                    ? <span style={{ color: stateColors['partial (acceso)'], fontWeight: 700 }}>&#x2714;</span>
                    : <span className="text-muted">—</span>}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {p.exploitedPartialBypass
                    ? <span style={{ color: stateColors['partial (bypass)'], fontWeight: 700, fontSize: '1.1rem' }}>&#x2714; BYPASS</span>
                    : <span className="text-muted">—</span>}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {p.triedFixed
                    ? <span style={{ color: stateColors['fixed'], fontWeight: 700 }}>&#x2714;</span>
                    : <span className="text-muted">—</span>}
                </td>
                <td className="mono" style={{ fontWeight: 600 }}>{p.maxStateReached}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EurekaTimeline({ eurekas }) {
  if (!eurekas || eurekas.length === 0) {
    return <p className="text-muted" style={{ fontSize: '0.9rem' }}>No se han detectado momentos eureka todavía. Prueba a atacar el estado partial: primero con acceso directo (será bloqueado), luego descubre el bypass.</p>;
  }

  return (
    <div>
      {eurekas.map((e, i) => (
        <div key={i} style={{
          padding: '1rem', marginBottom: '0.75rem', borderRadius: '8px',
          border: '2px solid var(--color-partial)',
          backgroundColor: 'rgba(243,156,18,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>&#x1f4a1;</span>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--color-partial)' }}>
                Eureka en {e.vulnerability}
              </div>
              <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                {new Date(e.timestampMs).toLocaleTimeString('es-ES')}
              </div>
            </div>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            {e.description}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', fontSize: '0.8rem' }}>
            <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', textAlign: 'center' }}>
              <div className="text-muted">Intentos bloqueados</div>
              <div className="mono" style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-vulnerable)' }}>
                {e.blockedAttemptsBefore}
              </div>
            </div>
            <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', textAlign: 'center' }}>
              <div className="text-muted">Tiempo hasta bypass</div>
              <div className="mono" style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-partial)' }}>
                {e.timeToDiscoverMs < 1000 ? `${e.timeToDiscoverMs}ms` : `${(e.timeToDiscoverMs / 1000).toFixed(1)}s`}
              </div>
            </div>
            <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', textAlign: 'center' }}>
              <div className="text-muted">Cambio de vector</div>
              <div className="mono" style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-accent)' }}>
                {e.fromEndpoint?.split('/').slice(-2).join('/') || '?'}
                <span style={{ margin: '0 0.25rem' }}>&rarr;</span>
                {e.toEndpoint?.split('/').slice(-2).join('/') || '?'}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SophisticationPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const res = await fetch('/api/monitor/sophistication');
      setData(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const id = setInterval(loadData, 4000);
    return () => clearInterval(id);
  }, []);

  if (loading) return <p className="text-muted">Analizando sofisticación...</p>;

  return (
    <div>
      <h2 className="section-title">Índice de Sofisticación del Atacante (ISA)</h2>
      <p className="section-subtitle">
        Clasificación del nivel del atacante basada en qué estados explota y cómo descubre los bypass.
        Este análisis es exclusivo de esta plataforma: solo es posible porque el modelo de 3 estados
        permite medir la progresión del atacante entre mitigaciones.
      </p>

      {!data || data.score === 0 ? (
        <div className="card">
          <p className="text-muted">
            No hay datos suficientes. Ejecuta ataques contra las vulnerabilidades en sus diferentes estados
            para generar el análisis de sofisticación.
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LevelGauge level={data.level} score={data.score} />
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Evidencia de la clasificación</h3>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                {data.evidence?.map((e, i) => (
                  <li key={i} style={{ fontWeight: i === 0 ? 700 : 400 }}>{e}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
              Matriz de progresión por vulnerabilidad
            </h3>
            <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.75rem' }}>
              Muestra qué estados ha intentado el atacante en cada vulnerabilidad y si ha descubierto el bypass del estado partial.
            </p>
            <ProgressionMatrix progressions={data.progressionByVuln || {}} />
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
              Momentos Eureka — Detección de descubrimiento de bypass
            </h3>
            <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.75rem' }}>
              Un "momento eureka" es el instante exacto en que el atacante pasa de recibir 403 (bloqueado)
              a descubrir un vector alternativo que funciona. Se detecta por el cambio de endpoint tras intentos fallidos.
            </p>
            <EurekaTimeline eurekas={data.eurekas || []} />
          </div>
        </>
      )}
    </div>
  );
}

export default SophisticationPage;
