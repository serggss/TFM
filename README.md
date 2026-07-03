# API Security Lab — TFM Ciberseguridad

Laboratorio educativo de vulnerabilidades en APIs REST con modelo de tres estados (vulnerable / partial / fixed) y capa de observación con fingerprinting de clientes.

## Requisitos

- Java 21 (LTS)
- Maven 3.9+
- Node.js 20+
- Docker y Docker Compose (opcional)

## Arranque rápido

### Backend

```bash
cd backend
mvn spring-boot:run
```

Backend en http://localhost:8080

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend en http://localhost:5173

### Docker

```bash
docker-compose up --build
```

Frontend: http://localhost:3000 · Backend: http://localhost:8080

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
- Despliegue: Docker + docker-compose
