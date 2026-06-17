/**
 * Página de demo interactiva de BOLA/IDOR.
 *
 * Permite al estudiante:
 *   1. Seleccionar un estado (vulnerable / partial / fixed).
 *   2. Elegir un usuario autenticado (simula quién eres).
 *   3. Intentar acceder a una cuenta por ID o buscar por ownerId.
 *   4. Ver la respuesta del servidor con el veredicto del oráculo.
 *   5. Leer la explicación de qué está pasando en cada estado.
 *
 * Flujo pedagógico esperado:
 *   a) El estudiante prueba en "vulnerable" → ve que funciona (rojo, ATTACK_SUCCESS).
 *   b) Cambia a "partial" → el acceso por ID falla (parece seguro).
 *   c) Prueba el bypass (búsqueda por ownerId) → funciona (naranja, BYPASS).
 *   d) Cambia a "fixed" → ningún ataque funciona (verde, ATTACK_BLOCKED).
 *
 * Este componente es intencionalmente largo porque contiene toda la lógica
 * de la demo en un solo fichero. Se refactorizará a componentes más pequeños
 * cuando se añadan más vulnerabilidades en Semana 2 (DRY entre demos).
 */
import { useState } from 'react';
import { getAccount, searchAccounts } from '../api/client';

function BolaPage() {
  // --- Estado del componente ---

  // Estado de la vulnerabilidad seleccionado (vulnerable/partial/fixed)
  const [state, setState] = useState('vulnerable');

  // Usuario autenticado simulado (quién hace la petición)
  const [userId, setUserId] = useState(2); // Bob por defecto (el "atacante")

  // Tipo de ataque: "direct" (por ID) o "search" (por ownerId)
  const [attackType, setAttackType] = useState('direct');

  // ID de la cuenta objetivo (para ataque directo)
  const [targetAccountId, setTargetAccountId] = useState(1); // Cuenta de Alice

  // ownerId objetivo (para ataque de búsqueda / bypass partial)
  const [targetOwnerId, setTargetOwnerId] = useState(1); // Alice

  // Respuesta del servidor
  const [response, setResponse] = useState(null);

  // Indicador de carga
  const [loading, setLoading] = useState(false);

  // --- Explicaciones por estado ---
  // Cada estado tiene una explicación pedagógica diferente que se muestra
  // debajo del selector. Esto ayuda al estudiante a entender qué esperar.
  const explanations = {
    vulnerable: {
      title: 'Estado VULNERABLE — Sin control de acceso',
      description:
        'No hay ninguna verificación de autorización. Cualquier usuario puede ' +
        'acceder a cualquier cuenta simplemente cambiando el ID en la URL. ' +
        'El servidor devuelve los datos sin preguntar quién eres.',
      color: 'text-vulnerable',
    },
    partial: {
      title: 'Estado PARTIAL — Mitigación incompleta (¡con bypass!)',
      description:
        'El acceso directo por ID está protegido: si pides la cuenta de otro usuario, ' +
        'recibes un 403 Forbidden. Parece seguro. Pero el endpoint de búsqueda ' +
        '(GET /accounts?ownerId=X) NO valida que el ownerId coincida con tu usuario. ' +
        'Prueba el ataque "Búsqueda por ownerId" para ver el bypass.',
      color: 'text-partial',
    },
    fixed: {
      title: 'Estado FIXED — Mitigación completa',
      description:
        'Todos los endpoints verifican la propiedad. El acceso directo comprueba ' +
        'el ownerId. La búsqueda IGNORA el parámetro ownerId del cliente y siempre ' +
        'filtra por el usuario autenticado. No hay forma de acceder a datos ajenos.',
      color: 'text-fixed',
    },
  };

  /**
   * Ejecuta el ataque seleccionado.
   *
   * Llama al endpoint correspondiente del backend y almacena la respuesta
   * para mostrarla en el visor. El tipo de ataque determina si se usa
   * el endpoint individual (por ID) o el de búsqueda (por ownerId).
   */
  const executeAttack = async () => {
    setLoading(true);
    setResponse(null);

    try {
      let result;

      if (attackType === 'direct') {
        // Ataque directo: GET /api/bola/{state}/accounts/{id}
        result = await getAccount(state, targetAccountId, userId);
      } else {
        // Ataque por búsqueda: GET /api/bola/{state}/accounts?ownerId={targetOwnerId}
        result = await searchAccounts(state, userId, targetOwnerId);
      }

      setResponse(result);
    } catch (err) {
      setResponse({
        status: 0,
        ok: false,
        data: { error: 'Error de conexión: ' + err.message },
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Determina la clase CSS del veredicto del oráculo.
   * Se usa para colorear el badge según el resultado.
   */
  const getVerdictClass = (verdict) => {
    if (!verdict) return '';
    if (verdict === 'ATTACK_SUCCESS') return 'verdict verdict-success';
    if (verdict === 'ATTACK_BLOCKED') return 'verdict verdict-blocked';
    return 'verdict verdict-legitimate';
  };

  return (
    <div>
      {/* ================================================================
          TÍTULO Y REFERENCIAS OWASP
          ================================================================ */}
      <h2 className="section-title">#1 — BOLA / IDOR</h2>
      <p className="section-subtitle">
        <span className="mono">API1:2023</span> · <span className="mono">A01:2025 Broken Access Control</span>
        <br />
        Broken Object Level Authorization — acceso a objetos ajenos manipulando el identificador.
      </p>

      {/* ================================================================
          SELECTOR DE ESTADO
          ================================================================
          Tres botones para cambiar entre los estados de la vulnerabilidad.
          El color del botón activo actúa como semáforo visual.
      */}
      <div className="state-selector">
        {['vulnerable', 'partial', 'fixed'].map(s => (
          <button
            key={s}
            className={`state-btn ${state === s ? `active-${s}` : ''}`}
            onClick={() => { setState(s); setResponse(null); }}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* ================================================================
          PANEL DE EXPLICACIÓN
          ================================================================
          Muestra una explicación diferente según el estado seleccionado.
          Es la parte más pedagógica de la demo.
      */}
      <div className="explanation-panel">
        <h3 className={explanations[state].color}>
          {explanations[state].title}
        </h3>
        <p>{explanations[state].description}</p>
      </div>

      {/* ================================================================
          PANEL DE CONFIGURACIÓN DEL ATAQUE
          ================================================================
          El estudiante configura los parámetros del ataque:
          - Quién es (usuario autenticado).
          - Qué tipo de ataque (directo o búsqueda).
          - Qué cuenta/usuario ataca.
      */}
      <div className="card">
        <h3 className="mb-2">Configurar ataque</h3>
        <div className="attack-panel">
          <div className="attack-config">
            {/* Selector de usuario autenticado */}
            <div className="form-group">
              <label>Eres el usuario:</label>
              <select
                value={userId}
                onChange={e => setUserId(Number(e.target.value))}
              >
                <option value={1}>Usuario 1 — Alice García (víctima)</option>
                <option value={2}>Usuario 2 — Bob Martínez (atacante)</option>
                <option value={3}>Usuario 3 — Charlie López</option>
              </select>
            </div>

            {/* Selector de tipo de ataque */}
            <div className="form-group">
              <label>Tipo de ataque:</label>
              <select
                value={attackType}
                onChange={e => setAttackType(e.target.value)}
              >
                <option value="direct">
                  Acceso directo por ID (GET /accounts/&#123;id&#125;)
                </option>
                <option value="search">
                  Búsqueda por ownerId (GET /accounts?ownerId=X) — BYPASS en partial
                </option>
              </select>
            </div>

            {/* Campo de objetivo: cambia según el tipo de ataque */}
            {attackType === 'direct' ? (
              <div className="form-group">
                <label>ID de cuenta objetivo:</label>
                <input
                  type="number"
                  min="1"
                  max="4"
                  value={targetAccountId}
                  onChange={e => setTargetAccountId(Number(e.target.value))}
                />
              </div>
            ) : (
              <div className="form-group">
                <label>ownerId del usuario víctima:</label>
                <select
                  value={targetOwnerId}
                  onChange={e => setTargetOwnerId(Number(e.target.value))}
                >
                  <option value={1}>1 — Alice García</option>
                  <option value={2}>2 — Bob Martínez</option>
                  <option value={3}>3 — Charlie López</option>
                </select>
              </div>
            )}

            {/* Botón de ejecución */}
            <button
              className="btn-attack"
              onClick={executeAttack}
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Ejecutar ataque'}
            </button>
          </div>

          {/* Resumen de la petición que se va a enviar */}
          <div className="form-group">
            <label>Petición HTTP que se enviará:</label>
            <div className="response-viewer">
              <div className="response-body" style={{ minHeight: '120px' }}>
                {attackType === 'direct'
                  ? `GET /api/bola/${state}/accounts/${targetAccountId}\nX-User-Id: ${userId}\n\n# Como usuario ${userId}, intentas acceder\n# a la cuenta #${targetAccountId}`
                  : `GET /api/bola/${state}/accounts?ownerId=${targetOwnerId}\nX-User-Id: ${userId}\n\n# Como usuario ${userId}, buscas las cuentas\n# del usuario ${targetOwnerId}`
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          VISOR DE RESPUESTA
          ================================================================
          Muestra la respuesta del servidor formateada como JSON.
          Incluye el HTTP status, el veredicto del oráculo y los datos.
      */}
      {response && (
        <div className="card mt-2">
          <h3 className="mb-1">Respuesta del servidor</h3>

          {/* Barra de estado HTTP + veredicto del oráculo */}
          <div className="response-viewer">
            <div className="response-header">
              <span className="response-status" style={{
                color: response.ok ? 'var(--color-fixed)' : 'var(--color-vulnerable)'
              }}>
                HTTP {response.status}
              </span>

              {/* Mostrar el veredicto del oráculo si existe */}
              {response.data?.oracle?.verdict && (
                <span className={getVerdictClass(response.data.oracle.verdict)}>
                  {response.data.oracle.verdict}
                </span>
              )}
            </div>

            {/* Cuerpo de la respuesta en JSON formateado */}
            <div className="response-body">
              {JSON.stringify(response.data, null, 2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BolaPage;
