# Nomad AI — Arquitectura y Contexto del Proyecto

## Visión General

**Nomad AI** es una aplicación inteligente para la planificación de viajes personalizada.
Un planificador de viajes "Zero-Effort" donde el usuario ingresa un prompt en lenguaje natural
(ej. _"10 días en Japón, cultura y relax"_) y la aplicación genera un itinerario completo
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

| Capa                | Tecnología                          | Versión | Notas                                                                  |
| ------------------- | ----------------------------------- | ------- | ---------------------------------------------------------------------- |
| **Framework**       | NestJS                              | ^11.0.1 | Backend REST                                                           |
| **Language**        | TypeScript                          | ^5.7.3  |                                                                        |
| **ORM**             | Prisma                              | ^7.9.1  | Mejor que TypeORM para nuevos proyectos (2025-2026)                    |
| **Base de datos**   | PostgreSQL                          | -       | Con campos JSONB y coordenadas lat/lng                                 |
| **IA**              | Google Gemini                       | -       | SDK `@google/genai` ^2.15.0 (NO el deprecated `@google/generative-ai`) |
| **Auth**            | Passport.js                         | ^0.7.0  | Estrategias: Local + Google OAuth + JWT                                |
| **Validación**      | class-validator + class-transformer | ^0.14.x | DTOs                                                                   |
| **Config**          | @nestjs/config + Joi                | ^4.0.0  | Variables de entorno seguras                                           |
| **Testing**         | Jest + Supertest                    | ^30.0.0 | Unit + E2E                                                             |
| **Linting**         | ESLint + Prettier                   | ^9.18.0 | Ya configurado                                                         |
| **API Docs**        | @nestjs/swagger                     | ^11.4.6 | OpenAPI 3.0 docs en `/api`                                             |
| **Mapas (fase 2)**  | Leaflet + OpenStreetMap             | -       | Gratuito, sin API key (alternativa a Google Maps)                      |
| **Package Manager** | pnpm                                | -       | Con workspace                                                          |

### Decisiones Clave de Stack

| Decisión                                      | Alternativa descartada  | Motivo                                                                                        |
| --------------------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------- |
| **Prisma > TypeORM**                          | TypeORM ^1.0            | Prisma tiene mejor DX, type safety, migraciones declarativas, 83% más descargas en npm (2026) |
| **`@google/genai` > `@google/generative-ai`** | `@google/generative-ai` | Deprecated desde agosto 2025. El nuevo SDK soporta Gemini 2.0+                                |
| **Leaflet > Google Maps**                     | Google Maps SDK         | Leaflet es gratuito, sin API key, open source. Google Maps requiere billing                   |
| **Passport.js > custom auth**                 | Auth manual             | Estándar de la industria, bien mantenido, múltiples estrategias                               |

### Nota sobre Prisma 7 + tsx

El proyecto usa `tsx` como runtime de desarrollo (en lugar de `nest start:watch`) para
compatibilidad con Prisma 7 `prisma-client` generator que genera código ESM con `import.meta.url`.

**Implicación para Swagger:** `tsx` usa `esbuild` que NO emite `emitDecoratorMetadata`.
Por eso `@ApiBody({ type: DtoClass })` causa circular dependency. La solución es usar
schemas inline: `@ApiBody({ schema: { ... } })`. Ver `AGENTS.md` para más detalles.

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

| #                     | Pantalla                                                                                 | Descripción                                                                                                    | Backend      |
| --------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------ |
| 1                     | **Login / Registro**                                                                     | Formulario de login con email/contraseña                                                                       | Sin cambios  |
| 2                     | **Onboarding / Generador**                                                               | Input de prompt en lenguaje natural → `POST /trips/generate`                                                   | Implementado |
| 3                     | **Dashboard de Viajes**                                                                  | Lista de viajes del usuario con tarjetas de portada (imágenes via Unsplash en frontend)                        | Sin cambios  |
| 4                     | **Itinerario + Mapa**                                                                    | Vista dividida: timeline de días/actividades + mapa con marcadores. `GET /trips/:id` retorna dayPlans anidados | Enriquecido  |
| 5                     | **Recomendaciones de Vuelos**                                                            | Tarjetas de vuelos con aerolínea, horarios, precio, escalas. Schema extendido con flightNumber, stops, etc.    | Extendido    |
| 6                     | **Recomendaciones de Hoteles**                                                           | Tarjetas de hoteles con fotos, precio, rating, barrio. Schema extendido con neighborhood, imageUrl, etc.       | Extendido    |
| 7 **Detalle del Día** | Timeline de actividades del día con badges de categoría, mapa con ruta, costos estimados | Refactorizado                                                                                                  |
| 8                     | **Perfil / Settings**                                                                    | Edición de nombre, apellido, foto de perfil. Email read-only.                                                  | Sin cambios  |

---

## Modelo de Datos (Prisma Schema)

### Entidad: User (Usuario)

Almacena la información de cuenta y las preferencias de IA.

| Campo        | Tipo            | Descripción                        |
| ------------ | --------------- | ---------------------------------- |
| id           | String (cuid)   | PK                                 |
| email        | String (unique) | Email del usuario                  |
| passwordHash | String?         | Hash de contraseña (null si OAuth) |
| firstName    | String?         | Nombre                             |
| lastName     | String?         | Apellido                           |
| avatarUrl    | String?         | URL de avatar (de Google OAuth)    |
| provider     | String          | "local" o "google"                 |
| providerId   | String?         | ID del proveedor OAuth             |
| role         | UserRole (enum) | "USER" o "ADMIN" (default: USER)   |
| isActive     | Boolean         | Soft delete (default: true)        |
| createdAt    | DateTime        | Fecha de creación                  |
| updatedAt    | DateTime        | Fecha de actualización             |

### Entidad: Trip (Viaje)

Representa el viaje creado por el usuario.

| Campo         | Tipo               | Descripción                                               |
| ------------- | ------------------ | --------------------------------------------------------- |
| id            | String (cuid)      | PK                                                        |
| userId        | String (FK → User) | Usuario propietario                                       |
| title         | String             | Título del viaje                                          |
| destination   | String             | Destino principal                                         |
| startDate     | DateTime           | Fecha de inicio                                           |
| endDate       | DateTime           | Fecha de fin                                              |
| budget        | Float?             | Presupuesto estimado                                      |
| travelerCount | Int                | Número de viajeros (default 1)                            |
| preferences   | Json               | { interests: [], travelStyle: "budget"\|"mid"\|"luxury" } |
| status        | TripStatus (enum)  | PLANNING \| ACTIVE \| COMPLETED                           |
| createdAt     | DateTime           |                                                           |
| updatedAt     | DateTime           |                                                           |

### Entidad: DayPlan (Día de Itinerario)

| Campo     | Tipo               | Descripción                       |
| --------- | ------------------ | --------------------------------- |
| id        | String (cuid)      | PK                                |
| tripId    | String (FK → Trip) | Viaje al que pertenece            |
| dayNumber | Int                | Número de día (1, 2, 3...)        |
| date      | DateTime           | Fecha del día                     |
| title     | String?            | "Llegada a Tokio", "Día en Kioto" |
| notes     | String?            | Notas adicionales                 |
| createdAt | DateTime           |                                   |
| updatedAt | DateTime           |                                   |

### Entidad: Activity (Actividad / Punto en Mapa)

Cada ubicación específica que se renderizará en el mapa.

| Campo       | Tipo                  | Descripción                                                                                                                                      |
| ----------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| id          | String (cuid)         | PK                                                                                                                                               |
| dayPlanId   | String (FK → DayPlan) | Día al que pertenece                                                                                                                             |
| title       | String                | Nombre de la actividad                                                                                                                           |
| description | String?               | Descripción detallada                                                                                                                            |
| location    | String?               | Nombre del lugar                                                                                                                                 |
| latitude    | Float?                | Latitud (para Leaflet/OpenStreetMap)                                                                                                             |
| longitude   | Float?                | Longitud (para Leaflet/OpenStreetMap)                                                                                                            |
| startTime   | String?               | Hora de inicio "09:00"                                                                                                                           |
| endTime     | String?               | Hora de fin "12:00"                                                                                                                              |
| cost        | Float?                | Costo estimado                                                                                                                                   |
| bookingUrl  | String?               | Link externo para reservar                                                                                                                       |
| category    | String?               | "sightseeing" \| "food" \| "culture" \| "adventure" \| "relaxation" \| "shopping" \| "nightlife" \| "transport" \| "stay" \| "flight" \| "other" |
| placeId     | String?               | ID genérico de lugar (reemplaza googlePlaceId)                                                                                                   |
| order       | Int                   | Orden dentro del día                                                                                                                             |
| createdAt   | DateTime              |                                                                                                                                                  |
| updatedAt   | DateTime              |                                                                                                                                                  |

### Entidad: FlightRecommendation (Recomendación de Vuelo)

| Campo           | Tipo               | Descripción                        |
| --------------- | ------------------ | ---------------------------------- |
| id              | String (cuid)      | PK                                 |
| tripId          | String (FK → Trip) | Viaje al que pertenece             |
| airline         | String             | Aerolínea                          |
| flightNumber    | String?            | Número de vuelo (ej. IB3456)       |
| departure       | String             | Aeropuerto de salida (IATA)        |
| arrival         | String             | Aeropuerto de llegada (IATA)       |
| departureDate   | String?            | Fecha de salida (YYYY-MM-DD)       |
| departureTime   | String             | Hora de salida                     |
| arrivalTime     | String             | Hora de llegada                    |
| price           | Float?             | Precio estimado                    |
| currency        | String             | "EUR" (default)                    |
| class           | String?            | economy / business / first         |
| stops           | Int?               | Número de escalas                  |
| durationMinutes | Int?               | Duración total en minutos          |
| bookingUrl      | String?            | Link a Google Flights / Skyscanner |
| notes           | String?            | Notas                              |
| isRecommended   | Boolean            | Si es la recomendación principal   |
| createdAt       | DateTime           |                                    |

### Entidad: HotelRecommendation (Recomendación de Hotel)

| Campo                 | Tipo               | Descripción                      |
| --------------------- | ------------------ | -------------------------------- |
| id                    | String (cuid)      | PK                               |
| tripId                | String (FK → Trip) | Viaje al que pertenece           |
| name                  | String             | Nombre del hotel                 |
| location              | String             | Ubicación (ciudad, país)         |
| neighborhood          | String?            | Barrio o distrito                |
| latitude              | Float?             | Latitud                          |
| longitude             | Float?             | Longitud                         |
| pricePerNight         | Float?             | Precio por noche (con descuento) |
| originalPricePerNight | Float?             | Precio original sin descuento    |
| currency              | String             | "EUR" (default)                  |
| rating                | Float?             | Valoración (1-5)                 |
| reviewCount           | Int?               | Número de reviews                |
| amenities             | String[]           | ["wifi", "pool", "breakfast"]    |
| imageUrl              | String?            | URL de foto del hotel            |
| bookingUrl            | String?            | Link a Booking.com / Hotels.com  |
| isRecommended         | Boolean            | Si es la recomendación principal |
| createdAt             | DateTime           |                                  |

---

## API Endpoints

### Documentación Swagger/OpenAPI

La documentación interactiva de la API está disponible en:

- **URL**: `http://localhost:3000/api`
- **Formato**: OpenAPI 3.0
- **Autenticación**: Bearer token (JWT) para endpoints protegidos

Todos los controllers y DTOs incluyen decoradores de Swagger (`@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiProperty`) para generar documentación completa y automáticamente actualizada.

### Auth

| Método | Ruta             | Descripción                    | Auth |
| ------ | ---------------- | ------------------------------ | ---- |
| POST   | `/auth/register` | Registro email+contraseña      | No   |
| POST   | `/auth/login`    | Login, retorna JWT en body     | No   |
| GET    | `/auth/profile`  | Perfil del usuario autenticado | Sí   |

### Users

| Método | Ruta         | Descripción             | Auth  |
| ------ | ------------ | ----------------------- | ----- |
| GET    | `/users`     | Listar usuarios (ADMIN) | ADMIN |
| PATCH  | `/users/:id` | Actualizar usuario      | Sí    |

### Trips

| Método | Ruta               | Descripción                                         | Auth  |
| ------ | ------------------ | --------------------------------------------------- | ----- |
| POST   | `/trips`           | Crear viaje                                         | Sí    |
| POST   | `/trips/generate`  | Generar viaje desde prompt en lenguaje natural (IA) | Sí    |
| GET    | `/trips`           | Listar viajes del usuario (paginado)                | Sí    |
| GET    | `/trips/admin/all` | Listar todos los viajes (solo ADMIN)                | ADMIN |
| GET    | `/trips/:id`       | Detalle de viaje con días y actividades             | Sí    |
| PATCH  | `/trips/:id`       | Actualizar viaje                                    | Sí    |
| DELETE | `/trips/:id`       | Eliminar viaje (cascade)                            | Sí    |

### Day Plans

| Método | Ruta                         | Descripción         | Auth |
| ------ | ---------------------------- | ------------------- | ---- |
| POST   | `/trips/:tripId/days`        | Añadir día al viaje | Sí   |
| PATCH  | `/trips/:tripId/days/:dayId` | Actualizar día      | Sí   |
| DELETE | `/trips/:tripId/days/:dayId` | Eliminar día        | Sí   |

### Activities

| Método | Ruta                                                | Descripción             | Auth |
| ------ | --------------------------------------------------- | ----------------------- | ---- |
| POST   | `/trips/:tripId/days/:dayId/activities`             | Añadir actividad al día | Sí   |
| PATCH  | `/trips/:tripId/days/:dayId/activities/:activityId` | Actualizar actividad    | Sí   |
| DELETE | `/trips/:tripId/days/:dayId/activities/:activityId` | Eliminar actividad      | Sí   |

### Recommendations (Gemini IA)

| Método | Ruta                                 | Descripción                  | Auth |
| ------ | ------------------------------------ | ---------------------------- | ---- |
| POST   | `/trips/:tripId/recommend/flights`   | Recomendar vuelos con IA     | Sí   |
| POST   | `/trips/:tripId/recommend/hotels`    | Recomendar hoteles con IA    | Sí   |
| POST   | `/trips/:tripId/recommend/itinerary` | Generar itinerario día a día | Sí   |

---

## Reglas de Negocio — User Management

### Permisos de edición

| Actor         | Campos editables                                       | Campos bloqueados                  |
| ------------- | ------------------------------------------------------ | ---------------------------------- |
| **Visitante** | —                                                      | — (solo puede registrarse)         |
| **USER**      | firstName, lastName, avatarUrl (solo su propio perfil) | role, isActive                     |
| **ADMIN**     | Todos los campos en OTROS usuarios                     | role, isActive en SU PROPIO perfil |

### Reglas de seguridad

| #   | Regla                                          | Protege contra                           |
| --- | ---------------------------------------------- | ---------------------------------------- |
| 1   | Admin no puede cambiar su propio `role`        | Auto-demotion accidental → lockout       |
| 2   | Admin no puede cambiar su propio `isActive`    | Auto-desactivación accidental → lockout  |
| 3   | No se puede desactivar al último admin activo  | Lockout del sistema (0 admins)           |
| 4   | Solo admins pueden cambiar `role` e `isActive` | Usuarios normales promoviendo privileges |

### Escenarios cubiertos

- **Admin promociona a otro usuario**: ✅ Permitido
- **Admin desactiva a otro admin** (hay más admins activos): ✅ Permitido
- **Admin se desactiva a sí mismo**: ❌ Bloqueado (regla 2)
- **Admin se demotiona a sí mismo**: ❌ Bloqueado (regla 1)
- **Último admin intenta desactivar a otro admin**: ❌ Bloqueado (regla 3)
- **Usuario normal intenta cambiar role/isActive**: ❌ Bloqueado (regla 4)

---

## Reglas de Negocio — Trip Management

### Permisos de edición por rol

| Actor     | Campos editables                                                  | Campos bloqueados |
| --------- | ----------------------------------------------------------------- | ----------------- |
| **USER**  | Todos (solo en viajes propios, sujeto a restricciones de status)  | —                 |
| **ADMIN** | Todos los campos, en cualquier viaje, sin restricciones de status | —                 |

### Restricciones de status (solo USER)

| Status actual | Campos editables                                                                              | Campos bloqueados               |
| ------------- | --------------------------------------------------------------------------------------------- | ------------------------------- |
| **planning**  | title, destination, startDate, endDate, budget, travelerCount, interests, travelStyle, status | —                               |
| **active**    | title, budget, travelerCount, interests, travelStyle, status                                  | destination, startDate, endDate |
| **completed** | — (solo lectura)                                                                              | Todos                           |

### Transiciones de status válidas (solo USER)

| De        | Hacia     | Permitido |
| --------- | --------- | --------- |
| planning  | active    | ✅        |
| planning  | completed | ✅        |
| active    | completed | ✅        |
| completed | planning  | ❌        |
| completed | active    | ❌        |
| active    | planning  | ❌        |

**Admin bypass:** El admin puede cambiar a cualquier estado sin restricciones.

### Reglas de seguridad

| #   | Regla                                                  | Protege contra                                                     |
| --- | ------------------------------------------------------ | ------------------------------------------------------------------ |
| 1   | Solo el propietario puede ver/editar/eliminar su viaje | Acceso no autorizado a viajes ajenos                               |
| 2   | Transiciones de status restringidas por estado         | Estados inconsistentes (ej. completed → planning)                  |
| 3   | Campos editables restringidos por estado               | Modificar datos que no deben cambiar en viajes activos/completados |
| 4   | Admin bypass total                                     | —                                                                  |
| 5   | endDate debe ser posterior a startDate                 | Viajes con fechas inválidas                                        |

### Escenarios cubiertos

- **Usuario edita su propio viaje en planning**: ✅ Todos los campos permitidos
- **Usuario edita destino en viaje activo**: ❌ Bloqueado (campo restringido)
- **Admin edita cualquier campo en viaje completado**: ✅ Permitido
- **Admin cambia status de completed a planning**: ✅ Permitido (bypass)
- **Usuario intenta cambiar completed a planning**: ❌ Transición inválida
- ** Usuario edita viaje ajeno**: ❌ Bloqueado (no es propietario)
- **Admin edita viaje ajeno**: ✅ Permitido

---

## Reglas de Negocio — Day Plans & Activities

### Day Plans

| #   | Regla                                              | Protege contra                 |
| --- | -------------------------------------------------- | ------------------------------ |
| 1   | Solo el propietario del viaje puede CRUD day plans | Acceso no autorizado           |
| 2   | `dayNumber` debe ser único dentro del viaje        | Días duplicados en un viaje    |
| 3   | `date` debe estar dentro del rango del viaje       | Días fuera del rango de fechas |
| 4   | Eliminar viaje elimina todos los días (cascade)    | Datos huérfanos                |

### Activities

| #   | Regla                                                     | Protege contra        |
| --- | --------------------------------------------------------- | --------------------- |
| 1   | Solo el propietario del viaje puede CRUD actividades      | Acceso no autorizado  |
| 2   | `order` se auto-incrementa si no se provee                | Orden inconsistente   |
| 3   | Actividad pertenece a un day plan que pertenece al viaje  | Actividades huérfanas |
| 4   | Eliminar day plan elimina todas las actividades (cascade) | Datos huérfanos       |

---

## Flujo Principal del Usuario

```
1. POST /auth/register  →  Cuenta creada
2. POST /auth/login     →  JWT en body
3. POST /trips/generate  →  { prompt: "10 días en Japón, cultura y relax" }
   → Gemini parsea el prompt y crea el viaje con título, destino, fechas, preferencias
4. POST /trips/:id/recommend/flights    →  Gemini genera opciones de vuelos
5. POST /trips/:id/recommend/hotels     →  Gemini genera opciones de hoteles
6. POST /trips/:id/recommend/itinerary  →  Gemini genera plan completo
   → Se guardan: DayPlan[] con Activity[] dentro (con lat/lng)
7. GET /trips/:id        →  Ver plan completo con todos los días (dayPlans + activities anidadas)
8. PATCH/DELETE          →  Modificar según preferencias
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
pnpm add passport passport-local passport-jwt
pnpm add bcryptjs
pnpm add class-validator class-transformer
pnpm add @nestjs/throttler
pnpm add @nestjs/swagger
pnpm add @google/genai
pnpm add reflect-metadata rxjs
```

### Producción (planeadas, aún no instaladas)

```bash
pnpm add passport-google-oauth20   # Google OAuth (fase 2)
pnpm add cookie-parser              # Cookies (fase 2)
```

### Desarrollo

```bash
pnpm add -D prisma @types/pg
pnpm add -D @types/passport-local @types/passport-jwt
```

---

## Estructura de Directorios

```
nomadai-api/
├── docs/
│   └── ARCHITECTURE.md          # Este archivo
├── src/
│   ├── main.ts                  # Bootstrap, Swagger, ValidationPipe global
│   ├── app.module.ts            # Módulo raíz (Config, Throttler, Prisma, Auth, Users, Trips, DayPlans, Activities, Gemini, Recommendations)
│   │
│   ├── domain/                  # NÚCLEO (sin dependencias externas)
│   │   ├── entities/            # Interfaces de dominio puras
│   │   │   ├── user.entity.ts
│   │   │   ├── trip.entity.ts
│   │   │   ├── day-plan.entity.ts
│   │   │   ├── activity.entity.ts
│   │   │   ├── flight-recommendation.entity.ts
│   │   │   └── hotel-recommendation.entity.ts
│   │   ├── enums/               # Enums de dominio
│   │   │   ├── user-role.enum.ts
│   │   │   ├── trip-status.enum.ts
│   │   │   ├── activity-category.enum.ts
│   │   │   └── travel-style.enum.ts
│   │   ├── ports/               # Interfaces (puertos)
│   │   │   ├── repositories/    # Puertos de salida (DRIVER)
│   │   │   │   ├── user.repository.port.ts
│   │   │   │   ├── trip.repository.port.ts
│   │   │   │   ├── day-plan.repository.port.ts
│   │   │   │   ├── activity.repository.port.ts
│   │   │   │   ├── flight-recommendation.repository.port.ts
│   │   │   │   └── hotel-recommendation.repository.port.ts
│   │   │   └── services/        # Puertos de entrada (DRIVEN)
│   │   │       └── gemini.port.ts
│   │   ├── value-objects/       # Objetos de valor (si aplica)
│   │   └── exceptions/          # Excepciones de dominio
│   │       ├── domain.exception.ts
│   │       ├── not-found.exception.ts
│   │       ├── conflict.exception.ts
│   │       ├── forbidden.exception.ts
│   │       ├── unauthorized.exception.ts
│   │       ├── validation.exception.ts
│   │       └── trip-not-found.exception.ts
│   │
│   ├── application/             # CASOS DE USO (depende solo de domain)
│   │   ├── use-cases/           # Un archivo por caso de uso
│   │   │   ├── auth/
│   │   │   │   ├── register.use-case.ts
│   │   │   │   └── login.use-case.ts
│   │   │   ├── users/
│   │   │   │   ├── list-users.use-case.ts
│   │   │   │   └── update-user.use-case.ts
│   │   │   ├── trips/
│   │       │   │       ├── generate-trip.use-case.ts
│       │   │       ├── create-trip.use-case.ts
│   │   │   │   ├── get-trip.use-case.ts
│   │   │   │   ├── list-trips.use-case.ts
│   │   │   │   ├── list-all-trips.use-case.ts
│   │   │   │   ├── update-trip.use-case.ts
│   │   │   │   └── delete-trip.use-case.ts
│   │   │   ├── day-plans/
│   │   │   │   ├── create-day-plan.use-case.ts
│   │   │   │   ├── update-day-plan.use-case.ts
│   │   │   │   └── delete-day-plan.use-case.ts
│   │   │   ├── activities/
│   │   │   │   ├── create-activity.use-case.ts
│   │   │   │   ├── update-activity.use-case.ts
│   │   │   │   └── delete-activity.use-case.ts
│   │   │   └── recommendations/
│   │   │       ├── recommend-flights.use-case.ts
│   │   │       ├── recommend-hotels.use-case.ts
│   │   │       └── recommend-itinerary.use-case.ts
│   │   └── dto/                 # DTOs de entrada/salida
│   │       ├── register.dto.ts
│   │       ├── login.dto.ts
│   │       ├── safe-user.dto.ts
│   │       ├── update-user.dto.ts
│   │       ├── create-trip.dto.ts
│   │       ├── generate-trip.dto.ts
│   │       ├── update-trip.dto.ts
│   │       ├── pagination.dto.ts
│   │       ├── create-day-plan.dto.ts
│   │       ├── update-day-plan.dto.ts
│   │       ├── create-activity.dto.ts
│   │       ├── update-activity.dto.ts
│   │       ├── recommend-flights.dto.ts
│   │       └── recommend-hotels.dto.ts
│   │
│   ├── infrastructure/          # ADAPTADORES (implementa puertos)
│   │   ├── database/
│   │   │   ├── prisma/
│   │   │   │   ├── prisma.module.ts      # Global PrismaModule
│   │   │   │   ├── prisma.service.ts     # PrismaService con PrismaPg adapter
│   │   │   │   └── mappers/              # Mappers Domain <-> Prisma
│   │   │   │       ├── user.mapper.ts
│   │   │   │       ├── trip.mapper.ts
│   │   │   │       ├── day-plan.mapper.ts
│   │   │   │       ├── activity.mapper.ts
│   │   │   │       ├── flight-recommendation.mapper.ts
│   │   │   │       └── hotel-recommendation.mapper.ts
│   │   │   └── repositories/
│   │   │       ├── prisma-user.repository.ts
│   │   │       ├── prisma-trip.repository.ts
│   │   │       ├── prisma-day-plan.repository.ts
│   │   │       ├── prisma-activity.repository.ts
│   │   │       ├── prisma-flight-recommendation.repository.ts
│   │   │       └── prisma-hotel-recommendation.repository.ts
│   │   ├── ai/
│   │   │   ├── gemini.module.ts
│   │   │   └── gemini.service.ts
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   └── strategies/
│   │   │       ├── local.strategy.ts
│   │   │       └── jwt.strategy.ts
│   │   ├── users/
│   │   │   └── users.module.ts
│   │   ├── trips/
│   │   │   └── trips.module.ts
│   │   ├── day-plans/
│   │   │   └── day-plans.module.ts
│   │   ├── activities/
│   │   │   └── activities.module.ts
│   │   └── recommendations/
│   │       └── recommendations.module.ts
│   │
│   ├── presentation/            # ADAPTADOR DE ENTRADA (HTTP)
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── trips.controller.ts
│   │   │   ├── day-plans.controller.ts
│   │   │   ├── activities.controller.ts
│   │   │   └── recommendations.controller.ts
│   │   ├── guards/
│   │   │   └── roles.guard.ts
│   │   ├── decorators/
│   │   │   └── roles.decorator.ts
│   │   ├── interceptors/        # (fase 2)
│   │   └── filters/
│   │       └── domain-exception.filter.ts
│   │
│   └── shared/                  # UTILIDADES COMPARTIDAS
│       ├── ai/                  # Schemas y mappers de respuestas de Gemini
│       │   ├── flight.schema.ts
│       │   ├── flight-recommendation.mapper.ts
│       │   ├── hotel.schema.ts
│       │   ├── hotel-recommendation.mapper.ts
│       │   ├── itinerary.schema.ts
│       │   ├── itinerary.mapper.ts
│       │   ├── trip-prompt.schema.ts
│       │   └── trip-prompt.mapper.ts
│       ├── config/
│       │   └── env.validation.ts
│       ├── decorators/
│       │   └── current-user.decorator.ts
│       ├── guards/
│       │   └── jwt-auth.guard.ts
│       └── types/
│           ├── user-payload.ts
│           └── paginated-response.ts
│
├── prisma/
│   ├── schema.prisma            # 6 modelos + UserRole + TripStatus enums
│   ├── seed.ts                  # Seed script (admin user)
│   └── migrations/              # Migraciones generadas
│
├── test/
│   ├── app.e2e-spec.ts          # Tests E2E de auth
│   ├── setup.ts                 # Config global de tests
│   ├── mocks/                   # Mock factories
│   │   ├── user.factory.ts
│   │   ├── user-repository.mock.ts
│   │   ├── jwt-service.mock.ts
│   │   ├── trip.factory.ts
│   │   ├── trip-repository.mock.ts
│   │   ├── day-plan.factory.ts
│   │   ├── day-plan-repository.mock.ts
│   │   ├── activity.factory.ts
│   │   ├── activity-repository.mock.ts
│   │   ├── flight-recommendation-repository.mock.ts
│   │   ├── hotel-recommendation-repository.mock.ts
│   │   └── gemini-service.mock.ts
│   └── jest-e2e.json
│
├── .env                         # Variables de entorno (gitignored)
├── .env.example                 # Template de .env
├── docker-compose.yml           # PostgreSQL + NestJS app
├── Dockerfile                   # Build de producción
├── Dockerfile.dev               # Desarrollo con hot-reload
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
├── eslint.config.mjs
├── .prettierrc
└── pnpm-workspace.yaml
```

### Reglas de dependencias (IMPORTANTE)

```
domain/          → NO depende de NADA (ni de Prisma, ni de NestJS, ni de nada externo)
application/     → Depende SOLO de domain/
infrastructure/  → Depende de domain/ y application/
presentation/    → Depende de application/ y shared/ (NUNCA directamente de infrastructure/)
shared/          → Depende solo de domain/ (tipos, decorators, guards)
```

Las flechas de dependencia van **siempre hacia adentro**. Nunca hacia afuera.

### Ejemplo: Flujo de un caso de uso

```
HTTP Request
  ↓
Controller (presentation/)          ← Valida con DTO (schema inline Swagger)
  ↓
Use Case (application/)             ← Lógica de negocio pura + validación manual
  ↓
Repository Port (domain/ports/)     ← Interfaz abstracta (abstract class)
  ↓
Repository Impl (infrastructure/)   ← Implementación con Prisma
  ↓
Database
```

---

## Plan de Implementación (Orden)

| Paso | Descripción                                                                     | Estado   |
| ---- | ------------------------------------------------------------------------------- | -------- |
| 1    | **Documentación** — Crear docs/ARCHITECTURE.md + AGENTS.md                      | ✅ Hecho |
| 2    | **Prisma + DB** — Schema, PrismaService, migración inicial                      | ✅ Hecho |
| 2b   | **Roles + Seed** — UserRole enum, RolesGuard, seed con admin                    | ✅ Hecho |
| 3    | **Config** — Variables de entorno validadas con Joi                             | ✅ Hecho |
| 4    | **Users** — CRUD básico                                                         | ✅ Hecho |
| 5    | **Auth** — Register/Login + JWT                                                 | ✅ Hecho |
| 5b   | **Swagger** — Documentación API con @nestjs/swagger                             | ✅ Hecho |
| 6    | **Trips** — CRUD de viajes + admin management                                   | ✅ Hecho |
| 7    | **Day Plans + Activities** — Planificación día a día con lat/lng                | ✅ Hecho |
| 8    | **Gemini Module** — Integración con Google Gemini                               | ✅ Hecho |
| 9    | **Recommendations** — Endpoints de recomendación (vuelos, hoteles, itinerario)  | ✅ Hecho |
| 10   | **Hardening** — Rate limiting, filtros de excepción, validación manual, mappers | ✅ Hecho |

### Estado actual (Backend MVP + Adaptación para Frontend completada)

**Módulos funcionando:**

- `POST /auth/register` — Registro con validación manual (email, password)
- `POST /auth/login` — Login con JWT (accessToken en body)
- `GET /auth/profile` — Perfil del usuario autenticado
- `GET /users` — Listar usuarios (solo ADMIN, paginado)
- `PATCH /users/:id` — Actualizar perfil (propio o admin, con reglas de negocio)
- `POST /trips` — Crear viaje
- `POST /trips/generate` — Generar viaje desde prompt en lenguaje natural con Gemini
- `GET /trips` — Listar viajes del usuario (paginado)
- `GET /trips/admin/all` — Listar todos los viajes (solo ADMIN, paginado)
- `GET /trips/:id` — Detalle de viaje con dayPlans y activities anidadas (solo propietario o admin)
- `PATCH /trips/:id` — Actualizar viaje (solo propietario o admin, admin bypass total)
- `DELETE /trips/:id` — Eliminar viaje con cascade (solo propietario o admin)
- `POST /trips/:tripId/days` — Crear día de itinerario (solo propietario)
- `PATCH /trips/:tripId/days/:dayId` — Actualizar día (solo propietario)
- `DELETE /trips/:tripId/days/:dayId` — Eliminar día (solo propietario, cascade activities)
- `POST /trips/:tripId/days/:dayId/activities` — Crear actividad (solo propietario)
- `PATCH /trips/:tripId/days/:dayId/activities/:activityId` — Actualizar actividad (solo propietario)
- `DELETE /trips/:tripId/days/:dayId/activities/:activityId` — Eliminar actividad (solo propietario)
- `POST /trips/:tripId/recommend/flights` — Generar recomendaciones de vuelos con IA (schema extendido)
- `POST /trips/:tripId/recommend/hotels` — Generar recomendaciones de hoteles con IA (schema extendido)
- `POST /trips/:tripId/recommend/itinerary` — Generar itinerario día a día con IA

**Hardening completado:**

- ✅ Rate limiting global (ThrottlerGuard: 100 requests/60s)
- ✅ JWT secret sin fallback (requerido en .env, validado por Joi)
- ✅ JwtModule.registerAsync con ConfigService
- ✅ JwtAuthGuard y CurrentUser en shared/ (arquitectura hexagonal correcta)
- ✅ UserMapper y TripMapper (eliminados `as any` en repositorios)
- ✅ Validación manual en use cases (page, limit, email, password, etc.)
- ✅ Enums de dominio en todas las capas (TripStatus, TravelStyle, UserRole)
- ✅ Paginación estándar en todos los endpoints de listado
- ✅ SafeUser como tipo de retorno (sin passwordHash)
- ✅ DomainExceptionFilter con manejo de errores de dominio
- ✅ Mappers de dominio para FlightRecommendation y HotelRecommendation
- ✅ Schemas de Gemini en shared/ai/ (arquitectura hexagonal correcta)

**Swagger UI:** `http://localhost:3000/api`

**Acceso a DB:** `docker exec -it nomadai-postgres psql -U postgres -d nomadai`

---

## Docker (Desarrollo Local)

### Archivos Docker

| Archivo              | Propósito                                                 |
| -------------------- | --------------------------------------------------------- |
| `Dockerfile`         | Build multi-stage para producción (deps → build → runner) |
| `Dockerfile.dev`     | Imagen de desarrollo con hot-reload                       |
| `docker-compose.yml` | Composición: app + PostgreSQL                             |
| `.dockerignore`      | Excluir archivos del contexto Docker                      |
| `.env.example`       | Template de variables de entorno (se sube a git)          |
| `.env.docker`        | Variables para Docker (gitignored)                        |

### Servicios

| Servicio     | Imagen                    | Puerto     | Descripción                           |
| ------------ | ------------------------- | ---------- | ------------------------------------- |
| **postgres** | `postgres:16-alpine`      | 5432       | Base de datos con volumen persistente |
| **app**      | `node:22-alpine` (custom) | 3000, 9229 | NestJS con hot-reload                 |

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

# Seed (crear usuario admin)
pnpm db:seed

# Reset completo (DB + seed)
pnpm db:reset
```

### Credenciales por defecto (Seed)

| Campo    | Valor               |
| -------- | ------------------- |
| Email    | `admin@nomadai.com` |
| Password | `admin123`          |
| Rol      | `ADMIN`             |

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

| Problema                                               | Solución                                            |
| ------------------------------------------------------ | --------------------------------------------------- |
| `node_modules` del host sobreescribe los del container | Volumen anónimo: `- /app/node_modules`              |
| Prisma no encuentra `musl` en Alpine                   | No instalar `libc6-compat`                          |
| Builds no reproducibles                                | Usar `--frozen-lockfile`                            |
| App arranca antes que la DB                            | `depends_on` con `condition: service_healthy`       |
| Container corre como root                              | Non-root user en Dockerfile de producción           |
| Secrets en el historial de git                         | `.env` en `.gitignore`, solo `.env.example` se sube |

---

## Fases Futuras

| Fase       | Funcionalidad                                                                      |
| ---------- | ---------------------------------------------------------------------------------- |
| **Fase 2** | Google OAuth, Leaflet/OpenStreetMap integrado, Streaming SSE, Chat flotante con IA |
| **Fase 3** | Duffel API para precios reales de vuelos/hoteles, Favoritos, Compartir viajes      |
| **Fase 4** | Frontend Vue completo, Notificaciones, Modo offline                                |

---

## Referencias

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Google Gemini SDK (Node.js)](https://googleapis.github.io/js-genai/)
- [Leaflet Documentation](https://leafletjs.com/reference.html)
- [Passport.js Strategies](https://www.passportjs.org/)
- [NestJS + Prisma](https://www.prisma.io/docs/guides/frameworks/nestjs)
