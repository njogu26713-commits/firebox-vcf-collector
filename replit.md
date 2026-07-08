# Firebox VCF Creator Dashboard

A premium SaaS dashboard for managing VCF (contact card) campaigns. One registered user manages multiple campaigns where visitors submit their name and phone via a unique share link, and a VCF file unlocks automatically when the target contact count is reached.

## Theme

White background (#ffffff) with green (#16a34a) accent — `hsl(142 72% 36%)` as `--primary` throughout. All CSS variables updated in `artifacts/firebox-dashboard/src/index.css`. Hardcoded dark colors replaced with `bg-background`, `text-foreground`, etc.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/firebox-dashboard run dev` — run the frontend dashboard (port 24816, proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Required env: `MONGODB_URI` — MongoDB connection string; `SESSION_SECRET` — session cookie signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, framer-motion, wouter, Recharts
- API: Express 5
- DB: MongoDB + Mongoose
- Validation: Zod (`zod/v4`)
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Theme: Black (#0B0B0B) background, orange (#FF6A00) accent

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `artifacts/api-server/src/lib/models.ts` — Mongoose schemas (User, Campaign, Contact)
- `artifacts/api-server/src/lib/mongodb.ts` — MongoDB connection (requires MONGODB_URI)
- `artifacts/api-server/src/routes/auth.ts` — email/password signup/login/logout/me (bcryptjs + express-session, session stored in Mongo via connect-mongo)
- `artifacts/api-server/src/middlewares/requireAuth.ts` — session-based auth guard for protected API routes
- `artifacts/api-server/src/routes/campaigns.ts` — CRUD + VCF download + contact submission
- `artifacts/api-server/src/routes/dashboard.ts` — stats + analytics endpoints
- `artifacts/firebox-dashboard/src/contexts/auth.tsx` — auth context wrapping the generated auth hooks
- `artifacts/firebox-dashboard/src/pages/sign-in.tsx`, `sign-up.tsx` — custom email/password auth pages
- `artifacts/firebox-dashboard/src/` — React frontend (pages/, components/)
- `artifacts/firebox-dashboard/src/index.css` — design tokens (black/orange theme)

## Architecture decisions

- Campaign share tokens are random 8-byte hex strings, used to generate public submission URLs
- Duplicate phone numbers per campaign are blocked at DB level (unique index on normalized digits) and app level
- VCF download only unlocks when `contactsCollected >= targetContacts` (enforced both server and client)
- Campaign auto-completes to "completed" status when target is reached via contact submission
- Authentication is self-hosted email/password (no third-party auth provider): bcryptjs password hashing + express-session with a MongoDB-backed store (connect-mongo). Supports multiple accounts; each user only sees their own campaigns (`Campaign.userId`).

## Product

- Dashboard with 4 stat cards (total/active campaigns, contacts collected, downloaded VCFs)
- Campaign list as modern dark cards with progress bars, share/copy/download actions
- Create campaign form (title, description, target contacts, status)
- Analytics page with Recharts bar/area charts per campaign
- Settings page with profile and notification toggles
- "How It Works" explainer section with 4-step flow

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any `lib/*` schema changes, run `pnpm run typecheck:libs` before leaf artifact typechecks to refresh declarations
- After any `lib/api-spec/openapi.yaml` changes, run `pnpm --filter @workspace/api-spec run codegen`
- Do NOT import from internal package paths (e.g. `@workspace/api-client-react/src/generated/...`) — use the public barrel export only

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
