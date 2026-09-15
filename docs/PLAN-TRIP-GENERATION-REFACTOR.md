# Plan: Refactor Trip Generation Flow — Preview First, Save Later

## Problem

Current flow saves a Trip to DB immediately on `POST /api/trips/generate`, even if the user decides not to keep it. This creates orphaned data and provides no preview experience.

Additionally, flights/hotels/itinerary are generated via separate `/recommend/*` endpoints, requiring the user to navigate away and make multiple calls.

## Desired Flow

```
[1] User types prompt in textarea
[2] POST /api/trips/generate → 4 parallel Gemini calls → returns ALL data WITHOUT saving to DB
[3] Frontend stores in Pinia/state → Shows full preview (trip, flights, hotels, itinerary)
[4] User reviews and clicks "Save" → POST /api/trips → saves everything to DB in a transaction
```

## Implementation Blocks

### Block 1 — Refactor `POST /api/trips/generate` (no DB)

**~1.5h** ✅ COMPLETED

- Modify `GenerateTripUseCase`: remove DB save, make 4 parallel Gemini calls (trip, flights, hotels, itinerary)
- Create response type `GenerateTripResult` with shape: `{ trip, flights, hotels, itinerary }`
- Reuse existing mappers: `TripPromptMapper`, `FlightRecommendationMapper`, `HotelRecommendationMapper`, `ItineraryMapper`
- Return plain objects without touching repository
- Build prompts for flights/hotels/itinerary using trip context (destination, dates, style, etc.)
- Update tests (8 tests, all passing)

**Files to modify:**

- `src/application/use-cases/trips/generate-trip.use-case.ts` — rewrite execute()
- `src/presentation/controllers/trips.controller.ts` — response type
- `src/infrastructure/ai/gemini.service.spec.ts` — tests
- `src/application/use-cases/trips/generate-trip.use-case.spec.ts` — tests (if exists)

**New files:**

- `src/application/dto/generate-trip-response.dto.ts` — response type

### Block 2 — Modify `POST /api/trips` to save full trip

**~1.5h** ✅ COMPLETED

- New DTO `SaveGeneratedTripDto` accepting `{ trip, flights, hotels, itinerary }`
- New `SaveGeneratedTripUseCase` with Prisma `$transaction` for atomic save
- New endpoint `POST /api/trips/save-generated` on TripsController
- Register in TripsModule
- 13 tests (validation + full save with flights/hotels/itinerary + minimal save)

**Files created:**

- `src/application/dto/save-generated-trip.dto.ts` — DTO with nested types
- `src/application/use-cases/trips/save-generated-trip.use-case.ts` — Use case with Prisma transaction
- `src/application/use-cases/trips/save-generated-trip.use-case.spec.ts` — 13 tests

**Files modified:**

- `src/presentation/controllers/trips.controller.ts` — new `POST /trips/save-generated` endpoint
- `src/presentation/controllers/trips.controller.spec.ts` — updated constructor + mock
- `src/infrastructure/trips/trips.module.ts` — registered SaveGeneratedTripUseCase

- `src/application/dto/save-generated-trip.dto.ts` — DTO for full trip save

### Block 3 — Clean up old recommendation endpoints (optional)

**~0.5h** ✅ COMPLETED

- Kept `/recommend/*` endpoints — useful for regenerating individual parts (just flights, just hotels, just itinerary)
- No code changes needed

## Response Shape

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
    travelStyle: string;
  };
  flights: CreateFlightRecommendationData[];
  hotels: CreateHotelRecommendationData[];
  itinerary: {
    days: Array<{
      dayNumber: number;
      title: string;
      notes: string | null;
      activities: MappedActivity[];
    }>;
  };
}
```

## Key Technical Decisions

1. **4 parallel Gemini calls** (not one combined prompt) — more focused prompts, better accuracy, ~5s total
2. **No DB interaction on generate** — pure AI response, frontend decides what to do with it
3. **Prisma nested creates** for atomic save — all-or-nothing transaction
4. **Existing `/recommend/*` endpoints stay** — useful for regenerating individual parts later

## Status

- [x] Block 1: Refactor generate endpoint (no DB) — DONE
- [x] Block 2: Modify create endpoint to save full trip — DONE
- [x] Block 3: Clean up (optional) — DONE (kept /recommend/* endpoints)
