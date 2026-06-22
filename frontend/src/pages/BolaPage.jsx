import { useState } from 'react';
import { getAccount, searchAccounts } from '../api/client';
import CurlCommand from '../components/CurlCommand';
import MitigationAnalysis from '../components/MitigationAnalysis';

function BehindTheScenes({ state }) {
  const code = {
    vulnerable: `// Sin control de acceso
Account account = accountRepository.findById(id);
return ResponseEntity.ok(account);
// → Devuelve cualquier cuenta sin preguntar quién eres`,
    partial: `// Acceso por ID: protegido ✓
if (!account.getOwnerId().equals(userId))
    return 403;

// Búsqueda por ownerId: SIN VALIDAR ✗
Long owner = request.getParam("ownerId"); // ← del atacante
return accountRepository.findByOwnerId(owner);
// → El atacante pasa ownerId=1 y ve cuentas de Alicia`,
    fixed: `// Acceso por ID: protegido ✓
if (!account.getOwnerId().equals(userId))
    return 403;

// Búsqueda: IGNORA el parámetro del cliente ✓
return accountRepository.findByOwnerId(userId);
// → Siempre filtra por el usuario autenticado`,
  };
  return (
    <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', padding: '0.75rem', border: '1px solid var(--border-color)', marginTop: '0.75rem' }}>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>Qué hace el servidor en estado {state}:</div>
      <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{code[state]}</pre>
    </div>
  );
}

function BolaPage() {
  const [state, setState] = useState('vulnerable');
  const [userId, setUserId] = useState(2);
  const [attackType, setAttackType] = useState('direct');
  const [targetAccountId, setTargetAccountId] = useState(1);
  const [targetOwnerId, setTargetOwnerId] = useState(1);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const explanations = {
    vulnerable: {
      title: 'Sin control de acceso',
      description: 'No hay ninguna verificación. Cualquier usuario accede a cualquier cuenta cambiando el ID en la URL.',
      color: 'text-vulnerable',
      attackHint: 'Siendo Roberto (user 2), pide la cuenta #1 de Alicia. El servidor la devuelve sin preguntar.',
    },
    partial: {
      title: 'Acceso directo protegido, búsqueda vulnerable',
      description: 'GET /accounts/{id} comprueba propiedad. Pero GET /accounts?ownerId=X no valida que el ownerId sea tuyo.',
      color: 'text-partial',
      attackHint: 'El acceso directo da 403. Cambia a "Búsqueda por ownerId" y pon ownerId=1 → bypass.',
    },
    fixed: {
      title: 'Todos los endpoints protegidos',
      description: 'Tanto el acceso directo como la búsqueda filtran por el usuario autenticado. El parámetro ownerId se ignora.',
      color: 'text-fixed',
      attackHint: 'Ningún ataque funciona. La búsqueda siempre devuelve solo tus cuentas.',
    },
  };

  const executeAttack = async () => {
    setLoading(true);
    setResponse(null);
    try {
      let result;
      if (attackType === 'direct') {
        result = await getAccount(state, targetAccountId, userId);
      } else {
        result = await searchAccounts(state, userId, targetOwnerId);
      }
      setResponse(result);
    } catch (err) {
      setResponse({ status: 0, ok: false, data: { error: err.message } });
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
      <h2 className="section-title">#1 — BOLA / IDOR</h2>
      <p className="section-subtitle">
        <span className="mono">API1:2023</span> · <span className="mono">A01:2025 Broken Access Control</span>
        <br />
        Acceso a objetos ajenos manipulando el identificador en la petición.
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

      <MitigationAnalysis slug="bola" state={state} />

      <div className="card">
        <h3 className="mb-2">Configurar ataque</h3>
        <div className="attack-panel">
          <div className="attack-config">
            <div className="form-group">
              <label>Eres el usuario (X-User-Id)</label>
              <select value={userId} onChange={e => setUserId(Number(e.target.value))}>
                <option value={1}>1 — Alicia García (víctima)</option>
                <option value={2}>2 — Roberto Martínez (atacante)</option>
                <option value={3}>3 — Carlos López</option>
              </select>
            </div>
            <div className="form-group">
              <label>Tipo de petición</label>
              <select value={attackType} onChange={e => setAttackType(e.target.value)}>
                <option value="direct">Acceso directo por ID → GET /accounts/:id</option>
                <option value="search">Búsqueda por ownerId → GET /accounts?ownerId=X {state === 'partial' ? '(BYPASS)' : ''}</option>
              </select>
            </div>
            {attackType === 'direct' ? (
              <div className="form-group">
                <label>ID de cuenta objetivo</label>
                <input type="number" min="1" max="4" value={targetAccountId}
                  onChange={e => setTargetAccountId(Number(e.target.value))} />
              </div>
            ) : (
              <div className="form-group">
                <label>ownerId del usuario víctima</label>
                <select value={targetOwnerId} onChange={e => setTargetOwnerId(Number(e.target.value))}>
                  <option value={1}>1 — Alicia</option>
                  <option value={2}>2 — Roberto</option>
                  <option value={3}>3 — Carlos</option>
                </select>
              </div>
            )}
            <button className="btn-attack" onClick={executeAttack} disabled={loading}>
              {loading ? 'Enviando...' : 'Ejecutar petición'}
            </button>
          </div>
          <div className="form-group">
            <label>Petición que se envía</label>
            <div className="response-viewer">
              <div className="response-body" style={{ minHeight: '120px', fontSize: '0.8rem' }}>
                {attackType === 'direct'
                  ? `GET /api/bola/${state}/accounts/${targetAccountId}\nX-User-Id: ${userId}\n\nRoberto (user ${userId}) intenta acceder a la\ncuenta #${targetAccountId}${targetAccountId !== userId ? ' (de otro usuario)' : ' (propia)'}`
                  : `GET /api/bola/${state}/accounts?ownerId=${targetOwnerId}\nX-User-Id: ${userId}\n\nRoberto (user ${userId}) busca las cuentas\ndel usuario ${targetOwnerId}${targetOwnerId !== userId ? ' (otro usuario)' : ' (propias)'}`
                }
              </div>
            </div>
          </div>
        </div>
        <CurlCommand command={
          attackType === 'direct'
            ? `curl -H "X-User-Id: ${userId}" http://localhost:8080/api/bola/${state}/accounts/${targetAccountId}`
            : `curl -H "X-User-Id: ${userId}" "http://localhost:8080/api/bola/${state}/accounts?ownerId=${targetOwnerId}"`
        } />
      </div>

      {response && (
        <div className="card mt-2">
          <h3 className="mb-1">Respuesta del servidor</h3>
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
          {response.data?.oracle?.verdict === 'ATTACK_SUCCESS' && (
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: '6px', backgroundColor: 'rgba(231,76,60,0.1)', border: '1px solid var(--color-vulnerable)', fontSize: '0.85rem', color: 'var(--color-vulnerable)' }}>
              El atacante accedió a datos de otro usuario. En un sistema real esto expondría datos financieros, personales o médicos.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BolaPage;
