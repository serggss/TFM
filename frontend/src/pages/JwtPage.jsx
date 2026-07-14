import { useState } from 'react';
import CurlCommand from '../components/CurlCommand';
import MitigationAnalysis from '../components/MitigationAnalysis';
import PartialDropdown from '../components/PartialDropdown';

const PARTIAL_OPTIONS = [
  {
    value: 'partial-alg-none',
    label: 'Acepta alg=none',
    shortLabel: 'alg=none',
    description: 'Verifica firma HS256 pero acepta tokens con alg=none. Bypass: forjar token sin firma.',
  },
  {
    value: 'partial-weak-key',
    label: 'Clave de firma débil',
    shortLabel: 'Clave débil',
    description: 'Rechaza alg=none pero usa una clave predecible. Bypass: crackear la clave offline y reforjar con role=admin.',
  },
  {
    value: 'partial-no-exp',
    label: 'Sin validación de expiración',
    shortLabel: 'Sin exp',
    description: 'Clave fuerte y alg correcto, pero ignora exp. Bypass: reutilizar un token expirado indefinidamente.',
  },
];

function TokenDecoder({ token, label, highlight }) {
  if (!token) return null;
  const parts = token.split('.');
  const colors = ['#e74c3c', '#f39c12', '#2ecc71'];
  const labels = ['Header', 'Payload', 'Signature'];

  const decode = (part) => {
    try {
      return JSON.stringify(JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/'))), null, 2);
    } catch { return '(vacío o no decodificable)'; }
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>{label}</div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.75rem', padding: '0.6rem',
        backgroundColor: 'var(--bg-primary)', borderRadius: '6px', border: '1px solid var(--border-color)',
        wordBreak: 'break-all', lineHeight: 1.4,
      }}>
        {parts.map((part, i) => (
          <span key={i}>
            {i > 0 && <span style={{ color: 'var(--text-muted)' }}>.</span>}
            <span style={{
              color: colors[i], fontWeight: highlight === i ? 800 : 400,
              backgroundColor: highlight === i ? colors[i] + '22' : 'transparent',
              padding: highlight === i ? '0 2px' : 0, borderRadius: 2,
            }}>{part || '(vacío)'}</span>
          </span>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
        {parts.map((part, i) => (
          <div key={i} style={{
            borderTop: `2px solid ${colors[i]}`, padding: '0.5rem',
            backgroundColor: 'var(--bg-primary)', borderRadius: '0 0 4px 4px', fontSize: '0.75rem',
          }}>
            <div style={{ color: colors[i], fontWeight: 700, marginBottom: '0.25rem' }}>{labels[i]}</div>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
              {decode(part)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepCard({ number, title, active, done, children }) {
  return (
    <div className="card" style={{
      borderColor: done ? 'var(--color-fixed)' : active ? 'var(--color-accent)' : 'var(--border-color)',
      opacity: active || done ? 1 : 0.5,
      marginBottom: '1rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.9rem', fontWeight: 700,
          backgroundColor: done ? 'var(--color-fixed)' : active ? 'var(--color-accent)' : 'var(--border-color)',
          color: done || active ? 'white' : 'var(--text-muted)',
        }}>{done ? '✓' : number}</div>
        <h3 style={{ fontSize: '1rem', color: done ? 'var(--color-fixed)' : active ? 'var(--color-accent)' : 'var(--text-muted)' }}>
          {title}
        </h3>
      </div>
      {(active || done) && children}
    </div>
  );
}

function BehindTheScenes({ state }) {
  const code = {
    vulnerable: `// El servidor decodifica el payload SIN VERIFICAR la firma
String payload = Base64.decode(token.split(".")[1]);
Map claims = parseJson(payload);
// → Acepta cualquier token, firmado o no`,
    'partial-alg-none': `// Verifica firma HS256... pero acepta alg=none
if (header.alg == "none") {
    return parseJson(payload);  // ← BYPASS: sin firma
}
// Tokens normales sí se verifican correctamente
return Jwts.parser().verifyWith(KEY).parse(token);`,
    'partial-weak-key': `// Rechaza alg=none, verifica firma... pero con clave débil
private static final String SECRET = "weak-secret-key-please-change-me";
private static final SecretKey KEY = Keys.hmacShaKeyFor(SECRET.getBytes());
// → La clave es predecible y está en listas de diccionario
// → hashcat -m 16500 <token> wordlist.txt → clave crackeada en segundos`,
    'partial-no-exp': `// Firma verificada con clave correcta... pero ignora exp
try {
    return Jwts.parser().verifyWith(KEY).parse(token).getPayload();
} catch (ExpiredJwtException e) {
    return e.getClaims(); // ← BYPASS: token expirado = aceptado
}
// → Un token robado es válido para siempre`,
    fixed: `// Solo acepta HS256 con la clave correcta
Claims claims = Jwts.parser()
    .verifyWith(KEY)          // Algoritmo fijo
    .requireIssuer("api-sec-lab")  // Verifica emisor
    .build().parseSignedClaims(token);
// Rechaza alg=none, tokens expirados, firma inválida`,
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', padding: '0.75rem',
      border: '1px solid var(--border-color)', marginTop: '0.75rem',
    }}>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
        Qué hace el servidor en este estado:
      </div>
      <pre style={{
        margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
        color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.5,
      }}>{code[state] || code['partial-alg-none']}</pre>
    </div>
  );
}

function JwtPage() {
  const [state, setState] = useState('vulnerable');
  const [username, setUsername] = useState('roberto');
  const [password, setPassword] = useState('password456');
  const [token, setToken] = useState(null);
  const [forgedToken, setForgedToken] = useState(null);
  const [useForged, setUseForged] = useState(false);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const isPartial = state.startsWith('partial');

  const explanations = {
    vulnerable: {
      title: 'Sin verificación de firma',
      description: 'El servidor decodifica el payload del JWT sin verificar la firma. Cualquiera puede fabricar un token con los claims que quiera.',
      color: 'text-vulnerable',
      attackHint: 'Prueba a forjar un token con role=admin en el paso 2. El servidor lo aceptará sin comprobar la firma.',
    },
    'partial-alg-none': {
      title: 'Acepta alg=none (bypass)',
      description: 'La firma se verifica para tokens HS256, pero el servidor también acepta tokens con alg=none. El atacante cambia el header a alg:none y elimina la firma.',
      color: 'text-partial',
      attackHint: 'El token forjado usa alg=none. En este estado el servidor lo acepta porque no rechaza ese algoritmo.',
    },
    'partial-weak-key': {
      title: 'Clave de firma predecible',
      description: 'El servidor rechaza alg=none y verifica la firma HS256 correctamente, pero la clave secreta es débil y predecible. Un atacante la crackea offline.',
      color: 'text-partial',
      attackHint: 'El servidor rechaza tokens sin firma. Pero la clave es "weak-secret-key-please-change-me" — crackeada con diccionario. El token forjado tiene firma válida con role=admin.',
    },
    'partial-no-exp': {
      title: 'Sin validación de expiración',
      description: 'Clave fuerte y algoritmo correcto, pero el servidor captura ExpiredJwtException y continúa la ejecución. Los tokens expirados son aceptados indefinidamente.',
      color: 'text-partial',
      attackHint: 'alg=none y clave débil están bloqueados. Pero un token expirado obtenido hace 1 hora sigue funcionando. Un token robado nunca pierde validez.',
    },
    fixed: {
      title: 'Verificación estricta',
      description: 'Solo acepta HS256 con la clave correcta. Verifica issuer, expiración, y rechaza alg=none.',
      color: 'text-fixed',
      attackHint: 'Intenta enviar cualquier token forjado o expirado. El servidor los rechazará con 403.',
    },
  };

  const step2Config = {
    vulnerable: {
      title: 'Forjar token con role=admin (sin firma)',
      description: 'El servidor no verifica la firma en absoluto — decodifica el payload en base64 y confía en él. Podemos fabricar un token con cualquier payload, incluyendo role=admin.',
      btnLabel: 'Forjar token con role=admin (sin firma)',
      forgeEndpoint: () => `/api/auth/forge-none/${userIdMap[username] || 2}`,
      tokenField: 'forgedToken',
      highlight: 1,
      tokenLabel: 'Token FORJADO (payload modificado, sin firma):',
      warning: 'Payload: role: "user" → role: "admin" · Signature: eliminada · El servidor acepta cualquier payload sin verificar.',
    },
    'partial-alg-none': {
      title: 'Forjar token con alg=none (sin firma)',
      description: 'El ataque alg=none funciona así: se cambia el header para indicar que no hay firma, se modifica el payload (role → admin), y se elimina la firma.',
      btnLabel: 'Forjar token con alg=none y role=admin',
      forgeEndpoint: () => `/api/auth/forge-none/${userIdMap[username] || 2}`,
      tokenField: 'forgedToken',
      highlight: 2,
      tokenLabel: 'Token FORJADO (sin firma, role=admin):',
      warning: 'Header: alg: "HS256" → alg: "none" · Payload: role: "user" → role: "admin" · Signature: eliminada',
    },
    'partial-weak-key': {
      title: 'Obtener token con clave crackeada (role=admin)',
      description: 'El atacante tomó un token legítimo, lo sometió a un ataque de diccionario offline con hashcat y encontró la clave. Ahora reforja un token con role=admin firmado correctamente.',
      btnLabel: 'Obtener token forjado con clave crackeada',
      forgeEndpoint: () => `/api/auth/forge-weak-key/${userIdMap[username] || 2}`,
      tokenField: 'forgedToken',
      highlight: 2,
      tokenLabel: 'Token forjado con clave débil (role=admin, firma VÁLIDA):',
      warning: 'La firma es criptográficamente correcta. El servidor la verifica y la acepta. El ataque es la clave débil, no la ausencia de firma.',
    },
    'partial-no-exp': {
      title: 'Obtener token expirado (simulación de robo)',
      description: 'El servidor genera un token con firma válida pero fecha de expiración ya pasada. Simula un token robado que debería haber caducado.',
      btnLabel: 'Obtener token expirado (firmado con clave correcta)',
      forgeEndpoint: () => `/api/auth/forge-expired/${userIdMap[username] || 2}`,
      tokenField: 'forgedToken',
      highlight: 0,
      tokenLabel: 'Token EXPIRADO (firma válida, exp en el pasado):',
      warning: 'La firma es válida. El problema: exp es una fecha pasada. En partial-no-exp el servidor lo acepta igualmente.',
    },
    fixed: {
      title: 'Intentar forjar token con alg=none (debe ser bloqueado)',
      description: 'Mismo ataque que en vulnerable: token sin firma con role=admin. En fixed el servidor exige HS256 con clave correcta, verifica el issuer y la expiración. Cualquier token manipulado recibe un 403.',
      btnLabel: 'Forjar token con alg=none (ataque que debe fallar)',
      forgeEndpoint: () => `/api/auth/forge-none/${userIdMap[username] || 2}`,
      tokenField: 'forgedToken',
      highlight: 0,
      tokenLabel: 'Token FORJADO (alg=none, sin firma):',
      warning: 'Este token funciona en vulnerable y partial-alg-none. En fixed el servidor lo rechaza con 403.',
    },
  };

  const userIdMap = { alicia: 1, roberto: 2, carlos: 3 };

  const login = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setForgedToken(null);
        setUseForged(false);
        setResponse(null);
        setStep(2);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const forgeToken = async () => {
    const cfg = step2Config[state];
    if (!cfg) return;
    const res = await fetch(cfg.forgeEndpoint());
    const data = await res.json();
    setForgedToken(data[cfg.tokenField] || data.forgedToken);
    setUseForged(true);
    setStep(3);
  };

  const sendToken = async () => {
    setLoading(true);
    const t = useForged && forgedToken ? forgedToken : token;
    try {
      const res = await fetch(`/api/jwt/${state}/profile`, {
        headers: { 'X-Auth-Token': t },
      });
      const data = await res.json().catch(() => null);
      setResponse({ status: res.status, ok: res.ok, data });
    } catch (e) {
      setResponse({ status: 0, ok: false, data: { error: e.message } });
    }
    setLoading(false);
  };

  const handleStateChange = (newState) => {
    setState(newState);
    setResponse(null);
    setForgedToken(null);
    setUseForged(false);
    setStep(token ? 2 : 1);
  };

  const getVerdictClass = (verdict) => {
    if (verdict === 'ATTACK_SUCCESS') return 'verdict verdict-success';
    if (verdict === 'ATTACK_BLOCKED') return 'verdict verdict-blocked';
    return 'verdict verdict-legitimate';
  };

  const currentStep2 = step2Config[state];
  const exp = explanations[state] || explanations['partial-alg-none'];

  return (
    <div>
      <h2 className="section-title">#2 — JWT mal implementado</h2>
      <p className="section-subtitle">
        <span className="mono">API2:2023</span> · <span className="mono">A01/A07:2025 Auth Failures</span>
        <br />
        Ataque al mecanismo de autenticación basado en JSON Web Tokens.
      </p>

      <div className="state-selector">
        <button
          className={`state-btn ${state === 'vulnerable' ? 'active-vulnerable' : ''}`}
          onClick={() => handleStateChange('vulnerable')}>
          Vulnerable
        </button>
        <PartialDropdown
          options={PARTIAL_OPTIONS}
          selected={isPartial ? state : null}
          onSelect={handleStateChange}
        />
        <button
          className={`state-btn ${state === 'fixed' ? 'active-fixed' : ''}`}
          onClick={() => handleStateChange('fixed')}>
          Fixed
        </button>
      </div>

      <div className="explanation-panel">
        <h3 className={exp.color}>{exp.title}</h3>
        <p>{exp.description}</p>
        <p style={{ marginTop: '0.5rem', fontStyle: 'italic', color: 'var(--color-accent)', fontSize: '0.85rem' }}>
          {exp.attackHint}
        </p>
        <BehindTheScenes state={state} />
      </div>

      <MitigationAnalysis slug="jwt" state={state} />

      <StepCard number={1} title="Autenticarse y obtener un token legítimo" active={step >= 1} done={!!token}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
          Primero necesitas un token válido. El servidor genera un JWT firmado con HS256
          que contiene tu userId, username y role en el payload.
        </p>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group">
            <label>Usuario</label>
            <select value={username} onChange={e => {
              setUsername(e.target.value);
              setPassword(e.target.value === 'roberto' ? 'password456' : e.target.value === 'alicia' ? 'password123' : 'password789');
            }}>
              <option value="alicia">alicia (víctima)</option>
              <option value="roberto">roberto (atacante)</option>
              <option value="carlos">carlos</option>
            </select>
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="text" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '140px' }} />
          </div>
          <button className="btn-attack" onClick={login} disabled={loading}>
            POST /api/auth/login
          </button>
        </div>
        <CurlCommand command={`curl -X POST -H "Content-Type: application/json" \\\n  -d '{"username":"${username}","password":"${password}"}' \\\n  ${window.location.origin}/api/auth/login`} />
        {token && <TokenDecoder token={token} label="Token legítimo recibido (firmado con HS256):" />}
      </StepCard>

      {currentStep2 && (
        <StepCard number={2} title={currentStep2.title} active={step >= 2} done={!!forgedToken}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            {currentStep2.description}
          </p>
          <button className="btn-attack" onClick={forgeToken} style={{ backgroundColor: 'var(--color-vulnerable)' }}>
            {currentStep2.btnLabel}
          </button>
          {forgedToken && (
            <div style={{ marginTop: '1rem' }}>
              <TokenDecoder token={forgedToken} label={currentStep2.tokenLabel} highlight={currentStep2.highlight} />
              <div style={{
                backgroundColor: 'rgba(231,76,60,0.1)', border: '1px solid var(--color-vulnerable)',
                borderRadius: '6px', padding: '0.75rem', fontSize: '0.85rem', color: 'var(--color-vulnerable)',
              }}>
                {currentStep2.warning}
              </div>
            </div>
          )}
        </StepCard>
      )}

      <StepCard number={currentStep2 ? 3 : 2} title="Enviar el token al servidor y ver el resultado" active={currentStep2 ? step >= 3 : step >= 2} done={!!response}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
          Envía el token al endpoint <code>/api/jwt/{state}/profile</code> en la cabecera
          <code> X-Auth-Token</code> y observa si el servidor lo acepta o rechaza.
        </p>
        {currentStep2 && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input type="radio" checked={!useForged} onChange={() => setUseForged(false)} />
              Enviar token <strong style={{ color: 'var(--color-fixed)' }}>legítimo</strong>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input type="radio" checked={useForged} onChange={() => setUseForged(true)} disabled={!forgedToken} />
              Enviar token <strong style={{ color: 'var(--color-vulnerable)' }}>de ataque</strong>
            </label>
          </div>
        )}
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.8rem', padding: '0.6rem',
          backgroundColor: 'var(--bg-primary)', borderRadius: '4px', marginBottom: '0.75rem',
          border: '1px solid var(--border-color)', color: 'var(--text-secondary)',
        }}>
          GET /api/jwt/<strong style={{ color: 'var(--color-accent)' }}>{state}</strong>/profile<br />
          X-Auth-Token: <span style={{ color: useForged ? 'var(--color-vulnerable)' : 'var(--color-fixed)' }}>
            {useForged ? '(token de ataque)' : '(token legítimo)'}
          </span>
        </div>
        <button className="btn-attack" onClick={sendToken} disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar petición'}
        </button>
        <CurlCommand command={`curl -H "X-Auth-Token: ${(useForged && forgedToken ? forgedToken : token) || '<token>'}" \\\n  ${window.location.origin}/api/jwt/${state}/profile`} />

        {response && (
          <div style={{ marginTop: '1rem' }}>
            <div className="response-viewer">
              <div className="response-header">
                <span className="response-status" style={{ color: response.ok ? 'var(--color-fixed)' : 'var(--color-vulnerable)' }}>
                  HTTP {response.status}
                </span>
                {response.data?.oracle?.verdict && (
                  <span className={getVerdictClass(response.data.oracle.verdict)}>
                    {response.data.oracle.verdict}
                  </span>
                )}
              </div>
              <div className="response-body">{JSON.stringify(response.data, null, 2)}</div>
            </div>
            {response.data?.oracle?.verdict === 'ATTACK_SUCCESS' && (
              <div style={{
                marginTop: '0.75rem', padding: '0.75rem', borderRadius: '6px',
                backgroundColor: 'rgba(231,76,60,0.1)', border: '1px solid var(--color-vulnerable)',
                fontSize: '0.85rem', color: 'var(--color-vulnerable)',
              }}>
                {state === 'vulnerable'
                  ? 'El servidor aceptó el token forjado — no verifica la firma en ningún caso.'
                  : 'El servidor aceptó el token de ataque. La mitigación parcial tiene un bypass explotable.'}
              </div>
            )}
            {response.data?.oracle?.verdict === 'ATTACK_BLOCKED' && (
              <div style={{
                marginTop: '0.75rem', padding: '0.75rem', borderRadius: '6px',
                backgroundColor: 'rgba(46,204,113,0.1)', border: '1px solid var(--color-fixed)',
                fontSize: '0.85rem', color: 'var(--color-fixed)',
              }}>
                El servidor rechazó el token. La verificación funciona correctamente para este tipo de ataque.
              </div>
            )}
          </div>
        )}
      </StepCard>
    </div>
  );
}

export default JwtPage;
