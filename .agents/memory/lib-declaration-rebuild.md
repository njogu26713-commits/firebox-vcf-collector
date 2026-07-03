---
name: Lib declaration rebuild rule
description: After editing lib/* schema or source files, run typecheck:libs before leaf artifact typechecks or the stale declarations cause TS2305 import errors.
---

**Rule:** After any edit to `lib/db/src/schema/`, `lib/api-zod/`, or other composite libs, run `pnpm run typecheck:libs` (which runs `tsc --build`) BEFORE running `pnpm --filter @workspace/<artifact> run typecheck`.

**Why:** Composite libs emit declaration files. Leaf artifacts (api-server, firebox-dashboard) import types from those declarations. If declarations are stale, the leaf typecheck fails with `Module has no exported member` even though the source is correct. The error looks like a bad import but is really a stale build artifact.

**How to apply:** Always pair lib schema changes with a `typecheck:libs` run. The codegen command (`pnpm --filter @workspace/api-spec run codegen`) already runs `typecheck:libs` at the end — so after codegen you are safe. Only manual lib edits (e.g. adding DB tables) need the explicit rebuild.
