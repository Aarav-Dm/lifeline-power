---
inclusion: always
---
# Product — LifeLine Power

A Massachusetts care coordinator types a town, sees only that town's electric company from the saved 351-town `utilities` kit, opens that company's own program, and prints a one-page handoff naming the unfinished step, its owner, and the renewal rule that program's form actually states.

- User: a home-care coordinator, or an adult child acting as one. Demo: Dana Okonkwo (coordinator), James Pell, his father Robert Pell (oxygen concentrator, Fitchburg, Unitil). All synthetic. No real account number.
- Outage notification and shutoff protection are different programs. A company with both has two records and the user picks one.
- Switching town or company clears every answer from the old company. Language is the only household field that survives.
- Loaded companies: Unitil, National Grid (Massachusetts Electric), Eversource (NSTAR Electric), Wellesley Municipal Light Plant. Holyoke Gas & Electric is blocked: named, no checklist. Every other company with no opened form is blocked the same way.
- The app never submits, never confirms, never decides eligibility, never gives medical advice.
- Source of truth for every rule, quote, address and number: `research/FINAL-idea.md` and `research/lifeline-sources.md` (outside this repo); in the repo, `src/rules/` and `public/data/`. If a fact is not there, it is UNVERIFIED and shown that way.
- Spec: `.kiro/specs/lifeline/`. Build order: MVP (M1–M4) → tier 1 (S1–S5) → tier 2 (T1–T3, optional MCP). Do not start a tier until the previous tier's tests are green.
- Pitch number (not in app code): 45,895 Massachusetts Medicare beneficiaries rely on electricity-dependent medical equipment (HHS emPOWER state layer, edited 2026-10-07). Say "Medicare beneficiaries", never "residents".
- Judging: Potential Value, Implementation (Kiro use), Quality & Design. Claim only Kiro features actually used.
