import { useEffect, useState } from 'react';

function ConfidenceBar({ value, label }) {
  const pct = Math.round(value * 100);
  const color = pct > 70 ? 'var(--color-vulnerable)' : pct > 40 ? 'var(--color-partial)' : 'var(--color-fixed)';
  return (
    <div style={{ marginBottom: '0.4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.15rem' }}>
        <span className="mono">{label}</span>
        <span className="mono" style={{ color }}>{pct}%</span>
      </div>
      <div style={{ height: 6, backgroundColor: 'var(--bg-primary)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

function SessionCard({ session, onSelect, selected }) {
  const fp = session.fingerprint;
  const pct = Math.round(fp.confidence * 100);
  const borderColor = pct > 70 ? 'var(--color-vulnerable)' : pct > 40 ? 'var(--color-partial)' : 'var(--color-accent)';

  return (
    <div onClick={() => onSelect(session)} className="card" style={{
      cursor: 'pointer', marginBottom: '0.75rem',
      borderColor: selected ? borderColor : 'var(--border-color)',
      borderWidth: selected ? 2 : 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <div>
          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: borderColor }} className="mono">{fp.tool}</span>
          <span className="text-muted" style={{ fontSize: '0.8rem', marginLeft: '0.5rem' }}>{pct}% confianza</span>
        </div>
        <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{session.requestCount} peticiones</span>
      </div>
      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <span>IP: <span className="mono">{session.sourceIp}</span></span>
        <span>Ataques: <span style={{ color: session.attackSuccessCount > 0 ? 'var(--color-vulnerable)' : 'var(--color-fixed)' }}>
          {session.attackSuccessCount} éxito / {session.attackBlockedCount} bloq.
        </span></span>
      </div>
    </div>
  );
}

function FingerprintPage() {
  const [sessions, setSessions] = useState([]);
  const [signatures, setSignatures] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('sesiones');

  const loadData = async () => {
    try {
      const [sessRes, sigRes] = await Promise.all([
        fetch('/api/monitor/sessions'),
        fetch('/api/monitor/signatures'),
      ]);
      setSessions(await sessRes.json());
      setSignatures(await sigRes.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const id = setInterval(loadData, 5000);
    return () => clearInterval(id);
  }, []);

  if (loading) return <p className="text-muted">Cargando análisis de fingerprinting...</p>;

  return (
    <div>
      <h2 className="section-title">Análisis de Fingerprinting de Clientes</h2>
      <p className="section-subtitle">
        Sistema de clasificación de herramientas atacantes basado en 4 motores de análisis:
        firma de cabeceras HTTP (similitud Jaccard + orden), análisis de timing (coeficiente de variación),
        patrones de comportamiento (escaneo secuencial, reconocimiento) y User-Agent con detección de suplantación.
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {['sesiones', 'firmas conocidas'].map(t => (
          <button key={t} className="state-btn" onClick={() => setTab(t)}
            style={{
              borderColor: tab === t ? 'var(--color-accent)' : undefined,
              color: tab === t ? 'var(--color-accent)' : undefined,
              backgroundColor: tab === t ? 'rgba(52,152,219,0.1)' : undefined,
            }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {tab === 'firmas conocidas' && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Base de datos de firmas HTTP conocidas ({signatures.length} herramientas)</h3>
          <div className="monitor-table-wrapper">
            <table className="monitor-table">
              <thead>
                <tr>
                  <th>Herramienta</th>
                  <th>Orden típico de cabeceras</th>
                  <th>Cabeceras requeridas</th>
                  <th>Cabeceras ausentes</th>
                  <th>Delatorias</th>
                </tr>
              </thead>
              <tbody>
                {signatures.map(sig => (
                  <tr key={sig.name}>
                    <td><strong className="mono">{sig.name}</strong></td>
                    <td className="mono" style={{ fontSize: '0.7rem', maxWidth: '300px' }}>
                      {sig.headerOrder.join(', ')}
                    </td>
                    <td className="mono" style={{ fontSize: '0.75rem', color: 'var(--color-fixed)' }}>
                      {sig.requiredHeaders.join(', ') || '—'}
                    </td>
                    <td className="mono" style={{ fontSize: '0.75rem', color: 'var(--color-vulnerable)' }}>
                      {sig.absentHeaders.join(', ') || '—'}
                    </td>
                    <td className="mono" style={{ fontSize: '0.75rem', color: 'var(--color-partial)' }}>
                      {sig.telltaleHeaders.join(', ') || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'sesiones' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>
              Sesiones detectadas ({sessions.length})
            </h3>
            {sessions.length === 0 ? (
              <p className="text-muted">No hay sesiones. Ejecuta ataques para generar datos.</p>
            ) : (
              sessions.map(s => (
                <SessionCard key={s.sessionKey} session={s}
                  selected={selected?.sessionKey === s.sessionKey}
                  onSelect={setSelected} />
              ))
            )}
          </div>

          <div>
            {selected ? (
              <div>
                <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>
                  Análisis detallado: <span className="mono" style={{ color: 'var(--color-accent)' }}>{selected.fingerprint.tool}</span>
                </h3>

                <div className="card" style={{ marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Clasificación</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                    <div style={{
                      fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
                      color: selected.fingerprint.confidence > 0.7 ? 'var(--color-vulnerable)' : 'var(--color-accent)',
                    }}>
                      {Math.round(selected.fingerprint.confidence * 100)}%
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{selected.fingerprint.tool}</div>
                      <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                        {selected.fingerprint.spoofDetected && '⚠️ Suplantación de User-Agent detectada'}
                      </div>
                    </div>
                  </div>

                  {Object.entries(selected.fingerprint.toolScores || {})
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([tool, score]) => (
                      <ConfidenceBar key={tool} label={tool} value={score} />
                    ))
                  }
                </div>

                <div className="card" style={{ marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Cabeceras HTTP</h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <div className="mb-1">
                      <strong>Orden observado:</strong>
                      <div className="mono" style={{ fontSize: '0.75rem', backgroundColor: 'var(--bg-primary)', padding: '0.5rem', borderRadius: '4px', marginTop: '0.25rem' }}>
                        {selected.fingerprint.headerAnalysis?.orden || '—'}
                      </div>
                    </div>
                    <div>Número de cabeceras: <span className="mono">{selected.fingerprint.headerAnalysis?.numCabeceras}</span></div>
                    <div>Mejor coincidencia: <span className="mono">{selected.fingerprint.headerAnalysis?.mejorCoincidencia}</span> (Jaccard: <span className="mono">{Number(selected.fingerprint.headerAnalysis?.puntuacion || 0).toFixed(2)}</span>)</div>
                  </div>
                </div>

                {selected.fingerprint.timingAnalysis?.patron && (
                  <div className="card" style={{ marginBottom: '0.75rem' }}>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Análisis de timing</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                      <div>Patrón: <strong className={
                        selected.fingerprint.timingAnalysis.patron === 'automatizado' ? 'text-vulnerable' :
                        selected.fingerprint.timingAnalysis.patron === 'manual' ? 'text-fixed' : 'text-partial'
                      }>{selected.fingerprint.timingAnalysis.patron}</strong></div>
                      <div>CV: <span className="mono">{Number(selected.fingerprint.timingAnalysis.coeficienteVariacion || 0).toFixed(2)}</span></div>
                      <div>Media: <span className="mono">{Math.round(selected.fingerprint.timingAnalysis.mediaIntervaloMs || 0)}ms</span></div>
                      <div>Ráfagas: <span className="mono">{selected.fingerprint.timingAnalysis.rafagas || 0}</span></div>
                    </div>
                  </div>
                )}

                {selected.fingerprint.behaviorAnalysis?.clasificacion && (
                  <div className="card" style={{ marginBottom: '0.75rem' }}>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Análisis de comportamiento</h4>
                    <div style={{ fontSize: '0.8rem' }}>
                      <div>Clasificación: <strong>{selected.fingerprint.behaviorAnalysis.clasificacion}</strong></div>
                      <div>Escaneo secuencial: <span className={selected.fingerprint.behaviorAnalysis.escaneoSecuencial ? 'text-vulnerable' : 'text-fixed'}>
                        {selected.fingerprint.behaviorAnalysis.escaneoSecuencial ? 'Sí' : 'No'}
                      </span></div>
                      <div>Endpoints únicos: {selected.fingerprint.behaviorAnalysis.endpointsUnicos}</div>
                      <div>Vulnerabilidades objetivo: {selected.fingerprint.behaviorAnalysis.vulnerabilidadesObjetivo}</div>
                      <div>Estados visitados: {selected.fingerprint.behaviorAnalysis.estadosVisitados}/3</div>
                      <div>Tasa de éxito: <span className="mono">{Math.round((selected.fingerprint.behaviorAnalysis.tasaExitoAtaque || 0) * 100)}%</span></div>
                    </div>
                  </div>
                )}

                <div className="card">
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Razones de la clasificación</h4>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    {(selected.fingerprint.reasons || []).map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="card">
                <p className="text-muted">Selecciona una sesión para ver el análisis detallado.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FingerprintPage;
