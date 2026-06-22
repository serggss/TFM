import { useState, useEffect } from 'react';
import CurlCommand from '../components/CurlCommand';
import MitigationAnalysis from '../components/MitigationAnalysis';

function BehindTheScenes({ state }) {
  const code = {
    vulnerable: `// Acepta TODOS los campos del JSON sin filtrar
for (Map.Entry entry : body.entrySet()) {
    applyField(profile, entry.getKey(), entry.getValue());
}
// → role, balance, verified, discount: todo modificable`,
    partial: `// Blocklist: bloquea role y balance
Set<String> blocked = Set.of("role", "balance");
if (blocked.contains(field)) continue; // ← bloqueado
applyField(profile, field, value);
// BYPASS: "verified" y "discount" no están en la blocklist`,
    fixed: `// DTO explícito: solo 3 campos aceptados
record ProfileUpdateRequest(String name, String email, String bio) {}
profile.setName(dto.name());
profile.setEmail(dto.email());
profile.setBio(dto.bio());
// → role, balance, verified, discount: imposibles de modificar`,
  };
  return (
    <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', padding: '0.75rem', border: '1px solid var(--border-color)', marginTop: '0.75rem' }}>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>Qué hace el servidor en estado {state}:</div>
      <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{code[state]}</pre>
    </div>
  );
}

function MassAssignmentPage() {
  const [state, setState] = useState('vulnerable');
  const [profile, setProfile] = useState(null);
  const [fields, setFields] = useState({ name: '', email: '', bio: '' });
  const [selectedFields, setSelectedFields] = useState(['role', 'balance']);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const TARGET_ID = 2;

  const explanations = {
    vulnerable: { title: 'Todos los campos aceptados', description: 'El JSON se aplica directamente a la entidad. El atacante puede modificar role, balance y cualquier campo.', color: 'text-vulnerable', attackHint: 'Marca "role → admin" y "balance → 999999". Ambos se aplicarán.' },
    partial: { title: 'Blocklist incompleta', description: 'Se bloquean "role" y "balance" pero se olvidan "verified" y "discount". El atacante puede verificarse y ponerse descuentos.', color: 'text-partial', attackHint: 'role será rechazado. Pero marca "verified" y "discount" → bypass.' },
    fixed: { title: 'DTO restrictivo (whitelist)', description: 'Solo acepta name, email y bio via un DTO explícito. Cualquier otro campo se ignora.', color: 'text-fixed', attackHint: 'Marca todos los campos protegidos. Ninguno se aplicará.' },
  };

  const protectedFields = [
    { key: 'role', label: 'role → "admin"', value: 'admin' },
    { key: 'balance', label: 'balance → 999999', value: 999999 },
    { key: 'verified', label: 'verified → true', value: true },
    { key: 'discount', label: 'discount → 99.9%', value: 99.9 },
  ];

  const loadProfile = async () => {
    try {
      const res = await fetch(`/api/mass-assignment/${state}/profile/${TARGET_ID}`);
      const data = await res.json();
      setProfile(data);
      setFields(prev => ({ ...prev, name: data.name || '', email: data.email || '', bio: data.bio || '' }));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadProfile(); }, [state]);

  const toggleField = (key) => {
    setSelectedFields(prev => prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]);
  };

  const buildBody = () => {
    const body = { name: fields.name, email: fields.email, bio: fields.bio };
    for (const f of protectedFields) {
      if (selectedFields.includes(f.key)) body[f.key] = f.value;
    }
    return body;
  };

  const sendUpdate = async () => {
    setLoading(true);
    try {
      const body = buildBody();
      const res = await fetch(`/api/mass-assignment/${state}/profile/${TARGET_ID}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      setResponse({ status: res.status, ok: res.ok, data });
      if (data.profile) setProfile(data.profile);
    } catch (e) { setResponse({ status: 0, ok: false, data: { error: e.message } }); }
    setLoading(false);
  };

  const resetProfile = async () => {
    await fetch(`/api/mass-assignment/${state}/profile/${TARGET_ID}/reset`, { method: 'POST' });
    await loadProfile();
    setResponse(null);
  };

  const getVerdictClass = (verdict) => {
    if (verdict === 'ATTACK_SUCCESS') return 'verdict verdict-success';
    if (verdict === 'ATTACK_BLOCKED') return 'verdict verdict-blocked';
    return 'verdict verdict-legitimate';
  };

  return (
    <div>
      <h2 className="section-title">#4 — Asignación Masiva / BOPLA</h2>
      <p className="section-subtitle">
        <span className="mono">API3:2023</span> · <span className="mono">A01:2025 Broken Access Control</span><br />
        Modificar propiedades protegidas del objeto incluyéndolas en el JSON de la petición.
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
        <p style={{ marginTop: '0.5rem', fontStyle: 'italic', color: 'var(--color-accent)', fontSize: '0.85rem' }}>{explanations[state].attackHint}</p>
        <BehindTheScenes state={state} />
      </div>

      <MitigationAnalysis slug="mass-assignment" state={state} />

      {profile && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="mb-1">Perfil actual de Roberto (ID: {TARGET_ID})</h3>
            <button onClick={resetProfile} style={{ padding: '0.4rem 0.8rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Resetear</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginTop: '0.5rem' }}>
            {['role', 'balance', 'verified', 'discount'].map(field => (
              <div key={field} style={{ padding: '0.5rem', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>{field}</div>
                <div className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: profile[field] === 'admin' || profile[field] === true || profile[field] > 50 ? 'var(--color-vulnerable)' : 'var(--text-primary)' }}>
                  {String(profile[field])}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card mt-2">
        <h3 className="mb-2">Configurar ataque</h3>
        <div className="attack-panel">
          <div className="attack-config">
            <div className="form-group">
              <label>Campos legítimos (siempre incluidos)</label>
              <input type="text" placeholder="name" value={fields.name} onChange={e => setFields(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Campos protegidos a inyectar</label>
              {protectedFields.map(f => (
                <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.2rem 0' }}>
                  <input type="checkbox" checked={selectedFields.includes(f.key)} onChange={() => toggleField(f.key)} />
                  <code style={{ fontSize: '0.8rem', color: selectedFields.includes(f.key) ? 'var(--color-vulnerable)' : 'var(--text-muted)' }}>{f.label}</code>
                </label>
              ))}
            </div>
            <button className="btn-attack mt-1" onClick={sendUpdate} disabled={loading}>
              {loading ? 'Enviando...' : `PUT /api/mass-assignment/${state}/profile/${TARGET_ID}`}
            </button>
          </div>
          <div className="form-group">
            <label>JSON que se envía</label>
            <div className="response-viewer">
              <div className="response-body" style={{ minHeight: '150px', fontSize: '0.8rem' }}>
                {JSON.stringify(buildBody(), null, 2)}
              </div>
            </div>
          </div>
        </div>
        <CurlCommand command={`curl -X PUT -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(buildBody())}' \\\n  http://localhost:8080/api/mass-assignment/${state}/profile/${TARGET_ID}`} />
      </div>

      {response && (
        <div className="card mt-2">
          <h3 className="mb-1">Respuesta</h3>
          {response.data?.rejectedFields?.length > 0 && (
            <div style={{ marginBottom: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: 'rgba(46,204,113,0.1)', border: '1px solid var(--color-fixed)', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--color-fixed)' }}>
              Campos bloqueados: {response.data.rejectedFields.join(', ')}
            </div>
          )}
          {response.data?.modifiedProtectedFields?.length > 0 && (
            <div style={{ marginBottom: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: 'rgba(231,76,60,0.1)', border: '1px solid var(--color-vulnerable)', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--color-vulnerable)' }}>
              Campos protegidos MODIFICADOS: {response.data.modifiedProtectedFields.join(', ')}
            </div>
          )}
          <div className="response-viewer">
            <div className="response-header">
              <span className="response-status" style={{ color: response.ok ? 'var(--color-fixed)' : 'var(--color-vulnerable)' }}>HTTP {response.status}</span>
              {response.data?.oracle?.verdict && (<span className={getVerdictClass(response.data.oracle.verdict)}>{response.data.oracle.verdict}</span>)}
            </div>
            <div className="response-body">{JSON.stringify(response.data, null, 2)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MassAssignmentPage;
