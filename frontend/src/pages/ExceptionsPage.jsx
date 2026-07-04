import { useState } from 'react';
import CurlCommand from '../components/CurlCommand';
import MitigationAnalysis from '../components/MitigationAnalysis';
import PartialDropdown from '../components/PartialDropdown';

const PARTIAL_OPTIONS = [
  {
    value: 'partial-fail-open',
    label: 'Fail-open',
    shortLabel: 'Fail-open',
    description: 'isAuthorized=true por defecto. Una excepción salta el check y deja pasar la petición.',
  },
  {
    value: 'partial-info-leak',
    label: 'Fuga de información en errores',
    shortLabel: 'Info leak',
    description: 'Autorización fail-closed correcta, pero los errores exponen versión Java, OS, rutas y estructura de BD.',
  },
];

function BehindTheScenes({ state }) {
  const code = {
    vulnerable: `// Sin autorización + errores verbosos
try {
    Long userId = Long.parseLong(userIdStr);
} catch (Exception e) {
    return Map.of("stackTrace", e.getStackTrace(),
                   "javaVersion", System.getProperty("java.version"),
                   "userDir", System.getProperty("user.dir"));
    // → Fuga de info: versiones, rutas internas, stack traces
}
return ADMIN_CONFIG; // Sin ningún check de autorización`,
    'partial-fail-open': `// FAIL-OPEN: el default es true (bug)
boolean isAuthorized = true;  // ← DEBERÍA SER false

try {
    Long userId = Long.parseLong(userIdStr); // "abc" lanza excepción
    UserProfile user = repo.findById(userId);
    isAuthorized = "admin".equals(user.getRole());
} catch (Exception e) {
    // El catch NO pone isAuthorized = false
    // → isAuthorized sigue siendo true → BYPASS
}

if (!isAuthorized) return 403;
return ADMIN_CONFIG; // ← Se ejecuta por el fail-open`,
    'partial-info-leak': `// FAIL-CLOSED correcto, pero errores verbosos
boolean isAuthorized = false; // ← Correcto

try {
    Long userId = Long.parseLong(userIdStr);
    // ↑ "abc" lanza NumberFormatException → capturada
    // → isAuthorized sigue false → acceso denegado (correcto)
} catch (NumberFormatException e) {
    return Map.of(
        "error", e.getClass().getName() + " para '" + userIdStr + "'",
        "stackTrace", e.getStackTrace(),           // ← FUGA
        "serverInfo", Map.of(
            "javaVersion", System.getProperty("java.version"), // ← FUGA
            "userDir",     System.getProperty("user.dir")      // ← FUGA
        )
    ); // Acceso denegado, pero el error revela el sistema
}`,
    fixed: `// FAIL-CLOSED: el default es false
boolean isAuthorized = false;  // ← CORRECTO

try {
    Long userId = Long.parseLong(userIdStr);
    UserProfile user = repo.findById(userId);
    isAuthorized = "admin".equals(user.getRole());
} catch (Exception e) {
    // isAuthorized sigue siendo false → SEGURO
}

if (!isAuthorized) return 403; // ← Siempre si hay error
return ADMIN_CONFIG;`,
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', padding: '0.75rem', border: '1px solid var(--border-color)', marginTop: '0.75rem' }}>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
        Qué hace el servidor en este estado:
      </div>
      <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
        {code[state] || code['partial-fail-open']}
      </pre>
    </div>
  );
}

function ExceptionsPage() {
  const [state, setState] = useState('vulnerable');
  const [userIdInput, setUserIdInput] = useState('abc');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const isPartial = state.startsWith('partial');

  const explanations = {
    vulnerable: {
      title: 'Sin auth + stack traces expuestos',
      description: 'No hay control de acceso. Los errores devuelven stack traces con rutas, versiones y datos internos.',
      color: 'text-vulnerable',
      attackHint: 'Envía cualquier valor. Sin auth, siempre devuelve la configuración admin. Con "abc" además ves el stack trace.',
    },
    'partial-fail-open': {
      title: 'Fail-open: isAuthorized = true por defecto',
      description: 'La variable isAuthorized se inicializa a true. Si X-User-Id no es numérico, la excepción deja el valor en true y la petición pasa.',
      color: 'text-partial',
      attackHint: 'Envía X-User-Id: "abc" → NumberFormatException → isAuthorized queda true → acceso concedido.',
    },
    'partial-info-leak': {
      title: 'Fail-closed correcto, pero errores verbosos',
      description: 'La autorización funciona correctamente (fail-closed). Pero las excepciones devuelven información interna: versión Java, OS, rutas, estructura de BD.',
      color: 'text-partial',
      attackHint: 'No puedes acceder a la config. Pero "abc" devuelve el stack trace con versión Java y user.dir. "999" revela nombre de tabla y datasource.',
    },
    fixed: {
      title: 'Fail-closed + errores genéricos',
      description: 'isAuthorized empieza en false. Cualquier excepción = acceso denegado. Errores sin detalles internos.',
      color: 'text-fixed',
      attackHint: 'Envía "abc" → excepción → isAuthorized sigue false → 403. Solo X-User-Id: 4 (admin) tiene acceso.',
    },
  };

  const presets = {
    default: [
      { value: 'abc', label: '"abc" — no numérico, provoca excepción', risk: true },
      { value: '2', label: '"2" — Roberto, role=user', risk: false },
      { value: '4', label: '"4" — Admin, role=admin', risk: false },
      { value: '', label: 'Sin cabecera', risk: true },
      { value: '999', label: '"999" — usuario inexistente', risk: true },
    ],
    'partial-info-leak': [
      { value: 'abc', label: '"abc" — NumberFormatException con stack trace + serverInfo', risk: true },
      { value: '999', label: '"999" — RuntimeException con nombre de tabla y datasource', risk: true },
      { value: '2', label: '"2" — Roberto (role=user): 403 genérico sin info extra', risk: false },
      { value: '4', label: '"4" — Admin: acceso legítimo', risk: false },
    ],
  };

  const currentPresets = presets[state] || presets.default;

  const sendRequest = async () => {
    setLoading(true);
    try {
      const headers = {};
      if (userIdInput) headers['X-User-Id'] = userIdInput;
      const res = await fetch(`/api/exceptions/${state}/admin/config`, { headers });
      const data = await res.json().catch(() => null);
      setResponse({ status: res.status, ok: res.ok, data });
    } catch (e) { setResponse({ status: 0, ok: false, data: { error: e.message } }); }
    setLoading(false);
  };

  const handleStateChange = (newState) => {
    setState(newState);
    setResponse(null);
    setUserIdInput('abc');
  };

  const getVerdictClass = (verdict) => {
    if (verdict === 'ATTACK_SUCCESS') return 'verdict verdict-success';
    if (verdict === 'ATTACK_BLOCKED') return 'verdict verdict-blocked';
    return 'verdict verdict-legitimate';
  };

  const exp = explanations[state] || explanations['partial-fail-open'];

  return (
    <div>
      <h2 className="section-title">#5 — Manejo Incorrecto de Excepciones</h2>
      <p className="section-subtitle">
        <span className="mono">API8:2023</span> · <span className="mono">A10:2025 (categoría NUEVA)</span><br />
        Fail-open en el manejo de excepciones + fuga de información interna en errores.
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

      <MitigationAnalysis slug="exceptions" state={state} />

      <div className="card">
        <h3 className="mb-2">Enviar petición a endpoint de admin</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          El endpoint <code>/api/exceptions/{'{state}'}/admin/config</code> devuelve configuración sensible.
          El valor de <code>X-User-Id</code> determina el usuario.
          {state === 'partial-info-leak' && (
            <span style={{ color: 'var(--color-partial)', display: 'block', marginTop: '0.5rem' }}>
              En este estado la autorización es correcta — no puedes acceder. Pero los errores filtran información interna.
            </span>
          )}
        </p>
        <div className="attack-panel">
          <div className="attack-config">
            <div className="form-group">
              <label>Valor de X-User-Id</label>
              {currentPresets.map(p => (
                <label key={p.value + p.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.2rem 0' }}>
                  <input type="radio" checked={userIdInput === p.value} onChange={() => setUserIdInput(p.value)} />
                  <code style={{ fontSize: '0.8rem', color: p.risk ? 'var(--color-vulnerable)' : 'var(--text-primary)' }}>{p.label}</code>
                </label>
              ))}
            </div>
            <button className="btn-attack" onClick={sendRequest} disabled={loading}>
              {loading ? 'Enviando...' : `GET /api/exceptions/${state}/admin/config`}
            </button>
          </div>
          <div className="form-group">
            <label>Petición HTTP</label>
            <div className="response-viewer">
              <div className="response-body" style={{ minHeight: '80px', fontSize: '0.8rem' }}>
                {`GET /api/exceptions/${state}/admin/config${userIdInput ? `\nX-User-Id: ${userIdInput}` : '\n(sin cabecera X-User-Id)'}`}
                {userIdInput === 'abc' && '\n\n→ "abc" no es numérico\n→ Long.parseLong() lanza NumberFormatException'}
              </div>
            </div>
          </div>
        </div>
        <CurlCommand command={userIdInput
          ? `curl -H "X-User-Id: ${userIdInput}" \\\n  ${window.location.origin}/api/exceptions/${state}/admin/config`
          : `curl ${window.location.origin}/api/exceptions/${state}/admin/config`
        } />
      </div>

      {response && (
        <div className="card mt-2">
          <h3 className="mb-1">Respuesta</h3>
          {(response.data?.stackTrace || response.data?.serverInfo) && (
            <div style={{ marginBottom: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: 'rgba(231,76,60,0.1)', border: '1px solid var(--color-vulnerable)', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--color-vulnerable)' }}>
              Información interna expuesta en la respuesta de error — versión Java, OS, rutas, stack trace.
            </div>
          )}
          {response.data?._explanation && (
            <div style={{ marginBottom: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: 'rgba(243,156,18,0.1)', border: '1px solid var(--color-partial)', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--color-partial)' }}>
              {response.data._explanation}
            </div>
          )}
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
        </div>
      )}
    </div>
  );
}

export default ExceptionsPage;
