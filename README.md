# API Security Lab — TFM Ciberseguridad

Laboratorio educativo de vulnerabilidades en APIs REST con modelo de tres estados (vulnerable / partial / fixed) y capa de observación con fingerprinting de clientes.

## Arranque rápido (Docker — recomendado)

Requisito: [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo.

```bash
git clone <url-del-repo>
cd api-security-lab
docker compose up --build
```

El primer build tarda ~3-5 minutos (Maven descarga dependencias). Los siguientes arranques son inmediatos.

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080

El frontend espera automáticamente a que el backend esté listo antes de arrancar.

### Solo el backend

```bash
docker compose -f docker-compose.backend.yml up --build
```

Útil para probar la API con Postman, curl o cualquier cliente externo.

### Solo el frontend

```bash
docker compose -f docker-compose.frontend.yml up --build
```

Requiere que el backend esté corriendo en `localhost:8080` (ya sea con `mvn spring-boot:run` o con el compose del backend). El nginx del contenedor redirige `/api/` al host automáticamente.

## Arranque sin Docker (desarrollo local)

Requisitos: Java 21, Maven 3.9+, Node.js 20+

```bash
# Terminal 1 — backend
cd backend
mvn spring-boot:run
# → http://localhost:8080

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

## Catálogo de vulnerabilidades (6/6 implementadas)

| # | Vulnerabilidad | OWASP API 2023 | OWASP Web 2025 | Bypass del estado partial |
|---|----------------|----------------|-----------------|---------------------------|
| 1 | BOLA / IDOR | API1:2023 | A01:2025 | Endpoint de búsqueda sin validación de ownerId |
| 2 | JWT mal implementado | API2:2023 | A01/A07:2025 | Acepta tokens con alg=none (sin firma) |
| 3 | CORS mal configurado | API8:2023 | A01/A02:2025 | Validación con contains("localhost") |
| 4 | Mass Assignment / BOPLA | API3:2023 | A01:2025 | Blocklist olvida verified y discount |
| 5 | Mishandling of Exceptions | API8:2023 | A10:2025 (nueva) | Fail-open: isAuthorized inicializado a true |
| 6 | Prompt Injection | LLM01 | A06:2025 | Filtro solo en inglés, bypass en español |

## Endpoints

### BOLA/IDOR (#1)
```
GET /api/bola/{state}/accounts/{id}
GET /api/bola/{state}/accounts[?ownerId=X]
```

### JWT (#2)
```
POST /api/auth/login                          # body: {"username","password"}
GET  /api/auth/forge-none/{userId}            # herramienta de ataque
GET  /api/jwt/{state}/profile                 # header: X-Auth-Token: <token>
```

Usuarios: alicia/password123, roberto/password456, carlos/password789, admin/admin

### CORS (#3)
```
GET /api/cors/{state}/data                    # header: Origin
```

### Mass Assignment (#4)
```
GET  /api/mass-assignment/{state}/profile/{id}
PUT  /api/mass-assignment/{state}/profile/{id}
POST /api/mass-assignment/{state}/profile/{id}/reset
```

### Mishandling of Exceptions (#5)
```
GET /api/exceptions/{state}/admin/config      # header: X-User-Id
```

### Prompt Injection (#6)
```
POST /api/prompt-injection/{state}/summarize  # body: {"text": "..."}
```

### Monitor (capa de observación)
```
GET    /api/monitor/events[?vulnerability=X&state=Y]
GET    /api/monitor/stats
POST   /api/monitor/events/clear
```

### Visor de diffs
```
GET /api/diffs
GET /api/diffs/{slug}
```

### Catálogo
```
GET /api/vulnerabilities
GET /api/vulnerabilities/{slug}
```

## Modelo de tres estados

`{state}` = vulnerable | partial | fixed

- **vulnerable**: sin protección.
- **partial**: mitigación parcial con bypass demostrable (aportación central del TFM).
- **fixed**: mitigación completa.

## Stack

- Backend: Java 21, Spring Boot 4.1.0, Maven, H2 en memoria, JJWT
- Frontend: React 19, Vite 6, React Router 7
- Despliegue: Docker + Docker Compose v2
