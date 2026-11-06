# AI Expert Chat

AI Expert Chat is a full-stack conversational web application built around an AI assistant specialized in programming. It is designed to help users understand programming concepts, debug code, interpret errors, reason about algorithms and data structures, and improve software development practices.

This project is being developed as a university Web Engineering project by a two-person team.

## Project status

**Current phase:** Phase 0 — Project foundation.

The project has been bootstrapped with Next.js, TypeScript, Tailwind CSS, pnpm, ESLint, and Prettier. The landing page, authentication, chat interface, conversation history, administration interfaces, and backend integration are implemented incrementally.

## Tech stack

| Layer           | Technology             |
| --------------- | ---------------------- |
| Framework       | Next.js App Router     |
| UI              | React                  |
| Language        | TypeScript             |
| Styling         | Tailwind CSS           |
| Backend         | Next.js Route Handlers |
| Database        | Supabase PostgreSQL    |
| ORM             | Prisma                 |
| Validation      | Zod                    |
| AI provider     | DeepSeek API           |
| Deployment      | Vercel                 |
| Version control | Git and GitHub         |
| Package manager | pnpm                   |

## Architecture

```text
Browser
  │
  ▼
Next.js App Router
React + TypeScript + Tailwind CSS
  │  typed API client
  ▼
Next.js Route Handlers
  │
  ├─ Authentication and authorization
  ├─ Request validation
  ├─ Conversation ownership
  ├─ Prisma
  │    └─ Supabase PostgreSQL
  └─ DeepSeek API
```

Rules:

- The browser must never call DeepSeek directly.
- The DeepSeek API key is server-only and must never use a `NEXT_PUBLIC_` variable.
- The backend enforces authentication, authorization, validation, and conversation ownership.
- The frontend handles interaction, rendering, loading states, and error feedback.
- Mock data is allowed only in tests or clearly labeled development mode.

## Project structure

```text
src/
├─ app/                 # Next.js routes and layouts
├─ components/          # Shared UI and layout components
├─ features/            # Domain-specific frontend code
├─ lib/                 # API client, contracts, and utilities
├─ server/              # Server-only database, auth, and AI code
└─ types/               # Shared TypeScript types
```

Planned supporting directories:

```text
prisma/                 # Prisma schema, migrations, and seed
docs/                   # Architecture and API contracts
e2e/                    # End-to-end tests
public/                 # Static assets
```

## Getting started

### Requirements

- Node.js 20 or newer
- pnpm

### Install dependencies

```bash
pnpm install
```

### Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available scripts

| Command             | Purpose                                 |
| ------------------- | --------------------------------------- |
| `pnpm dev`          | Start the development server            |
| `pnpm build`        | Create a production build               |
| `pnpm start`        | Start the production server             |
| `pnpm lint`         | Run ESLint                              |
| `pnpm lint:fix`     | Fix ESLint issues where possible        |
| `pnpm typecheck`    | Run TypeScript without emitting files   |
| `pnpm format`       | Format the codebase with Prettier       |
| `pnpm format:check` | Check formatting without changing files |

## Development workflow

The team works with one feature per branch and pull request:

- `feat/<feature-name>` for feature work.
- `fix/<fix-name>` for fixes.
- `main` remains stable.
- API contracts are agreed before frontend integration.
- Frontend and backend progress in parallel using shared contracts and test fixtures.

## Environment variables

Environment configuration will be added with the database and authentication foundation. Real credentials must never be committed. Keep a committed `.env.example` with variable names only.

Expected server-only variables include:

```text
DATABASE_URL=
DIRECT_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
DEEPSEEK_API_KEY=
```

Additional Supabase service credentials, if required for seeding, must remain server-only and must never be exposed in client code.

## Team responsibilities

### Developer 1 — Frontend and integration

- Landing page.
- Authentication interfaces.
- Application shell and navigation.
- Chat interface.
- Conversation history.
- Administration interfaces.
- Responsive design and accessibility.
- Frontend tests and frontend-backend integration.

### Developer 2 — Backend and AI

- Supabase and Prisma setup.
- Database schema and migrations.
- Authentication and session infrastructure.
- API route handlers.
- Authorization and ownership enforcement.
- DeepSeek integration and system prompt management.
- Statistics queries.
- Backend tests and deployment.

## Documentation

The shared API contract is available at [`docs/api-contracts.md`](docs/api-contracts.md).

The README will be expanded as the following are implemented:

- Supabase setup.
- Prisma migrations and seed data.
- Authentication flow.
- DeepSeek integration.
- Testing strategy.
- Deployment.
- Evaluation checklist.

## License

This project is developed for educational purposes.
