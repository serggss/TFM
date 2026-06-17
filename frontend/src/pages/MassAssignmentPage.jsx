import { useState, useEffect } from 'react';

function MassAssignmentPage() {
  const [state, setState] = useState('vulnerable');
  const [profile, setProfile] = useState(null);
  const [fields, setFields] = useState({
    name: '', email: '', bio: '',
    role: 'admin', balance: 999999, verified: true, discount: 99.9,
  });
  const [selectedFields, setSelectedFields] = useState(['role', 'balance']);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const TARGET_ID = 2;

  const explanations = {
    vulnerable: {
      title: 'Estado VULNERABLE — Todos los campos aceptados',
      description:
        'El servidor acepta y aplica todos los campos del JSON, incluyendo role, balance, ' +
        'verified y discount. El atacante puede hacerse admin o cambiar su saldo.',
      color: 'text-vulnerable',
    },
    partial: {
      title: 'Estado PARTIAL — Blocklist incompleta',
      description:
        'El servidor bloquea "role" y "balance" pero olvida "verified" y "discount". ' +
        'El atacante no puede hacerse admin, pero puede verificarse a sí mismo y ' +
        'ponerse un descuento del 99.9%.',
      color: 'text-partial',
    },
    fixed: {
      title: 'Estado FIXED — DTO restrictivo',
      description:
        'El servidor usa un DTO que solo acepta name, email y bio. Cualquier otro campo ' +
        'se ignora silenciosamente. No es posible modificar campos protegidos.',
      color: 'text-fixed',
    },
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
      setFields(prev => ({
        ...prev,
        name: data.name || '',
        email: data.email || '',
        bio: data.bio || '',
      }));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { loadProfile(); }, [state]);

  const toggleField = (key) => {
    setSelectedFields(prev =>
      prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
    );
  };

  const buildBody = () => {
    const body = { name: fields.name, email: fields.email, bio: fields.bio };
    for (const f of protectedFields) {
      if (selectedFields.includes(f.key)) {
        body[f.key] = f.value;
      }
    }
    return body;
  };

  const sendUpdate = async () => {
    setLoading(true);
    try {
      const body = buildBody();
      const res = await fetch(`/api/mass-assignment/${state}/profile/${TARGET_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setResponse({ status: res.status, ok: res.ok, data });
      if (data.profile) setProfile(data.profile);
    } catch (e) {
      setResponse({ status: 0, ok: false, data: { error: e.message } });
    }
    setLoading(false);
  };

  const resetProfile = async () => {
    await fetch(`/api/mass-assignment/${state}/profile/${TARGET_ID}/reset`, { method: 'POST' });
    await loadProfile();
    setResponse(null);
  };

  const getVerdictClass = (verdict) => {
    if (!verdict) return '';
    if (verdict === 'ATTACK_SUCCESS') return 'verdict verdict-success';
    if (verdict === 'ATTACK_BLOCKED') return 'verdict verdict-blocked';
    return 'verdict verdict-legitimate';
  };

  return (
    <div>
      <h2 className="section-title">#4 — Mass Assignment / BOPLA</h2>
      <p className="section-subtitle">
        <span className="mono">API3:2023</span> · <span className="mono">A01:2025 Broken Access Control</span>
        <br />
        Broken Object Property Level Authorization — modificar propiedades protegidas del objeto.
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

      {profile && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="mb-2">Perfil actual de Bob (ID: {TARGET_ID})</h3>
            <button onClick={resetProfile} style={{
              padding: '0.4rem 0.8rem', background: 'transparent', border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem',
            }}>Resetear perfil</button>
          </div>
          <div className="response-viewer">
            <div className="response-body" style={{ maxHeight: '150px' }}>
              {JSON.stringify(profile, null, 2)}
            </div>
          </div>
        </div>
      )}

      <div className="card mt-2">
        <h3 className="mb-2">Configurar ataque</h3>
        <div className="attack-panel">
          <div className="attack-config">
            <div className="form-group">
              <label>Campos legítimos</label>
              <input type="text" placeholder="name" value={fields.name}
                onChange={e => setFields(p => ({ ...p, name: e.target.value }))} />
              <input type="text" placeholder="email" value={fields.email} className="mt-1"
                onChange={e => setFields(p => ({ ...p, email: e.target.value }))} />
              <input type="text" placeholder="bio" value={fields.bio} className="mt-1"
                onChange={e => setFields(p => ({ ...p, bio: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Campos protegidos (ataque)</label>
              {protectedFields.map(f => (
                <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.25rem 0' }}>
                  <input type="checkbox" checked={selectedFields.includes(f.key)}
                    onChange={() => toggleField(f.key)} />
                  <span className="mono" style={{ fontSize: '0.85rem' }}>{f.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>JSON que se enviará</label>
            <div className="response-viewer">
              <div className="response-body" style={{ minHeight: '150px' }}>
                {`PUT /api/mass-assignment/${state}/profile/${TARGET_ID}\nContent-Type: application/json\n\n${JSON.stringify(buildBody(), null, 2)}`}
              </div>
            </div>
          </div>
        </div>
        <button className="btn-attack mt-1" onClick={sendUpdate} disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar actualización'}
        </button>
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

export default MassAssignmentPage;
