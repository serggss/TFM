import { useState } from 'react';

const API = '';

function JwtPage() {
  const [state, setState] = useState('vulnerable');
  const [username, setUsername] = useState('bob');
  const [password, setPassword] = useState('password456');
  const [token, setToken] = useState(null);
  const [forgedToken, setForgedToken] = useState(null);
  const [useForged, setUseForged] = useState(false);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const explanations = {
    vulnerable: {
      title: 'Estado VULNERABLE — Sin verificación de firma',
      description:
        'El servidor decodifica el payload del JWT sin verificar la firma. ' +
        'Cualquiera puede crear un token con los claims que quiera (ej: role=admin) ' +
        'y el servidor lo aceptará.',
      color: 'text-vulnerable',
    },
    partial: {
      title: 'Estado PARTIAL — Acepta alg=none',
      description:
        'El servidor verifica la firma para tokens HS256, pero también acepta tokens ' +
        'con alg=none (sin firma). El atacante modifica el header del token para usar ' +
        'alg=none, cambia el payload, y elimina la firma. El servidor lo acepta.',
      color: 'text-partial',
    },
    fixed: {
      title: 'Estado FIXED — Verificación estricta',
      description:
        'El servidor solo acepta tokens firmados con HS256 y la clave correcta. ' +
        'Verifica issuer, expiración, y rechaza cualquier token manipulado.',
      color: 'text-fixed',
    },
  };

  const login = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setForgedToken(null);
        setResponse({ status: res.status, ok: true, data });
      } else {
        setResponse({ status: res.status, ok: false, data });
      }
    } catch (e) {
      setResponse({ status: 0, ok: false, data: { error: e.message } });
    }
    setLoading(false);
  };

  const forgeToken = async () => {
    const userIdToForge = username === 'bob' ? 2 : username === 'alice' ? 1 : 3;
    const res = await fetch(`${API}/api/auth/forge-none/${userIdToForge}`);
    const data = await res.json();
    setForgedToken(data.forgedToken);
    setUseForged(true);
  };

  const sendToken = async () => {
    setLoading(true);
    const t = useForged && forgedToken ? forgedToken : token;
    try {
      const res = await fetch(`${API}/api/jwt/${state}/profile`, {
        headers: { 'Authorization': `Bearer ${t}` },
      });
      const data = await res.json().catch(() => null);
      setResponse({ status: res.status, ok: res.ok, data });
    } catch (e) {
      setResponse({ status: 0, ok: false, data: { error: e.message } });
    }
    setLoading(false);
  };

  const decodePayload = (t) => {
    try {
      const parts = t.split('.');
      return JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    } catch { return null; }
  };

  const getVerdictClass = (verdict) => {
    if (!verdict) return '';
    if (verdict === 'ATTACK_SUCCESS') return 'verdict verdict-success';
    if (verdict === 'ATTACK_BLOCKED') return 'verdict verdict-blocked';
    return 'verdict verdict-legitimate';
  };

  return (
    <div>
      <h2 className="section-title">#2 — JWT mal implementado</h2>
      <p className="section-subtitle">
        <span className="mono">API2:2023</span> · <span className="mono">A01/A07:2025 Auth Failures</span>
        <br />
        Manipulación de JSON Web Tokens — ataque alg=none.
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
        <h3 className="mb-2">1. Obtener un token legítimo</h3>
        <div className="attack-config" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group">
            <label>Usuario</label>
            <select value={username} onChange={e => { setUsername(e.target.value); setPassword(e.target.value === 'bob' ? 'password456' : e.target.value === 'alice' ? 'password123' : 'password789'); }}>
              <option value="alice">alice</option>
              <option value="bob">bob (atacante)</option>
              <option value="charlie">charlie</option>
            </select>
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="text" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button className="btn-attack" onClick={login} disabled={loading}>Login</button>
        </div>
        {token && (
          <div className="mt-2">
            <div className="form-group">
              <label>Token obtenido</label>
              <div className="response-viewer">
                <div className="response-body" style={{ fontSize: '0.75rem', maxHeight: '80px' }}>{token}</div>
              </div>
            </div>
            <div className="form-group mt-1">
              <label>Payload decodificado</label>
              <div className="response-viewer">
                <div className="response-body">{JSON.stringify(decodePayload(token), null, 2)}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {token && (
        <div className="card mt-2">
          <h3 className="mb-2">2. Forjar token (ataque alg=none)</h3>
          <p className="text-muted mb-2" style={{ fontSize: '0.9rem' }}>
            Crea un token con <code>alg: none</code> y <code>role: admin</code>, sin firma.
          </p>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button className="btn-attack" onClick={forgeToken}>Forjar token alg=none</button>
            {forgedToken && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={useForged} onChange={e => setUseForged(e.target.checked)} />
                Usar token forjado
              </label>
            )}
          </div>
          {forgedToken && (
            <div className="mt-2">
              <div className="form-group">
                <label>Token forjado (sin firma)</label>
                <div className="response-viewer">
                  <div className="response-body" style={{ fontSize: '0.75rem', maxHeight: '80px' }}>{forgedToken}</div>
                </div>
              </div>
              <div className="form-group mt-1">
                <label>Payload del token forjado</label>
                <div className="response-viewer">
                  <div className="response-body">{JSON.stringify(decodePayload(forgedToken), null, 2)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {token && (
        <div className="card mt-2">
          <h3 className="mb-2">3. Enviar token al endpoint</h3>
          <p className="text-muted mb-1" style={{ fontSize: '0.9rem' }}>
            Enviando: <strong>{useForged && forgedToken ? 'TOKEN FORJADO' : 'token legítimo'}</strong> al estado <strong>{state}</strong>
          </p>
          <button className="btn-attack" onClick={sendToken} disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar token'}
          </button>
        </div>
      )}

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

export default JwtPage;
