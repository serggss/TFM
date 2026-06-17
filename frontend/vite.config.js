import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Configuración de Vite para el frontend del laboratorio.
 *
 * El proxy de desarrollo reenvía las peticiones /api/* al backend
 * Spring Boot (localhost:8080). Esto evita problemas de CORS durante
 * el desarrollo local sin necesidad de configuraciones especiales.
 *
 * En producción (Docker), nginx hace este mismo proxy.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    // Puerto del servidor de desarrollo de Vite
    port: 5173,
    proxy: {
      // Todas las peticiones a /api/* se reenvían al backend
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
