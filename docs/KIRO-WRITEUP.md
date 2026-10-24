# LifeLine Power — Kiro Implementation Write-up

This write-up documents how Kiro was used to build LifeLine Power for the Hackachusetts 2026 Healthcare & Biotech track. Every claim reflects development events logged in [`docs/kiro-notes.md`](kiro-notes.md).

---

### 1. Which Kiro tools did you use? Kiro IDE, CLI, Web, Crew? How did they differ?

We primarily used **`kiro-cli` 2.34.0** in headless CLI mode (`kiro-cli chat --v3 --mode spec --no-interactive --trust-all-tools --trust-workspace "<prompt>"`), resuming sessions (`--resume`) across revision gates.

- **Kiro CLI:** Our primary execution engine. It enabled scriptable terminal automation, prompt logging in `research/spec-agent-prompts/`, and execution of the Spec agent and sub-agents.
- **Kiro Crew Profile:** Parallel sub-agents (3 in MVP, 4 in Tier 1) ran using the `kirocrew-worker` agent profile installed by Kiro Crew (which configures the "Kiro Crew Worker" prompt and loads Crew worker MCP tools). We used this Crew-installed profile to build the data layer, records, and UI in parallel against shared types in `src/types.ts`. However, Kiro Crew's full platform (gateway, web dashboard, and cron orchestrator) was not used.
- **Kiro IDE:** Used during the 6:23 PM ACP session to implement QA bug fixes.
- **What was NOT used:** **Kiro Web** was not used.

---

### 2. Spec-Driven Development (SDD) vs. Vibe Coding

We structured our specification under `/.kiro/specs/lifeline/` across three gated phases:
1. **Requirements (`requirements.md`):** Formal EARS acceptance criteria across 14 requirements.
2. **Design (`design.md`):** Architectural state machine, file layout, and 22 Correctness properties ($P_1$–$P_{22}$).
3. **Tasks (`tasks.md`):** Backlog (Tasks 0–19) isolating the MVP (Tasks 0–7) from Tier 1 (Tasks 8–14a) and Tier 2.

**What the Spec Agent Caught During Drafting:**
- *Requirements phase (4:22 PM):* Checked the MassGIS dataset while drafting, corrected our hand draft of 8 dual-served Eversource/National Grid towns, and flagged conflicting columns in Westfield.
- *Design phase (4:27 PM):* Discovered the latest Essex County FEMA disaster row was declaration 3599 (not 4736) and mapped data files to `public/data/` instead of `data/`.
- *Tasks phase (4:29 PM):* Structured discrete tasks with property links and removed an unrealistic early-deploy task before coding started.

**Plan Agent & Bugfix Specs:**
- At 6:14 PM, the built-in **Kiro Plan agent** (`kiro-cli chat --agent kiro_planner`) audited the stretch backlog against project bans, successfully cutting unsafe items (untranscribed paper boxes per Ban 12, calendar `.ics` exports per Bans 3/10/12/14).
- Three targeted bugfix specs (`lifeline-ui-bugs/`, `lifeline-qa-bugs/`, `lifeline-step-order/`) added 13+ regression tests. Note: these ran under Kiro's **Default agent**; the standalone Bug Fix agent is not claimed.

**How SDD Compares to Vibe Coding:**
In healthcare utility routing, "vibe coding" with an unconstrained LLM fails dangerously: it hallucinates policies, blends Eversource's Westwood address with National Grid's outage program, invents non-existent 12-month shutoff protections from Unitil checkboxes, and promises continuous power. SDD established rigid behavioral invariants, clear data boundaries, and non-negotiable refusals before generating code.

---

### 3. Agent Hooks

We automated safety and quality gates in `.kiro/hooks/quality-gates.json` (v1) with three specific hooks:
1. **PreToolUse Guard:** Intercepts tool calls and blocks write attempts to public kit CSVs under `public/data/utilities/data.csv`. Verified live at 6:16 PM: when an agent attempted to write `public/data/_hook_probe.txt`, the hook fired and blocked the operation with: *"Blocked: public/data/ holds the five saved kits; they are read-only (bans.md 12, tech.md)"*.
2. **PostFileSave Hook & Stop Hook:** Both execute `pnpm test`. Verified live at 6:16 PM: Vitest's cache was automatically updated at 6:16:02 and 6:16:37 PM without manual test commands.

---

### 4. Steering Documents

We maintained five global steering documents in `/.kiro/steering/` (`product.md`, `tech.md`, `bans.md`, `frontend.md`, `judging.md`) with `inclusion: always`, plus scoped `fileMatch` steering (`.kiro/steering/programs.md` added at 6:02 PM).

**Strategy That Made the Biggest Difference:**
Treating `bans.md` (15 refusal rules) as non-negotiable architectural constraints. The Spec agent and sub-agents deterministically respected negative constraints: dropping generic "not a guarantee of power" disclaimers (Ban 15), refusing to infer household languages from demographic rates (Ban 9), isolating Wellesley's calendar-year expiry to Wellesley (Ban 4), and refusing to invent forms for unverified municipal utilities like Holyoke (Ban 8).

At 6:09 PM, we validated a custom read-only audit agent (`.kiro/agents/bans-check.json` via `kiro-cli agent validate`), which read `src/rules/programs.ts` and confirmed zero ban violations.

---

### 5. Model Context Protocol (MCP)

We utilized two distinct MCP servers:
1. **`lifeline-kits` Server:** Registered in `.kiro/settings/mcp.json` with three read-only tools (`town_company`, `ej_mean`, `program_sources`). At 6:18 PM, invoked from `kiro-cli chat` to verify that `town_company({town: "Leominster"})` and `ej_mean({town: "Lawrence"})` matched UI state exactly (28.88%, n=56).
2. **`21st.dev` UI MCP Server:** Queried at 6:46 PM via `search` for design components. We retrieved the Vertical Titled Stepper (`get_component`, id 29815; using 1 of 2 free daily requests) and adapted its connecting-line step pattern into our shadcn Tabs stepper in `Workspace.tsx`.

---

### 6. Property-Based Testing (PBT)

We implemented property-based tests using `fast-check` tied to spec properties ($P_1$–$P_{22}$), validating hundreds of randomized inputs across 210 passing tests:

**The $P_1$ Planted-Bug Mutation Test:**
At 5:16 PM, we performed a mutation test by altering the reducer to preserve prior form answers when changing towns. Vitest immediately caught the bug, failing Property $P_1$ (`Town change clears answers`) with the minimal counterexample:
- Counterexample: `ABINGTON → HALIFAX` (and `Fitchburg → Leominster`).
The property test proved that old form data leaked across company boundaries. Reverting the mutation restored all tests to green.

**Other Issues Caught by PBT:**
- **$P_{16}$ Performance Timeout (5:56 PM):** $P_{16}$ timed out at 5.0s because EJ stats re-scanned 2,604 block groups across 351 towns on every render. Caching per kit reduced execution from 15.9s to 1.0s.
- **Task 9 Scope Conflict (5:51 PM):** Adding a second Unitil record broke older unit tests that hardcoded a single Unitil record. Spec properties $P_7, P_8, P_{13}, P_{21}$ forced the rule to generalize to "all Unitil records," preserving system correctness.

---

### 7. Kiro Powers

**Not Used.** Pre-bundled Kiro Powers (such as Context7) were not used. Instead, we leveraged specialized agent skills (`ui-ux-pro-max`, `frontend-design`, `apple-design`, `shadcn`, `impeccable`, and `web-design-guidelines`) to extract accessible high-contrast design tokens, enforce 44px touch targets, scaffold shadcn controls, add skip links, and establish deep-linked URL routing (`#/home`, `#/workspace`).
