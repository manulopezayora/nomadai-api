# Nomad AI — Arquitectura y Contexto del Proyecto

## Visión General

**Nomad AI** es una aplicación inteligente para la planificación de viajes personalizada.
Un planificador de viajes "Zero-Effort" donde el usuario ingresa un prompt en lenguaje natural
(ej. *"10 días en Japón, cultura y relax"*) y la aplicación genera un itinerario completo
dividido por días, mapeado geográficamente en un mapa interactivo y con cotización de vuelos
y hoteles recomendados.

### Concepto Principal

- El usuario describe su viaje en lenguaje natural
- La IA (Google Gemini) genera recomendaciones de vuelos, hoteles e itinerarios
- Se guardan enlaces externos para reservas (vuelos, hoteles, entradas)
- Las actividades se guardan con coordenadas para integración con mapa
- El historial de viajes queda almacenado con el plan día a día

### Lo que NO hace la app (gestión externa)

- **Vuelos**: Solo recomendaciones con enlaces a Google Flights / Skyscanner
- **Hoteles**: Solo recomendaciones con enlaces a Booking.com / Hotels.com
- **Entradas de actividades**: Solo recomendaciones con enlaces de reserva
- **Rutas/itinerarios**: SÍ se guardan en la app con el historial del viaje

---

## Stack Tecnológico

| Capa | Tecnología | Versión | Notas |
|------|-----------|---------|-------|
| **Framework** | NestJS | ^11.0.1 | Backend REST |
| **Language** | TypeScript | ^5.7.3 | |
| **ORM** | Prisma | ^7.9.1 | Mejor que TypeORM para nuevos proyectos (2025-2026) |
| **Base de datos** | PostgreSQL | - | Con campos JSONB y coordenadas lat/lng |
| **IA** | Google Gemini | - | SDK `@google/genai` ^2.15.0 (NO el deprecated `@google/generative-ai`) |
| **Auth** | Passport.js | ^0.7.0 | Estrategias: Local + Google OAuth + JWT |
| **Validación** | class-validator + class-transformer | ^0.14.x | DTOs |
| **Config** | @nestjs/config + Joi | ^4.0.0 | Variables de entorno seguras |
| **Testing** | Jest + Supertest | ^30.0.0 | Unit + E2E |
| **Linting** | ESLint + Prettier | ^9.18.0 | Ya configurado |
| **Mapas (fase 2)** | Leaflet + OpenStreetMap | - | Gratuito, sin API key (alternativa a Google Maps) |
| **Package Manager** | pnpm | - | Con workspace |

### Decisiones Clave de Stack

| Decisión | Alternativa descartada | Motivo |
|----------|----------------------|--------|
| **Prisma > TypeORM** | TypeORM ^1.0 | Prisma tiene mejor DX, type safety, migraciones declarativas, 83% más descargas en npm (2026) |
| **`@google/genai` > `@google/generative-ai`** | `@google/generative-ai` | Deprecated desde agosto 2025. El nuevo SDK soporta Gemini 2.0+ |
| **Leaflet > Google Maps** | Google Maps SDK | Leaflet es gratuito, sin API key, open source. Google Maps requiere billing |
| **Passport.js > custom auth** | Auth manual | Estándar de la industria, bien mantenido, múltiples estrategias |

### Nota sobre Amadeus API

Amadeus cerró su portal Self-Service API el 17 de julio de 2026. Ya no es una opción
viable para vuelos/hoteles. Para el MVP se usan solo recomendaciones de Gemini. En el
futuro, **Duffel API** es la alternativa más accesible (self-serve, sandbox gratuito).

---

## Arquitectura del Sistema

### Patrón Backend

- **BFF (Backend for Frontend)**: El backend sirve como capa intermedia entre el frontend y los servicios de IA/externos
- **Protección de credenciales**: La clave `GEMINI_API_KEY` permanece en el servidor
- **Validación con DTOs y Pipes**: Garantiza que la salida JSON de Gemini cumple el esquema TypeScript antes de enviarla al cliente
- **Streaming (fase 2)**: Server-Sent Events para respuestas progresivas de IA

### Flujo de Datos

```
Frontend (Vue)
    ↓ POST /trips/:id/recommend/itinerary
    ↓ { preferences, dates, destination }
Backend (NestJS)
    ↓ Valida DTO
    ↓ Construye prompt con schema estructurado
    ↓
Google Gemini API
    ↓ Genera respuesta JSON con vuelos, hoteles, actividades
    ↓
Backend (NestJS)
    ↓ Valida respuesta contra schema
    ↓ Guarda en PostgreSQL (con coordenadas lat/lng)
    ↓
Frontend (Vue)
    ↓ Muestra itinerario + mapa (Leaflet)
```

---

## Diseño de Pantallas (UX/UI Workflow)

| # | Pantalla | Descripción |
|---|----------|-------------|
| 1 | **Onboarding / Generador** | Input central tipo "prompt" minimalista con tarjetas de sugerencias predefinidas para capturar la intención del viaje |
| 2 | **Dashboard del Itinerario** | Vista dividida (Split-Screen). A la izquierda, acordeón por días con actividades; a la derecha, mapa interactivo con marcadores y conectores de ruta |
| 3 | **Módulo de Vuelos + Chat Flotante** | Despliegue de opciones de vuelos integradas junto con un asistente virtual flotante para refinamiento en caliente |
| 4 | **Vista Colaborativa y Presupuesto** | Trazado completo de la ruta entre ciudades (ej. Tokio → Kioto → Osaka), lista de colaboradores y desglose gráfico de presupuesto |

---

## Modelo de Datos (Prisma Schema)

### Entidad: User (Usuario)

Almacena la información de cuenta y las preferencias de IA.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String (cuid) | PK |
| email | String (unique) | Email del usuario |
| passwordHash | String? | Hash de contraseña (null si OAuth) |
| firstName | String? | Nombre |
| lastName | String? | Apellido |
| avatarUrl | String? | URL de avatar (de Google OAuth) |
| provider | String | "local" o "google" |
| providerId | String? | ID del proveedor OAuth |
| createdAt | DateTime | Fecha de creación |
| updatedAt | DateTime | Fecha de actualización |

### Entidad: Trip (Viaje)

Representa el viaje creado por el usuario.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String (cuid) | PK |
| userId | String (FK → User) | Usuario propietario |
| title | String | Título del viaje |
| destination | String | Destino principal |
| startDate | DateTime | Fecha de inicio |
| endDate | DateTime | Fecha de fin |
| budget | Float? | Presupuesto estimado |
| travelerCount | Int | Número de viajeros (default 1) |
| preferences | Json | { interests: [], travelStyle: "budget"\|"mid"\|"luxury" } |
| status | String | "planning" \| "active" \| "completed" |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### Entidad: DayPlan (Día de Itinerario)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String (cuid) | PK |
| tripId | String (FK → Trip) | Viaje al que pertenece |
| dayNumber | Int | Número de día (1, 2, 3...) |
| date | DateTime | Fecha del día |
| title | String? | "Llegada a Tokio", "Día en Kioto" |
| notes | String? | Notas adicionales |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### Entidad: Activity (Actividad / Punto en Mapa)

Cada ubicación específica que se renderizará en el mapa.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String (cuid) | PK |
| dayPlanId | String (FK → DayPlan) | Día al que pertenece |
| title | String | Nombre de la actividad |
| description | String? | Descripción detallada |
| location | String? | Nombre del lugar |
| latitude | Float? | Latitud (para Leaflet/OpenStreetMap) |
| longitude | Float? | Longitud (para Leaflet/OpenStreetMap) |
| startTime | String? | Hora de inicio "09:00" |
| endTime | String? | Hora de fin "12:00" |
| cost | Float? | Costo estimado |
| bookingUrl | String? | Link externo para reservar |
| category | String? | "museum" \| "restaurant" \| "temple" \| "shopping" \| "transport" |
| placeId | String? | ID genérico de lugar (reemplaza googlePlaceId) |
| order | Int | Orden dentro del día |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### Entidad: FlightRecommendation (Recomendación de Vuelo)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String (cuid) | PK |
| tripId | String (FK → Trip) | Viaje al que pertenece |
| airline | String | Aerolínea |
| departure | String | Aeropuerto de salida |
| arrival | String | Aeropuerto de llegada |
| departureTime | String | Hora de salida |
| arrivalTime | String | Hora de llegada |
| price | Float? | Precio estimado |
| currency | String | "EUR" (default) |
| bookingUrl | String? | Link a Google Flights / Skyscanner |
| notes | String? | Notas |
| isRecommended | Boolean | Si es la recomendación principal |
| createdAt | DateTime | |

### Entidad: HotelRecommendation (Recomendación de Hotel)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String (cuid) | PK |
| tripId | String (FK → Trip) | Viaje al que pertenece |
| name | String | Nombre del hotel |
| location | String | Ubicación |
| latitude | Float? | Latitud |
| longitude | Float? | Longitud |
| pricePerNight | Float? | Precio por noche |
| currency | String | "EUR" (default) |
| rating | Float? | Valoración |
| amenities | String[] | ["wifi", "pool", "breakfast"] |
| bookingUrl | String? | Link a Booking.com / Hotels.com |
| isRecommended | Boolean | Si es la recomendación principal |
| createdAt | DateTime | |

---

## API Endpoints

### Auth

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/auth/register` | Registro email+contraseña | No |
| POST | `/auth/login` | Login, retorna JWT en cookie | No |
| GET | `/auth/google` | Redirige a Google OAuth | No |
| GET | `/auth/google/callback` | Callback de Google, retorna JWT | No |
| POST | `/auth/logout` | Borra cookie de JWT | Sí |

### Users

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/users/me` | Perfil del usuario actual | Sí |

### Trips

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/trips` | Crear viaje | Sí |
| GET | `/trips` | Listar viajes del usuario | Sí |
| GET | `/trips/:id` | Detalle de viaje con días y actividades | Sí |
| PATCH | `/trips/:id` | Actualizar viaje | Sí |
| DELETE | `/trips/:id` | Eliminar viaje (cascade) | Sí |

### Day Plans

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/trips/:tripId/days` | Añadir día al viaje | Sí |
| PATCH | `/trips/:tripId/days/:dayId` | Actualizar día | Sí |
| DELETE | `/trips/:tripId/days/:dayId` | Eliminar día | Sí |
| POST | `/trips/:tripId/days/:dayId/activities` | Añadir actividad al día | Sí |
| PATCH | `/trips/:tripId/days/:dayId/activities/:activityId` | Actualizar actividad | Sí |
| DELETE | `/trips/:tripId/days/:dayId/activities/:activityId` | Eliminar actividad | Sí |

### Gemini (Recomendaciones IA)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/trips/:tripId/recommend/flights` | Recomendar vuelos con IA | Sí |
| POST | `/trips/:tripId/recommend/hotels` | Recomendar hoteles con IA | Sí |
| POST | `/trips/:tripId/recommend/itinerary` | Generar itinerario día a día | Sí |
| POST | `/trips/:tripId/recommend/activities` | Recomendar actividades | Sí |

---

## Flujo Principal del Usuario

```
1. POST /auth/register  →  Cuenta creada
2. POST /auth/login     →  JWT en cookie httpOnly
3. POST /trips           →  { destination: "Japón", startDate: "2026-04-01", ... }
4. POST /trips/:id/recommend/itinerary  →  Gemini genera plan completo
   → Se guardan: DayPlan[] con Activity[] dentro (con lat/lng)
   → Se guardan: FlightRecommendation[] y HotelRecommendation[]
5. GET /trips/:id        →  Ver plan completo con todos los días
6. PUT/PATCH/DELETE      →  Modificar según preferencias
```

---

## Variables de Entorno (.env)

```env
# Base de datos
DATABASE_URL="postgresql://user:password@localhost:5432/nomadai"

# JWT
JWT_SECRET="tu_secreto_aleatorio_de_64_caracteres"
JWT_EXPIRES_IN="15m"

# Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"

# Google Gemini
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-2.5-flash"

# App
PORT=3000
NODE_ENV="development"
```

---

## Dependencias

### Producción

```bash
pnpm add @nestjs/common @nestjs/core @nestjs/platform-express
pnpm add @nestjs/config @nestjs/passport @nestjs/jwt
pnpm add passport passport-local passport-jwt passport-google-oauth20
pnpm add bcryptjs cookie-parser
pnpm add @google/genai
pnpm add class-validator class-transformer
pnpm add @nestjs/throttler
pnpm add reflect-metadata rxjs
```

### Desarrollo

```bash
pnpm add -D prisma @prisma/client @prisma/adapter-pg pg
pnpm add -D @types/passport-local @types/passport-jwt @types/passport-google-oauth20
pnpm add -D @types/cookie-parser @types/bcryptjs
```

---

## Estructura de Directorios

```
nomadai-api/
├── docs/
│   └── ARCHITECTURE.md          # Este archivo
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   │   └── env.validation.ts    # Validación de variables de entorno con Joi
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts    # PrismaClient como Provider NestJS
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── dto/
│   │   ├── strategies/
│   │   ├── guards/
│   │   └── decorators/
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.service.ts
│   │   └── users.controller.ts
│   ├── trips/
│   │   ├── trips.module.ts
│   │   ├── trips.controller.ts
│   │   ├── trips.service.ts
│   │   └── dto/
│   └── gemini/
│       ├── gemini.module.ts
│       ├── gemini.service.ts
│       ├── dto/
│       ├── schemas/
│       └── gemini-exception.filter.ts
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── prisma/
│   └── schema.prisma
├── .env
├── .env.example
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
├── eslint.config.mjs
├── .prettierrc
└── pnpm-workspace.yaml
```

---

## Plan de Implementación (Orden)

| Paso | Descripción | Archivos aprox. |
|------|-------------|-----------------|
| 1 | **Documentación** — Crear docs/ARCHITECTURE.md | 1 |
| 2 | **Prisma + DB** — Schema, PrismaService, migración inicial | 3 |
| 3 | **Config** — Variables de entorno validadas con Joi | 2 |
| 4 | **Users** — CRUD básico | 3 |
| 5 | **Auth** — Register/Login + Google OAuth + JWT | ~10 |
| 6 | **Trips** — CRUD de viajes | 4 |
| 7 | **Day Plans + Activities** — Planificación día a día con lat/lng | 5 |
| 8 | **Gemini Module** — Integración con Google Gemini | 5 |
| 9 | **Recommendations** — Endpoints de recomendación (vuelos, hoteles, itinerario) | 4 |
| 10 | **Hardening** — Rate limiting, validación de env, filtros de excepción | 2 |

---

## Docker (Desarrollo Local)

### Archivos Docker

| Archivo | Propósito |
|---------|-----------|
| `Dockerfile` | Build multi-stage para producción (deps → build → runner) |
| `Dockerfile.dev` | Imagen de desarrollo con hot-reload |
| `docker-compose.yml` | Composición: app + PostgreSQL |
| `.dockerignore` | Excluir archivos del contexto Docker |
| `.env.example` | Template de variables de entorno (se sube a git) |
| `.env.docker` | Variables para Docker (gitignored) |

### Servicios

| Servicio | Imagen | Puerto | Descripción |
|----------|--------|--------|-------------|
| **postgres** | `postgres:16-alpine` | 5432 | Base de datos con volumen persistente |
| **app** | `node:22-alpine` (custom) | 3000, 9229 | NestJS con hot-reload |

### Comandos

```bash
# Primera vez: levantar todo
docker compose up --build

# En segundo plano
docker compose up -d

# Ver logs
docker compose logs -f app

# Parar todo
docker compose down

# Resetear base de datos
docker compose down -v

# Rebuild después de cambiar package.json
docker compose up --build

# Shell en el container de la app
docker exec -it nomadai-app sh

# Shell en PostgreSQL
docker exec -it nomadai-postgres psql -U postgres -d nomadai

# Prisma Studio (GUI en localhost:5555)
docker exec -it nomadai-app pnpm prisma studio

# Crear migración
docker exec -it nomadai-app pnpm prisma migrate dev --name nombre_migracion
```

### Variables de Entorno para Docker

**IMPORTANTE:** Dentro de Docker, `localhost` se refiere al container, NO al host.
El `DATABASE_URL` debe usar el nombre del servicio Docker como hostname:

```env
# Dentro de Docker: usar "postgres" como host
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/nomadai?schema=public"

# Fuera de Docker (local): usar "localhost"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nomadai?schema=public"
```

### Gotchas Evitados

| Problema | Solución |
|----------|----------|
| `node_modules` del host sobreescribe los del container | Volumen anónimo: `- /app/node_modules` |
| Prisma no encuentra `musl` en Alpine | No instalar `libc6-compat` |
| Builds no reproducibles | Usar `--frozen-lockfile` |
| App arranca antes que la DB | `depends_on` con `condition: service_healthy` |
| Container corre como root | Non-root user en Dockerfile de producción |
| Secrets en el historial de git | `.env` en `.gitignore`, solo `.env.example` se sube |

---

## Fases Futuras

| Fase | Funcionalidad |
|------|---------------|
| **Fase 2** | Leaflet/OpenStreetMap integrado, Streaming SSE, Chat flotante con IA |
| **Fase 3** | Duffel API para precios reales de vuelos/hoteles, Favoritos, Compartir viajes |
| **Fase 4** | Frontend Vue completo, Notificaciones, Modo offline |

---

## Referencias

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Google Gemini SDK (Node.js)](https://googleapis.github.io/js-genai/)
- [Leaflet Documentation](https://leafletjs.com/reference.html)
- [Passport.js Strategies](https://www.passportjs.org/)
- [NestJS + Prisma](https://www.prisma.io/docs/guides/frameworks/nestjs)
