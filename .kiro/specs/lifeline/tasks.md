# LifeLine Power — Tasks

Spec: `lifeline`. Phase: tasks. Implements the approved `requirements.md` and `design.md` (both at Revision 2: Jim's review, then Dwight's). Reconciled with `research/spec-hand-draft/tasks.md` (its order and numbering kept, plus a setup task 0).

Order is `LIFELINE-BUILD-PLAN.md`, with the MVP gate moved to 6:30 PM (Aarav approved, Revision 2): MVP (M1–M4) 4:30–6:30 PM, tier 1 (S1–S5) 6:30–7:00, tier 2 (T1–T3, optional MCP) only if tier 1 is green, freeze at 7:20. Unitil/Fitchburg is MVP (the M3 demo switch). The backup / facilities panel is tier 2. Each task names the properties it adds (P#, `design.md` §8) and the requirement IDs it covers. A task is ticked only when `pnpm test` and `pnpm build` both pass.

**6:30 PM gate:** Dana types Fitchburg, sees Unitil, fax 603-227-4784 and the Concord address, prints the handoff, switches to Leominster, and every Unitil answer is gone. Holyoke, opened for a second, has no checklist.

The MVP critical path uses only the `utilities` kit, two records (`unitil-lifesupport`, `ng-outage`) and no tracker. Shared types and global tests must not pull EJ, the tracker, facilities, FEMA or MCP into it.

## MVP — 4:30 to 6:30 PM

- [x] 0. Setup and guards
  - Confirm the five kits exist at `public/data/{utilities,ej,hospitals,cms-hospitals,fema}/data.csv` with their `README.md`. Do not move, copy or edit them.
  - Add test layout: `tests/` folder, `vitest` config if needed so `pnpm test` (`vitest run`) finds `tests/*.test.ts`; one smoke test.
  - Hooks via Kiro's hook tool: `PreToolUse` blocks agent writes under `public/data/` (exit 2); `PostFileSave` on `src/**`, `tests/**` runs `pnpm test`; `Stop` runs `pnpm test`. Commands use `pnpm` / `node` only, no bash syntax (Windows).
  - Update `.kiro/steering/tech.md` so the data path reads `public/data/<kit>/data.csv` (design §1). Confirm `.kiro` is not in `.gitignore`.
  - _Requirements: 13.5, 13.8_

- [x] 1. Data in place; only enabled-tier kits are blocking
  - `src/lib/kit-sources.ts`: the only module importing the five CSVs with `?raw` by relative path; each entry is a `KitSource` with `savedAt: "2026-10-18"` and its tier. Importing a string does not parse it.
  - `src/lib/csv.ts`: RFC 4180 parser (quoted fields, embedded commas, CRLF, empty cell → `null`). No dependency.
  - `src/lib/kits.ts`: `norm()`, typed rows, numeric columns → `number | null`, `overall_rating` → rating / `"Not Available"` / `null`, `validateKit(name, text)` returning `{ ok: false, file, check }` on the first failure, and `loadKits(enabledTiers)`: parses `utilities` always (failure → `fatal`, full-page error); parses a stretch kit only when its tier is enabled (failure → that kit `ok: false`, non-blocking); a disabled-tier kit is never parsed.
  - Only `utilities` is validated in this task. `ej` is validated in task 12; `hospitals`, `cms-hospitals` in task 15; `fema` in task 16.
  - Verify `pnpm build` and `pnpm test` both load `utilities` from `public/data/` and that the five `?raw` imports compile. If either fails, set `publicDir: false` in `vite.config.ts`; never move the kits.
  - Tests: parser examples (quoted comma, `"LAWRENCE, MA"`, CRLF, blank → `null`); `validateKit("utilities")` on the real kit (exact header, 351 rows); a renamed `utilities` header ⇒ `fatal` naming the file; `loadKits(["mvp"])` does not parse `ej`, `hospitals`, `cms-hospitals` or `fema`. (The P12 parser property is tier 1, task 8; the parser examples here are unit tests, not a gate property.)
  - Accept: a deliberately malformed `ej` string passed to `loadKits(["mvp"])` changes nothing; a malformed `utilities` string yields the full-page error.
  - _Requirements: 1.2, 13.1a, 13.3, 13.4, 13.8, 13.9, 13.10, 13.11_

- [x] 2. Town → company (M1)
  - Selectors `townRow`, `companyCodes` (split `utility_code` on `", "` only; never read `utility`).
  - Derived statuses `idle`, `not-found`, `mixed-unpicked`, `blocked` (`holyoke-no-form`, `no-form-loaded`).
  - `ENABLED_TIERS = ["mvp"]`, so Eversource and Wellesley towns show the generic blocked card until tier 1.
  - Tests: **P4**. Examples: Fitchburg → `Unitil (Fitchburg Gas & Electric)`; Leominster, Gardner, Shirley, Westminster → National Grid; Westfield is mixed (Westfield G&E or Eversource, both blocked in the MVP), never National Grid; Holyoke blocked, no phone number; Nantucket blocked; "West Townsend" not found. Mixed rows: exactly 18 start `mixed-unpicked` — 8 Eversource + National Grid (Bellingham …), 9 municipal + investor-owned (Chicopee …), 1 municipal + municipal (Lynnfield); no single-company row does; Lynnfield either pick and Chicopee's municipal pick are blocked.
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.4a, 1.4b, 1.5, 1.6, 1.7, 1.8, 1.9_

- [x] 3. Program records for the MVP (M2 data)
  - `src/rules/sources.ts`: the ten sources from design §3, each with the literal `openedAt: "2026-10-24"` (never computed from a clock). No `savedAt` on a `Source`.
  - `src/rules/programs.ts`: `ProgramRecord`, `Field` (kinds incl. `yes-no`, `consent`), `isAnswered`, the `Step` union (`field` / `send` / `utility-wait`, field steps with a non-empty field tuple), `NO_INTERVAL`, records `unitil-lifesupport` and `ng-outage` exactly as design §3.
  - `unitil-lifesupport`: `renewalLabel` "Outage-list renewal", renewal `NO_INTERVAL` with scope "in the opened sources"; `regulationContext` "Separate shutoff-protection certificate (220 CMR 25.03): serious illness renewed quarterly; chronic every six months"; `formBoxNote` "clinician's anticipated length of the condition, not a protection period". No 3/6/12 coordinator field; the box lives in the clinician's send step. No low-income field.
  - `ng-outage` quotes copied character for character from `FINAL-idea.md` "Verbatim limits"; the CPAP sentence stored as `cpapSentence`, not rendered until task 10. Unitil strings are `verbatim: false`.
  - Tests: **P10 MVP part** (2.2, 2.3, 2.5, 2.9 on `unitil-lifesupport` and `ng-outage` only: card fields, single-record text, Unitil fax/address/URLs, UNVERIFIED badges); the 13.x source checks and the tier-1 strings (413-746-6495, 1-866-460-8549, Westwood, Syracuse) are P10's tier-1 part in task 8; **P7 MVP part** (2.4, 2.4a, 2.6a) and **P8** for the two MVP records; **P21** structure part (one send step, one wait step last, every field step has a required field) and the `isAnswered` rules ("No" answered, blank not, consent only when `true`).
  - _Requirements: 2.2, 2.3, 2.4, 2.4a, 2.5, 2.6, 2.6a, 2.6b, 2.7, 2.8, 2.9, 2.10, 2.10a, 2.10b, 13.1, 13.1b, 13.2_

- [x] 4. Reducer and derive (M3 core)
  - `src/state/reducer.ts`: `State` with no `confirmed`, `status` or `rejected` field; actions `SELECT_TOWN`, `SUBMIT_UNMATCHED`, `PICK_COMPANY`, `PICK_PROGRAM`, `SET_ANSWER` (namespaced keys only; equal value ⇒ same state object; a different value ⇒ also `attestedSent = false`), `SET_ATTESTED`, `SET_LANGUAGE`, `SET_LANGUAGE_OTHER`, `SET_TYPED_COUNTY`, `SET_BACKUP_CONTACT`. Invalid actions return the same object.
  - `src/state/derive.ts`: `ViewModel`, `CardView` (`appText` vs `quotes` / `limits` / `renewal` / `regulationContext`), `stepDone` (field by `isAnswered`, send by `attestedSent`, wait never), `firstOpenStep`, `HandoffView` (no `trackerWord` unless tier 1 is enabled).
  - Synthetic demo fixture (Robert Pell, Fitchburg, account "DEMO — not a real account") in `src/state/demo.ts`, flagged so the handoff can label it.
  - Tests: **P1** (headline: Fitchburg → Leominster), **P2** (Lawrence → Worcester), **P3**, **P5** (resulting-state invariant over generated action sequences; success example Holyoke → `SELECT_TOWN(FITCHBURG)` is `program-open` on Unitil; Bellingham → National Grid pick opens `ng-outage`), **P5 MVP part** is the bullet above (1.4–1.6, 4.7; the 7.7 tracker part is task 11), **P6 MVP part** (2.8 on the two MVP records), **P16 MVP part** (3.2: town change keeps language, state only), **P21** regressions (a) household fields filled ⇒ Unitil clinician send step still open and first; (b) `SET_ATTESTED(true)` from a Prepared state via the reducer ⇒ "Waiting for Unitil to confirm" still open and first; (c) wait step never done.
  - Accept: deliberately keep one Unitil answer across the switch, see P1 fail, revert, see it pass; screenshot both for the write-up. Deliberately mark the wait step done when its list is empty, see P21 fail, revert.
  - _Requirements: 1.4, 1.5, 1.6, 2.8, 2.10c, 2.10d, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.7_

- [x] 5. Screen: town search, company line, one program card (M1 + M2 UI)
  - Add shadcn components: `pnpm dlx shadcn@latest add badge radio-group card alert checkbox input label select separator`. No hand-rolled controls. (`command`, `popover` arrive with the tier-1 combobox, task 14a.)
  - `src/App.tsx` + `src/components/*` render only `derive()` output: header line, a labelled typed town `Input` + submit `Button` (Enter matches the normalized text against the 351 rows → `SELECT_TOWN`; no match → `SUBMIT_UNMATCHED`; no list, scroll or sort in the MVP), company `Badge`s, mixed-town `RadioGroup`, blocked `Alert`, full-page error when `utilities` is `fatal`, program `Card` (purpose, signer, labelled renewal, the Unitil `regulationContext` in its own labelled block below the renewal, the 3/6/12 `formBoxNote`, return channels, source links with visible URL, quotes in `<blockquote>`, UNVERIFIED `Badge`s, steps with kind, owner and a text done-marker, labelled fields; yes-no as a two-option control so "No" is a real answer).
  - Static test: no rule text, fax, address or phone string in `src/components/**` or `src/App.tsx`; no `fetch(`, `XMLHttpRequest` or `sendBeacon` under `src/`.
  - Accept: Fitchburg shows 603-227-4784, the Concord address, "Outage-list renewal: No interval stated in the opened sources", the separately labelled "Separate shutoff-protection certificate (220 CMR 25.03)" line, the 3/6/12 box labelled as the clinician's anticipated length of the condition, and no "protected for 12 months" or outage-list expiry; with every household field filled the next open step is the clinician's send step; Lawrence shows the live-form URL and "No interval stated"; every control has a visible label; the demo path (type town, Enter, pick, fill, print) works by keyboard with visible focus; status in text, not colour alone. (375 px, 200% zoom, reduced motion and the full keyboard-order pass are tier 1, task 14a.)
  - Fallback (Dwight): if this screen is not up by 6:10 PM, ship the plain text field and the card, and go straight to task 6.
  - _Requirements: 1.2a, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.5, 2.6, 2.6a, 2.6b, 2.8, 2.9, 2.10, 2.10c, 13.5, 13.10, 14.1a, 14.2, 14.4_

- [x] 6. Print handoff (M4, no tracker dependency)
  - `<Handoff>` from `derive().handoff`, `hidden print:block`; `@media print` hides everything else; `@page { size: letter; margin: 0.5in }`; one page for the longest MVP record.
  - "Print handoff" `Button` rendered only in `program-open`. "synthetic demo household" when the fixture is in use. No generic no-guarantee line.
  - MVP handoff shows every step with its owner and the next unfinished step with its owner; no Prepared / Submitted / Confirmed word. Does not import or wait on task 11.
  - Tests: **P9** (incl. `enabledTiers = ["mvp"]` ⇒ no tracker word).
  - Accept: printed Fitchburg page names Unitil, the MALFORM-MA URL, the clinician signer text, fax 603-227-4784, "Outage-list renewal: No interval stated in the opened sources", the separately labelled 220 CMR 25.03 shutoff-protection certificate line, the clinician's send step as next unfinished step (owner = signer text), and "Waiting for Unitil to confirm" kept as an open step owned by Unitil; it shows no tracker word, never says confirmed, and no line reads as enrollment (4.5). Browser print preview shows one US Letter page.
  - _Requirements: 4.1, 4.1a, 4.2a, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [x] 7. MVP gate (by 6:30 PM)
  - Run the 6:30 path end to end: Fitchburg → Unitil fax + Concord address → print → Leominster clears every Unitil answer → Holyoke shows no checklist.
  - `pnpm test` green for exactly the MVP properties and parts (`design.md` §8 Tier cells): P1, P2, P3, P4, P8, P9 in full; P5 (1.4–1.6, 4.7); P6 (2.8 on the two MVP records); P7 (2.4, 2.4a, 2.6a on the two MVP records); P10 (2.2, 2.3, 2.5, 2.9 on the two MVP records); P16 (3.2, state only); P21 (2.10–2.10d on the two MVP records). No tier-1 record, fax, address or property is required for this gate (not P11, P12, P13–P15, P17, P22, nor any tier-1 part). `pnpm build` succeeds; `pnpm preview` serves `dist/` and `utilities` loads. No stretch kit is parsed.
  - Accessibility at this gate is 14.1a, 14.2, 14.4 only; the gate does not fail on 14.1, 14.3 or 14.5.
  - _Requirements: 1.1, 1.2a, 2.1, 2.10a, 3.1, 4.1, 4.2a, 13.1, 13.9, 14.1a, 14.2, 14.4_

## Tier 1 — 6:30 to 7:00 PM (start only after task 7 is green)

- [x] 8. National Grid and Eversource two-program choice (S1)
  - Add `ng-medical`, `ev-letter`, `ev-illness` exactly as design §3, with their verbatim quotes (`ev-illness` keeps the doubled "or a chronic serious illness"; statute sentence on `ev-illness` only). `noGuarantee` only on `ev-letter`.
  - Steps follow the contract: clinician document steps are `[field]` steps owned by the signer with a coordinator-recorded consent ("Signed letter is in hand" / "Completed certificate is in hand"); then one `[send]`; then `[wait]`.
  - `ENABLED_TIERS = ["mvp", "tier1"]`; program-choice `RadioGroup` (name + purpose); `PICK_PROGRAM` clearing.
  - `ng-medical`: discount-rate field and conditional hardship consent; email shown as "masked on the opened page — UNVERIFIED", no address stored.
  - Tests: **P13**; **P11** (determinism, 13.7); **P12** parser part (13.4, over generated CSV text and the real `utilities` kit); tier-1 parts of **P6** (5.5, 13.6, all records), **P10** (13.x source checks; 413-746-6495, 1-866-460-8549, Westwood, Syracuse each only on its own record) and **P21** (all records); **P7** re-run. P11 and P12 do not depend on these records: if `ng-medical` is cut (cut item 6), they still run here.
  - Accept: Leominster → Medical Protection shows 90/180, Syracuse, hardship, masked email UNVERIFIED, no "No interval stated"; with household fields filled the next open step is the signer's letter step; Chelsea → letter shows Westwood, annual, "Bedford copy, May 2023 filename — currency UNVERIFIED"; illness shows 90/180, fax 413-746-6495 or eversource.com/upload, both certifier lists, no Westwood, no 781-441-3686.
  - _Requirements: 2.10a, 2.10b, 2.10c, 5.1, 5.2, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 13.1, 13.1a, 13.1b, 13.2, 13.3, 13.4, 13.6, 13.7_

- [x] 9. Unitil account-protection record (S1; cut second, after MCP)
  - Add `unitil-protection`: renewal is the 220 CMR 25.03 line (`regulation-quarterly-semiannual`), with the 3/6/12 `formBoxNote` beside it, not collapsed into it.
  - Low-income verification `[field]` step before the send step: select with "Verification supplied" / "Utility confirmed not applicable"; while unanswered it reads "Applicability not determined" and the step shows unfinished. The app never chooses an outcome. The field exists only on this record and never gates `unitil-lifesupport`.
  - Unitil now offers two records and requires a choice. Intent-to-file note shown separately, unchecked, labelled "not the physician certificate".
  - If cut: Unitil stays on `unitil-lifesupport` alone and opens without asking (2.1); a read-only caveat is not needed there because the footnote is account-protection only.
  - Tests: **P13** for the Unitil pair; **P8** and **P7** over both Unitil records (220 CMR text is `unitil-protection`'s renewal and only `unitil-lifesupport`'s `regulationContext`); **P21** low-income part (null ⇒ open with "Applicability not determined"; either outcome answers it; `unitil-lifesupport` steps unchanged).
  - _Requirements: 2.6b, 5.3, 5.3a, 5.10, 5.10a, 5.10b, 5.10c, 5.11_

- [x] 10. CPAP quoted limit (S2)
  - On `ng-outage` only: device select and patient age in months. Show `cpapSentence` verbatim citing `ng-live` plus a link-only pointer to `ng-protect` when the device is CPAP, BiPAP, APAP or VPAP and age > 6; age prompt when age is blank; nothing extra at ≤ 6.
  - No rejected / denied / not-eligible state or text anywhere.
  - Tests: **P14**.
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 11. Tracker (S3)
  - Derived tracker UI: Prepared, Submitted, Confirmed as three labelled stages, state in text. Prepared = every `[field]` step done; Submitted = Prepared + attested `[send]` step. Confirmed always muted and reads "Only {company} can confirm".
  - Attestation `Checkbox` with the record's own wording, disabled until Prepared. Any actual change to a packet answer after the attestation clears it (the reducer rule from task 4); re-entering the same value changes nothing.
  - Handoff shows the tracker word only now that tier 1 is enabled.
  - Tests: **P15**, P5 tier-1 part (7.7: no tracker while blocked, not found or unpicked), P21 tier-1 part (7.2a), **P22** (edit after send: changed value ⇒ attestation cleared, not submitted; clear-then-refill with the old value ⇒ still not submitted; same value ⇒ same state, still submitted).
  - _Requirements: 4.2, 7.1, 7.2, 7.2a, 7.3, 7.4, 7.5, 7.6, 7.6a, 7.7_

- [x] 12. Language control and EJ sort (S4)
  - Enabling tier 1 makes `loadKits` parse and `validateKit("ej")` (header, 2,604 rows); failure turns only the EJ sort and mean off with the notice "Saved ej file failed check: {check}. EJ sort is off."
  - `ejStats` selector (unweighted mean of non-null `limited_english_hh_pct` over `ej === "Yes"` rows, with n).
  - Sort toggle A–Z / EJ mean; `28.88% · n=56` beside each town with the label "unweighted mean across EJ block groups — not a town-wide rate"; "No EJ block groups" sorted last; Wellesley shows 0.00% · n=2.
  - Household language `Select`, default "Not chosen", in its own group apart from the sort; handoff shows the language only if set, labelled "set by coordinator".
  - EJ max column: not in the requirements, so it is not built (third in the cut order; nothing to cut).
  - Tests: **P16** tier-1 part (8.1–8.3), **P17**; a malformed `ej` string with tier 1 enabled ⇒ EJ off and Fitchburg → Leominster → handoff still derives.
  - _Requirements: 4.2, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 13.9, 13.11_

- [x] 13. Wellesley record (S5)
  - Add `wmlp-chn` exactly as design §3, with `noGuarantee` from its own source. Physician verification "may be requested" is a limits line, not a step.
  - Tests: **P7** tier-1 part (9.1, 9.4, 9.5: calendar-year text on `wmlp-chn` only; never on Holyoke, blocked cards or National Grid records); tier-1 parts of **P6**, **P10** and **P21** re-run.
  - Accept: Wellesley shows rest of calendar year or until need ends, renew with the same form, physician verification may be requested, the unpaid-bill line, the 24-hour line, 4 Municipal Way and 781-235-7600; Holyoke unchanged.
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 14a. Town combobox and tier-1 accessibility
  - `pnpm dlx shadcn@latest add command popover`; replace the MVP town `Input` with a `Popover` + `Command` combobox over the 351 towns (list, scroll, type to filter, arrow keys, Enter; empty text "Not in the saved 351-town table"). A–Z / EJ sort stays in task 12. This is cut item 4 (search polish): if cut, the MVP typed field stays.
  - Accessibility pass: full keyboard order in visual order with visible focus on every control (14.1); 375 px and 200% zoom without horizontal scroll (14.3); `prefers-reduced-motion` respected (14.5).
  - _Requirements: 1.2, 1.2a, 14.1, 14.3, 14.5_

- [x] 14. Tier 1 gate (by 7:00 PM)
  - Demo path: Lawrence (CPAP sentence), Chelsea (Eversource choice), Wellesley, Holyoke, Bellingham; on a submitted packet, editing the address drops Submitted. Accessibility: 14.1, 14.3, 14.5 checked (task 14a). `pnpm test` green: every MVP part plus the tier-1 parts and properties (P1–P11, P12 parser part, P13–P17, P21, P22), `pnpm build` succeeds.
  - _Requirements: 5.1, 6.1, 7.1, 7.6a, 8.1, 9.1, 14.1, 14.3, 14.5_

## Tier 2 — 7:00 to 7:20 PM (only if task 14 is green; otherwise polish the UI)

- [ ] 15. Same-town facilities to verify (T1)
  - Enabling tier 2 makes `loadKits` parse and validate `hospitals` (103 rows) and `cms-hospitals` (84 rows); a failure turns only that list off with its notice.
  - `facilitiesFor(town)` over `cms-hospitals` (`city`) and `hospitals` (`municipality`), exact normalized match, file order, two lists labelled by source file and "Same town — verify by phone. Not ranked by distance."
  - Empty list: "No rows in this file for {town}"; typed backup-contact field when both are empty. Bed 0 with its note; "Not Available" ratings as printed.
  - No dedupe across the two files (each list is its own source); backup dedupe is fifth in the cut order.
  - Tests: **P18**; **P12** tier-2 part (beds and ratings); a malformed `hospitals` string ⇒ that list off, card and print unaffected.
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 13.9, 13.11_

- [ ] 16. Historical FEMA line (T2)
  - Enabling tier 2 makes `loadKits` parse and validate `fema` (415 rows); a failure turns only the FEMA line off with its notice.
  - County from agreeing facility rows or typed; origin label; `^(.+?)\s*\(County\)` parse; latest by date, tie on higher `disasterNumber`; "Historical declaration — not a forecast". No hardcoded disaster number.
  - Tests: **P19**. Example: Lawrence → 2023-09-15 Hurricane Lee, Essex, from the CMS row; Chelsea blank until typed; tribal, reservation and Statewide rows never match.
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 13.9, 13.11_

- [ ] 17. National Grid paper notice as a separate record (T3)
  - Add `ng-paper` (tier 2) via `OPEN_PAPER_NOTICE`, shown as "Also published: paper notice" outside the two-choice list; code "CM10226 (10/24)" shown as printed; own field keys and options; steps per the contract (signature as a consent `[field]` step, then `[send]`, then `[wait]`).
  - Tests: **P20**; **P7** tier-2 part (12.1: "No interval stated", no Wellesley expiry); **P21** re-run.
  - _Requirements: 12.1, 12.2, 12.3_

- [ ] 18. Optional read-only MCP server (25-minute timebox; cut first)
  - Not in the feature spec (`lifeline-features.md`). Optional, 25-minute cap, stops at the 7:20 freeze whether or not it connects; never blocks the demo.
  - Narrow read-only tools over `public/data/` reusing `src/lib/kits.ts` normalization; config in `.kiro/settings/mcp.json`.
  - If not connected within the timebox: remove the config; write-up says "MCP: not used".
  - _Requirements: 15.1, 15.2, 15.3_

## Freeze — 7:20 to 7:30 PM

- [ ] 19. Ship
  - No new features. `pnpm test` green; `pnpm build`; `pnpm preview` check.
  - `.kiro/` committed and absent from `.gitignore`. Aarav pushes his own repo to a branch and enables GitHub Pages; URL opens in a private window and loads the enabled-tier kits.
  - README: what it does, what it never does, sources (program sources opened 2026-10-24; kits saved 2026-10-18), Kiro features actually used (specs, steering, hooks, property tests; MCP only if task 18 shipped).
  - _Requirements: 13.1, 13.1a, 13.5, 13.8_

## Cut order if behind (build plan)

1. MCP server (task 18)
2. Unitil account-protection record (task 9)
3. EJ max column (not built; nothing to cut)
4. Search polish (task 14a combobox; the MVP typed field stays)
5. Backup dedupe (not built in task 15)
6. National Grid Medical Protection card (`ng-medical` in task 8; National Grid then shows `ng-outage` alone)

Never cut: the MVP Unitil record (`unitil-lifesupport`), the property tests, or `.kiro/`.

## Property coverage

MVP column = what gate 7 requires (`design.md` §8 Tier cells).

| P# | MVP (gate 7) | Tier 1 | Tier 2 |
|---|---|---|---|
| P1, P2, P3 | 4 (full) | — | — |
| P4 | 2 (full) | — | — |
| P5 | 4 (1.4–1.6, 4.7) | 11 (7.7) | — |
| P6 | 4 (2.8, two MVP records) | 8 (5.5, 13.6, all records); re-run 13 | — |
| P7 | 3 (2.4, 2.4a, 2.6a, two MVP records) | 8 re-run; 9 (5.3a); 13 (9.1, 9.4, 9.5) | 17 (12.1) |
| P8 | 3 (full); re-run 9 | — | — |
| P9 | 6 (full) | — | — |
| P10 | 3 (2.2, 2.3, 2.5, 2.9, two MVP records) | 8 (13.x source checks; tier-1 fax/address strings); re-run 13 | — |
| P11 | — | 8 | — |
| P12 | — | 8 (parser, 13.4) | 15 (beds, ratings) |
| P13 | — | 8, 9 | — |
| P14 | — | 10 | — |
| P15, P22 | — | 11 | — |
| P16 | 4 (3.2, state only) | 12 (8.1–8.3) | — |
| P17 | — | 12 | — |
| P18 | — | — | 15 |
| P19 | — | — | 16 |
| P20 | — | — | 17 |
| P21 | 3 (structure, `isAnswered`), 4 (regressions a–c), two MVP records | 8 (all records), 9 (5.10x), 11 (7.2a), re-run 13 | 17 re-run |

## Reconciliation notes

- Task 0 added: kits are already in `public/data/` (no copy step), hooks and the `tech.md` path fix come first.
- Task 1 uses `kit-sources.ts` and the design's `public/data/` fallback; no `data/SOURCES.md` (each kit's README already names its source).
- Task 5 adds the static no-rule-text / no-fetch test (13.5, tech.md layering).
- Task 6 drops the tracker word from the MVP handoff; it arrives in task 11 (4.2, 4.2a).
- Task 10 uses age in months only (design §3), not a months/years unit picker.
- Task 14 is a tier 1 gate; tier 2 tasks renumber to 15–18 and ship to 19.
- Requirement IDs follow the approved numbering (print gating 4.7, synthetic label 4.8, company line 1.9).

### Revision 1 — Jim's review (`research/review-spec-jim.md`)

- Jim 1 (Unitil renewal split): tasks 3, 5, 6 (MVP labels); task 9 (220 CMR as account-protection renewal).
- Jim 2 (MVP print without tracker): task 6, gate 7; tracker word only in task 11.
- Jim 3 (low-income applicability): task 9.
- Mixed towns 18 = 8 + 9 + 1: task 2 examples.
- Jim 4 (`openedAt` / `savedAt`): tasks 1, 3, 19.
- Jim 5 (step completion contract, blocking): tasks 3, 4 (P21), re-run in 8, 9, 13, 17.
- Jim 6 (edit after send): reducer rule in task 4; P22 in task 11; gate 14.
- Jim 7 (P5 scope): P5 moved from task 2 to task 4, where action sequences exist; Holyoke → Fitchburg success example.
- Jim 8 (only enabled-tier kits block): task 1; stretch-kit validation moved to tasks 12, 15, 16; gate 7.

### Revision 2 — Dwight's review (`research/review-spec-dwight.md`) and god's decision

- MVP gate 6:30 PM (Aarav approved): header, MVP heading, task 7, tier-1 heading. Tier 2 7:00–7:20 only if tier 1 is green; freeze 7:20.
- Requirement 14 split: task 5 and gate 7 require 14.1a, 14.2, 14.4 only; new task 14a does 14.1, 14.3, 14.5; tier-1 gate 14 checks them.
- MVP town input is a typed field + Enter (task 5); the `Command` combobox moves to task 14a (cut item 4 now points there); EJ sort stays in task 12. Fallback: if task 5 is not up by 6:10, ship the plain field and the card.
- pnpm: `pnpm test` / `pnpm build` / `pnpm preview` throughout; hooks run `pnpm test`.
- Task 6: "Waiting for Unitil to confirm" stays open, owned by Unitil, never reads as enrollment, never says confirmed (4.5).
- Task 3: P10 checks only existing records; tier-1 strings checked in task 8.
- Task 18: MCP not in the feature spec; optional, 25-minute cap, stops at 7:20.

### Revision 3 — Dwight via god

- Rule: a property or part is MVP only if it tests Requirements 1–4 on `unitil-lifesupport` and `ng-outage`; `design.md` §8 Tier cells now say exactly which part sits in which tier.
- Task 7 lists exactly the MVP properties and parts and states that no tier-1 record, fax, address or property is required for the gate.
- P11 and the P12 parser part move from tasks 4 and 1 to task 8; task 1 keeps parser unit examples only.
- Task 3: P10 and P7 limited to their MVP parts. Task 4: P5, P6, P16 limited to their MVP parts; requirements line drops 7.7, 13.6, 13.7.
- Task 8 adds P11, P12 parser, and the tier-1 parts of P6, P10, P21 (incl. 1-866-460-8549); task 11 adds P5 (7.7) and P21 (7.2a); task 12 P16 (8.1–8.3); task 13 P7 (9.x); task 15 P12 (beds); task 17 P7 (12.1).
- Tier-1 gate 14 lists P1–P11, P12 parser part, P13–P17, P21, P22. Coverage table rewritten with MVP / Tier 1 / Tier 2 columns.







