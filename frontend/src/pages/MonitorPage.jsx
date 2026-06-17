/**
 * Página del Monitor de Eventos de Seguridad.
 *
 * Muestra una tabla con todos los eventos registrados por la capa de
 * observación del laboratorio. Cada fila representa una petición a un
 * endpoint de vulnerabilidad e incluye:
 *   - Timestamp (cuándo).
 *   - Vulnerabilidad y estado (qué).
 *   - Endpoint y método (dónde).
 *   - Fingerprint del cliente (quién).
 *   - Resultado del oráculo (qué pasó).
 *   - Descripción (resumen legible).
 *
 * El auto-refresh (polling cada 3 segundos) permite ver los eventos
 * en "tiempo real" mientras se interactúa con la demo de BOLA en
 * otra pestaña del navegador.
 *
 * NOTA: En Semana 3 se añadirán filtros avanzados, gráficos de
 * distribución de ataques, y análisis de patrones de fingerprinting.
 */
import { useEffect, useState } from 'react';
import { getMonitorEvents } from '../api/client';

function MonitorPage() {
  // Lista de eventos cargados del backend
  const [events, setEvents] = useState([]);
  // Filtro activo (por vulnerabilidad)
  const [filter, setFilter] = useState('');
  // Indicador de carga inicial
  const [loading, setLoading] = useState(true);

  /**
   * Función para cargar los eventos del monitor.
   * Se llama al montar el componente y cada 3 segundos (polling).
   */
  const loadEvents = async () => {
    try {
      const filters = {};
      if (filter) filters.vulnerability = filter;
      const data = await getMonitorEvents(filters);
      setEvents(data);
    } catch (err) {
      console.error('Error cargando eventos:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carga inicial + polling cada 3 segundos
  useEffect(() => {
    loadEvents();

    // setInterval devuelve un ID que usamos para limpiar al desmontar.
    // Esto evita memory leaks si el usuario navega a otra página.
    const intervalId = setInterval(loadEvents, 3000);

    // Cleanup: se ejecuta al desmontar el componente
    return () => clearInterval(intervalId);
  }, [filter]); // Se re-ejecuta si cambia el filtro

  /**
   * Formatea un timestamp ISO a una hora legible.
   * Solo muestra hora:minuto:segundo para no ocupar mucho ancho.
   */
  const formatTime = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div>
      {/* ================================================================
          TÍTULO Y DESCRIPCIÓN
          ================================================================ */}
      <h2 className="section-title">Monitor de Eventos de Seguridad</h2>
      <p className="section-subtitle">
        Registro en tiempo real de todas las peticiones a los endpoints del
        laboratorio. Cada evento incluye el veredicto del oráculo y un
        fingerprint básico del cliente atacante.
        <br />
        <span className="text-muted">
          Auto-refresh cada 3 segundos · {events.length} evento(s) registrado(s)
        </span>
      </p>

      {/* ================================================================
          FILTROS
          ================================================================ */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="form-group" style={{ maxWidth: '300px' }}>
          <label>Filtrar por vulnerabilidad:</label>
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">Todas</option>
            <option value="BOLA">BOLA / IDOR</option>
            <option value="JWT">JWT</option>
            <option value="CORS">CORS</option>
            <option value="MASS_ASSIGNMENT">Mass Assignment</option>
          </select>
        </div>
      </div>

      {/* ================================================================
          TABLA DE EVENTOS
          ================================================================
          Cada fila es un SecurityEvent del backend.
          Los colores ayudan a identificar rápidamente:
            - Estado (rojo/naranja/verde).
            - Resultado (rojo = ataque exitoso, verde = bloqueado).
      */}
      {loading ? (
        <p className="text-muted">Cargando eventos...</p>
      ) : events.length === 0 ? (
        <div className="card">
          <p className="text-muted">
            No hay eventos registrados. Ejecuta algún ataque en la página de
            BOLA/IDOR para ver los eventos aquí.
          </p>
        </div>
      ) : (
        <div className="monitor-table-wrapper">
          <table className="monitor-table">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Vuln</th>
                <th>Estado</th>
                <th>Método</th>
                <th>Endpoint</th>
                <th>Cliente</th>
                <th>Resultado</th>
                <th>Descripción</th>
              </tr>
            </thead>
            <tbody>
              {events.map(event => (
                <tr key={event.id}>
                  {/* Timestamp formateado */}
                  <td className="mono">{formatTime(event.timestamp)}</td>

                  {/* Nombre de la vulnerabilidad */}
                  <td><strong>{event.vulnerability}</strong></td>

                  {/* Estado con badge coloreado */}
                  <td>
                    <span className={`state-badge state-badge-${event.state}`}>
                      {event.state}
                    </span>
                  </td>

                  {/* Método HTTP */}
                  <td className="mono">{event.method}</td>

                  {/* Endpoint (ruta) */}
                  <td className="mono" style={{ fontSize: '0.8rem' }}>
                    {event.endpoint}
                  </td>

                  {/* Fingerprint del cliente */}
                  <td>
                    <span className="mono" style={{ fontSize: '0.8rem' }}>
                      {event.clientFingerprint || '-'}
                    </span>
                  </td>

                  {/* Resultado del ataque (éxito/fallo) */}
                  <td>
                    <span className={`attack-indicator ${
                      event.attackSuccess ? 'attack-success' : 'attack-failed'
                    }`}>
                      {event.attackSuccess ? 'ÉXITO' : 'BLOQ.'}
                    </span>
                  </td>

                  {/* Descripción legible */}
                  <td style={{ fontSize: '0.8rem', maxWidth: '300px' }}>
                    {event.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default MonitorPage;
