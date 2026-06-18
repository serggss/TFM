import { useState } from 'react';
import CurlCommand from '../components/CurlCommand';

function BehindTheScenes({ state }) {
  const code = {
    vulnerable: `// Refleja el Origin del cliente sin validar
String origin = request.getHeader("Origin");
response.setHeader("Access-Control-Allow-Origin", origin);
response.setHeader("Access-Control-Allow-Credentials", "true");
// → evil.com puede leer la respuesta con las cookies de la víctima`,
    partial: `// Valida con contains() — INCORRECTO
if (origin.contains("localhost")) {
    response.setHeader("Access-Control-Allow-Origin", origin);
}
// → "https://localhost.evil.com" pasa el check
// → "https://evil-localhost.com" también pasa`,
    fixed: `// Whitelist EXACTA con Set.contains()
Set<String> allowed = Set.of("http://localhost:5173");
if (allowed.contains(origin)) {  // igualdad exacta
    response.setHeader("Access-Control-Allow-Origin", origin);
}
// → Solo orígenes exactos de la whitelist`,
  };
  return (
    <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', padding: '0.75rem', border: '1px solid var(--border-color)', marginTop: '0.75rem' }}>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>Qué hace el servidor en estado {state}:</div>
      <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{code[state]}</pre>
    </div>
  );
}

function CorsPage() {
  const [state, setState] = useState('vulnerable');
  const [origin, setOrigin] = useState('https://evil.com');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const explanations = {
    vulnerable: {
      title: 'Refleja cualquier Origin',
      description: 'El servidor copia el Origin del atacante en Access-Control-Allow-Origin. Cualquier web puede leer la respuesta.',
      color: 'text-vulnerable',
      attackHint: 'Envía una petición con Origin: evil.com. El servidor lo refleja → un sitio malicioso podría robar los datos.',
    },
    partial: {
      title: 'Validación con contains("localhost")',
      description: 'Comprueba que el Origin contenga "localhost", pero con contains() en vez de igualdad exacta.',
      color: 'text-partial',
      attackHint: 'Usa "https://localhost.evil.com" — contiene "localhost" y pasa la validación. El atacante registra ese dominio.',
    },
    fixed: {
      title: 'Whitelist exacta',
      description: 'Solo acepta orígenes exactos de una lista cerrada. No hay forma de eludirlo.',
      color: 'text-fixed',
      attackHint: 'Ningún Origin malicioso será aceptado. Solo localhost:5173 y localhost:3000.',
    },
  };

  const originOptions = [
    { value: 'https://evil.com', label: 'https://evil.com', desc: 'Sitio malicioso' },
    { value: 'https://localhost.evil.com', label: 'https://localhost.evil.com', desc: 'Bypass contains()' },
    { value: 'https://evil-localhost.com', label: 'https://evil-localhost.com', desc: 'Otro bypass' },
    { value: 'http://localhost:5173', label: 'http://localhost:5173', desc: 'Origen legítimo' },
  ];

  const sendRequest = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cors/${state}/data`, { headers: { 'Origin': origin } });
      const data = await res.json();
      setResponse({ status: res.status, ok: res.ok, data });
    } catch (e) {
      setResponse({ status: 0, ok: false, data: { error: e.message } });
    }
    setLoading(false);
  };

  const getVerdictClass = (verdict) => {
    if (verdict === 'ATTACK_SUCCESS') return 'verdict verdict-success';
    if (verdict === 'ATTACK_BLOCKED') return 'verdict verdict-blocked';
    return 'verdict verdict-legitimate';
  };

  return (
    <div>
      <h2 className="section-title">#3 — CORS mal configurado</h2>
      <p className="section-subtitle">
        <span className="mono">API8:2023</span> · <span className="mono">A01/A02:2025 Security Misconfiguration</span>
        <br />
        Acceso cross-origin no autorizado a datos sensibles de la API.
      </p>

      <div className="state-selector">
        {['vulnerable', 'partial', 'fixed'].map(s => (
          <button key={s} className={`state-btn ${state === s ? `active-${s}` : ''}`}
            onClick={() => { setState(s); setResponse(null); }}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="explanation-panel">
        <h3 className={explanations[state].color}>{explanations[state].title}</h3>
        <p>{explanations[state].description}</p>
        <p style={{ marginTop: '0.5rem', fontStyle: 'italic', color: 'var(--color-accent)', fontSize: '0.85rem' }}>
          {explanations[state].attackHint}
        </p>
        <BehindTheScenes state={state} />
      </div>

      <div className="card">
        <h3 className="mb-2">Simular petición cross-origin</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Cuando un navegador hace una petición a otro dominio, envía la cabecera <code>Origin</code>.
          El servidor decide si permite el acceso según el valor de <code>Access-Control-Allow-Origin</code> en la respuesta.
        </p>
        <div className="attack-panel">
          <div className="attack-config">
            <div className="form-group">
              <label>Origin del atacante</label>
              {originOptions.map(o => (
                <label key={o.value} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.2rem 0' }}>
                  <input type="radio" checked={origin === o.value} onChange={() => setOrigin(o.value)} />
                  <code style={{ fontSize: '0.8rem' }}>{o.label}</code>
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>({o.desc})</span>
                </label>
              ))}
            </div>
            <button className="btn-attack" onClick={sendRequest} disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar petición'}
            </button>
          </div>
          <div className="form-group">
            <label>Petición HTTP</label>
            <div className="response-viewer">
              <div className="response-body" style={{ minHeight: '100px', fontSize: '0.8rem' }}>
                {`GET /api/cors/${state}/data\nOrigin: ${origin}\n\nEl navegador enviará esta cabecera\nautomáticamente desde ${origin}`}
              </div>
            </div>
          </div>
        </div>
        <CurlCommand command={`curl -v -H "Origin: ${origin}" \\\n  http://localhost:8080/api/cors/${state}/data`} />
      </div>

      {response && (
        <div className="card mt-2">
          <h3 className="mb-1">Respuesta del servidor</h3>

          {response.data?.corsHeaders && (
            <div style={{ marginBottom: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.3rem' }}>Cabeceras CORS de la respuesta:</div>
              <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                {Object.entries(response.data.corsHeaders).map(([k, v]) => `${k}: ${v}`).join('\n')}
              </pre>
            </div>
          )}

          <div className="response-viewer">
            <div className="response-header">
              <span className="response-status" style={{
                color: response.ok ? 'var(--color-fixed)' : 'var(--color-vulnerable)'
              }}>HTTP {response.status}</span>
              {response.data?.oracle?.verdict && (
                <span className={getVerdictClass(response.data.oracle.verdict)}>
                  {response.data.oracle.verdict}
                </span>
              )}
            </div>
            <div className="response-body">{JSON.stringify(response.data, null, 2)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CorsPage;
