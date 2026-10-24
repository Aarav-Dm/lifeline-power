---
inclusion: always
---
# Tech — LifeLine Power

- Stack: Vite + React + TypeScript (strict) + Tailwind + shadcn/ui. UI components follow `frontend.md`. Package manager: pnpm (as scaffolded).
- Static site on GitHub Pages. `vite.config.ts` uses `base: './'`. No server, no runtime `fetch`, no API keys, no telemetry, no login.
- Data: the five kit CSVs at `public/data/<kit>/data.csv` (`utilities`, `ej`, `hospitals`, `cms-hospitals`, `fema`), copied verbatim, imported with `?raw`. Never edit anything under `public/data/`; a `PreToolUse` hook blocks agent writes there. Only enabled-tier kits are loaded: `utilities` in the MVP; a stretch-kit failure never blocks the MVP.
- Layering (pure modules have no React import and are what tests import):
  - `src/lib/csv.ts` parse · `src/lib/kits.ts` normalize + selectors
  - `src/rules/sources.ts`, `src/rules/programs.ts` — the only place rule text, quotes, addresses, faxes live; every string carries a `sourceId`
  - `src/state/reducer.ts` state machine · `src/state/derive.ts` view model
  - `src/components/*`, `src/App.tsx` render the view model only; no rule text in components
- Normalize joins with `trim().replace(/\s+/g, " ").toUpperCase()`. Join utilities on `town`, ej/hospitals on `municipality`, cms on `city`. Never join on a display name. Split `utility_code` on `", "` only.
- Missing, zero and "Not Available" are different values. Blank parses to `null`.
- Tests: vitest + fast-check in `tests/*.test.ts`; `pnpm test` runs `vitest run`. Generators use real kit rows. Each property in `design.md` §8 is one `fc.assert` with its P-number in the test name. A shrunk counterexample becomes a named regression test. fast-check is our library, not a Kiro feature.
- A task is done only when `pnpm test` and `pnpm build` pass. Use `pnpm add`, never `npm install`.
- Commit `.kiro/`. Never add `.kiro` to `.gitignore`.
- Windows dev box: hook commands use `node` / `pnpm` only, no bash syntax.

