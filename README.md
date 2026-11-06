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

Supporting directories:

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

Real credentials must never be committed. Copy `.env.example` to `.env` and fill in the values locally.

Server-only variables:

```text
DATABASE_URL=
DIRECT_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DEEPSEEK_API_KEY=
SEED_ADMIN_EMAIL=
SEED_ADMIN_PASSWORD=
SEED_ADMIN_NAME=
```

`DATABASE_URL` is the transaction-pooler Supabase connection used by the application. It should include `pgbouncer=true`, `connection_limit=1`, and `sslmode=require`.

`DIRECT_URL` is the session-pooler or direct connection used by Prisma migrations. It should also include `sslmode=require`.

`SUPABASE_SERVICE_ROLE_KEY` is only for trusted server-side scripts and administrative operations. It must never be exposed to the browser or used in a `NEXT_PUBLIC_` variable.

## Database setup

After creating a Supabase project and filling in `.env`:

```bash
pnpm db:generate
pnpm db:migrate:deploy
pnpm db:seed
```

Use `pnpm db:migrate:deploy` to apply the existing committed migration to Supabase. Use `pnpm db:migrate` only when creating a new development migration.

`pnpm db:seed` creates or updates the ADMIN account defined by the seed environment variables and initializes the default assistant configuration.

Useful database commands:

| Command                  | Purpose                                            |
| ------------------------ | -------------------------------------------------- |
| `pnpm db:generate`       | Generate Prisma Client                             |
| `pnpm db:migrate`        | Create and apply a development migration           |
| `pnpm db:migrate:deploy` | Apply existing migrations                          |
| `pnpm db:seed`           | Seed the ADMIN account and assistant configuration |
| `pnpm db:studio`         | Open Prisma Studio                                 |
| `pnpm db:validate`       | Validate the Prisma schema                         |

### Data model

- `User` — application profile linked to the Supabase Auth user UUID, with `USER` or `ADMIN` role.
- `Conversation` — owned by one user, with a title and activity timestamps.
- `Message` — owned by one conversation, with `USER` or `ASSISTANT` role and ordered content.
- `AssistantConfig` — singleton assistant configuration containing the system prompt, model, temperature, and token limit.

Conversations cascade-delete their messages. Deleting a user cascades to their conversations. Conversation and message indexes support history ordering and ownership queries.

## Authentication

Authentication uses Supabase Auth with server-managed cookies through `@supabase/ssr`. Session cookies are `HttpOnly`, `SameSite=Lax`, and `Secure` in production.

Available endpoints:

| Method | Endpoint             | Purpose                              |
| ------ | -------------------- | ------------------------------------ |
| `POST` | `/api/auth/register` | Create an account and public profile |
| `POST` | `/api/auth/login`    | Create a session                     |
| `POST` | `/api/auth/logout`   | Clear the session                    |
| `GET`  | `/api/auth/me`       | Return the current user and role     |

Behavior:

- New accounts receive the `USER` role.
- The public `users` profile uses the Supabase Auth user UUID.
- Protected routes `/chat`, `/history`, and `/admin` are guarded by `src/proxy.ts` for optimistic redirects and session refresh.
- API routes and server layouts must still verify authorization; the proxy is not the only security boundary.
- Server code can use `getCurrentUser`, `requireUser`, and `requireAdmin` from `src/server/auth/current-user.ts`.
- `GET /api/auth/me` and protected API routes return `401` when there is no valid session.
- Email confirmation is supported by the contract. For the course demo, consider disabling **Confirm email** in Supabase Auth → Providers → Email to avoid email-sending rate limits during registration. If it is enabled, the registration response returns `requiresEmailConfirmation: true` and the UI must show a confirmation message.

## Conversation API

| Method   | Endpoint                 | Purpose                                       |
| -------- | ------------------------ | --------------------------------------------- |
| `GET`    | `/api/conversations`     | List the authenticated user's conversations   |
| `GET`    | `/api/conversations/:id` | Get an owned conversation and its messages    |
| `PATCH`  | `/api/conversations/:id` | Rename an owned conversation                  |
| `DELETE` | `/api/conversations/:id` | Delete an owned conversation and its messages |

Behavior:

- All endpoints require an authenticated session.
- Users can only access their own conversations.
- Missing or foreign conversations return `404 NOT_FOUND`.
- Conversation lists are ordered by `updatedAt` descending.
- `limit` defaults to `20` and supports `1–100`.
- Conversation detail returns up to the 200 most recent messages in chronological order.
- Deleting a conversation cascades to its messages.
- Mutating requests validate the request origin.

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

- Chat API and DeepSeek integration.
- Testing strategy.
- Deployment.
- Evaluation checklist.

## License

This project is developed for educational purposes.
