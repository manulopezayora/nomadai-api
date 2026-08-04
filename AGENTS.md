# AGENTS.md — Directrices de Desarrollo para nomadai-api

## Contexto del Proyecto

Backend REST API para **Nomad AI**, una app de planificación de viajes con IA.
Consultar `docs/ARCHITECTURE.md` para detalles completos del stack, modelo de datos y endpoints.

---

## Arquitectura Hexagonal (Puertos y Adaptadores)

El proyecto sigue **arquitectura hexagonal** (Ports & Adapters). La lógica de negocio
está en el centro, aislada de infraestructura, frameworks y bases de datos.

### Estructura de carpetas

```
src/
├── domain/                          # NÚCLEO (sin dependencias externas)
│   ├── entities/                    # Entidades de negocio puras
│   │   ├── user.entity.ts
│   │   ├── trip.entity.ts
│   │   ├── day-plan.entity.ts
│   │   ├── activity.entity.ts
│   │   ├── flight-recommendation.entity.ts
│   │   └── hotel-recommendation.entity.ts
│   ├── enums/                       # Enums de dominio
│   │   ├── user-role.enum.ts
│   │   ├── trip-status.enum.ts
│   │   ├── activity-category.enum.ts
│   │   └── travel-style.enum.ts
│   ├── value-objects/               # Objetos de valor (si aplica)
│   ├── ports/                       #Interfaces (puertos)
│   │   ├── repositories/            # Puertos de salida (DRIVER)
│   │   │   ├── user.repository.port.ts
│   │   │   ├── trip.repository.port.ts
│   │   │   └── ...
│   │   └── services/                # Puertos de entrada (DRIVEN)
│   │       ├── gemini.port.ts
│   │       └── ...
│   └── exceptions/                  # Excepciones de dominio
│       └── trip-not-found.exception.ts
│
├── application/                     # CASOS DE USO (depende solo de domain)
│   ├── use-cases/                   # Un archivo por caso de uso
│   │   ├── auth/
│   │   │   ├── register.use-case.ts
│   │   │   └── login.use-case.ts
│   │   ├── trips/
│   │   │   ├── create-trip.use-case.ts
│   │   │   ├── get-trip.use-case.ts
│   │   │   ├── update-trip.use-case.ts
│   │   │   └── delete-trip.use-case.ts
│   │   ├── day-plans/
│   │   │   ├── add-day-plan.use-case.ts
│   │   │   └── add-activity.use-case.ts
│   │   └── recommendations/
│   │       ├── recommend-flights.use-case.ts
│   │       ├── recommend-hotels.use-case.ts
│   │       └── recommend-itinerary.use-case.ts
│   └── dto/                         # DTOs de entrada/salida de casos de uso
│       ├── create-trip.dto.ts
│       ├── login.dto.ts
│       └── ...
│
├── infrastructure/                  # ADAPTADORES (implementa puertos)
│   ├── database/                    # Adaptador de persistencia
│   │   ├── prisma/
│   │   │   ├── prisma.module.ts
│   │   │   ├── prisma.service.ts
│   │   │   └── mappers/             # Mappers Domain <-> Prisma
│   │   │       ├── user.mapper.ts
│   │   │       └── ...
│   │   └── repositories/            # Implementación de puertos de repositorio
│   │       ├── prisma-user.repository.ts
│   │       ├── prisma-trip.repository.ts
│   │       └── ...
│   ├── ai/                          # Adaptador de IA
│   │   ├── gemini.module.ts
│   │   ├── gemini.service.ts        # Implementa gemini.port.ts
│   │   └── schemas/                 # Schemas de respuesta de Gemini
│   └── auth/                        # Adaptador de autenticación
│       ├── strategies/
│       ├── guards/
│       └── decorators/
│
├── presentation/                    # ADAPTADOR DE ENTRADA (HTTP)
│   ├── controllers/                 # Controladores NestJS (thin controllers)
│   │   ├── auth.controller.ts
│   │   ├── users.controller.ts
│   │   ├── trips.controller.ts
│   │   └── recommendations.controller.ts
│   ├── interceptors/                # Interceptors
│   │   └── gemini-exception.interceptor.ts
│   └── filters/                     # Filtros de excepción
│       └── global-exception.filter.ts
│
├── shared/                          # UTILIDADES COMPARTIDAS
│   ├── config/
│   │   └── env.validation.ts
│   └── types/                       # Tipos compartidos
│       └── request-with-user.ts
│
└── main.ts
```

### Reglas de dependencias (IMPORTANTE)

```
domain/          → NO depende de NADA (ni de Prisma, ni de NestJS, ni de nada externo)
application/     → Depende SOLO de domain/
infrastructure/  → Depende de domain/ y application/
presentation/    → Depende de application/ (NUNCA directamente de infrastructure/)
```

Las flechas de dependencia van **siempre hacia adentro**. Nunca hacia afuera.

### Ejemplo: Flujo de un caso de uso

```
HTTP Request
  ↓
Controller (presentation/)          ← Valida con DTO + class-validator
  ↓
Use Case (application/)             ← Lógica de negocio pura
  ↓
Repository Port (domain/ports/)     ← Interfaz abstracta
  ↓
Repository Impl (infrastructure/)   ← Implementación con Prisma
  ↓
Database
```

---

## Clean Code y Principios SOLID

### S — Single Responsibility
- Cada clase/archivo tiene **una única razón para cambiar**
- Un controller solo orquesta, un use case solo tiene una lógica
- Un repository solo accede a datos

### O — Open/Closed
- Entidades y puertos son **abiertos a extensión, cerrados a modificación**
- Para añadir un nuevo adaptador de IA, se crea una nueva implementación del puerto

### L — Liskov Substitution
- Todas las implementaciones de un puerto deben ser intercambiables

### I — Interface Segregation
- Puertos pequeños y específicos (no interfaces gigantes)
- `UserRepositoryPort` solo tiene métodos de usuario

### D — Dependency Inversion
- Los módulos de alto nivel no dependen de bajo nivel
- Ambos dependen de **abstracciones** (puertos/interfaces)

### Convenciones de código

- **Thin controllers**: Controllers solo validan input y llaman a use cases
- **No lógica de negocio en controllers ni services de infraestructura**
- **Una función = un archivo** para casos de uso (cuando son simples)
- **Functional pipes** en lugar de clases cuando sea posible
- **DTOs con class-validator** para validación declarativa
- **No usar `any`** — usar tipos específicos siempre
- **Nombres descriptivos**: `createTripUseCase`, no `create` o `svc`
- **Archivos kebab-case**: `create-trip.use-case.ts`, no `createTripUseCase.ts`
- **Exportaciones nombradas**, no default exports (excepto módulos NestJS)

---

## Base de Datos: SOLO Migraciones

### Regla absoluta

> **NUNCA modificar el schema directamente en producción.**
> **TODOS los cambios se hacen mediante migraciones de Prisma.**

### Flujo correcto

```bash
# 1. Modificar prisma/schema.prisma
# 2. Generar migración
pnpm prisma migrate dev --name descripcion_del_cambio

# 3. Verificar que la migración se creó en prisma/migrations/
# 4. El PrismaClient se regenera automáticamente
```

### Reglas

- Una migración por cambio funcional (no agrupar cambios no relacionados)
- Nombres de migración en snake_case descriptivo: `add_user_preferences`, `create_trip_entity`
- Revisar la migración generada antes de confirmar
- No usar `prisma db push` en desarrollo — solo `migrate dev`
- Los seed scripts van en `prisma/seed.ts`
- Las migraciones se aplican automáticamente al arrancar en Docker (`migrate deploy`)

---

## Cómo Crear un Módulo Nuevo

Para cada entidad/recurso, crear estos archivos siguiendo el patrón:

### 1. Dominio

```typescript
// domain/entities/trip.entity.ts
export interface Trip {
  id: string;
  userId: string;
  title: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  budget: number | null;
  travelerCount: number;
  preferences: TripPreferences;
  status: TripStatus;
  createdAt: Date;
  updatedAt: Date;
}

// domain/ports/repositories/trip.repository.port.ts
export interface TripRepositoryPort {
  findById(id: string): Promise<Trip | null>;
  findByUserId(userId: string): Promise<Trip[]>;
  create(data: CreateTripData): Promise<Trip>;
  update(id: string, data: UpdateTripData): Promise<Trip>;
  delete(id: string): Promise<void>;
}
```

### 2. Caso de uso

```typescript
// application/use-cases/trips/create-trip.use-case.ts
export class CreateTripUseCase {
  constructor(
    private readonly tripRepository: TripRepositoryPort,  // Puerto inyectado
  ) {}

  async execute(dto: CreateTripDto, userId: string): Promise<Trip> {
    // Lógica de negocio
    return this.tripRepository.create({ ...dto, userId });
  }
}
```

### 3. Adaptador de infraestructura

```typescript
// infrastructure/database/repositories/prisma-trip.repository.ts
export class PrismaTripRepository implements TripRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Trip | null> {
    const result = await this.prisma.trip.findUnique({ where: { id } });
    return result ? TripMapper.toDomain(result) : null;
  }
  // ...
}
```

### 4. Mapper (Domain <-> Prisma)

```typescript
// infrastructure/database/prisma/mappers/trip.mapper.ts
export class TripMapper {
  static toDomain(prismaTrip: PrismaTrip): Trip {
    return {
      id: prismaTrip.id,
      title: prismaTrip.title,
      // ...
    };
  }

  static toPrisma(trip: Trip): PrismaTripCreateInput {
    return {
      title: trip.title,
      // ...
    };
  }
}
```

### 5. Controller (thin)

```typescript
// presentation/controllers/trips.controller.ts
@ApiTags('Trips')
@ApiBearerAuth()
@Controller('trips')
@UseGuards(JwtAuthGuard)
export class TripsController {
  constructor(
    private readonly createTripUseCase: CreateTripUseCase,
    private readonly getTripUseCase: GetTripUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new trip' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'destination'],
      properties: {
        title: { type: 'string', example: 'Trip to Japan' },
        destination: { type: 'string', example: 'Tokyo' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Trip created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@CurrentUser() user: UserPayload, @Body() dto: CreateTripDto) {
    return this.createTripUseCase.execute(dto, user.userId);
  }
}
```

### 6. Módulo NestJS

```typescript
// infrastructure/trips.module.ts (o en su módulo correspondiente)
@Module({
  imports: [PrismaModule],
  controllers: [TripsController],
  providers: [
    CreateTripUseCase,
    GetTripUseCase,
    { provide: TripRepositoryPort, useClass: PrismaTripRepository },
  ],
})
export class TripsModule {}
```

### 7. Documentación Swagger (OBLIGATORIO para cada módulo)

**Cada controller y DTO nuevo DEBE incluir decoradores de Swagger.**

```typescript
// En el controller:
@ApiTags('Trips')                    // Agrupa endpoints en Swagger UI
@ApiBearerAuth()                     // Indica que requiere JWT
@ApiOperation({ summary: '...' })    // Descripción del endpoint
@ApiResponse({ status: 200, ... })   // Cada respuesta posible
@ApiParam({ name: 'id', ... })       // Parámetros de ruta

// En los DTOs:
@ApiProperty({ example: '...' })             // Propiedades requeridas
@ApiPropertyOptional({ example: '...' })     // Propiedades opcionales
```

**⚠️ IMPORTANTE: `@ApiBody` con tsx/esbuild**

El proyecto usa `tsx` (basado en esbuild) que **NO emite `emitDecoratorMetadata`**.
Por eso `@ApiBody({ type: RegisterDto })` causa un error de dependencia circular:

```
[RegisterDto] A circular dependency has been detected (property key: "email")
```

**Solución: Usar schemas inline en `@ApiBody`** en lugar de referenciar clases DTO:

```typescript
// ❌ INCORRECTO - causa circular dependency con tsx
@ApiBody({ type: RegisterDto })

// ✅ CORRECTO - schema inline, funciona con tsx
@ApiBody({
  schema: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email', example: 'user@example.com' },
      password: { type: 'string', minLength: 8, example: 'password123' },
      firstName: { type: 'string', example: 'John' },
    },
  },
})
```

**Checklist de documentación por módulo:**
- [ ] `@ApiTags('NombreDelModulo')` en el controller
- [ ] `@ApiBearerAuth()` en controllers protegidos
- [ ] `@ApiOperation` en cada endpoint
- [ ] `@ApiResponse` para cada código de estado (200, 201, 400, 401, 403, 404)
- [ ] `@ApiParam` para parámetros de ruta
- [ ] `@ApiBody({ schema: {...} })` con **schema inline** (NO `type: DtoClass`) para endpoints con body
- [ ] `@ApiProperty` / `@ApiPropertyOptional` en todos los campos del DTO
- [ ] `examples` en properties para documentación clara

---

## Comandos Obligatorios

Después de cada cambio significativo, ejecutar:

```bash
# Lint
pnpm lint

# Build (verificar que compila)
pnpm build

# Tests (si existen)
pnpm test
```

Si alguno falla, **corregir antes de continuar**.

---

## Naming Conventions

| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| Archivos de caso de uso | `*.use-case.ts` | `create-trip.use-case.ts` |
| Archivos de controller | `*.controller.ts` | `trips.controller.ts` |
| Archivos de servicio | `*.service.ts` | `gemini.service.ts` |
| Archivos de repository | `*.repository.ts` | `prisma-trip.repository.ts` |
| Archivos de DTO | `*.dto.ts` | `create-trip.dto.ts` |
| Archivos de mapper | `*.mapper.ts` | `trip.mapper.ts` |
| Archivos de strategy | `*.strategy.ts` | `jwt.strategy.ts` |
| Archivos de guard | `*.guard.ts` | `jwt-auth.guard.ts` |
| Archivos de interfaz | `*.port.ts` (puerto) | `trip.repository.port.ts` |
| Enums | `*.enum.ts` | `trip-status.enum.ts` |
| Clases | PascalCase | `CreateTripUseCase` |
| Variables/funciones | camelCase | `createTripUseCase` |
| Constantes | UPPER_SNAKE_CASE | `MAX_TRIPS_PER_USER` |

---

## Imports: Orden y Convención

```typescript
// 1. Módulos externos
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

// 2. Dominio (entidades, puertos, enums)
import { Trip } from '../../domain/entities/trip.entity';
import { TripRepositoryPort } from '../../domain/ports/repositories/trip.repository.port';
import { TripStatus } from '../../domain/enums/trip-status.enum';

// 3. Application (DTOs, casos de uso)
import { CreateTripDto } from '../../application/dto/create-trip.dto';

// 4. Shared
import { UserPayload } from '../../shared/types/request-with-user';
```

---

## Seguridad

- **Nunca** loguear tokens JWT, contraseñas o API keys
- **Nunca** exponer stack traces en producción
- Usar HTTP-only cookies para JWT (no localStorage en frontend)
- Validar TODOS los inputs con DTOs y class-validator
- Rate limiting en endpoints de auth
- Variables sensibles SOLO en `.env` (nunca hardcodeadas)

---

## Arquitectura Hexagonal — Resumen Visual

```
                    ┌─────────────────────────────┐
                    │      PRESENTATION           │
                    │   (Controllers, Guards,      │
                    │    Filters, Interceptors)    │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │       APPLICATION           │
                    │    (Use Cases, DTOs)         │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │         DOMAIN              │
                    │  (Entities, Ports, Enums,    │
                    │   Value Objects, Exceptions) │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │     INFRASTRUCTURE          │
                    │  (Prisma, Gemini, Auth,      │
                    │   Repositories, Mappers)    │
                    └─────────────────────────────┘
```

**Regla de oro:** Las dependencias siempre apuntan hacia adentro (→ Domain).
Nunca hacia afuera.
