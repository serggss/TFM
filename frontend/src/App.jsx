/**
 * Componente raíz de la aplicación.
 *
 * Define la estructura general (navegación + rutas) y el enrutamiento
 * entre las distintas páginas del laboratorio:
 *   /           → Página principal con el catálogo de vulnerabilidades.
 *   /bola       → Demo interactiva de BOLA/IDOR con los 3 estados.
 *   /monitor    → Panel de observación con los eventos de seguridad.
 *
 * Se usa react-router-dom v7 para el enrutamiento del lado del cliente.
 * Cada ruta carga un componente de página independiente.
 */
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import BolaPage from './pages/BolaPage';
import MonitorPage from './pages/MonitorPage';

function App() {
  // useLocation para resaltar el enlace activo en la navegación
  const location = useLocation();

  return (
    <div className="app">
      {/* ================================================================
          CABECERA Y NAVEGACIÓN
          ================================================================
          Barra de navegación fija con el nombre del proyecto y los enlaces
          a las secciones principales.
      */}
      <header className="app-header">
        <div className="header-content">
          <h1 className="logo">
            {/* El icono de escudo refuerza la temática de seguridad */}
            <span className="logo-icon">&#x1f6e1;</span>
            API Security Lab
          </h1>
          <nav className="main-nav">
            <Link
              to="/"
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              Catálogo
            </Link>
            <Link
              to="/bola"
              className={`nav-link ${location.pathname === '/bola' ? 'active' : ''}`}
            >
              BOLA/IDOR
            </Link>
            <Link
              to="/monitor"
              className={`nav-link ${location.pathname === '/monitor' ? 'active' : ''}`}
            >
              Monitor
            </Link>
          </nav>
        </div>
      </header>

      {/* ================================================================
          CONTENIDO PRINCIPAL
          ================================================================
          Routes renderiza el componente correspondiente a la URL actual.
      */}
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/bola" element={<BolaPage />} />
          <Route path="/monitor" element={<MonitorPage />} />
        </Routes>
      </main>

      {/* ================================================================
          PIE DE PÁGINA
          ================================================================ */}
      <footer className="app-footer">
        <p>
          TFM — Máster en Ciberseguridad &middot; Laboratorio de vulnerabilidades en APIs REST
        </p>
      </footer>
    </div>
  );
}

export default App;
