/**
 * Cliente HTTP para comunicarse con el backend del laboratorio.
 *
 * Centraliza todas las llamadas al API REST en un solo módulo para:
 *   1. No repetir la URL base en cada componente.
 *   2. Manejar la cabecera X-User-Id (autenticación simulada) en un solo sitio.
 *   3. Facilitar el cambio a JWT en Semana 2 (solo hay que modificar este fichero).
 *
 * Usa fetch() nativo del navegador (no axios/ky) porque:
 *   - Es una dependencia menos que mantener.
 *   - Para las peticiones simples de este laboratorio, fetch es suficiente.
 *   - El estudiante ve exactamente qué se envía al servidor.
 *
 * La URL base es relativa ("/api/...") porque Vite proxy (en desarrollo)
 * y nginx (en Docker) reenvían las peticiones al backend automáticamente.
 */

// =========================================================================
//  BOLA / IDOR — Endpoints de la vulnerabilidad #1
// =========================================================================

/**
 * Obtiene una cuenta por ID en un estado concreto.
 *
 * @param {string} state - "vulnerable", "partial" o "fixed".
 * @param {number} accountId - ID de la cuenta a consultar.
 * @param {number|null} userId - ID del usuario autenticado (cabecera X-User-Id).
 * @returns {Promise<Object>} Respuesta del servidor (datos + oráculo).
 */
export async function getAccount(state, accountId, userId) {
  // Construimos las cabeceras de la petición
  const headers = {};

  // X-User-Id simula la autenticación. Si es null, la petición es anónima.
  // El backend decide qué hacer con peticiones sin autenticación.
  if (userId !== null && userId !== undefined) {
    headers['X-User-Id'] = String(userId);
  }

  const response = await fetch(`/api/bola/${state}/accounts/${accountId}`, {
    method: 'GET',
    headers,
  });

  // Devolvemos tanto el body como el status para que el componente
  // pueda mostrar errores (403, 401, 404) y respuestas exitosas.
  const data = await response.json().catch(() => null);
  return {
    status: response.status,
    ok: response.ok,
    data,
  };
}

/**
 * Lista/busca cuentas en un estado concreto.
 *
 * En el estado "partial", el parámetro ownerId es el VECTOR DE BYPASS:
 * permite consultar cuentas de otro usuario sin que se valide.
 *
 * En el estado "fixed", el parámetro ownerId se IGNORA por el backend.
 *
 * @param {string} state - "vulnerable", "partial" o "fixed".
 * @param {number|null} userId - ID del usuario autenticado.
 * @param {number|null} targetOwnerId - ID del propietario a buscar (para bypass).
 * @returns {Promise<Object>} Respuesta con la lista de cuentas.
 */
export async function searchAccounts(state, userId, targetOwnerId) {
  const headers = {};
  if (userId !== null && userId !== undefined) {
    headers['X-User-Id'] = String(userId);
  }

  // Construir la URL con el query parameter de búsqueda
  let url = `/api/bola/${state}/accounts`;
  if (targetOwnerId !== null && targetOwnerId !== undefined) {
    url += `?ownerId=${targetOwnerId}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  const data = await response.json().catch(() => null);
  return {
    status: response.status,
    ok: response.ok,
    data,
  };
}

// =========================================================================
//  CATÁLOGO DE VULNERABILIDADES
// =========================================================================

/**
 * Obtiene el catálogo completo de vulnerabilidades con metadatos.
 * Se usa en la página principal para listar las 6 vulnerabilidades.
 */
export async function getVulnerabilities() {
  const response = await fetch('/api/vulnerabilities');
  return response.json();
}

/**
 * Obtiene los metadatos de una vulnerabilidad concreta por slug.
 */
export async function getVulnerabilityBySlug(slug) {
  const response = await fetch(`/api/vulnerabilities/${slug}`);
  return response.json();
}

// =========================================================================
//  MONITOR DE EVENTOS
// =========================================================================

/**
 * Obtiene los eventos de seguridad del monitor.
 *
 * @param {Object} filters - Filtros opcionales.
 * @param {string} filters.vulnerability - Filtrar por vulnerabilidad (ej: "BOLA").
 * @param {string} filters.state - Filtrar por estado (ej: "partial").
 * @returns {Promise<Array>} Lista de SecurityEvent.
 */
export async function getMonitorEvents(filters = {}) {
  const params = new URLSearchParams();
  if (filters.vulnerability) params.set('vulnerability', filters.vulnerability);
  if (filters.state) params.set('state', filters.state);

  const queryString = params.toString();
  const url = `/api/monitor/events${queryString ? '?' + queryString : ''}`;

  const response = await fetch(url);
  return response.json();
}
