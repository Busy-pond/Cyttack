---
name: Seed module auto-run fix
description: seed.ts must not self-execute at module level — doing so kills the server process via process.exit(0) when bundled by esbuild.
---

## Rule
Never put `seed().catch(...) + process.exit()` at the top level of `seed.ts` (or any module imported by the server).

**Why:** esbuild bundles everything into one file (`dist/index.mjs`). Module-level code in `seed.ts` runs on bundle initialization. The `isMain` check using `import.meta.url === process.argv[1]` is always true inside the bundle (both point to `dist/index.mjs`), so the seed auto-runs and `process.exit(0)` kills the entire server process seconds after it starts.

**How to apply:** Keep `seed()` and `seedIfEmpty()` as pure exported functions. For the `pnpm seed` CLI script, use a separate `src/seed-runner.ts` entry point that imports and calls `seed()` then exits. Update `package.json` `"seed"` script to point to `seed-runner.ts`.
