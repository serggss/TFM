# API Security Lab — TFM Ciberseguridad

Laboratorio educativo de vulnerabilidades en APIs REST con modelo de tres estados (vulnerable / partial / fixed).

## Requisitos

- Java 21 (LTS)
- Maven 3.9+
- Node.js 20+
- Docker y Docker Compose (opcional, para despliegue)

## Arranque rápido (desarrollo local)

### Backend

```bash
cd backend
mvn spring-boot:run
```

El backend arranca en `http://localhost:8080`.
La consola H2 está disponible en `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:apiseclab`).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend arranca en `http://localhost:5173`. Las peticiones a `/api/*` se redirigen al backend automáticamente (proxy de Vite).

## Arranque con Docker

```bash
docker-compose up --build
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8080`

## Vulnerabilidades implementadas

| # | Vulnerabilidad | Estado |
|---|----------------|--------|
| 1 | BOLA / IDOR | Implementada |
| 2 | JWT mal implementado | Pendiente (Semana 2) |
| 3 | CORS mal configurado | Pendiente (Semana 2) |
| 4 | Mass Assignment / BOPLA | Pendiente (Semana 2) |
| 5 | Mishandling of Exceptional Conditions | Pendiente (Semana 3) |
| 6 | Prompt Injection en API con LLM | Pendiente (Semana 3) |

## Endpoints BOLA/IDOR

### Estado vulnerable
```
GET /api/bola/vulnerable/accounts/{id}
GET /api/bola/vulnerable/accounts
```

### Estado partial (bypass vía búsqueda)
```
GET /api/bola/partial/accounts/{id}        # protegido
GET /api/bola/partial/accounts?ownerId=X   # BYPASS — no valida ownerId
```

### Estado fixed
```
GET /api/bola/fixed/accounts/{id}
GET /api/bola/fixed/accounts               # ignora parámetro ownerId
```

### Monitor
```
GET /api/monitor/events
GET /api/monitor/events?vulnerability=BOLA
```

### Catálogo
```
GET /api/vulnerabilities
GET /api/vulnerabilities/{slug}
```

## Autenticación (Semana 1)

Se simula con la cabecera `X-User-Id`. Ejemplo:

```bash
curl -H "X-User-Id: 2" http://localhost:8080/api/bola/vulnerable/accounts/1
```

En Semana 2 se reemplaza por JWT.
