import { useState } from 'react';

function ExceptionsPage() {
  const [state, setState] = useState('vulnerable');
  const [userIdInput, setUserIdInput] = useState('abc');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const explanations = {
    vulnerable: {
      title: 'Estado VULNERABLE — Sin auth + stack traces expuestos',
      description:
        'No hay control de acceso. Los errores devuelven stack traces completos ' +
        'con rutas internas, versiones de Java, nombres de clases y datos de conexión a BD.',
      color: 'text-vulnerable',
    },
    partial: {
      title: 'Estado PARTIAL — Fail-open por default true',
      description:
        'La variable isAuthorized se inicializa a true en vez de false. Si el parseo del ' +
        'X-User-Id lanza una excepción (ej: "abc"), el catch no corrige el valor y el ' +
        'request pasa como autorizado. También filtra info interna en los errores.',
      color: 'text-partial',
    },
    fixed: {
      title: 'Estado FIXED — Fail-closed + errores genéricos',
      description:
        'isAuthorized empieza en false (fail-closed). Cualquier excepción deja el acceso ' +
        'denegado. Los errores nunca exponen detalles internos.',
      color: 'text-fixed',
    },
  };

  const presets = [
    { label: '"abc" (no numérico → excepción)', value: 'abc' },
    { label: '"2" (Bob, role=user)', value: '2' },
    { label: '"4" (Admin, role=admin)', value: '4' },
    { label: 'Sin cabecera (vacío)', value: '' },
    { label: '"999" (usuario inexistente)', value: '999' },
  ];

  const sendRequest = async () => {
    setLoading(true);
    try {
      const headers = {};
      if (userIdInput) headers['X-User-Id'] = userIdInput;

      const res = await fetch(`/api/exceptions/${state}/admin/config`, { headers });
      const data = await res.json().catch(() => null);
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
      <h2 className="section-title">#5 — Mishandling of Exceptional Conditions</h2>
      <p className="section-subtitle">
        <span className="mono">API8:2023</span> · <span className="mono">A10:2025 (categoría NUEVA)</span>
        <br />
        Fail-open en el manejo de excepciones + fuga de información en errores.
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
        <h3 className="mb-2">Acceder a configuración de admin</h3>
        <div className="attack-panel">
          <div className="attack-config">
            <div className="form-group">
              <label>Valor de X-User-Id</label>
              <select value={userIdInput} onChange={e => setUserIdInput(e.target.value)}>
                {presets.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
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
              <div className="response-body" style={{ minHeight: '80px' }}>
                {`GET /api/exceptions/${state}/admin/config${userIdInput ? `\nX-User-Id: ${userIdInput}` : '\n(sin cabecera X-User-Id)'}`}
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

export default ExceptionsPage;
