# LifeLine Power — Product Requirements Document

Version 1, 24 Oct 2026, 4:45 PM ET. Owner: Stanley (Kiro builder). **Track: Healthcare & Biotech.**

This PRD agrees with the Kiro spec in `.kiro/specs/lifeline/` (requirements, design, tasks; produced by Kiro's Spec agent) and with `LIFELINE-BUILD-PLAN.md`. If they disagree, the build plan wins on order and scope, and the spec wins on acceptance wording. Requirement IDs below (R1.4, R2.6a, …) are the spec's. Every rule, number and URL traces to `research/FINAL-idea.md` or `research/lifeline-sources.md`. Anything not opened is marked UNVERIFIED.

---

## 1. Problem

Massachusetts electric companies already publish how to register someone who depends on powered medical equipment. The failure is filling the wrong company's form, or reading one company's rule onto another company's form.

- The saved state table (MassGIS, 351 towns) assigns each town its company. By primary company, 158 towns are National Grid (Massachusetts Electric), 130 are Eversource (NSTAR Electric) and 41 are municipal (counts from `FINAL-idea.md`); separately, 18 rows name more than one company and wait for a pick.
- Each company runs two kinds of program that are easy to confuse:
  - **Outage notification**: a call before a planned or long outage. It does not protect the account from shutoff and does not give faster restoration.
  - **Shutoff protection**: a clinician certificate plus financial hardship that stops disconnection for non-payment. Its renewal is whatever that company's opened form states: National Grid's and Eversource's say 90 days (serious illness) or 180 days (chronic illness); Unitil's form points to 220 CMR 25.03 (quarterly, or every six months if chronic). Wellesley's program is notification, not shutoff protection, and Holyoke's form was not opened.
- Renewal rules differ by form. National Grid's outage form states no interval. Eversource's life-support letter is annual. Wellesley's lasts the rest of the calendar year. Unitil's form has a 3 / 6 / 12-month box that is the clinician's estimate of how long the condition lasts, not a protection period.
- Holyoke Gas & Electric publishes no form we could open.

**Hook number.** 45,895 Massachusetts Medicare beneficiaries rely on electricity-dependent medical equipment, out of 1,520,183 Medicare beneficiaries in the state; 7,409 use oxygen services. Source: HHS emPOWER state layer (`Power_Dependent_Devices_DME`), edited 2026-10-07, checked live by god. Say "Medicare beneficiaries", never "residents"; it does not count people on commercial insurance.

## 2. Named user

**Dana Okonkwo**, care coordinator at an elder-services office covering north-central Massachusetts. Today she is on the phone with **James Pell**, who is registering his father **Robert Pell**, who uses an oxygen concentrator at home in **Fitchburg**. The bill says **Unitil**. All three people are synthetic. There is no real account number.

Dana has one afternoon. She needs to know which company serves the town, which of that company's programs she is filling, who signs, where it goes, when it renews, and what step is still open.

## 3. Goals and non-goals

**Goals**
1. From a typed town, show only the company the state table names, and only that company's programs (R1, R2).
2. Keep outage notification and shutoff protection as separate programs, each with its own renewal rule (R2, R5, R9).
3. Clear every answer when the town or company changes, so one company's form cannot follow the household (R3).
4. Print a one-page handoff: program, next unfinished step and its owner, renewal, where to send it, source link (R4).
5. Show every rule with its source, and show gaps as UNVERIFIED rather than filling them (R13).

**Non-goals** (from the spec's non-goals and the build plan)
- No submission to any utility, no login, no backend, no database, no live API call at runtime.
- No Holyoke form, and no program for any company whose form was not opened.
- No guessing the household's language.
- No "nearest hospital", no distance ranking, no promise of backup power.
- No weather forecast; FEMA rows are history only.
- No restoration-priority claim on any program.
- No merging National Grid's paper-notice equipment list with the live form.
- No real household data.

## 4. User stories

| # | Story | Spec |
|---|---|---|
| U1 | As Dana, I type Robert's town and see the company the state table names, so I start on the right program. | R1 |
| U2 | As Dana, I see that company's program as one card with signer, renewal, where to send it and its source link. | R2 |
| U3 | As Dana, when James asks about his sister in another town, every answer from the old company is gone. | R3 |
| U4 | As Dana, I print one page for the clinician or the mailbox that names the open step and its owner. | R4 |
| U5 | As Dana, on a National Grid, Eversource or Unitil town I choose outage notification or shutoff protection, never a blend. | R5 |
| U6 | As Dana, when a family names a CPAP on National Grid's outage form, I see National Grid's own sentence, not a rejection. | R6 |
| U7 | As Dana, I see prepared, submitted and confirmed as three different states, and only the utility confirms. | R7 |
| U8 | As Dana, I set the household language myself, and I can sort towns by the limited-English share with n shown. | R8 |
| U9 | As Dana, I see Wellesley's calendar-year rule only on Wellesley's form. | R9 |
| U10 | As Dana, I see same-town hospitals to phone and verify, and an honest empty list when there are none. | R10 |
| U11 | As Dana, I see the last saved disaster declaration for the county, labelled as history. | R11 |
| U12 | As Dana, I can open National Grid's paper notice without inheriting the live form's rules. | R12 |

## 5. Scope and acceptance

### MVP — 4:30 to 6:30 PM (spec tasks 0–7)

| Feature | Criterion served | Acceptance (spec IDs) |
|---|---|---|
| **M1 Town → company** | Potential Value (any of 351 towns); Quality and Design (honest blocked/mixed states) | All 351 towns offered (R1.2). Fitchburg → Unitil; Leominster → National Grid, even though Unitil's website dropdown lists Leominster (R1.7). Holyoke → company named, "No form opened. No checklist." (R1.5). All 18 mixed-company towns, e.g. Bellingham, wait for a pick of the company on the bill (R1.4, R1.4a). Unknown text → "Not in the saved 351-town table" (R1.3). |
| **M2 One program card** | Potential Value; Quality and Design (sources one click away) | MVP records: Unitil life-support identification and National Grid Outage Life Support (R2). Fitchburg shows fax 603-227-4784, the Concord NH mail address and the MALFORM-MA PDF link (R2.5). The 3/6/12 box reads "Clinician's anticipated length of the condition — not a protection period" (R2.6). Renewal reads "Outage-list renewal: No interval stated in the opened sources", with the 220 CMR 25.03 shutoff-certificate rule shown separately (R2.6a, R2.6b). National Grid shows "No interval stated" and its no-shutoff-protection and no-priority sentences (R2.8). Steps are field, send or utility-wait; the utility-wait step is never done (R2.10a–d). |
| **M3 Company change clears answers** | Implementation (headline property test P1); Potential Value | Fitchburg → Leominster leaves no Unitil fax, Concord address, 3/6/12 control or "equipment: yes" (R3.1, R3.6). Lawrence → Worcester keeps the National Grid card and clears the street address (R3.5). Language survives a town change (R3.2). This is the headline property test (P1). |
| **M4 Print handoff** | Potential Value (paper for people without devices); Quality and Design | One US Letter page: town, company, program, purpose, next unfinished step and owner, every step with owner, renewal, return channel, source URL (R4.1). No tracker word in the MVP (R4.2a). Never says confirmed (R4.5). No print for blocked, unknown or unpicked towns (R4.7). Advisory line only if the record's own source states it (R4.6, ban 15): on Fitchburg, Unitil's page advice to keep a backup source of electricity, shown as a labelled paraphrase because no verbatim text was transcribed; no blanket "not a guarantee of power" banner. |
| Source integrity | Quality and Design (unique public data, honest gaps); Implementation (property tests) | Every rule string has a source; program sources record the day they were opened (2026-10-24), kits their saved date (2026-10-18) (R13.1–13.1b). Missing shows "not reported", never 0 (R13.4). Only the utilities kit blocks the MVP (R13.9–13.11). |
| Accessibility (MVP part) | Potential Value (accessibility and equity) | Every control labelled; the demo path works by keyboard with visible focus; status in text (R14.1a, R14.2, R14.4). Full keyboard-order pass, 375 px, 200% zoom and reduced motion move to tier 1 (task 14a). The MVP town input is a typed field matched on Enter (R1.2a); the searchable combobox is tier 1. |

**6:30 PM gate (spec task 7, moved from 6:00 with Aarav's approval):** Dana types Fitchburg, sees Unitil, the fax and the Concord address, prints the handoff, switches to Leominster and every Unitil answer is gone. Holyoke, opened for a second, has no checklist. Tests and build green.

**Video path if only the MVP ships:** Fitchburg → Unitil card → print handoff → Leominster clears every Unitil answer → Holyoke blocked. The pitch script (`research/lifeline-pitch.md`) also uses Chelsea, Wellesley, the CPAP sentence and two-program choices, which need tier 1; cut those scenes if tier 1 is not green. Properties are described as tested, not proven.

### Tier 1 — 6:30 to 7:00 PM, only after the MVP gate (tasks 8–14, 14a)

| Feature | Criterion served | Acceptance (spec IDs) |
|---|---|---|
| **S1 Two programs per company** | Potential Value; Implementation (P13 program-separation test) | National Grid: Outage Life Support vs Medical Protection (90/180 days, hardship, fax 1-866-460-8549, Syracuse NY mail; masked email UNVERIFIED) (R5.1, R5.7). Eversource: annual Westwood letter (Bedford copy, currency UNVERIFIED) vs Medical Certification of Illness (90/180 days, fax 413-746-6495 or eversource.com/upload; form and statute certifier lists shown separately) (R5.2, R5.8, R5.9). Unitil: life-support identification vs account protection, with 220 CMR 25.03 as the account-protection renewal and low-income verification "Applicability not determined" until recorded (R5.3, R5.3a, R5.10–5.10c). Switching program clears the other's answers (R5.4). |
| **S2 CPAP quoted limit** | Quality and Design (quote, never a rejection); Implementation (P14) | The live form's "generally not considered life-sustaining" sentence shows only for CPAP/BiPAP/APAP/VPAP with age over 6 months on National Grid Outage Life Support; blank age asks for it; never a rejection; never cites the paper notice (R6). |
| **S3 Tracker** | Quality and Design (unconfirmed shown, never guessed); Implementation (P15, P22) | Prepared, Submitted, Confirmed shown as three labels. Submitted needs "I sent this". Changing an answer after sending clears that attestation. No control sets Confirmed: "Only {company} can confirm" (R7). |
| **S4 Language and EJ sort** | Potential Value (equity: language support planned from EJ data); Quality and Design (unique data) | Language starts "Not chosen" and changes only by hand (R8.1–8.3). Towns sort by the unweighted mean of limited-English households across environmental-justice (EJ) block groups, with n: Lawrence 28.88% (n=56), Chelsea 26.20% (n=36), Holyoke 20.54% (n=29), Wellesley 0.00% (n=2). Labelled "unweighted mean across EJ block groups — not a town-wide rate" (R8.4–8.6). |
| **S5 Wellesley** | Potential Value (municipal coverage); Implementation (P7 renewal-leak test) | Rest of the calendar year or until need ends; physician verification may be requested; no unpaid-bill exemption; no 24-hour guarantee; never shown on any other company or on Holyoke (R9). |

### Tier 2 — 7:00 to 7:20 PM, only if tier 1 is green (tasks 15–18)

| Feature | Criterion served | Acceptance (spec IDs) |
|---|---|---|
| **T1 Same-town facilities** | Quality and Design (honest empty lists); Potential Value | Two lists by source file, "Same town — verify by phone. Not ranked by distance." Lawrence: CMS 220010 Merrimack Health Lawrence Hospital (emergency Yes, 2 stars) and an empty hospitals-file list. Chelsea and Wellesley empty in both, with a typed backup contact (R10). |
| **T2 Historical FEMA line** | Quality and Design (unique public data, labelled as history) | Only when a county is known from facility rows or typed. Lawrence → Hurricane Lee, 2023-09-15, Essex, "Historical declaration — not a forecast". Tribal and statewide rows never match a county (R11). |
| **T3 National Grid paper notice** | Quality and Design (artifacts kept separate) | Separate record: printed code "CM10226 (10/24)", purpose UNVERIFIED, "No interval stated", Northboro PO Box and the box.OutageLifeSupport email; no CPAP sentence; equipment list not merged (R12). |
| Optional MCP server | Implementation (only if built) | Read-only tools over the kits, 25-minute timebox; if not connected, remove it and say "MCP: not used" (R15). |

**Cut order if behind** (build plan): MCP → Unitil account-protection record → EJ max column → search polish → backup dedupe → National Grid Medical Protection card. Never cut the MVP Unitil record, the tests or `.kiro/`.

## 6. Data sources

| Source | Used for | Tier | Notes |
|---|---|---|---|
| `utilities` kit, 351 rows (`town`, `utility_code`, `utility`) | Town → company | MVP | Saved 2026-10-18. The company line comes from `utility_code` only. 18 mixed rows: 8 Eversource + National Grid, 9 municipal + investor-owned, 1 two-municipal (Lynnfield). |
| Unitil life-support page and MALFORM-MA PDF (2021-08) | Unitil records | MVP / tier 1 | Newer PDF UNVERIFIED. |
| National Grid live Outage Life Support form | National Grid outage record, CPAP sentence | MVP / tier 1 | No revision date shown. |
| 220 CMR 25.03 (Cornell mirror) | Shutoff-certificate renewal (quarterly / six months) | MVP label, tier 1 record | Shutoff rule only, not outage-list renewal. |
| National Grid special-protections page | Medical Protection record | Tier 1 | Email masked: UNVERIFIED. |
| Eversource Bedford-copy letter; Eversource illness PDF; M.G.L. c.164 §124A | Eversource records | Tier 1 | Bedford currency UNVERIFIED. |
| Wellesley WMLP Critical Health Need form | Wellesley record | Tier 1 | — |
| `ej` kit, 2,604 rows | Limited-English sort with n | Tier 1 | Unweighted mean, not a town rate, never the household language. |
| `hospitals` (103), `cms-hospitals` (84), `fema` (415) kits | Same-town facilities, FEMA line | Tier 2 | No coordinates, address or phone in the saved files. |
| National Grid paper notice CM10226 (10/24) | Separate record | Tier 2 | Purpose UNVERIFIED. |
| HHS emPOWER state layer | Hook number only | Pitch | Not in app code. |
| Census ACS (Spanish is about 94% of Lawrence's and about 92% of Chelsea's non-English speakers) | Why Spanish is the first translation | Pitch | Not in app code; never sets language. |

URLs for every row are in `research/lifeline-sources.md` and the spec's design §3. Holyoke Gas & Electric has no opened form; the town stays blocked.

## 7. Success metrics for the demo

| Metric | Target | How we check |
|---|---|---|
| 6:30 PM gate | Fitchburg → print → Leominster clears every Unitil answer; Holyoke blocked | Live click-through plus property P1 |
| Correctness properties | Every property for the shipped tiers green (P1–P22 in the spec) | `pnpm test` at freeze |
| Refusals hold | No "protected for 12 months", no priority claim, no Wellesley expiry off Wellesley, no Confirmed set by the app | Properties P6–P8, P15, P22 |
| One-page handoff | Prints on one US Letter page | Browser print preview |
| Kiro evidence | One property shown failing then passing after a repair | Screenshot or recording for the write-up |
| Sources visible | Every card shows its source link; every gap labelled UNVERIFIED | Visual check of each loaded record |
| Accessibility | Demo path driven by keyboard alone | Manual pass before freeze |
| Video | Under 3:00 | Recording length |

| WCAG AA contrast | Every text colour ≥4.5:1 on its background (UI borders ≥3:1); values computed in `docs/FRONTEND.md` §4 | Recompute if any token changes; `impeccable` audit before 6:30 and 7:20 |

No usage or impact metric is claimed; there are no real users today.

## 8. Judging-criteria fit

The rules list three criteria with no published weights.

- **Potential Value.** The app names the company for all 351 towns. It loads programs for Unitil and National Grid in the MVP, and for Eversource and Wellesley in tier 1; every other company is blocked, not guessed. Where a program is loaded, Dana can name it, the unfinished step and who owns it. The equity piece is a manual language control plus the EJ limited-English sort with n. The population line stays the HHS Medicare figure.
  - **Scaling story** (future, not built): add a company only after its own form is opened and transcribed, Holyoke first if Holyoke Gas & Electric publishes one, so coverage grows from 351 towns named to more companies loaded.
  - More languages: Spanish first, because the Census ACS shows Spanish is about 94% of Lawrence's and about 92% of Chelsea's non-English speakers; the household language stays a manual choice.
  - Longer term, the typed program records could become a shared, sourced form registry that other coordinator tools read; no such registry exists today.
- **Implementation (Kiro use).** Claim only what is actually used:
  - **Spec:** generated by Kiro's built-in Spec agent in the CLI (`kiro-cli` 2.34.0, `chat --v3 --mode spec`, run headless and resumed with `--resume`): requirements, then design, then tasks, with the builder approving each gate. Inputs were the team docs and a hand draft the builder wrote first, which the agent reconciled. Three later revisions from team review were also made by the Spec agent; a few small fixes (Pam #4, Oscar #7 and #8) were hand edits. Not produced in the IDE.
  - **Steering:** `product.md`, `tech.md` and `bans.md` (15 refusal rules), plus `frontend.md` (loads the five frontend skills) and `judging.md` (official judging rules), all always-on. No fileMatch steering exists yet, so none is claimed.
  - **Hooks** (planned in spec task 0; claim only once they run): rerun the tests after agent saves, block agent edits to the kit CSVs, run the tests at the end of each agent turn.
  - **Property tests:** vitest + fast-check, P1–P22, written by us; fast-check is not a Kiro feature.
  - **MCP:** only if it ships.
  - **Not used (do not claim):** Kiro Web; Crew; Powers (none installed); the Kiro IDE and its Spec Correctness panel (not used by the builder so far; the spec was made in the CLI; if a teammate used the IDE, log it first); fileMatch steering (none exists); MCP (unless task 18 ships). Move an item out of this list only when `docs/kiro-notes.md` records it being used.
- **Quality and Design.** One town field, one program card, one printout. Sources one click away. Prepared, submitted and confirmed look different. Built with shadcn/ui, usable by keyboard alone. The combination judges may not expect: the utilities kit joined to the EJ kit, with hospitals, CMS and FEMA as tier-2 context, and Holyoke honestly blocked.

## 9. Risks and mitigations

| Risk | Mitigation |
|---|---|
| The two programs of one company get merged on screen | Separate records; switching clears answers; properties forbid each record's claims on the other (R5, P13). |
| A renewal rule leaks across companies (Wellesley onto Holyoke, 220 CMR onto Unitil's outage list) | Renewal is a field on each record; "No interval stated" stays as is (R2.4, R2.6b, R9.4, P7, P8). |
| A step marks itself done (utility confirmation, clinician send) | Three step kinds; the utility-wait step is never done (R2.10a–d, P21). |
| Editing after "I sent this" keeps Submitted | A changed answer clears the attestation (R7.6a, P22). |
| EJ mean read as the household's language or a town rate | Language starts "Not chosen"; mean labelled with n and "not a town-wide rate" (R8). |
| Facility list read as "nearest safe hospital" | Same-town only, "verify by phone", empty lists ship as empty (R10). Lawrence's hospitals-file list is empty because the row's town reads "LAWRENCE, MA"; that is a data limitation, not proof Lawrence has no hospital. |
| A stretch kit breaks the MVP | Only the utilities kit blocks; other kits switch off their own feature (R13.9–13.11). |
| Source currency (Bedford letter, Unitil 2021-08 PDF, masked email) | Shown as UNVERIFIED on the card. |
| Scope past the clock | MVP gate at 6:30, tier gates, cut order above, freeze at 7:20. |
| Kits served as plain files from `public/data/` on the deployed site | Accepted side effect noted in the design; nothing runs them. |
| Pages deploy fails late | Freeze at 7:20 leaves time; check the URL in a private window; README carries the local-run command as backup. |

## 10. Release plan

| Clock (ET) | Step | Done when |
|---|---|---|
| 4:30–6:30 | MVP, spec tasks 0–7 | 6:30 gate passes; `pnpm test` and `pnpm build` green |
| 6:30–7:00 | Tier 1, tasks 8–14 and 14a | Each tier-1 acceptance check and property green |
| 7:00–7:20 | Tier 2, tasks 15–18, only if tier 1 is green; otherwise polish | — |
| **7:20** | **Freeze** (task 19): no new features; full test run; `.kiro/` committed and not in `.gitignore`; Aarav pushes his repo once and enables GitHub Pages | URL works in a private window |
| 7:30–8:00 | Record the video (under 3:00), README, Kiro write-up, Devpost | Submitted by 7:55; hard deadline 8:00 |

Build started at 4:58 PM on god's go (tasks 0–4), with task 5 after the frontend review fixes.

### Ship checks (hard submission requirements, from `.kiro/steering/judging.md` / official rules)

Each must be ticked before submit; breaking one means disqualified or unscored.

- [ ] Built with Kiro; `/.kiro` at the repo root, committed, not in `.gitignore`.
- [ ] Track stated in the submission: Healthcare & Biotech.
- [ ] Public GitHub repo with all source and assets; README has `pnpm install`, `pnpm dev`, `pnpm test` and the live URL.
- [ ] Working project link (GitHub Pages), free, no login; opens in a private window.
- [ ] Video under 3:00, public on YouTube or Vimeo, showing the app running; no copyrighted music; third-party names only as needed to name the utilities.
- [ ] Text description of features, and a Kiro write-up (fed by `docs/kiro-notes.md`) that claims only Kiro features actually used; never Web or Crew.
- [ ] Everything in English; original work; open-source libraries only under their licenses.
- [ ] No "33%" or any criterion weight anywhere.








