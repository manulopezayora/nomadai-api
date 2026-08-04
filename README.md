# Nomad AI — API Backend

Backend REST API for **Nomad AI**, an AI-powered travel planning application.

## Stack

- **Runtime**: Node.js 22
- **Framework**: NestJS 11
- **Language**: TypeScript 5.7 (strict mode)
- **Database**: PostgreSQL 16 via Prisma 7
- **AI**: Google Gemini (`@google/genai`)
- **Maps**: Leaflet / OpenStreetMap (free, no API key)
- **Auth**: Passport.js (Local + Google OAuth + JWT)
- **Architecture**: Hexagonal (Ports & Adapters)
- **Package manager**: pnpm

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
```

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
```

## Project Structure

```
src/
├── domain/            # Core business logic (no external dependencies)
├── application/       # Use cases (depends only on domain)
├── infrastructure/    # Adapters (Prisma, Gemini, Auth)
├── presentation/      # HTTP layer (controllers, filters, interceptors)
└── shared/            # Shared config and types
```

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm build` | Build for production |
| `pnpm start:dev` | Start in watch mode |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run unit tests |
| `pnpm docker:up` | Start with Docker |
| `pnpm docker:reset` | Reset Docker (volumes + rebuild) |

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture documentation.
See [AGENTS.md](AGENTS.md) for AI agent guidelines and coding conventions.

## License

UNLICENSED
