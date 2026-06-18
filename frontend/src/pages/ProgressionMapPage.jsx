import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const NODES = [
  {
    id: 'bola', slug: 'BOLA', label: 'BOLA / IDOR',
    subtitle: 'API1:2023 · A01:2025',
    x: 450, y: 70, level: 0, prereqs: [],
    route: '/bola',
    why: 'Punto de entrada. El concepto más simple: cambiar un ID para acceder a datos ajenos.',
  },
  {
    id: 'jwt', slug: 'JWT', label: 'JWT mal implementado',
    subtitle: 'API2:2023 · A07:2025',
    x: 170, y: 230, level: 1, prereqs: ['bola'],
    route: '/jwt',
    why: 'Requiere BOLA: necesitas entender "quién es el usuario" antes de "cómo verificamos al usuario".',
  },
  {
    id: 'cors', slug: 'CORS', label: 'CORS mal configurado',
    subtitle: 'API8:2023 · A02:2025',
    x: 450, y: 230, level: 1, prereqs: ['bola'],
    route: '/cors',
    why: 'Requiere BOLA: el impacto de CORS depende de que existan recursos protegidos accesibles.',
  },
  {
    id: 'mass-assignment', slug: 'MASS_ASSIGNMENT', label: 'Mass Assignment',
    subtitle: 'API3:2023 · A01:2025',
    x: 730, y: 230, level: 1, prereqs: ['bola'],
    route: '/mass-assignment',
    why: 'Requiere BOLA: ambos son fallos de autorización a nivel de objeto, Mass Assignment es la variante por propiedades.',
  },
  {
    id: 'exceptions', slug: 'EXCEPTIONS', label: 'Manejo de Excepciones',
    subtitle: 'API8:2023 · A10:2025',
    x: 300, y: 400, level: 2, prereqs: ['jwt', 'mass-assignment'],
    route: '/exceptions',
    why: 'Requiere JWT + Mass Assignment: el fail-open ocurre cuando fallan los mecanismos de auth y validación que ya conoces.',
  },
  {
    id: 'prompt-injection', slug: 'PROMPT_INJECTION', label: 'Prompt Injection',
    subtitle: 'LLM01 · A06:2025',
    x: 600, y: 400, level: 2, prereqs: ['bola'],
    route: '/prompt-injection',
    why: 'Requiere BOLA: necesitas entender límites de confianza (trust boundaries) antes de abordar inyección en LLMs.',
  },
];

const EDGES = [];
NODES.forEach(node => {
  node.prereqs.forEach(prereqId => {
    EDGES.push({ from: prereqId, to: node.id });
  });
});

const NODE_W = 170;
const NODE_H = 56;

function ProgressionMapPage() {
  const [progress, setProgress] = useState({});
  const [selected, setSelected] = useState(null);
  const [hovering, setHovering] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/monitor/progress')
      .then(r => r.json())
      .then(data => setProgress(data.vulnerabilities || {}))
      .catch(() => {});
  }, []);

  const getNodeStatus = (node) => {
    const p = progress[node.slug];
    if (!p) return 'not_started';
    return p.status;
  };

  const arePrereqsMet = (node) => {
    if (node.prereqs.length === 0) return true;
    return node.prereqs.every(prereqId => {
      const prereqNode = NODES.find(n => n.id === prereqId);
      const status = getNodeStatus(prereqNode);
      return status === 'completed' || status === 'in_progress';
    });
  };

  const getNodeColor = (node) => {
    const status = getNodeStatus(node);
    if (status === 'completed') return { fill: '#1a4d2e', stroke: '#2ecc71', text: '#2ecc71' };
    if (status === 'in_progress') return { fill: '#4d3a1a', stroke: '#f39c12', text: '#f39c12' };
    if (!arePrereqsMet(node)) return { fill: '#2a2a3a', stroke: '#444466', text: '#555577' };
    return { fill: '#1a2d4d', stroke: '#3498db', text: '#3498db' };
  };

  const getProgressLabel = (node) => {
    const p = progress[node.slug];
    if (!p) return '0/3';
    return p.progress;
  };

  const getStatusEmoji = (node) => {
    const status = getNodeStatus(node);
    if (status === 'completed') return '✅';
    if (status === 'in_progress') return '⏳';
    if (!arePrereqsMet(node)) return '🔒';
    return '○';
  };

  const handleClick = (node) => {
    if (arePrereqsMet(node)) {
      setSelected(node);
    }
  };

  return (
    <div>
      <h2 className="section-title">Mapa de Progresión Pedagógica</h2>
      <p className="section-subtitle">
        Grafo de dependencias conceptuales entre vulnerabilidades. Cada nodo se desbloquea
        al interactuar con sus prerrequisitos. El orden no es arbitrario: refleja cómo se
        construyen los conceptos de seguridad unos sobre otros.
      </p>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <Legend color="#2ecc71" label="Completada (3/3 estados)" />
        <Legend color="#f39c12" label="En progreso" />
        <Legend color="#3498db" label="Disponible" />
        <Legend color="#555577" label="Bloqueada" />
      </div>

      <div className="card" style={{ padding: '1rem', overflow: 'auto' }}>
        <svg viewBox="0 0 900 480" style={{ width: '100%', maxWidth: '900px', margin: '0 auto', display: 'block' }}>
          <defs>
            <marker id="arrow" viewBox="0 0 10 7" refX="10" refY="3.5"
              markerWidth="8" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 3.5 L 0 7 z" fill="#555577" />
            </marker>
            <marker id="arrow-active" viewBox="0 0 10 7" refX="10" refY="3.5"
              markerWidth="8" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 3.5 L 0 7 z" fill="#3498db" />
            </marker>
          </defs>

          {EDGES.map((edge, i) => {
            const from = NODES.find(n => n.id === edge.from);
            const to = NODES.find(n => n.id === edge.to);
            const fromStatus = getNodeStatus(from);
            const isActive = fromStatus === 'completed' || fromStatus === 'in_progress';

            return (
              <line key={i}
                x1={from.x} y1={from.y + NODE_H / 2 + 4}
                x2={to.x} y2={to.y - NODE_H / 2 - 4}
                stroke={isActive ? '#3498db55' : '#333355'}
                strokeWidth={2}
                strokeDasharray={isActive ? 'none' : '6 4'}
                markerEnd={isActive ? 'url(#arrow-active)' : 'url(#arrow)'}
              />
            );
          })}

          {NODES.map(node => {
            const colors = getNodeColor(node);
            const isHovering = hovering === node.id;
            const isClickable = arePrereqsMet(node);

            return (
              <g key={node.id}
                onClick={() => handleClick(node)}
                onMouseEnter={() => setHovering(node.id)}
                onMouseLeave={() => setHovering(null)}
                style={{ cursor: isClickable ? 'pointer' : 'not-allowed' }}
              >
                <rect
                  x={node.x - NODE_W / 2} y={node.y - NODE_H / 2}
                  width={NODE_W} height={NODE_H}
                  rx={10} ry={10}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={isHovering && isClickable ? 3 : 1.5}
                  opacity={isClickable ? 1 : 0.5}
                />
                <text x={node.x} y={node.y - 6}
                  textAnchor="middle" fill={colors.text}
                  fontSize="13" fontWeight="700" fontFamily="var(--font-sans)">
                  {getStatusEmoji(node)} {node.label}
                </text>
                <text x={node.x} y={node.y + 14}
                  textAnchor="middle" fill={colors.text}
                  fontSize="10" fontFamily="var(--font-mono)" opacity={0.7}>
                  {node.subtitle} · {getProgressLabel(node)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {selected && (
        <div className="card mt-2" style={{ borderColor: getNodeColor(selected).stroke }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ color: getNodeColor(selected).text, marginBottom: '0.5rem' }}>
                {selected.label}
              </h3>
              <p className="mono text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                {selected.subtitle}
              </p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                <strong>¿Por qué aquí en el grafo?</strong> {selected.why}
              </p>
              {selected.prereqs.length > 0 && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Prerrequisitos: {selected.prereqs.map(p =>
                    NODES.find(n => n.id === p)?.label
                  ).join(', ')}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
              <span className={`state-badge state-badge-${
                getNodeStatus(selected) === 'completed' ? 'fixed' :
                getNodeStatus(selected) === 'in_progress' ? 'partial' : 'vulnerable'
              }`} style={{ fontSize: '0.9rem', padding: '0.3rem 0.8rem' }}>
                {getProgressLabel(selected)} estados
              </span>
              <button className="btn-attack" onClick={() => navigate(selected.route)}>
                Ir a la demo
              </button>
            </div>
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            {['vulnerable', 'partial', 'fixed'].map(state => {
              const p = progress[selected.slug];
              const tried = p?.statesTried?.includes(state);
              return (
                <div key={state} style={{
                  flex: 1, padding: '0.5rem', borderRadius: '6px', textAlign: 'center',
                  backgroundColor: tried ? `var(--color-${state})15` : 'var(--bg-primary)',
                  border: `1px solid ${tried ? `var(--color-${state})` : 'var(--border-color)'}`,
                  color: tried ? `var(--color-${state})` : 'var(--text-muted)',
                  fontSize: '0.85rem', fontWeight: 600,
                }}>
                  {tried ? '✓' : '○'} {state}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card mt-2" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Caminos de aprendizaje</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-accent)', fontWeight: 600, marginBottom: '0.3rem' }}>
              Control de acceso
            </p>
            <p className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              BOLA → Mass Assignment → Exceptions
            </p>
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-accent)', fontWeight: 600, marginBottom: '0.3rem' }}>
              Autenticación
            </p>
            <p className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              BOLA → JWT → Exceptions
            </p>
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-accent)', fontWeight: 600, marginBottom: '0.3rem' }}>
              Configuración
            </p>
            <p className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              BOLA → CORS → Exceptions
            </p>
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-accent)', fontWeight: 600, marginBottom: '0.3rem' }}>
              IA / Moderno
            </p>
            <p className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              BOLA → Prompt Injection
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
      <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: color, opacity: 0.8 }} />
      {label}
    </div>
  );
}

export default ProgressionMapPage;
