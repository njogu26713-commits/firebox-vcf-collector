---
name: Internal package import anti-pattern
description: Never import from internal package paths like @workspace/pkg/src/generated/...; always use the public barrel export.
---

**Rule:** Always import from the public package name only: `import { Campaign } from '@workspace/api-client-react'`. Never import from internal paths like `@workspace/api-client-react/src/generated/api.schemas`.

**Why:** Internal paths are not resolvable by TypeScript's `bundler` moduleResolution from another workspace package. The path works in the source package but causes `TS2307: Cannot find module` in consuming packages. This is a release-blocking error that only surfaces at typecheck time, not during dev (Vite resolves differently).

**How to apply:** When writing or reviewing code that imports types from a sibling workspace package, always check the import path uses the package name only. The public barrel (`lib/api-client-react/src/index.ts`) re-exports everything from the generated files.
