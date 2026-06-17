import { useState } from 'react';

function CorsPage() {
  const [state, setState] = useState('vulnerable');
  const [origin, setOrigin] = useState('https://evil.com');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const explanations = {
    vulnerable: {
      title: 'Estado VULNERABLE — Refleja cualquier Origin',
      description:
        'El servidor copia el valor del header Origin en Access-Control-Allow-Origin ' +
        'sin validar. Cualquier sitio web puede leer la respuesta de esta API. ' +
        'Un atacante solo necesita que la víctima visite su página maliciosa.',
      color: 'text-vulnerable',
    },
    partial: {
      title: 'Estado PARTIAL — Validación con contains()',
      description:
        'El servidor valida que el Origin contenga "localhost" usando contains(). ' +
        'Bypass: un dominio como "localhost.evil.com" o "evil-localhost.com" pasa la validación ' +
        'porque contiene la cadena "localhost".',
      color: 'text-partial',
    },
    fixed: {
      title: 'Estado FIXED — Whitelist exacta',
      description:
        'El servidor compara el Origin exacto contra una whitelist cerrada. ' +
        'Solo los orígenes exactos (localhost:5173, localhost:3000) son aceptados. ' +
        'No hay forma de saltarse la validación.',
      color: 'text-fixed',
    },
  };

  const originOptions = [
    { value: 'https://evil.com', label: 'https://evil.com (sitio malicioso)' },
    { value: 'https://localhost.evil.com', label: 'https://localhost.evil.com (bypass contains)' },
    { value: 'http://localhost:5173', label: 'http://localhost:5173 (legítimo)' },
    { value: 'https://attacker.localhost.com', label: 'https://attacker.localhost.com (bypass)' },
  ];

  const sendRequest = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cors/${state}/data`, {
        headers: { 'Origin': origin },
      });
      const data = await res.json();
      setResponse({ status: res.status, ok: res.ok, data });
    } catch (e) {
      setResponse({ status: 0, ok: false, data: { error: e.message } });
    }
    setLoading(false);
  };

  const getVerdictClass = (verdict) => {
    if (!verdict) return '';
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
        Cross-Origin Resource Sharing — acceso cross-origin no autorizado a datos sensibles.
      </p>

      <div className="state-selector">
        {['vulnerable', 'partial', 'fixed'].map(s => (
          <button key={s}
            className={`state-btn ${state === s ? `active-${s}` : ''}`}
            onClick={() => { setState(s); setResponse(null); }}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="explanation-panel">
        <h3 className={explanations[state].color}>{explanations[state].title}</h3>
        <p>{explanations[state].description}</p>
      </div>

      <div className="card">
        <h3 className="mb-2">Simular petición cross-origin</h3>
        <div className="attack-panel">
          <div className="attack-config">
            <div className="form-group">
              <label>Origin del atacante</label>
              <select value={origin} onChange={e => setOrigin(e.target.value)}>
                {originOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <button className="btn-attack" onClick={sendRequest} disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar petición'}
            </button>
          </div>
          <div className="form-group">
            <label>Petición HTTP</label>
            <div className="response-viewer">
              <div className="response-body" style={{ minHeight: '100px' }}>
                {`GET /api/cors/${state}/data\nOrigin: ${origin}\n\n# El navegador envía el header Origin\n# automáticamente en peticiones cross-origin`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {response && (
        <div className="card mt-2">
          <h3 className="mb-1">Respuesta</h3>
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
