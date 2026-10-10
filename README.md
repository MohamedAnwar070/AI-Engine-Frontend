# Perfect Engine — Console (Frontend)

The web console for the Perfect Engine. Use it to manage projects, design their nodes, configure LLM providers, test chat turns, and monitor operations.

The console talks only to the engine's HTTP API. It holds no business data.

## Features

| Area | Route | Roles |
|------|-------|-------|
| Dashboard | `/` | all |
| Projects list and detail | `/projects`, `/projects/:id` | all |
| Create / edit project | `/projects/new`, `/projects/:id/edit` | admin, editor |
| Node designer (create / edit node) | `/projects/:projectId/nodes/new`, `/projects/:projectId/nodes/:nodeId/edit` | admin, editor |
| Chat playground | `/projects/:id/chat` | all |
| Model settings (LLM providers) | `/llm-providers` | admin, editor |
| Operations (metrics, audits) | `/operations` | admin |
| Settings | `/settings` | all |
| Documentation | `/docs` | all |
| Login | `/login` | public |

Role checks are enforced in `src/components/auth/ProtectedRoute.tsx`. A user without the required role is redirected to the dashboard.

## Stack

- React 18 with TypeScript
- Vite (dev server and build)
- React Router for routing
- TanStack Query for server state
- Tailwind CSS with shadcn/ui (Radix primitives)
- react-hook-form and zod for forms

## Requirements

- Node.js 20 or newer
- npm
- A running Perfect Engine backend (see `AI-ENGINE-BACKEND/README.md`)

## Setup

```powershell
cd AI-ENGINE-FRONTEND
npm install
```

Create a `.env` file with the engine URL:

```env
VITE_API_BASE_URL=http://localhost:8001
```

If `VITE_API_BASE_URL` is not set, the console uses `http://localhost:8000`.

The API client also stores a base URL override in the browser's local storage. A value saved there takes precedence over `.env` in that browser.

## Run

```powershell
npm run dev
```

The dev server runs on `http://localhost:5000`. Sign in at `/login`. Accounts are managed by the engine's auth routes (`/api/auth/register`, `/api/auth/login`).

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the dev server on port 5000 |
| `npm run build` | Produce a production build in `dist/` |
| `npm run build:dev` | Production-style build in development mode |
| `npm run preview` | Serve the built `dist/` on port 4173 |
| `npm run lint` | Run ESLint (see Known issues) |

## Production

Build and serve the static bundle:

```powershell
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```

Or with Docker:

```powershell
docker build -t perfect-engine-console .
docker run -p 4173:4173 perfect-engine-console
```

The Dockerfile does not pass `VITE_API_BASE_URL` into the build. Vite bakes that value in at build time, so for a deployment that points at a different engine, either rebuild with the variable set or change the base URL in the browser's local storage. Adding a build argument for `VITE_API_BASE_URL` is a worthwhile follow-up.

## Project layout

```
src/
├── App.tsx                 # Routes and providers
├── main.tsx
├── config/navigation.ts    # Sidebar items and their role filters
├── lib/
│   ├── api.ts              # Engine API client (base URL, bearer token, endpoints)
│   ├── auth.tsx            # Session state and login/logout
│   └── utils.ts
├── domain/                 # Types for projects, nodes, chat, providers, workflows
├── components/
│   ├── auth/ProtectedRoute.tsx
│   ├── layout/             # Shell, sidebar, page container
│   ├── chat/               # Chat panel, input, message
│   ├── nodes/              # Node card, schema builder, test dialog
│   ├── operations/         # Graph canvas
│   ├── testing/            # Test run monitor
│   ├── state/              # Loading and async state
│   └── ui/                 # shadcn/ui primitives
└── pages/                  # One file per route
```

## Connecting to the engine

All requests go through `src/lib/api.ts`. The client:

- prefixes every path with the configured base URL,
- adds `Authorization: Bearer <token>` when a session token is stored,
- calls the engine's routes, such as `/api/projects`, `/api/nodes`, `/api/chat`, and `/api/llm-providers`.

If a page shows "Failed to fetch", check that the engine is running, that the URL matches `VITE_API_BASE_URL` (or the browser override), and that the engine's `ALLOWED_ORIGINS` includes the console's origin.

## Known issues

`npm run lint` currently reports 15 errors and 13 warnings across 18 files. The build is not affected. Main items:

- `src/pages/LLMProviders.tsx`: hook-rule violations (`rules-of-hooks`, `exhaustive-deps`). Fix this first, since it can cause stale state.
- Explicit `any` in `src/lib/api.ts`, `src/domain/chat.ts`, `src/components/chat/ChatMessage.tsx`, and `src/components/nodes/NodeTestDialog.tsx`.
- Empty interface types in `src/components/ui/command.tsx` and `src/components/ui/textarea.tsx`.
- `tailwind.config.ts` uses `require()`.
- Fast-refresh warnings from shadcn/ui files that export non-component helpers. These are safe to leave.

The bundle is larger than 500 kB after minification. Route-level code splitting with `React.lazy` would fix this.

## Lockfiles

The repository has both `package-lock.json` and `bun.lockb`. The Dockerfile uses npm (`npm ci`), so `package-lock.json` is the one in use. Delete `bun.lockb` unless you plan to use Bun.
