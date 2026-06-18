import { useEffect, useState } from 'react';

const VULN_NAMES = {
  'bola': 'BOLA / IDOR',
  'jwt': 'JWT mal implementado',
  'cors': 'CORS mal configurado',
  'mass-assignment': 'Asignación Masiva / BOPLA',
  'exceptions': 'Manejo Incorrecto de Excepciones',
  'prompt-injection': 'Inyección de Prompt',
};

function DiffViewerPage() {
  const [diffs, setDiffs] = useState([]);
  const [selected, setSelected] = useState('bola');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/diffs')
      .then(r => r.json())
      .then(data => { setDiffs(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const currentDiff = diffs.find(d => d.slug === selected);

  const stateColors = {
    vulnerable: 'var(--color-vulnerable)',
    partial: 'var(--color-partial)',
    fixed: 'var(--color-fixed)',
  };

  if (loading) return <p className="text-muted">Cargando código...</p>;

  return (
    <div>
      <h2 className="section-title">Visor de Código por Estados</h2>
      <p className="section-subtitle">
        Comparación del código clave entre los tres estados de cada vulnerabilidad.
        Las diferencias muestran exactamente qué cambia entre vulnerable, partial y fixed.
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {diffs.map(d => (
          <button key={d.slug}
            onClick={() => setSelected(d.slug)}
            style={{
              padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer',
              border: selected === d.slug ? '2px solid var(--color-accent)' : '2px solid var(--border-color)',
              background: selected === d.slug ? 'rgba(52,152,219,0.15)' : 'transparent',
              color: selected === d.slug ? 'var(--color-accent)' : 'var(--text-secondary)',
              fontSize: '0.85rem', fontWeight: 600,
            }}>
            {VULN_NAMES[d.slug] || d.slug}
          </button>
        ))}
      </div>

      {currentDiff && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
          {['vulnerable', 'partial', 'fixed'].map(state => (
            <div key={state} style={{
              borderRadius: '8px', overflow: 'hidden',
              border: `1px solid ${stateColors[state]}33`,
            }}>
              <div style={{
                padding: '0.6rem 1rem',
                backgroundColor: `${stateColors[state]}15`,
                borderBottom: `2px solid ${stateColors[state]}`,
                color: stateColors[state],
                fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase',
              }}>
                {state}
              </div>
              <pre style={{
                padding: '1rem', margin: 0,
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                minHeight: '200px',
                maxHeight: '500px',
                overflowY: 'auto',
              }}>
                {currentDiff.states[state]}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DiffViewerPage;
