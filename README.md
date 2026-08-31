# Nomad AI — API Backend

Backend REST API for **Nomad AI**, an AI-powered travel planning application.

Users describe their trip in natural language (e.g. _"10 days in Japan, culture and relax"_) and the API generates flight recommendations, hotel options, and a day-by-day itinerary with map coordinates — all powered by Google Gemini.

## Stack

- **Runtime**: Node.js 22
- **Framework**: NestJS 11
- **Language**: TypeScript 5.7 (strict mode)
- **Database**: PostgreSQL 16 via Prisma 7
- **AI**: Google Gemini (`@google/genai`)
- **Maps**: Leaflet / OpenStreetMap (free, no API key)
- **Auth**: Passport.js (Local + JWT)
- **Architecture**: Hexagonal (Ports & Adapters)
- **Package manager**: pnpm
- **Tests**: 200 unit tests (Jest)

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm
- Docker & Docker Compose

### Local Development

```bash
# Install dependencies
pnpm install

# Start PostgreSQL + app with hot-reload
pnpm docker:up

# The API will be available at http://localhost:3000
# Swagger UI at http://localhost:3000/api
```

### Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nomadai?schema=public"
JWT_SECRET="your-random-secret-here"
GEMINI_API_KEY="your-gemini-api-key"
```

Get a free Gemini API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).

### Database

```bash
# Create a migration
pnpm prisma migrate dev --name description_of_change

# Apply pending migrations
pnpm prisma migrate deploy

# Regenerate Prisma Client
pnpm prisma generate

# Open Prisma Studio
pnpm prisma studio

# Seed DB with admin user
pnpm db:seed

# Reset DB completely
pnpm db:reset
```

## Project Structure

```
src/
├── domain/            # Core business logic (no external dependencies)
├── application/       # Use cases (depends only on domain)
├── infrastructure/    # Adapters (Prisma, Gemini, Auth)
├── presentation/      # HTTP layer (controllers, filters, interceptors)
└── shared/            # Shared config, types, AI schemas and mappers
```

## Scripts

| Script              | Description                             |
| ------------------- | --------------------------------------- |
| `pnpm build`        | Build for production                    |
| `pnpm start:dev`    | Start in watch mode                     |
| `pnpm lint`         | Run ESLint                              |
| `pnpm test`         | Run unit tests                          |
| `pnpm test:cov`     | Run tests with coverage                 |
| `pnpm test:ci`      | Run tests for CI (coverage + forceExit) |
| `pnpm test:e2e`     | Run E2E tests                           |
| `pnpm db:seed`      | Seed DB with admin user                 |
| `pnpm db:reset`     | Reset DB completely                     |
| `pnpm docker:up`    | Start with Docker                       |
| `pnpm docker:down`  | Stop Docker containers                  |
| `pnpm docker:reset` | Reset Docker (volumes + rebuild)        |

## API

Swagger UI available at `http://localhost:3000/api` when the server is running.

### Key Endpoints

| Module              | Endpoints                                                        |
| ------------------- | ---------------------------------------------------------------- |
| **Auth**            | `POST /auth/register`, `POST /auth/login`, `GET /auth/profile`   |
| **Users**           | `GET /users`, `PATCH /users/:id`                                 |
| **Trips**           | CRUD + `GET /trips/admin/all`                                    |
| **Day Plans**       | CRUD nested under `/trips/:tripId/days`                          |
| **Activities**      | CRUD nested under `/trips/:tripId/days/:dayId/activities`        |
| **Recommendations** | `POST /trips/:tripId/recommend/flights`, `/hotels`, `/itinerary` |

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture documentation.
See [AGENTS.md](AGENTS.md) for AI agent guidelines and coding conventions.

## Git Conventions

This project uses [conventional commits](https://www.conventionalcommits.org/) enforced by commitlint + husky.

```
feat(trips): add trip creation endpoint
fix(auth): handle expired JWT
docs(arch): update directory structure
```

## License

UNLICENSED
