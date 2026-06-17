/**
 * Punto de entrada del frontend React.
 *
 * Monta la aplicación dentro del div#root del index.html.
 * Se usa createRoot (React 19) en vez del antiguo ReactDOM.render.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './App.css';

// BrowserRouter envuelve la app para habilitar el enrutamiento por URL.
// Esto permite tener /bola, /monitor, etc. como rutas navegables.
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
