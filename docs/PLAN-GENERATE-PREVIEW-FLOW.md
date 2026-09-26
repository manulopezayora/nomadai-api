# Plan: Generate Preview Flow — "Todo local hasta el final"

> **STATUS: IMPLEMENTADO.** Este es el flujo vigente.
> Endpoints: `POST /trips/generate`, `/generate-itinerary`, `/generate-flights`,
> `/generate-hotels` (1 Gemini call cada uno, ninguno persiste) y
> `POST /trips/save-generated` (0 llamadas de IA, una única transacción).
> Los endpoints legacy `POST /trips/:tripId/recommend/*` fueron eliminados.

## Problem

El flujo actual de generate hace 4 llamadas Gemini (trip + flights + hotels + itinerary) y las guarda directamente en BD. El usuario quiere un flujo donde:

- Nada se guarda hasta que el usuario confirme
- El itinerario se genera primero (es la pantalla principal)
- Vuelos y hoteles son opcionales
- El usuario tiene control total sobre qué guardar

## Desired Flow

```
[1] TextArea: "5 días en Roma"
    → POST /api/trips/generate (1 Gemini call, sin DB)
    → Returns: { trip: { title, destination, dates, ... } }
    → Guarda en Pinia → Redirige a vista de itinerario

[2] Pestaña Itinerario (default)
    → POST /api/trips/generate-itinerary (NUEVO, 1 Gemini call, sin DB)
    → Body: { trip data desde Pinia }
    → Returns: { days: [{ dayNumber, title, activities: [...] }] }
    → Guarda en Pinia
    → Muestra mapa con puntos de interés

[3] Pestaña Vuelos (opcional)
    → POST /api/trips/generate-flights (NUEVO, 1 Gemini call, sin DB)
    → Body: { trip data + departureHint + departureDate }
    → Returns: { flights: [...] }
    → Usuario selecciona uno
    → Guarda en Pinia

[4] Pestaña Hoteles (opcional)
    → POST /api/trips/generate-hotels (NUEVO, 1 Gemini call, sin DB)
    → Body: { trip data + checkIn/checkOut }
    → Returns: { hotels: [...] }
    → Usuario selecciona uno
    → Guarda en Pinia

[5] Click "Guardar"
    → POST /api/trips/save-generated (YA EXISTE)
    → Body: { trip + itinerary + flights? + hotels? }
    → Guarda todo atómicamente en BD
    → Redirige a /trips/:id
```

## RPM Consumption

| Endpoint                         | Gemini Calls | RPM | When                    |
| -------------------------------- | :----------: | :-: | ----------------------- |
| `POST /trips/generate`           |      1       |  1  | User types prompt       |
| `POST /trips/generate-itinerary` |      1       |  1  | Itinerary tab loads     |
| `POST /trips/generate-flights`   |      1       |  1  | User clicks flights tab |
| `POST /trips/generate-hotels`    |      1       |  1  | User clicks hotels tab  |
| `POST /trips/save-generated`     |      0       |  0  | User saves              |

**Max 1 RPM per user action. Never exceeds 5 RPM limit.**

## API Endpoints

### POST /api/trips/generate (ya existe)

**Purpose:** Parse natural language prompt into trip data

**Request:**

```json
{ "prompt": "5 días en Roma, cultura y comida" }
```

**Response:**

```json
{
  "trip": {
    "title": "5 Days in Rome",
    "destination": "Rome",
    "startDate": "2026-10-01",
    "endDate": "2026-10-06",
    "budget": null,
    "travelerCount": 1,
    "interests": ["culture", "food"],
    "travelStyle": "mid"
  }
}
```

### POST /api/trips/generate-itinerary (NUEVO)

**Purpose:** Generate day-by-day itinerary without saving to DB

**Request:**

```json
{
  "trip": {
    "title": "5 Days in Rome",
    "destination": "Rome",
    "startDate": "2026-10-01",
    "endDate": "2026-10-06",
    "interests": ["culture", "food"],
    "travelStyle": "mid",
    "travelerCount": 1,
    "budget": null
  }
}
```

**Response:**

```json
{
  "days": [
    {
      "dayNumber": 1,
      "title": "Arrival in Rome",
      "notes": "Explore the Colosseum area",
      "activities": [
        {
          "dayNumber": 1,
          "title": "Visit Colosseum",
          "description": "Tour the ancient amphitheater",
          "category": "sightseeing",
          "startTime": "10:00",
          "endTime": "12:00",
          "location": "Colosseum",
          "latitude": 41.8902,
          "longitude": 12.4922,
          "cost": 16,
          "bookingUrl": null,
          "order": 1
        }
      ]
    }
  ]
}
```

### POST /api/trips/generate-flights (NUEVO)

**Purpose:** Generate flight options without saving to DB

**Request:**

```json
{
  "trip": {
    "title": "5 Days in Rome",
    "destination": "Rome",
    "startDate": "2026-10-01",
    "endDate": "2026-10-06",
    "interests": ["culture", "food"],
    "travelStyle": "mid",
    "travelerCount": 1,
    "budget": null
  },
  "departureHint": "Madrid",
  "departureDate": "2026-10-01",
  "returnDate": "2026-10-06",
  "passengers": 1,
  "travelClass": "economy"
}
```

**Response:**

```json
{
  "flights": [
    {
      "airline": "Iberia",
      "flightNumber": "IB3240",
      "departure": "MAD",
      "arrival": "FCO",
      "departureDate": "2026-10-01",
      "departureTime": "08:30",
      "arrivalTime": "11:00",
      "price": 280,
      "currency": "EUR",
      "class": "economy",
      "stops": 0,
      "durationMinutes": 150,
      "bookingUrl": "https://www.google.com/flights",
      "notes": null,
      "isRecommended": true
    }
  ]
}
```

### POST /api/trips/generate-hotels (NUEVO)

**Purpose:** Generate hotel options without saving to DB

**Request:**

```json
{
  "trip": {
    "title": "5 Days in Rome",
    "destination": "Rome",
    "startDate": "2026-10-01",
    "endDate": "2026-10-06",
    "interests": ["culture", "food"],
    "travelStyle": "mid",
    "travelerCount": 1,
    "budget": null
  },
  "checkIn": "2026-10-01",
  "checkOut": "2026-10-06",
  "maxPricePerNight": 150,
  "minRating": 4,
  "amenities": ["wifi", "breakfast"]
}
```

**Response:**

```json
{
  "hotels": [
    {
      "name": "Hotel Artemide",
      "location": "Rome, Italy",
      "neighborhood": "Via Nazionale",
      "latitude": 41.9009,
      "longitude": 12.4964,
      "pricePerNight": 120,
      "originalPricePerNight": 150,
      "currency": "EUR",
      "rating": 4,
      "reviewCount": 2800,
      "amenities": ["wifi", "breakfast", "spa", "bar"],
      "imageUrl": "https://example.com/hotel.jpg",
      "bookingUrl": "https://www.booking.com",
      "isRecommended": true
    }
  ]
}
```

### POST /api/trips/save-generated (ya existe)

**Purpose:** Save everything to DB atomically

**Request:** Combines trip + itinerary + optional flights + optional hotels

## Implementation Blocks

### Block 1 — DTOs (~30 min)

**New files:**

- `src/application/dto/generate-itinerary.dto.ts`
- `src/application/dto/generate-flights.dto.ts`
- `src/application/dto/generate-hotels.dto.ts`
- `src/application/dto/generate-preview-response.dto.ts`

### Block 2 — Use Cases (~1.5h)

**New files:**

- `src/application/use-cases/trips/generate-itinerary-preview.use-case.ts`
- `src/application/use-cases/trips/generate-flights-preview.use-case.ts`
- `src/application/use-cases/trips/generate-hotels-preview.use-case.ts`

**Pattern:** Each use case:

- Injects only `GeminiPort` (no repositories)
- Reuses the prompts that lived in the now-removed recommend use cases
- Reuses mappers from `shared/ai/`
- Returns mapped data without DB save

### Block 3 — Controller + Module (~30 min)

**Modified files:**

- `src/presentation/controllers/trips.controller.ts` — add 3 endpoints
- `src/infrastructure/trips/trips.module.ts` — register 3 use cases

### Block 4 — Tests (~1h)

**New files:**

- `src/application/use-cases/trips/generate-itinerary-preview.use-case.spec.ts`
- `src/application/use-cases/trips/generate-flights-preview.use-case.spec.ts`
- `src/application/use-cases/trips/generate-hotels-preview.use-case.spec.ts`

### Block 5 — Verification (~15 min)

```bash
pnpm tsc --noEmit   # 0 errors
pnpm lint            # 0 errors
pnpm test            # all passing
```

## Files Summary

### New files (8)

- `src/application/dto/generate-itinerary.dto.ts`
- `src/application/dto/generate-flights.dto.ts`
- `src/application/dto/generate-hotels.dto.ts`
- `src/application/dto/generate-preview-response.dto.ts`
- `src/application/use-cases/trips/generate-itinerary-preview.use-case.ts`
- `src/application/use-cases/trips/generate-flights-preview.use-case.ts`
- `src/application/use-cases/trips/generate-hotels-preview.use-case.ts`
- `docs/PLAN-GENERATE-PREVIEW-FLOW.md`

### Modified files (2)

- `src/presentation/controllers/trips.controller.ts`
- `src/infrastructure/trips/trips.module.ts`

### Unchanged files

- All `shared/ai/*.mapper.ts` — reused as-is
- All `shared/ai/*.schema.ts` — reused as-is
- `save-generated-trip.*` — already works

> Nota: el plan original preveía conservar `recommendations/*` "para viajes ya guardados".
> Ese módulo se eliminó posteriormente por ser un segundo camino de escritura que
> duplicaba el consumo de cuota de Gemini. `save-generated` es hoy el único que persiste.

## Design Decisions

1. **Option A: trip data in body** — endpoints accept full trip object, no DB dependency
2. **departureHint for flights** — user types city name, Gemini infers IATA code
3. **Extract prompts to shared** — avoid duplication between the generate-preview use cases
4. **TripsController** — all generate endpoints in one controller (consistency)
5. **No DB until save** — nothing persisted until user confirms
