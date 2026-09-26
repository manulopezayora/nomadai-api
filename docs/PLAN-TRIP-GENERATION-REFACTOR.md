# Plan: Trip Generation Flow — Option C (RPM-Optimized)

> **STATUS: SUPERSEDED — documento histórico, no refleja la implementación actual.**
>
> La "Opción C" descrita abajo NO fue la elegida. Se implementó en su lugar
> [`PLAN-GENERATE-PREVIEW-FLOW.md`](./PLAN-GENERATE-PREVIEW-FLOW.md).
>
> Los endpoints `POST /api/trips/:id/recommend/{flights,hotels,itinerary}` que se describen
> en "Current State" **ya no existen**: fueron eliminados por duplicar el flujo de preview y
> por escribir directamente en BD. Persisten solo con `POST /api/trips/save-generated`.
> Ver el flujo vigente en [ARCHITECTURE.md](./ARCHITECTURE.md).

## Problem (2026-09-15)

Gemini free tier allows **5 RPM**. The previous implementation (`POST /trips/generate`) made **4 parallel Gemini calls** (trip + flights + hotels + itinerary), consuming 4 RPM per request. This meant the user could only generate once per minute, and hitting it twice caused 503 errors.

## Current State

- `POST /api/trips/generate` — makes 1 Gemini call → returns trip preview only
- `POST /api/trips/save-generated` — saves everything to DB in a transaction
- `POST /api/trips/:id/recommend/flights|hotels|itinerary` — 1 Gemini call each, used per tab

## Desired Flow (Option C)

**1 Gemini call per user action. Never exceed 1 RPM.**

```
[1] User types prompt "5 días en Roma"
    → POST /api/trips/generate  (1 Gemini call: parse prompt → trip data)
    → Returns: { trip }  ← solo viaje, sin recommendations
    → NO save to DB

[2] Frontend shows trip preview
    → Título, destino, fechas, preferences
    → Botón "Guardar viaje"

[3] User clicks "Guardar"
    → POST /api/trips/save-generated  (0 Gemini calls, solo save a BD)
    → Returns: { tripId: "abc123" }
    → Redirect → /trips/abc123

[4] Vista del viaje → pestañas "Vuelos" | "Hoteles" | "Itinerario"

[5] User clicks "Vuelos"
    → POST /api/trips/abc123/recommend/flights  (1 Gemini call)
    → Se guardan en BD
    → Se muestran

[6] User clicks "Hoteles"
    → POST /api/trips/abc123/recommend/hotels  (1 Gemini call)

[7] User clicks "Itinerario"
    → POST /api/trips/abc123/recommend/itinerary  (1 Gemini call)
```

## RPM Consumption

| Endpoint                              | Gemini Calls | RPM | When              |
| ------------------------------------- | ------------ | --- | ----------------- |
| `POST /trips/generate`                | 1            | 1   | User types prompt |
| `POST /trips/save-generated`          | 0            | 0   | User clicks save  |
| `POST /trips/:id/recommend/flights`   | 1            | 1   | User clicks tab   |
| `POST /trips/:id/recommend/hotels`    | 1            | 1   | User clicks tab   |
| `POST /trips/:id/recommend/itinerary` | 1            | 1   | User clicks tab   |

**Max 1 RPM per user action. Never exceeds 5 RPM limit.**

## Implementation Blocks

### Block 1 — Simplify `POST /trips/generate` (1 Gemini call only)

**~1h**

Revert the 4-parallel-calls approach. Generate endpoint should only parse the prompt into trip data (1 Gemini call).

**Changes:**

- `src/application/use-cases/trips/generate-trip.use-case.ts` — remove flights/hotels/itinerary generation, keep only trip parsing
- `src/application/dto/generate-trip-response.dto.ts` — simplify to only return `trip` (remove flights, hotels, itinerary)
- `src/presentation/controllers/trips.controller.ts` — update Swagger docs (remove flights/hotels/itinerary from response)
- `src/application/use-cases/trips/generate-trip.use-case.spec.ts` — update tests (1 Gemini call, not 4)

**New response shape:**

```typescript
interface GenerateTripResult {
  trip: {
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    budget: number | null;
    travelerCount: number;
    interests: string[];
    travelStyle: TravelStyle;
  };
}
```

**Code to remove from generate-trip.use-case.ts:**

- `buildFlightsPrompt()` method
- `buildHotelsPrompt()` method
- `buildItineraryPrompt()` method
- `Promise.all([flights, hotels, itinerary])` block
- Flight/hotel/itinerary mapper imports
- `flightRecommendationSchema`, `hotelRecommendationSchema`, `itinerarySchema` imports

**Files:**

- `src/application/use-cases/trips/generate-trip.use-case.ts`
- `src/application/dto/generate-trip-response.dto.ts`
- `src/presentation/controllers/trips.controller.ts`
- `src/application/use-cases/trips/generate-trip.use-case.spec.ts`

### Block 2 — No changes needed

`POST /api/trips/save-generated` already works correctly. It accepts the full `SaveGeneratedTripDto` and saves in a transaction. No modifications needed.

### Block 3 — No changes needed

`POST /api/trips/:id/recommend/*` endpoints already exist and work. They accept tripId and generate recommendations via Gemini (1 call each). No modifications needed.

## Frontend Flow (Reference)

### Screen 1: Trip Generation (textarea)

```
User types prompt → POST /api/trips/generate → receives trip data
→ Shows preview: title, destination, dates, budget, interests
→ Button: "Guardar viaje"
```

### Screen 2: Save Trip

```
User clicks "Guardar" → POST /api/trips/save-generated → receives tripId
→ Redirect to /trips/:tripId
```

### Screen 3: Trip Detail (tabs)

```
Tab "Vuelos" → POST /api/trips/:tripId/recommend/flights → shows flights
Tab "Hoteles" → POST /api/trips/:tripId/recommend/hotels → shows hotels
Tab "Itinerario" → POST /api/trips/:tripId/recommend/itinerary → shows itinerary
```

## Key Technical Decisions

1. **1 Gemini call per user action** — respects 5 RPM limit
2. **No DB on generate** — pure AI preview, user decides to save
3. **Existing `/recommend/*` endpoints handle recommendations** — no new code needed
4. **Prisma transaction on save** — atomic save of trip data

## Files Summary

### Files to modify (Block 1)

- `src/application/use-cases/trips/generate-trip.use-case.ts` — simplify to 1 call
- `src/application/dto/generate-trip-response.dto.ts` — remove flights/hotels/itinerary
- `src/presentation/controllers/trips.controller.ts` — update Swagger
- `src/application/use-cases/trips/generate-trip.use-case.spec.ts` — update tests

### Files unchanged (already working)

- `src/application/dto/save-generated-trip.dto.ts` ✅
- `src/application/use-cases/trips/save-generated-trip.use-case.ts` ✅
- `src/application/use-cases/trips/save-generated-trip.use-case.spec.ts` ✅

### Files removed after this plan was written

Este plan asumía que los endpoints `recommend/*` se quedaban. Ya no existen:

- `src/presentation/controllers/recommendations.controller.ts` — eliminado
- `src/application/use-cases/recommendations/recommend-flights.use-case.ts` — eliminado
- `src/application/use-cases/recommendations/recommend-hotels.use-case.ts` — eliminado
- `src/application/use-cases/recommendations/recommend-itinerary.use-case.ts` — eliminado
- `src/application/dto/recommend-flights.dto.ts` — eliminado
- `src/application/dto/recommend-hotels.dto.ts` — eliminado
- `src/infrastructure/recommendations/recommendations.module.ts` — eliminado
- `src/infrastructure/database/repositories/prisma-flight-recommendation.repository.ts` — eliminado
- `src/infrastructure/database/repositories/prisma-hotel-recommendation.repository.ts` — eliminado
- `test/mocks/flight-recommendation-repository.mock.ts` — eliminado
- `test/mocks/hotel-recommendation-repository.mock.ts` — eliminado

Se conservan a propósito las entidades, puertos, schemas y mappers de `FlightRecommendation` y
`HotelRecommendation`: `save-generated` los usa para persistir.

## Status

- [x] Block 1: Simplify generate endpoint (1 Gemini call) — DONE
- [x] Block 2: Save-generated endpoint (already working) — DONE
- [x] Block 3: Recommend endpoints (already working) — DONE
- [x] Verify: 0 TS errors, 0 lint, all tests passing — DONE
