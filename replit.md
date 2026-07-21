# Cyttack

An AI-powered Cyber Resilience command center for government/critical infrastructure SOC teams. Detects behavioral anomalies across IT/OT networks, maps them to MITRE ATT&CK attack chains, and orchestrates containment playbooks — compressing detection-to-response time from weeks to minutes.

## Run & Operate

- `pnpm --filter @workspace/cyttack run dev` — run the React/Vite frontend
- `pnpm --filter @workspace/api-server run dev` — run the Express API server (port from `PORT` env var)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes to Postgres (dev only)

## Required Environment Variables

- `DATABASE_URL` — Postgres connection string (required for API server)
- `SESSION_SECRET` — session signing secret (already set in Replit Secrets)
- `PORT` — assigned automatically per artifact by Replit
- `VITE_API_URL` — (optional) full URL of the API server for external deployments (e.g. `https://api.cyttack.com`). Leave unset in Replit — same-domain /api/* routing is handled automatically by the shared proxy.
- `FRONTEND_ORIGIN` — (optional) URL of the deployed frontend for explicit CORS allowlisting (e.g. `https://cyttack.vercel.app`). Leave unset in Replit.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + React Flow
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/cyttack/` — React/Vite frontend (dashboard, incidents, attack maps, etc.)
- `artifacts/api-server/` — Express REST API server
- `lib/db/` — Drizzle ORM schema and DB connection (`src/schema/index.ts` is source of truth)
- `lib/api-spec/` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/` — generated React Query hooks (from Orval codegen)
- `lib/api-zod/` — generated Zod validators (from Orval codegen)

## Architecture decisions

- API contract is defined in `lib/api-spec` as an OpenAPI spec; client hooks and Zod validators are generated from it via Orval — never edit generated files directly.
- DB schema lives in `lib/db/src/schema/` and is shared across the monorepo via the `@workspace/db` package.
- Frontend communicates with the API server via generated hooks in `@workspace/api-client-react`.
- Frontend/backend wiring: relative `/api/*` calls work out-of-the-box in Replit via the shared proxy. For external deployments set `VITE_API_URL` to the API server URL and `FRONTEND_ORIGIN` to the frontend URL.

## Product

Cyttack is a SOC command center targeting Indian government agencies and critical national infrastructure. Key features: live security operations dashboard, behavioral anomaly detection (simulated), MITRE ATT&CK mapping, APT campaign attribution, and an autonomous incident response orchestrator with human-in-the-loop escalation.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/db run push` after schema changes in dev.
- API client hooks and Zod validators are generated — run `pnpm --filter @workspace/api-spec run codegen` after OpenAPI spec changes.
- `seed.ts` must NOT self-execute at module level — use `src/seed-runner.ts` as the direct-run entry point to avoid `process.exit()` killing the server on startup (see `.agents/memory/seed-module-fix.md`).
- Drizzle returns `Date` objects for timestamp columns. Serialize to ISO strings before passing to `ZodSchema.parse()` — see `serializeAlert()` in `routes/simulation.ts`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
- Full product brief: `attached_assets/Pasted-REPLIT-AGENT-BUILD-BRIEF-SentinelGrid-AI-Driven-Cyber-R_1784459452359.txt`
