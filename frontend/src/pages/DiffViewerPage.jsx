import { useEffect, useState } from 'react';

const VULN_NAMES = {
  'bola': 'BOLA / IDOR',
  'jwt': 'JWT mal implementado',
  'cors': 'CORS mal configurado',
  'mass-assignment': 'Asignación Masiva / BOPLA',
  'exceptions': 'Manejo Incorrecto de Excepciones',
  'prompt-injection': 'Inyección de Prompt',
};

const STATE_LABELS = {
  'vulnerable': 'Vulnerable',
  'partial': 'Partial',
  'partial-alg-none': 'Partial — alg=none',
  'partial-weak-key': 'Partial — clave débil',
  'partial-no-exp': 'Partial — sin exp',
  'partial-fail-open': 'Partial — fail-open',
  'partial-info-leak': 'Partial — info leak',
  'fixed': 'Fixed',
};

const getStateColor = (state) => {
  if (state === 'vulnerable') return 'var(--color-vulnerable)';
  if (state === 'fixed') return 'var(--color-fixed)';
  return 'var(--color-partial)';
};

const sortStates = (keys) => {
  return [...keys].sort((a, b) => {
    const order = k => k === 'vulnerable' ? 0 : k === 'fixed' ? 100 : 50;
    return order(a) - order(b);
  });
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

  if (loading) return <p className="text-muted">Cargando código...</p>;

  return (
    <div>
      <h2 className="section-title">Visor de Código por Estados</h2>
      <p className="section-subtitle">
        Comparación del código clave entre los tres estados de cada vulnerabilidad.
        Las diferencias muestran exactamente qué cambia entre vulnerable, partial y fixed.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1.5rem', maxWidth: '700px', margin: '0 auto 1.5rem' }}>
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

      {currentDiff && (() => {
        const stateKeys = sortStates(Object.keys(currentDiff.states));
        return (
          <div style={{ overflowX: 'auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${stateKeys.length}, minmax(240px, 1fr))`,
              gap: '0.75rem',
              minWidth: stateKeys.length > 3 ? `${stateKeys.length * 250}px` : 'auto',
            }}>
              {stateKeys.map(state => {
                const color = getStateColor(state);
                return (
                  <div key={state} style={{
                    borderRadius: '8px', overflow: 'hidden',
                    border: `1px solid ${color}33`,
                  }}>
                    <div style={{
                      padding: '0.6rem 1rem',
                      backgroundColor: `${color}15`,
                      borderBottom: `2px solid ${color}`,
                      color,
                      fontWeight: 700, fontSize: '0.9rem',
                      textTransform: state === 'vulnerable' || state === 'fixed' || state === 'partial' ? 'uppercase' : 'none',
                    }}>
                      {STATE_LABELS[state] || state}
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
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default DiffViewerPage;
