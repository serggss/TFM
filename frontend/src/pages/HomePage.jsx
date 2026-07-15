import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getVulnerabilities } from '../api/client';

function HomePage() {
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [loading, setLoading] = useState(true);

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
      <h2 className="section-title">Catálogo de Vulnerabilidades</h2>
      <p className="section-subtitle">
        6 vulnerabilidades de APIs REST modernas, cada una con tres estados de
        mitigación (vulnerable → parcial → corregido). Referenciadas a
        OWASP API Top 10 2023 y OWASP Top 10 2025.
      </p>

      <div className="vuln-grid">
        {vulnerabilities.map(vuln => {
          const route = slugToRoute[vuln.slug];

          const cardContent = (
            <>
              <div className="vuln-card-header">
                <div>
                  <h3>#{vuln.id} — {vuln.name}</h3>
                  <div className="vuln-refs">
                    {vuln.owaspApiRef} · {vuln.owaspWebRef}
                  </div>
                </div>
              </div>
              <p>{vuln.description}</p>
            </>
          );

          if (route) {
            return (
              <Link key={vuln.id} to={route} className="vuln-card">
                {cardContent}
              </Link>
            );
          }

          return (
            <div key={vuln.id} className="vuln-card">
              {cardContent}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default HomePage;
