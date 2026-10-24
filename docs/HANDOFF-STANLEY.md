# Handoff from Stanley (Kiro builder) — 24 Oct 2026, 6:47 PM ET

Read this first. Then `docs/status.md` (one line per task, with test counts) and `docs/kiro-notes.md` (every Kiro feature used, with times and logs).

## State right now

- `pnpm test`: **210/210 green, 18 files**. `pnpm exec tsc -b`: clean. `pnpm build`: green.
- Last browser check (headless Edge against `pnpm dev` on **http://localhost:5173/**, 6:46 PM) passed all four MVP checks:
  1. Fitchburg shows fax 603-227-4784 and the Concord, NH address.
  2. Print is one US Letter page.
  3. Leominster clears every Unitil answer.
  4. Holyoke is blocked, with Next disabled.
  - Also checked: step order Town → Program → Checklist → Handoff on Leominster; no horizontal scroll at 375 px; no console errors.
- **Dev server ports:** I ran `pnpm dev` on **5173**. The team's server on **4318** was not started by me and may serve an older build.
- **Nothing is half-done.** I stopped after finishing the 21st.dev stepper step.
- **Not committed or pushed.** Aarav pushes, once, at the freeze.

## Done

### Spec and docs

- **Spec** `.kiro/specs/lifeline/`, frozen:
  - `requirements.md`: 15 requirements, EARS (Easy Approach to Requirements Syntax).
  - `design.md`: properties P1–P22, each tagged by tier.
  - `tasks.md`: tasks 0–14 and 14a ticked; 15–19 open.
  - Revisions applied from Jim, Dwight, Pam and Oscar.
- **Bug-fix specs:**
  - `.kiro/specs/lifeline-ui-bugs/`: tab title, raw "not-chosen" label, town filter focus and stale filter, National Grid URL wrap.
  - `.kiro/specs/lifeline-qa-bugs/`: Oscar's 5 QA bugs plus polish item b.
  - `.kiro/specs/lifeline-step-order/`: Dwight's "Next skips Checklist on Leominster".
- **Docs** in `docs/`:
  - `PRD.md` (frozen), `FRONTEND.md`, `PRODUCT.md` (context for the impeccable skill);
  - `status.md`, `kiro-notes.md`, this file.
  - `DESIGN-BRIEF.md` is god's.
- **Steering** `.kiro/steering/`: `product.md`, `tech.md`, `bans.md` (binding), `frontend.md`, `judging.md`, `agent-routing.md`.

### Build tasks

| Tasks | What |
|---|---|
| 0 | Hooks in `.kiro/hooks/quality-gates.json`, plus `scripts/guard-raw-data.mjs` |
| 1–4 | CSV parser and kit loading; town → company; the MVP records; reducer and view model (`src/lib`, `src/rules`, `src/state`, shared types in `src/types.ts`) |
| 5–7 | Screen, print handoff, MVP gate (god ran the gate at 5:35: PASS) |
| 8–14a | National Grid and Eversource two-program choice; Unitil account protection; CPAP quoted limit; tracker (Confirmed is never settable); language control and limited-English sort with n; Wellesley; town combobox; tier-1 gate (keyboard, 375 px, 200% zoom) |

### Extras

- **Oscar's wiring:**
  - coverage ledger shown on Home and About through `src/lib/coverage-view.ts`: 293 of 351 towns, 92.5% of environmental-justice block groups, next forms to open;
  - Unitil disagreement notice on the Town step (Leominster, Gardner, Shirley, Westminster, West Townsend).
- **Spanish print:** "Imprimir en español" appears when the household language is Spanish. It uses Pam's labels from `src/i18n/handoff-es.ts`. Every record and source string stays English under "Texto original en inglés". Pam's generic no-guarantee and 220 CMR notices are left out (ban 15).
- **All five of Oscar's QA bugs** and Dwight's step-order bug are fixed and tested.
- **Redesign** per `docs/DESIGN-BRIEF.md`. Every screen in the brief exists:
  - **Shell** (`src/App.tsx`): sidebar (Home, New handoff, Coverage, Sources, About), top bar with Ctrl K town search, New handoff and a dark/light toggle, skip link. On mobile the sidebar becomes a top sheet.
  - **Home** (`src/screens/Home.tsx`):
    - 4 headline-number cards, all computed from code;
    - "Recent handoffs" table labelled "Demo data — synthetic", built by the real reducer;
    - "Next forms to open" bar list.
  - **Workspace** (`src/screens/Workspace.tsx`, step logic in `src/screens/step-order.ts`):
    - three columns: vertical stepper on the left (the 21st.dev connecting-line pattern), Next-step band and step content in the centre, sticky live handoff preview on the right;
    - steps Town → Program → Checklist → Handoff.
  - **Coverage** (`src/screens/CoverageScreen.tsx`): 351-town table with filter, sort and 50 rows per page.
  - **Sources** (`src/screens/SourcesScreen.tsx`): every source with link, date opened and its UNVERIFIED items, plus the saved data files.
  - **About** (`src/screens/AboutScreen.tsx`, reusing `Landing.tsx`): HHS figure with its source, the honest limits, coverage.
  - **Tokens** in `src/index.css`, light and dark, with AA contrast computed (teal #0E6E7A 5.95:1 on white, amber #B45309 5.02:1).
  - **Print CSS:** only `#handoff` prints, black on white, 9.5 pt. All 7 programs print on 1 page with every field filled.

## Queue for the next session (in order)

god's list included items that are already finished; they are marked here.

1. **Rest of the redesign** (`DESIGN-BRIEF.md` §5). All screens exist; what's left is polish.
   - **Still open:**
     - web-design-guidelines: the URL does not reflect the current screen or step;
     - Oscar's polish a (repeated copy: hero vs tagline, limits shown twice, Holyoke's name twice) and polish c (links on the disagreement notice);
     - optional: swap KPI cards, sidebar or tables for 21st.dev components (only one free `get_component` left today).
   - **Keep:** no logic or test changes; the four MVP checks; one-page print.
2. **Bug batches: already done.**
   - `research/qa-oscar.md` bugs 1–5 (spec `lifeline-qa-bugs`).
   - `research/qa-dwight.md` "Next skips Checklist": not reproducible on the current build; locked with 12 tests (spec `lifeline-step-order`).
   - New bugs go through agent-routing (see "How I ran Kiro" for the Bug Fix agent caveat).
3. **Tier 2:** tasks 15 (same-town facilities), 16 (FEMA line by county), 17 (National Grid paper notice). Not started.
   - The Plan agent's call at 6:12: do 15 first; do 16 only if 15 is green; **cut 17** (paper-notice boxes not transcribed, ban 12).
   - Switching on tier 2 means `ENABLED_TIERS = ["mvp","tier1","tier2"]` in `src/rules/programs.ts`. That makes `loadKits` parse the hospital and FEMA files.
4. **Stretch backlog:** `board.md` was **not found** (searched `D:\Hackathon`, `~\.hive`, `~\.kiro`). From god's message the Plan agent ordered it: renewal .ics → **cut** (bans 3, 10, 12, 14; would break property P11); draft-form text → **cut** (ban 12); tier 2 and FEMA as in item 3.
5. **Real hook firing: already logged** (6:16 PM). The guard hook blocked a write to `public/data/` inside a Kiro session. A hook ran `pnpm test` at the end of each session, but the logs don't show whether it was the on-save hook or the end-of-turn hook.
6. **MCP calls: already done.**
   - `lifeline-kits`: `town_company(Leominster)` and `ej_mean(Lawrence)` (6:19 PM), matching the UI.
   - 21st.dev: 4 `search` and 1 `get_component` (Vertical Titled Stepper), read-only only.
   - **Never** call 21st `delete_*`, `edit_*` or `create_*` (they change Aarav's account). Never copy the 21st key into the repo; it lives in `~/.kiro/settings/mcp.json`.
7. **Ship (task 19):** README with `pnpm install`, `pnpm dev`, `pnpm test` and the live URL; Aarav pushes and turns on GitHub Pages; check the URL in a private window. `.kiro/` is committed and not in `.gitignore` (checked).

## Rules

- `.kiro/steering/bans.md` is binding: never invent a rule, number, URL or quote; gaps are UNVERIFIED.
- `agent-routing.md`:

  | Work | Agent |
  |---|---|
  | Bug | Bug Fix agent |
  | Small feature | Quick Spec |
  | Ordering or cut calls | Plan |
  | Big change | Spec |
  | Parallel work | sub-agents |

  Log every use in `kiro-notes.md`, and never claim an agent that isn't logged.
- **Redesign:** layout, components and styles only. No changes to `src/state`, `src/rules`, `src/lib` or tests.
- **Four MVP checks** after every change; print stays one page, black on white.
- **Clock:** no new item after 7:05 PM; freeze at 7:20 PM; Aarav pushes. Submission is due 8:00 PM.
- **Package manager:** pnpm only (`pnpm add`, never `npm install`).

## How I ran Kiro (kiro-cli 2.34.0, Windows)

| Job | Command | What actually ran |
|---|---|---|
| Spec / bug-fix spec | `kiro-cli chat --v3 --mode spec --no-interactive --trust-all-tools --trust-workspace "<prompt>"`; `--resume` to continue the same spec session | Spec mode. Bug-fix runs **self-reported as the Default agent, not the Bug Fix agent.** `--mode` only accepts default or spec; picking "Fix a Bug" or "Quick Spec" needs the interactive `/spec new` or the IDE. |
| Plan | `kiro-cli chat --agent kiro_planner --no-interactive --trust-tools=fs_read "<prompt>"` | The real Plan agent |
| Sub-agents, 5:00 and 5:40 PM | The `subagent` tool with the `kirocrew-worker` profile | **A Crew-installed profile.** The write-up must not say "never Crew"; the Crew gateway, dashboard and scheduled jobs were not used. |
| Sub-agents, 6:30 PM | `kiro-cli chat --v3 --agent builder-worker --no-interactive ...` | Printed `agent "builder-worker" not found, using "default"`, so these ran as the Default agent. `.kiro/agents/builder-worker.json` exists but V3 does not load it. Don't claim it as used. |
| Hook / MCP probes | `kiro-cli chat --v3 --no-interactive --trust-all-tools --trust-workspace "<prompt>"` | — |

- **Prompts and logs:** `D:\Hackathon\research\spec-agent-prompts\` (files 1–15).
- **Browser checks:** throwaway Playwright scripts against Edge in `%TEMP%\llcheck\`, not in the repo: `flow2.js` (MVP checks), `pages2.js` (one-page print, all programs), `bug6.js` (step order).
- **Watch out in PowerShell:** `$home` is a built-in read-only variable. One sub-agent run got the wrong prompt because of it.

## Kiro features used (details and times in `docs/kiro-notes.md`)

- **Spec agent:** requirements → design → tasks, then revisions 1–3. Plus three bug-fix-type specs (Default agent).
- **Plan agent** (`kiro_planner`): ordered the stretch backlog.
- **Steering:** six always-on files.
- **Hooks:** guard seen blocking a write in a Kiro session; a hook ran the tests.
- **Sub-agents** in parallel, with the profile caveats above.
- **Skills:** ui-ux-pro-max, frontend-design, apple-design, shadcn, impeccable (detector run; design review done by one reviewer, not the two isolated reviews), vercel-composition-patterns, web-design-guidelines.
  - vercel-react-best-practices was named in prompts but no audit was run, so it is **not** claimed.
- **MCP:** lifeline-kits (2 calls); 21st.dev (4 searches, 1 `get_component`).
- **Custom agents in the repo:** `builder-worker.json` (defined, not loaded by V3); `bans-check.json` (Dwight's).
- **Property tests:** vitest + fast-check, P1–P22. The P1 mutation demo (town reset kept old answers → P1 failed with counterexample ABINGTON → HALIFAX → reverted) is the write-up's caught-bug story.
- **Not used:** Kiro Web; Kiro IDE (by me); Powers; fileMatch steering.

## Files I did not write (left as their owners made them)

- `src/lib/coverage.ts`, `src/rules/disagreements.ts` and their tests (Oscar).
- `src/i18n/handoff-es.ts` (Pam).
- `mcp/server.mjs` and `.kiro/settings/mcp.json` (Dwight).
- `.kiro/agents/bans-check.json` (Dwight).
- `.kiro/steering/judging.md` and `agent-routing.md` (god).
- `docs/DESIGN-BRIEF.md` (god).
