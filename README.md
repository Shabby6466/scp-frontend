# scp-frontend

# School Compliance Platform

A production-ready SaaS application for school groups to manage compliance documents with RBAC, dynamic forms, versioning, expiry tracking, audit trails, risk heatmaps, and signed-URL sharing.

## Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Redux Toolkit + RTK Query
- **Backend:** NestJS 11, TypeScript, Prisma ORM, object storage via **Supabase Storage** (default) or **AWS S3** (`STORAGE_PROVIDER` in `.env`)
- **Database:** PostgreSQL 16
- **Monorepo:** Turborepo + pnpm workspaces

## Project Structure

```
├── apps/
│   ├── frontend/          # Next.js 15 app (port 3000)
│   └── backend/           # NestJS API (port 4000)
├── packages/
│   ├── shared/            # Shared types, constants, enums
│   └── ui/                # Shared shadcn/ui components
├── prisma/
│   └── schema.prisma      # Database schema
├── docker-compose.yml     # PostgreSQL + pgAdmin
└── turbo.json             # Turborepo config
```

## Getting Started

### Prerequisites

- Node.js >= 22
- pnpm >= 9
- Docker (for local PostgreSQL)

### Setup

```bash
# Install dependencies
pnpm install

# Start PostgreSQL
docker compose up -d

# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Start development servers
pnpm dev
```

### Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

## Development

```bash
pnpm dev          # Start all apps in dev mode
pnpm build        # Build all apps
pnpm lint         # Lint all apps
pnpm db:studio    # Open Prisma Studio
pnpm db:migrate   # Run database migrations
```

## Services

| Service  | URL                     |
|----------|-------------------------|
| Frontend | http://localhost:3000    |
| Backend  | http://localhost:4000    |
| pgAdmin  | http://localhost:5050    |
