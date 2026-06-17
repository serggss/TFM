# API Security Lab — TFM Ciberseguridad

Laboratorio educativo de vulnerabilidades en APIs REST con modelo de tres estados (vulnerable / partial / fixed).

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

Backend en `http://localhost:8080`. Consola H2 en `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:apiseclab`).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend en `http://localhost:5173`.

## Arranque con Docker

```bash
docker-compose up --build
```

Frontend: `http://localhost:3000` · Backend: `http://localhost:8080`

## Vulnerabilidades implementadas

| # | Vulnerabilidad | Estado | Semana |
|---|----------------|--------|--------|
| 1 | BOLA / IDOR | Implementada | 1 |
| 2 | JWT mal implementado | Implementada | 2 |
| 3 | CORS mal configurado | Implementada | 2 |
| 4 | Mass Assignment / BOPLA | Implementada | 2 |
| 5 | Mishandling of Exceptional Conditions | Pendiente | 3 |
| 6 | Prompt Injection en API con LLM | Pendiente | 3 |

## Endpoints

### BOLA/IDOR (#1)
```
GET /api/bola/{state}/accounts/{id}
GET /api/bola/{state}/accounts              # búsqueda (bypass en partial via ?ownerId=X)
```

### JWT (#2)
```
POST /api/auth/login                        # obtener token (body: username, password)
GET  /api/auth/forge-none/{userId}          # generar token alg=none (herramienta de ataque)
GET  /api/jwt/{state}/profile               # acceder a perfil con JWT (header: Authorization: Bearer)
```

Usuarios: alice/password123, bob/password456, charlie/password789, admin/admin

### CORS (#3)
```
GET /api/cors/{state}/data                  # datos sensibles con headers CORS según estado
```

Bypass partial: Origin que contenga "localhost" (ej: `https://localhost.evil.com`)

### Mass Assignment (#4)
```
GET  /api/mass-assignment/{state}/profile/{id}
PUT  /api/mass-assignment/{state}/profile/{id}   # actualizar perfil
POST /api/mass-assignment/{state}/profile/{id}/reset
```

Campos protegidos: role, balance, verified, discount. Partial solo bloquea role y balance.

### Monitor
```
GET    /api/monitor/events
GET    /api/monitor/events?vulnerability=BOLA
DELETE /api/monitor/events
```

### Catálogo
```
GET /api/vulnerabilities
GET /api/vulnerabilities/{slug}
```

## Modelo de tres estados

Cada vulnerabilidad tiene tres variantes (`{state}` = vulnerable | partial | fixed):

- **vulnerable**: sin protección, el ataque siempre funciona.
- **partial**: mitigación parcial con bypass demostrable (aportación central del TFM).
- **fixed**: mitigación completa.
