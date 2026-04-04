# 🏢 School Compliance Management System

A high-performance, production-ready SaaS platform designed for school groups to manage compliance documentation, personnel clearances, and organizational health.

---

## 🚀 Quick Start

### 1. Prerequisites
Ensure you have the following installed:
- **Node.js** (v22 or higher)
- **pnpm** (v9 or higher)
- **Docker** (for local database)

### 2. Installation
Clone the repository and install dependencies:
```bash
pnpm install
```

### 3. Environment Configuration
Copy the example environment file and update the values:
```bash
cp .env.example .env
```
> [!IMPORTANT]
> Update `DATABASE_URL` with your local credentials and add your `MAILERSEND_API_KEY` to enable the professional "Nudge" system.

### 4. Database Setup
Start the PostgreSQL container and sync the Prisma schema:
```bash
# Start PostgreSQL & pgAdmin
docker compose up -d

# Generate Prisma client and sync schema
pnpm db:generate
pnpm db:push
```

### 5. Launch Development Servers
Run both frontend and backend simultaneously:
```bash
# Standard mode
pnpm dev

# High-performance mode (with Turbopack)
pnpm dev:turbo
```

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Monorepo** | [Turborepo](https://turbo.build/) + pnpm Workspaces |
| **Frontend** | Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | NestJS 11, TypeScript, Prisma ORM |
| **State Management** | Redux Toolkit + RTK Query |
| **Database** | PostgreSQL 16 (via Docker) |
| **Storage** | Supabase Storage or AWS S3 |

---

## ⚡ Key Features & Commands

### High-Performance "Power Tools"
The system includes advanced management features for school directors:
- **Action Center**: A "Task-First" dashboard for pending reviews and critical gaps.
- **Compliance Health Score**: Visual 0-100% health indicators.
- **Bulk Verification**: Instant verification of multiple documents.
- **Nudge System**: Professional email reminders for staff gaps.

### Development Commands
| Command | Description |
| :--- | :--- |
| `pnpm dev` | Start all applications in development mode |
| `pnpm build` | Create a production-ready build of all apps |
| `pnpm db:push` | Sync the Prisma schema to your local database |
| `pnpm db:studio` | Open a local GUI for database management |
| `pnpm lint` | Run recursive linting across the monorepo |

---

## 🌐 Service Access

Once running, the system is accessible at:
- **Frontend**: `http://localhost:3000`
- **API Backend**: `http://localhost:4000`
- **Database GUI (pgAdmin)**: `http://localhost:5050` (Email: `admin@school.local`, Pass: `admin`)

---

## 📂 Project Structure
```text
├── apps/
│   ├── frontend/          # Next.js Application
│   └── backend/           # NestJS REST API
├── packages/
│   ├── shared/            # Shared Types & Constants
│   └── ui/                # Shared UI Component Library
├── prisma/
│   └── schema.prisma      # Database Schema Definition
└── docker-compose.yml     # Infrastructure (Postgres/pgAdmin)
```

---

> [!TIP]
> For the best development experience, use `pnpm dev:turbo` to leverage Turbopack's lightning-fast compilation.
