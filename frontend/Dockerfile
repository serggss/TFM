# =============================================================================
# Dockerfile del frontend — Multi-stage build
# =============================================================================
# Etapa 1 (build): compila la app React con Vite (genera ficheros estáticos).
# Etapa 2 (runtime): sirve los ficheros con nginx (servidor web ligero).
#
# ¿Por qué nginx y no "npm run preview"?
#   - nginx es un servidor web probado en producción, no una herramienta de dev.
#   - Consume menos recursos (~5MB RAM vs ~100MB para Node).
#   - Permite configurar el proxy al backend en un solo sitio.
#   - Es la práctica estándar para SPAs en Docker.
# =============================================================================

# --- Etapa 1: Build ---
FROM node:20-alpine AS build

WORKDIR /app

# Copiar package.json y lock file primero para cachear npm install
COPY package.json package-lock.json* ./
RUN npm install

# Copiar el resto del código y compilar
COPY . .
RUN npm run build

# --- Etapa 2: Servir con nginx ---
FROM nginx:alpine

# Copiar la configuración de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los ficheros estáticos generados por Vite
COPY --from=build /app/dist /usr/share/nginx/html

# Puerto estándar de nginx
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
