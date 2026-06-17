/**
 * Página principal — Catálogo de vulnerabilidades.
 *
 * Muestra las 6 vulnerabilidades del laboratorio en una cuadrícula de tarjetas.
 * Cada tarjeta muestra:
 *   - Nombre y referencias OWASP (API 2023 + Web 2025).
 *   - Descripción breve.
 *   - Estado de implementación (implementada o pendiente).
 *
 * Los datos se cargan del backend al montar el componente.
 * Las vulnerabilidades implementadas son clicables (llevan a su demo).
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getVulnerabilities } from '../api/client';

function HomePage() {
  // Estado local: lista de vulnerabilidades cargadas del backend
  const [vulnerabilities, setVulnerabilities] = useState([]);
  // Estado de carga para mostrar un spinner o mensaje mientras se piden datos
  const [loading, setLoading] = useState(true);

  // useEffect con [] se ejecuta solo al montar el componente (equivalente a
  // componentDidMount en componentes de clase). Pide el catálogo al backend.
  useEffect(() => {
    getVulnerabilities()
      .then(data => {
        setVulnerabilities(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error cargando catálogo:', err);
        setLoading(false);
      });
  }, []);

  // Mapa de slugs a rutas del frontend.
  // Solo las vulnerabilidades implementadas tienen ruta.
  const slugToRoute = {
    'bola': '/bola',
    'jwt': '/jwt',
    'cors': '/cors',
    'mass-assignment': '/mass-assignment',
    'exceptions': '/exceptions',
    'prompt-injection': '/prompt-injection',
  };

  if (loading) {
    return <p className="text-muted">Cargando catálogo de vulnerabilidades...</p>;
  }

  return (
    <div>
      {/* Título y descripción de la página */}
      <h2 className="section-title">Catálogo de Vulnerabilidades</h2>
      <p className="section-subtitle">
        6 vulnerabilidades de APIs REST modernas, cada una con tres estados de
        mitigación (vulnerable → parcial → corregido). Referenciadas a
        OWASP API Top 10 2023 y OWASP Top 10 2025.
      </p>

      {/* Cuadrícula de tarjetas de vulnerabilidades */}
      <div className="vuln-grid">
        {vulnerabilities.map(vuln => {
          // Determinar si la tarjeta es clicable
          const route = slugToRoute[vuln.slug];
          const isClickable = vuln.implemented && route;

          // El contenido de la tarjeta es el mismo sea o no clicable
          const cardContent = (
            <>
              <div className="vuln-card-header">
                <div>
                  <h3>#{vuln.id} — {vuln.name}</h3>
                  <div className="vuln-refs">
                    {vuln.owaspApiRef} · {vuln.owaspWebRef}
                  </div>
                </div>
                <span className={`vuln-badge ${
                  vuln.implemented ? 'vuln-badge-implemented' : 'vuln-badge-pending'
                }`}>
                  {vuln.implemented ? 'Implementada' : 'Pendiente'}
                </span>
              </div>
              <p>{vuln.description}</p>
            </>
          );

          // Si está implementada, envolver en Link para navegar a la demo
          if (isClickable) {
            return (
              <Link key={vuln.id} to={route} className="vuln-card">
                {cardContent}
              </Link>
            );
          }

          // Si no está implementada, renderizar como tarjeta no clicable
          return (
            <div key={vuln.id} className="vuln-card" style={{ opacity: 0.6 }}>
              {cardContent}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default HomePage;
