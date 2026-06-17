import { Routes, Route, Link, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import BolaPage from './pages/BolaPage';
import JwtPage from './pages/JwtPage';
import CorsPage from './pages/CorsPage';
import MassAssignmentPage from './pages/MassAssignmentPage';
import MonitorPage from './pages/MonitorPage';

const NAV_ITEMS = [
  { path: '/', label: 'Catálogo' },
  { path: '/bola', label: 'BOLA' },
  { path: '/jwt', label: 'JWT' },
  { path: '/cors', label: 'CORS' },
  { path: '/mass-assignment', label: 'Mass Assign' },
  { path: '/monitor', label: 'Monitor' },
];

function App() {
  const location = useLocation();

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1 className="logo">
            <span className="logo-icon">&#x1f6e1;</span>
            API Security Lab
          </h1>
          <nav className="main-nav">
            {NAV_ITEMS.map(item => (
              <Link key={item.path} to={item.path}
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/bola" element={<BolaPage />} />
          <Route path="/jwt" element={<JwtPage />} />
          <Route path="/cors" element={<CorsPage />} />
          <Route path="/mass-assignment" element={<MassAssignmentPage />} />
          <Route path="/monitor" element={<MonitorPage />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <p>TFM — Máster en Ciberseguridad &middot; Laboratorio de vulnerabilidades en APIs REST</p>
      </footer>
    </div>
  );
}

export default App;
