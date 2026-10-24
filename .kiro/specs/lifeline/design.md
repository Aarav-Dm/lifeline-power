# LifeLine Power — Design

Spec: `lifeline`. Phase: design. Implements the approved `requirements.md` (Requirements 1–15, tiers MVP / 1 / 2). Reconciled with `research/spec-hand-draft/design.md`; its sections are kept. Facts trace to `FINAL-idea.md` (including "Fallback hardening") and `lifeline-sources.md`. Build order follows `LIFELINE-BUILD-PLAN.md`. Kit facts in §2 were re-read from the repo's own copies on 24 Oct 2026. Anything not opened is **UNVERIFIED**.

## 1. Architecture

Static single-page app on GitHub Pages. No server, no runtime `fetch`, no login, no telemetry, no API key.

```
 public/data/<kit>/data.csv (5 kits, verbatim)      src/rules/sources.ts + programs.ts
          |  imported as strings with ?raw                 |  typed records, every string sourced
          v                                                v
 src/lib/csv.ts -> src/lib/kits.ts  ------------->  src/state/derive.ts  <---- src/state/reducer.ts
   (parse)          (validate, normalize,            (pure view model:          (pure state machine:
                     selectors)                       card, tracker, handoff)    actions -> State)
                                                           |
                                                           v
                                          src/App.tsx + src/components/*.tsx (React + shadcn/ui)
                                                           |
                                                           v
                                          window.print() + @media print -> <Handoff>
```

| Layer | Files | Rule |
|---|---|---|
| Data | `public/data/{utilities,ej,hospitals,cms-hospitals,fema}/data.csv` and each kit's `README.md` | Already in the repo (Kevin's copy). Never edited. A `PreToolUse` hook blocks agent writes under `public/data/`. |
| Kit import | `src/lib/kit-sources.ts` | The only file that imports the CSVs: `import utilitiesCsv from "../../public/data/utilities/data.csv?raw"` (and the other four), each with `savedAt: "2026-10-18"`. Importing a string does not parse it. App and tests share it. |
| Parse | `src/lib/csv.ts` | RFC 4180: quoted fields, embedded commas (`"LAWRENCE, MA"`, multi-company cells), CRLF, empty cells. No dependency. |
| Kits | `src/lib/kits.ts` | `loadKits(enabledTiers)`, `validateKit(name, rows)`, typed rows, `norm()`, selectors `townRow`, `companyCodes`, `ejStats`, `facilitiesFor`, `latestFema`. Pure, no React. |
| Rules | `src/rules/sources.ts`, `src/rules/programs.ts` | The only place rule text, quotes, addresses, faxes and phone numbers live. Every string carries a `sourceId`. |
| State | `src/state/reducer.ts` | Pure `reduce(state, action, ctx)`. No React import. |
| View model | `src/state/derive.ts` | Pure `derive(state, ctx) -> ViewModel`. The UI renders only this. |
| UI | `src/App.tsx`, `src/components/*.tsx`, `src/components/ui/*` | React + shadcn/ui. No rule text in components. |
| Tests | `tests/*.test.ts` | vitest + fast-check; import only pure modules. |

### Tier-gated kit loading

`loadKits(enabledTiers)` parses and validates only the kits an enabled tier uses (13.9):

| Kit | Parsed from | On validation failure |
|---|---|---|
| `utilities` | MVP (always) | Blocking: `{ fatal: { file, check } }` → full-page error naming the file and the check (13.10) |
| `ej` | tier 1 | Non-blocking: `kits.ej = { ok: false, file, check }`; the EJ sort and mean are off with the notice "Saved ej file failed check: {check}. EJ sort is off." |
| `hospitals`, `cms-hospitals`, `fema` | tier 2 | Non-blocking: that list or the FEMA line is off with the same kind of notice |

A kit of a disabled tier is never parsed (`kits.ej = { ok: false, reason: "tier-disabled" }`) and its feature is not rendered. No stretch-kit state can reach town lookup, the card, the reducer's town reset or the handoff (13.11). All five CSVs stay committed verbatim (13.8).

`ctx = { kits, enabledTiers }`. `ENABLED_TIERS` in `src/rules/programs.ts` is the build switch (`["mvp"]`, then `["mvp","tier1"]`, then all). Tests pass `enabledTiers` explicitly, so a tier's properties can run against its records without flipping the shipped switch.

### Kit location (decision)

Kits live at `public/data/<kit>/data.csv` (what exists), not `data/` as `tech.md` and the hand draft say. Consequences:

- `?raw` imports by relative path bundle the text into JS; the app never fetches. Vite's build accepts this. The dev server may print "Assets in public directory cannot be imported from JavaScript" (seen in `node_modules/vite` source); that is a warning, not an error. Only the `utilities` kit is loaded and validated in the MVP; stretch kits are parsed and validated with their tier (13.9–13.11). Task 1 confirms `pnpm build` and `pnpm test` load `utilities` and that all five `?raw` imports compile. If either fails, the fallback is `publicDir: false` in `vite.config.ts` — not moving or editing the kits.
- Vite copies `public/` into `dist/`, so the deployed site also serves the raw CSVs, READMEs and the kits' `fetch.js` / `fetch.py` as static files. Nothing runs them. A judge can open the CSV from the site.
- `tech.md` and the data-guard hook should name `public/data/` (steering update proposed at the tasks phase; not changed here).

## 2. Data contract — the five CSVs

Re-checked 24 Oct 2026 from `public/data/<kit>/data.csv` (header line read, rows counted with a CSV parser).

| Kit | Rows | Header (exact) | Join key | Tier | Quirks and missing-value rule |
|---|---|---|---|---|---|
| `utilities` | 351 | `town,utility_code,utility` | `norm(town)` | MVP | `town` is uppercase. Exactly 18 rows quote a multi-company cell; split `utility_code` on `", "` only. All 18 are mixed towns and wait for a pick: 8 Eversource + National Grid (Bellingham, Cheshire, Erving, Hancock, Lenox, Pembroke, Scituate, Westport); 9 municipal + investor-owned (Chester, Chicopee, Dighton, Groton, Hingham, Lakeville, Middleborough, Russell, Westfield); 1 municipal + municipal (Lynnfield: Peabody Municipal Light Plant, Reading Municipal Light Department). A municipal pick has no record, so it is blocked. Westfield is a mixed town: its `utility_code` is "Westfield Gas and Electric Light Department, Eversource Energy (NSTAR Electric)" while its `utility` column reads "Municipal, Massachusetts Electric d/b/a National Grid". The two columns disagree, so `utility_code` is the company line and the program key; `utility` is a category label only (`Municipal` for Holyoke and Wellesley, `UNITIL` for Unitil towns). No row named West Townsend. Nantucket is `National Grid (Nantucket Electric)`, a different code from Massachusetts Electric. |
| `ej` | 2,604 | `municipality,population,minority_pct,limited_english_hh_pct,block_group_income,ej,criteria` | `norm(municipality)` | Tier 1 | Mixed case (`Harwich`). Every row in this copy has `ej = "Yes"` (the source query filtered on it); the selector still filters. No blank `limited_english_hh_pct` in this copy; the parser still maps a blank to `null`, excluded from the mean and counted as `missing`. Real zeros exist (Harwich row `0`). Recomputed: Lawrence 28.88 (n=56), Chelsea 26.20 (n=36), Holyoke 20.54 (n=29), Wellesley 0.00 (n=2). |
| `hospitals` | 103 | `name,facility_type,municipality,county,icu_beds,med_surg_beds,pediatric_beds` | `norm(municipality)` | Tier 2 | `municipality` and `county` uppercase. No coordinates, address or phone. Merrimack Health Lawrence Hospital's `municipality` is `"LAWRENCE, MA"` (the only comma value), so an exact match leaves Lawrence's hospitals-file list empty, as `FINAL-idea.md` states. The match is not loosened. Holyoke rows: Holyoke Medical Center (Acute, ICU 12) and Providence Behavior Health Hospital Campus (Non-acute, ICU 0, med-surg 0, pediatric 0). No blank cells in this copy; 0 is a value. |
| `cms-hospitals` | 84 | `facility_id,facility_name,city,county,hospital_type,ownership,emergency,overall_rating` | `norm(city)` | Tier 2 | `facility_id` is a string (`220010`). Names uppercase. `emergency` is `Yes` (60) / `No` (24). `overall_rating` is `Not Available` on 30 rows; render it as printed, never as 0 or blank. No address or phone. Lawrence: 220010 Merrimack Health Lawrence Hospital, ESSEX, Acute Care Hospitals, emergency Yes, rating 2. Holyoke: Holyoke Medical Center (rating 4) and two psychiatric rows (`Not Available`). |
| `fema` | 415 | `declarationDate,disasterNumber,incidentType,declarationTitle,designatedArea,declarationType` | county parsed from `designatedArea` | Tier 2 | County only via `^(.+?)\s*\(County\)`; both `Essex (County)(in PMSA …)` and `Worcester (County) (in (P)MSA …)` parse. Non-county areas in this copy: `Mashpee Wampanoag Tribe`, `Wampanoag Tribe of Gay Head (Aquinnah)`, `Hassanamisco Indian Reservation`, `Statewide`; none match. Latest Essex row: 2023-09-15, Hurricane, HURRICANE LEE, disaster 3599, type EM. Latest row overall: 2026-06-30, Mashpee Wampanoag Tribe. Dates are ISO; display the date part. Tie on date: higher `disasterNumber`, then file order. |

`norm(s) = String(s).trim().replace(/\s+/g, " ").toUpperCase()`. Display values are kept separately from keys. Never join on a display name.

Parsed cell rule: blank → `null`; numeric columns (`population`, `minority_pct`, `limited_english_hh_pct`, `block_group_income`, `icu_beds`, `med_surg_beds`, `pediatric_beds`) → `number | null`; `overall_rating` → `{ kind: "rating", value: number } | { kind: "text", value: "Not Available" } | null`. "Not Available", blank and 0 never collapse.

`validateKit(name, text)` asserts that kit's exact header and row count above (351 / 2,604 / 103 / 84 / 415) and returns `{ ok: false, file, check }` on the first failure. `loadKits` calls it only for enabled-tier kits (§1).

```ts
export interface KitSource {
  name: "utilities" | "ej" | "hospitals" | "cms-hospitals" | "fema"
  path: `public/data/${string}/data.csv`
  savedAt: "2026-10-18"        // kit snapshot date from its README; never an openedAt
  tier: Tier                   // tier that first parses it
}
```

### Company codes the build maps

| `utility_code` | Records | Tier of records |
|---|---|---|
| `Unitil (Fitchburg Gas & Electric)` | `unitil-lifesupport`; `unitil-protection` | MVP; tier 1 |
| `National Grid (Massachusetts Electric)` | `ng-outage`; `ng-medical`; `ng-paper` (separate, never in the two-program choice) | MVP; tier 1; tier 2 |
| `Eversource Energy (NSTAR Electric)` | `ev-letter`, `ev-illness` | Tier 1 |
| `Wellesley Municipal Light Plant` | `wmlp-chn` | Tier 1 |
| `Holyoke Gas & Electric Department` | none — blocked, "No form opened. No checklist." | MVP |
| any other code, incl. `National Grid (Nantucket Electric)` and every other municipal company | none — blocked, "No form loaded for this company in this build. No checklist." | MVP |

Before tier 1 ships, Eversource and Wellesley towns show the generic blocked card (1.6).

## 3. Program record type

```ts
export type Purpose = "outage-notify" | "shutoff-protection" | "UNVERIFIED"
export type Tier = "mvp" | "tier1" | "tier2"
export type OwnerRole = "coordinator" | "clinician" | "utility"
export type RecordId =
  | "unitil-lifesupport" | "unitil-protection"
  | "ng-outage" | "ng-medical" | "ng-paper"
  | "ev-letter" | "ev-illness" | "wmlp-chn"

export interface Source {
  id: string                  // "unitil-pdf", "unitil-page", "cmr-25-03", "mgl-164-124a", ...
  title: string
  url: `https://${string}`
  openedAt: "2026-10-24"      // the day this artifact was opened; a literal, never `new Date()`
  note?: string               // "Bedford copy, May 2023 filename — currency UNVERIFIED"
}
// A source that was not opened is not a Source. It is a string on the record's
// `unverified` list, with no openedAt (13.1b).

/** One string from one source. Never composed from two. */
export interface Sourced {
  text: string
  sourceId: string            // must resolve to a Source on the same record
  verbatim: boolean           // true only for text copied from FINAL-idea.md's verbatim section
}

export interface Field {
  key: `${RecordId}.${string}` // namespaced by record
  label: string
  kind: "text" | "yes-no" | "select" | "consent" | "device" | "age-months"
  options?: string[]           // yes-no: ["Yes", "No"]; select: the source's choices
  unansweredText?: string      // shown while null, e.g. "Applicability not determined"
  required: boolean
  requiredWhen?: { key: string; notEquals: string } // e.g. hardship statement unless discount rate is "Yes"
  note?: Sourced               // e.g. Unitil intent-to-file: "not the physician certificate"
}

/** Answered rule (2.10b): text → non-empty after trim; yes-no / select / device → any option
 *  chosen, including "No"; age-months → a finite number ≥ 0; consent → exactly `true`.
 *  null, "" and (for consent) false are unanswered. */
export function isAnswered(field: Field, value: unknown): boolean

export type Step =
  | { kind: "field"; id: string; label: string; owner: OwnerRole; ownerText: string; fields: [string, ...string[]] }
  | { kind: "send"; id: string; label: string; owner: OwnerRole; ownerText: string }
  | { kind: "utility-wait"; id: string; label: `Waiting for ${string} to confirm`; owner: "utility"; ownerText: string }
// ownerText: coordinator → "Coordinator"; clinician → record.signer.text; utility → companyNameOnPage.
// A field step's `fields` tuple is non-empty by type, so `every()` over an empty list can never mark it done.
// Done (derived, never stored):
//   field        → every required field in `fields` isAnswered (requiredWhen applied)
//   send         → state.attestedSent === true
//   utility-wait → false, always

export interface ProgramRecord {
  id: RecordId
  tier: Tier
  companyCode: string          // exact utilities-kit utility_code
  companyNameOnPage: string
  programName: string
  purpose: Purpose
  signer: Sourced
  signerAlso?: Sourced         // ev-illness: statute's narrower certifier list, shown separately
  renewalLabel: string         // "Renewal"; "Outage-list renewal" on unitil-lifesupport
  renewal: Sourced & {
    kind: "none-stated" | "days-90-180" | "annual" | "calendar-year-or-need" | "regulation-quarterly-semiannual"
    scope?: "in the opened sources"   // unitil-lifesupport only (2.4a)
  }
  regulationContext?: Sourced & { label: "Separate shutoff-protection certificate (220 CMR 25.03)" } // unitil-lifesupport only; never its renewal
  formBoxNote?: Sourced        // both Unitil records: the 3/6/12 label (2.6)
  returnChannels: (Sourced & { kind: "fax" | "mail" | "web" | "email" | "phone"; unverified?: true })[]
  quotes: Sourced[]            // verbatim === true only
  limits: Sourced[]            // what this program does not do, from its own source
  noGuarantee?: Sourced        // only where the record's source states one (ban 15)
  unverified: string[]         // rendered with an UNVERIFIED badge
  fields: Field[]
  steps: Step[]                // field steps, then exactly one send step, then exactly one utility-wait step (last)
  sendAttestation: string      // "I sent this" or the record's own sender wording
  claims: { outageNotification: boolean; shutoffProtection: boolean; restorationPriority: false }
  sources: Source[]
}

export const NO_INTERVAL = "No interval stated"
```

Type-level guards:

- `claims.restorationPriority` is the literal `false`. No record can claim priority (13.6, ban 7).
- `renewal.kind === "none-stated"` requires `renewal.text === NO_INTERVAL`; no other kind may use that text (checked by P7). Rendered renewal is `${renewalLabel}: ${text}` plus `" " + scope` when set.
- `regulationContext` is set only on `unitil-lifesupport`; `kind "regulation-quarterly-semiannual"` is used only by `unitil-protection` (2.6b, 5.3a).
- Every record has exactly one `send` step and one `utility-wait` step, the wait step last (2.10a; checked by P21).
- `outage-notify` records have `claims.shutoffProtection === false`; `shutoff-protection` records have `claims.outageNotification === false` (checked by P6, P13).
- There is no `confirmed` field on a record, a step or the state.

### Sources (`src/rules/sources.ts`)

| id | URL | Used by |
|---|---|---|
| `unitil-pdf` | https://unitil.com/sites/default/files/2021-08/MALFORM-MA.pdf | unitil-* |
| `unitil-page` | https://unitil.com/outages-emergencies/life-support-customers | unitil-* |
| `cmr-25-03` | https://www.law.cornell.edu/regulations/massachusetts/220-CMR-25-03 | unitil-lifesupport (regulationContext only); unitil-protection (renewal) |
| `ng-live` | https://www.nationalgridus.com/Form/MA-Electric-Outage-Life-Support-Form | ng-outage |
| `ng-protect` | https://www.nationalgrid.com/us/ma/electric/home/billing-payments/bill-help/special-protections | ng-medical; pointer link on ng-outage (6.6) |
| `ng-paper` | https://www.nationalgridus.com/media/pdfs/storms-outages/ma-notice-of-life-sustaining-equipment.pdf | ng-paper |
| `ev-bedford` | https://bedfordma.gov/DocumentCenter/View/5556/EMA-Life-Support-Equipment-Certification-5-2023 (note: Bedford copy, May 2023 filename — currency UNVERIFIED) | ev-letter |
| `ev-illness-pdf` | https://www.eversource.com/docs/default-source/spanish/medical-certification-of-illness-form-egma-span.pdf?sfvrsn=46e9f0a5_1 | ev-illness |
| `mgl-164-124a` | https://malegislature.gov/Laws/GeneralLaws/PartI/TitleXXII/Chapter164/Section124a | ev-illness (signerAlso) |
| `wmlp` | https://www.wellesleyma.gov/FormCenter/Municipal-Light-Plant-5/Critical-Health-Need-for-Electricity-118 | wmlp-chn |

All `openedAt: "2026-10-24"` — each of these ten was opened that day (`FINAL-idea.md` "Sources opened for this draft" and Fallback hardening; `lifeline-sources.md` "Opened Today: Y"). The kits' `savedAt: "2026-10-18"` lives on `KitSource`, never on a `Source`. The Medical Protection pointer on `ng-outage` cites `ng-protect` as a link only; `ng-outage.sources` includes it for that purpose and no text on `ng-outage` is drawn from it.

### The eight records

Content from `FINAL-idea.md` (verbatim section and Fallback hardening) and `lifeline-features.md`.

| id | Tier | Purpose | Signer | Renewal | Return | Sources |
|---|---|---|---|---|---|---|
| `unitil-lifesupport` | MVP | outage-notify | A physician, physician assistant, nurse practitioner, or local board of health completes the physician section and faxes or mails it from the office within seven days; the customer fills the top | renewalLabel "Outage-list renewal"; `none-stated`: `NO_INTERVAL`, scope "in the opened sources" (unitil-page, unitil-pdf). regulationContext (cmr-25-03), labelled "Separate shutoff-protection certificate (220 CMR 25.03)": "serious illness renewed quarterly; chronic every six months". formBoxNote (unitil-pdf): "Anticipated length 3, 6 or 12 months — the clinician's anticipated length of the condition, not a protection period" | Fax 603-227-4784; mail Unitil, c/o Customer Services – Life Support, 5 McGuire Street, Concord, NH 03301; phone 1-888-301-7700 (unitil-page) | unitil-pdf, unitil-page, cmr-25-03 |
| `unitil-protection` | Tier 1 | shutoff-protection | Same clinician list | renewalLabel "Renewal"; `regulation-quarterly-semiannual` (cmr-25-03): "220 CMR 25.03: a serious-illness certificate is renewed quarterly; a chronic certificate every six months". Same formBoxNote beside it, not collapsed into it | Same | Same. Limit: low-income verification, if applicable, is also required to get account protection |
| `ng-outage` | MVP | outage-notify | The account holder on the web form; a clinician signature is not on the opened page | `none-stated`: `NO_INTERVAL` | The live web form | ng-live (+ ng-protect as pointer) |
| `ng-medical` | Tier 1 | shutoff-protection | A registered physician, physician assistant, nurse practitioner, or local board of health, on letterhead with that office's address and phone | `days-90-180`: serious illness 90 days; chronic illness 180 days | Online Customer Protections Form; fax 1-866-460-8549; mail National Grid, Attention: Protections, D1, 300 Erie Blvd W, Syracuse, NY 13202; email "masked on the opened page — UNVERIFIED" (`unverified: true`, no address stored) | ng-protect |
| `ev-letter` | Tier 1 | outage-notify | A medical doctor, on letterhead | `annual` (verbatim: "To maintain this enrollment, certification must be updated annually.") | Mail Eversource, 247 Station Drive SW200, Westwood, MA 02090 | ev-bedford |
| `ev-illness` | Tier 1 | shutoff-protection | Form: Registered Physician, Board of Health official, APRN or PA (verbatim). signerAlso (mgl-164-124a): the statute names a registered physician or the local board of health | `days-90-180` (verbatim: the two "Serious Illness … 90 days" / "Serious Chronic Illness … 180 days" lines) | Fax 413-746-6495; online at eversource.com/upload (verbatim return sentence) | ev-illness-pdf, mgl-164-124a |
| `wmlp-chn` | Tier 1 | outage-notify | The customer submits the form; WMLP may ask for physician verification (not required) | `calendar-year-or-need`: "The rest of this calendar year, or until the need ends, whichever is first; renew with the same form" | Online form; mail or in person to WMLP, 4 Municipal Way, Wellesley, MA 02481; phone 781-235-7600 | wmlp |
| `ng-paper` | Tier 2 | UNVERIFIED | The customer | `none-stated`: `NO_INTERVAL` | Email box.OutageLifeSupport@nationalgrid.com; mail PO Box 960, Northboro, MA 01532-0960 | ng-paper (form code shown as printed: "CM10226 (10/24)") |

Verbatim `quotes` are copied character for character from `FINAL-idea.md` → "Verbatim limits from pages opened 24 Oct 2026":

- `ng-outage`: the four paragraphs (purpose; no termination protection + Customer Protections Form; no higher restoration priority; the "The Following are generally not considered life-sustaining …" sentence, held as `cpapSentence`, shown only under 6.1).
- `ev-letter`: the three paragraphs (required contents; signed by a medical doctor and mailed to Westwood; enrolled + annual; does not prioritize restoration + alternate energy + no impact on medical protection). The fourth paragraph's "We encourage you to have an alternate source of energy…" stays inside its quote.
- `ev-illness`: the five blocks (protection sentence with the doubled "or a chronic serious illness" unedited; 90-day line; 180-day line; "Does your patient have life support equipment at home?"; return sentence).
- `mgl-164-124a`: the one statute sentence, on `ev-illness` only.

Unitil, National Grid Medical Protection, Wellesley and 220 CMR 25.03 have no verbatim text in the sources; their strings are `verbatim: false` paraphrases of `FINAL-idea.md` and render as "From {source title}:" without quotation marks.

`noGuarantee` is set only on `ev-letter` (inside its verbatim restoration paragraph) and `wmlp-chn` ("no utility can guarantee electricity 24 hours a day"). Unitil's "keep a backup source of electricity" is a `limits` entry, not a no-guarantee line. No other record gets one (4.6).

`unverified` lists:

- `unitil-*`: newer Massachusetts PDF than 2021-08; MyUnitil forms still unavailable at demo time; what Unitil does when the 12-month box is checked and the six-month chronic renewal has passed.
- `ng-outage`: revision date (none shown); the live form's own equipment list (not transcribed).
- `ng-medical`: the protections email (masked); the Customer Protections / Medical Protection application fields (not transcribed).
- `ev-letter`: currency past the Bedford May 2023 posting.
- `ev-illness`: revision date (none shown); form code MN0324 (search index only); fax 781-441-3686 (from a copy not downloaded — never a return channel).
- `wmlp-chn`: the online form's field list (not transcribed).
- `ng-paper`: purpose; the individual equipment box labels (not transcribed here).

### Fields and steps

Checklist items are what the source says is needed. Where a form's field layout was not transcribed, the item is labelled as information to gather, not as a form field.

Step completion contract (2.10a–2.10d). Each step is `[field]`, `[send]` or `[wait]`:

- `[field]` is done when every required field in it is answered (`isAnswered`): a chosen "No" is answered; a blank is not; a `consent` checkbox only when `true`. A field step always has at least one required field.
- `[send]` is done only when `attestedSent === true`. No field completes it.
- `[wait]` is never done.

Where a clinician produces a document the coordinator then sends, the clinician's step is a `[field]` step owned by the signer whose one required field is a coordinator-recorded `consent` ("Signed letter is in hand"). Filling household fields never answers it. Where the clinician's office sends the document itself (Unitil), the clinician's step is the `[send]` step, owned by the signer.

| Record | Steps in order — kind, owner, required fields | Send attestation |
|---|---|---|
| `unitil-lifesupport` | 1 Customer section `[field]` Coordinator: customer name, service address, account number (demo: "DEMO — not a real account") · 2 Life-support equipment `[field]` Coordinator: "Electrically powered life-support equipment used?" (yes-no), equipment description (required unless "No") · 3 Physician section incl. nature of illness and anticipated length 3/6/12, faxed or mailed from the clinician's office within seven days `[send]` signer text · 4 Waiting for Unitil to confirm `[wait]` Unitil. Optional, never required: intent-to-file note, labelled "not the physician certificate", unchecked by default (5.11). No 3/6/12 control for the coordinator (2.7). No low-income item (5.10c). | "The clinician's office says it faxed or mailed this"; tracker word "Submitted (per the clinician's office)" (tier 1) |
| `unitil-protection` | 1 and 2 as above · 3 Low-income verification `[field]` Coordinator: select with options "Verification supplied" / "Utility confirmed not applicable"; while `null` it reads "Applicability not determined" and the step shows unfinished (5.10a–5.10b) · 4 Physician section, faxed or mailed from the office `[send]` signer text · 5 Waiting for Unitil to confirm `[wait]` Unitil | same as above |
| `ng-outage` | 1 Account and contact `[field]` Coordinator: account number, service address, primary phone (secondary phone optional) · 2 Equipment `[field]` Coordinator: device (select incl. CPAP, BiPAP, APAP, VPAP, "Other — type it"); patient age in months optional, used only for 6.1 · 3 Submit the web form `[send]` Coordinator · 4 Waiting for National Grid to confirm `[wait]` National Grid | "I submitted the web form" |
| `ng-medical` | 1 Discount rate and hardship `[field]` Coordinator: "Account is on a discount rate" (Yes / No / Not known), "Financial-hardship statement prepared" (consent; required unless discount rate is "Yes"), patient name and address for the clinician · 2 Letter on letterhead stating patient name, address, serious (90) or chronic (180) `[field]` signer text: consent "Signed letter is in hand" · 3 Send by Customer Protections Form, fax or mail `[send]` Coordinator · 4 Waiting for National Grid to confirm `[wait]` National Grid | "I sent this" |
| `ev-letter` | 1 Gather letter contents `[field]` Coordinator: patient name, address, primary phone, alternate phone, equipment type · 2 Letter signed by a medical doctor on letterhead `[field]` signer text: consent "Signed letter is in hand" · 3 Mail to Westwood `[send]` Coordinator · 4 Waiting for Eversource to confirm `[wait]` Eversource | "The letter was mailed to Westwood" |
| `ev-illness` | 1 Patient and hardship `[field]` Coordinator: patient name, address, "Household states a financial hardship" (yes-no; "No" is answered, and the app decides nothing from it) · 2 Certification of serious or serious chronic illness, incl. the life-support question `[field]` signer text: consent "Completed certificate is in hand" · 3 Return by fax or eversource.com/upload `[send]` Coordinator · 4 Waiting for Eversource to confirm `[wait]` Eversource | "I sent this" |
| `wmlp-chn` | 1 Fill the Critical Health Need form `[field]` Coordinator: consent "Form filled in" (field list UNVERIFIED) · 2 Submit online or mail / bring to WMLP `[send]` Coordinator · 3 Waiting for WMLP to confirm `[wait]` WMLP. "Physician verification may be requested" is a `limits` line, not a step. | "I submitted the form" |
| `ng-paper` | 1 Notice fields `[field]` Coordinator: account number, service address, telephone, "life-sustaining equipment still in the home" (yes-no), equipment (free text; boxes UNVERIFIED); optional third party · 2 Customer signature and date `[field]` Coordinator, for the customer: consent "Customer signed and dated the notice" · 3 Email or mail `[send]` Coordinator · 4 Waiting for National Grid to confirm `[wait]` National Grid | "I sent this" |

`ng-paper`'s equipment field has its own key and options; it never shares `ng-outage`'s option list (12.2, P20).

## 4. State machine

### State

```ts
export interface State {
  townKey: string | null           // norm(town) of a kit row; null when idle or not found
  townQuery: string                // last submitted text, for the not-found message
  notFound: boolean
  companyCode: string | null       // auto for single-company towns; PICK_COMPANY for mixed
  programId: RecordId | null       // auto when exactly one enabled record; PICK_PROGRAM otherwise
  answers: Record<string, string | boolean | number | null>  // keys namespaced `${programId}.*`
  attestedSent: boolean
  language: "not-chosen" | "English" | "Spanish" | "Other"   // never derived
  languageOther: string
  backup: { typedCounty: string; typedContact: string }
}
```

There is no `confirmed` field, no `status` field and no `rejected` field. Confirmed is not representable, so no action can set it (7.4, ban 10). The tracker is derived.

`initialState`: everything empty / null / false, `language: "not-chosen"`.

### Actions

`reduce(state, action, ctx)` is pure. Invalid actions return the same object (`===`).

| Action | Effect |
|---|---|
| `SELECT_TOWN(key)` | If `key === state.townKey`: return `state` (3.3). If `key` is not a kit row: invalid. Else **town reset**: `townKey = key`, `notFound = false`, `companyCode` = the only code or `null` if mixed, `programId` = the only enabled record of that company or `null`, `answers = {}`, `attestedSent = false`, `backup = { "", "" }`. `language`, `languageOther` untouched (3.1, 3.2, 3.5). |
| `SUBMIT_UNMATCHED(query)` | Enter on text that matches no row: town reset with `townKey = null`, `notFound = true`, `townQuery = query`. Typing alone changes nothing; only the search list shows "Not in the saved 351-town table" (1.3). |
| `PICK_COMPANY(code)` | Valid only if the town is mixed and `code` is one of its codes. If same as current: return `state`. Else `companyCode = code`, `programId` = only enabled record or `null`, `answers = {}`, `attestedSent = false` (3.4). |
| `PICK_PROGRAM(id)` | Valid only if `id` is enabled, belongs to `companyCode`, and is not `ng-paper` when used as a program choice. If same: return `state`. Else `programId = id`, `answers = {}`, `attestedSent = false` (5.4). |
| `OPEN_PAPER_NOTICE` (tier 2) | Valid only on National Grid (Massachusetts Electric). Same effect as `PICK_PROGRAM("ng-paper")`; kept separate so `ng-paper` never appears in the 5.1 choice. |
| `SET_ANSWER(key, v)` | Valid only if `key` starts with `${programId}.` and is a field of that record. If `v` equals the current value (`Object.is`, with `undefined` treated as `null`): return `state` unchanged — a no-op that keeps the attestation. Otherwise set the key and set `attestedSent = false`: any actual change after a send needs a new attestation (7.6, 7.6a). |
| `SET_ATTESTED(b)` | `true` valid only when the derived tracker is Prepared; `false` always valid. |
| `SET_LANGUAGE(l)`, `SET_LANGUAGE_OTHER(s)` | Change only the language fields (8.2). |
| `SET_TYPED_COUNTY(s)`, `SET_BACKUP_CONTACT(s)` | Change only `backup` (tier 2). |

### Derived town status

```
                 +-------+
   (start) ----> | idle  |
                 +-------+
                     | SELECT_TOWN / SUBMIT_UNMATCHED
   +-----------------+------------------+---------------------+
   v                 v                  v                     v
+-----------+  +----------------+  +-----------+   +--------------------+
| not-found |  | mixed-unpicked |  |  blocked  |   |  program-choice    |
+-----------+  +----------------+  +-----------+   | (2 enabled records)|
                     | PICK_COMPANY      ^          +--------------------+
                     +-------------------+                 | PICK_PROGRAM
                     | (company with one enabled record)   v
                     +--------------------------->  +--------------+
                                                    | program-open |
                                                    +--------------+
```

`blocked.reason` is `holyoke-no-form` (code `Holyoke Gas & Electric Department`) or `no-form-loaded` (any other code with no enabled record). Only `program-open` has a card, a tracker and a print button (4.7, 7.7).

### Tracker (derived, never stored)

```
 not-started --(every [field] step done)----------------------> prepared
 prepared    --(SET_ATTESTED true)----------------------------> submitted   ([send] step done)
 submitted   --(SET_ANSWER with a different value)------------> attestedSent = false; recomputed
 submitted   --(SET_ANSWER with the same value)---------------> unchanged (no-op)
 confirmed   :  no edge in. [wait] step is never done. Rendered as "Only {companyNameOnPage} can confirm".
```

`stepDone(step, state)` follows §3: `[field]` by `isAnswered`, `[send]` by `attestedSent`, `[wait]` always `false`. `firstOpenStep` is the first step with `stepDone === false`; because the `[wait]` step is never done, it always exists. With every household field filled, the first open step is the clinician's step (Unitil `[send]`; NG medical / Eversource consent `[field]`) or, on records with no clinician, the `[send]` step. After Submitted it is "Waiting for {company} to confirm", owner the company.

The tracker words and the attestation control ship in tier 1 (Requirement 7). In the MVP there is no attestation control, so the `[send]` step stays open; the card and handoff show every step, the next unfinished step and its owner, and no tracker word (4.2a). The reducer supports attestation from the start so P15 and P22 can run as soon as tier 1 is enabled.

### Clearing in depth

Answer keys are namespaced by record. A town reset, company pick or program pick empties `answers`, and `SET_ANSWER` rejects keys outside the open record, so a value from one record cannot render on another even if a reset were missed (3.6, 5.4).

## 5. View model and the appText / quotes split

```ts
export interface ViewModel {
  status: "idle" | "not-found" | "mixed-unpicked" | "blocked" | "program-choice" | "program-open"
  town?: { display: string; companyCodes: string[]; ej?: EjView }
  notFoundMessage?: "Not in the saved 351-town table"
  blocked?: { companyCode: string; reason: "holyoke-no-form" | "no-form-loaded"; message: string }
  choices?: { id: RecordId; programName: string; purpose: Purpose }[]
  card?: CardView
  tracker?: { state: "not-started" | "prepared" | "submitted"; confirmedLabel: string }
  handoff?: HandoffView
  language: { value: State["language"]; other: string }
  backup?: BackupView                         // tier 2
}

export type EjView =
  | { kind: "mean"; meanPct: number; n: number; label: "unweighted mean across EJ block groups — not a town-wide rate" }
  | { kind: "none"; label: "No EJ block groups" }

export interface CardView {
  recordId: RecordId
  appText: string[]          // every sentence the app writes in its own words
  quotes: Sourced[]          // verbatim, from this record's sources only
  limits: Sourced[]
  renewal: { label: string; text: string; sourceId: string }  // "Outage-list renewal" + "No interval stated in the opened sources" on unitil-lifesupport
  regulationContext?: { label: string; text: string; sourceId: string } // unitil-lifesupport only, rendered apart from renewal
  formBoxNote?: Sourced      // both Unitil records
  returnChannels: ProgramRecord["returnChannels"]
  sources: Source[]
  unverified: string[]
  steps: { label: string; kind: Step["kind"]; ownerText: string; done: boolean }[]
  firstOpenStep: { label: string; ownerText: string }
  cpapNotice?: { sentence: Sourced; pointer: Source }   // 6.1 only
  agePrompt?: "Enter the patient's age in months to check National Grid's sentence"  // 6.2
}

export interface HandoffView {
  town: string; companyCode: string; programName: string; purpose: Purpose
  firstOpenStep: { label: string; ownerText: string }
  steps: { label: string; ownerText: string; done: boolean }[]
  renewal: string                              // "{label}: {text}"; never the regulation line on unitil-lifesupport
  regulationContext?: string                   // "{label}: {text}", printed on its own line (4.1a)
  formBoxNote?: string
  returnChannels: string[]; sourceUrls: string[]
  limits: string[]; noGuarantee?: string
  trackerWord?: string                         // only when tier 1 is enabled (4.2, 4.2a); absent in the MVP
  language?: { value: string; label: "set by coordinator" }  // tier 1, only if set (8.7)
  householdLabel?: "synthetic demo household"  // 4.8
}
```

Two kinds of text, tested differently:

- **`appText`** — every sentence the app writes itself: headings, purpose line, tracker words, step labels, handoff summary, blocked messages. Forbidden-phrase properties run on it:
  - on an `outage-notify` card: never `/protect(ed|ion|s)?\b.{0,40}\b(shut ?off|terminat|disconnect)/i`;
  - on a `shutoff-protection` card: never `/(outage|notification) (list|call list)|notify you (of|before) (an )?outage/i`;
  - on any card or handoff: never `/priorit|faster restoration|restored first|protected for (3|6|12) months|12[- ]month protection|confirmed by|enrollment confirmed|not eligible|rejected|denied/i`;
  - on a Unitil life-support card or handoff: never `/(outage|life[- ]support|list|enrol(l)?ment|registration).{0,60}(expire|lapse|renew|valid).{0,40}(quarter|six months|90|180|3 months|6 months|12 months)/i` (2.6b);
  - on the MVP handoff (tier 1 disabled): never `/\b(prepared|submitted|confirmed)\b/i` (4.2a).
- **`quotes` / `limits` / `renewal`** — source strings, which may contain banned words in the negative ("does not protect your account from termination", "does not prioritize your service"). They are checked for provenance: each `sourceId` resolves to a source on the open record, and each string appears on exactly one record.

Purpose display strings: `outage-notify` → "Outage notification", `shutoff-protection` → "Shutoff protection (financial hardship + clinician certificate)", `UNVERIFIED` → "Purpose not stated on the opened page — UNVERIFIED".

## 6. Error and empty states

| Situation | Shows | Never shows |
|---|---|---|
| No town yet | Town field, hint "Type a Massachusetts town" | Any company |
| Typed text matches no row (incl. "West Townsend") | "Not in the saved 351-town table" in the list; after Enter, the not-found screen | A guessed company |
| Holyoke | "Holyoke Gas & Electric Department", "No form opened. No checklist." | Any record, step, renewal, tracker, print, phone number, Wellesley's expiry |
| Other company with no enabled record (municipal, Nantucket Electric, Eversource / Wellesley before tier 1) | The exact company code, "No form loaded for this company in this build. No checklist." | Another company's program |
| Mixed town, no pick (Bellingham) | Every company code, "Pick the company printed on the bill" | Any record, step, renewal |
| Mixed town, picked company has no record (Lynnfield, Chicopee's municipal pick) | Blocked card for that company | — |
| Two records, none picked | Two radios with program name and purpose | Either record's fields |
| Record states no interval | "No interval stated" (Unitil life-support: "Outage-list renewal: No interval stated in the opened sources") | Any interval; the 220 CMR 25.03 line as that record's renewal |
| Unitil account protection, low-income not recorded | "Applicability not determined" on an unfinished step | A decided outcome |
| Masked or unopened item | The item with an UNVERIFIED badge | A guessed value |
| CPAP family device, age blank | The age prompt | The sentence |
| CPAP family device, age ≤ 6 months | Nothing extra | The sentence, or any rule for that age |
| EJ: town has no EJ rows | "No EJ block groups", sorted last | 0.00% |
| EJ: rows average 0 | "0.00% · n=2" | "No EJ block groups" |
| Facility file has no same-town rows | "No rows in this file for {town}"; typed contact field when both are empty | A nearby or invented facility |
| Bed count 0 | "0" + "0 in the file is not proof the unit is closed" | "closed", blank |
| CMS rating `Not Available` | "Not Available" | 0, blank, stars |
| Blank numeric cell | "not reported" | 0 |
| No county known | No FEMA line; "Type a county to see the last saved declaration" | An inferred county |
| `utilities` kit fails `validateKit` | Full-page error naming the file and the failed check (13.10) | A partial app |
| Enabled stretch kit (`ej`, `hospitals`, `cms-hospitals`, `fema`) fails `validateKit` | Its feature is off, with "Saved {file} failed check: {check}. {feature} is off."; town lookup, card, town change and print keep working (13.11) | A full-page error; a guessed value |
| Stretch kit's tier disabled | Its feature is not rendered; the kit is not parsed (13.9) | A notice, an error, or any EJ / facility / FEMA text |
| Print with nothing open | Print button not rendered | A blank or other-record handoff |

## 7. UI (shadcn/ui)

One page. Components come from shadcn/ui per `frontend.md` (`components.json`: style `base-nova`, Base UI primitives, lucide icons). Only `button` is installed today; the MVP adds `pnpm dlx shadcn@latest add badge radio-group card alert checkbox input label select separator`; tier 1 adds `command popover` for the town combobox. No hand-rolled controls.

1. **Header:** product name and one line: "Finds the program for this town. Does not submit or confirm anything."
2. **Town:** MVP is a labelled shadcn `Input` with a submit `Button`: type a town, press Enter, match against the 351 rows (1.2a); no match shows "Not in the saved 351-town table". Tier 1 replaces it with a `Popover` + `Command` combobox (list, scroll, type to filter, arrow keys) and adds a sort toggle (A–Z / EJ limited-English mean) and `28.88% · n=56` beside each town, with the label from `EjView`; the language `Select` ("Not chosen" default) sits in its own "Household" group, apart from the sort, so the two never look linked.
3. **Company:** `Badge` per company code. Mixed towns: `RadioGroup` "Pick the company printed on the bill". Blocked: `Alert` with the message as text.
4. **Program:** tier 1 `RadioGroup` of records (name + purpose). Then a `Card`: purpose, signer (+ signerAlso), renewal with its label, the 3/6/12 `formBoxNote` on Unitil, and on Unitil life-support the `regulationContext` in its own labelled block below the renewal (never in the renewal row), return channels, source links (`<a>` opening in a new tab, URL visible), verbatim quotes in `<blockquote>` with the source title, limits, UNVERIFIED `Badge`s, steps with owner and a text done-marker, fields (`Checkbox`, `Input`, `Select`, each with a `Label`).
5. **Tracker (tier 1):** three labelled stages — Prepared, Submitted, Confirmed. Confirmed is always muted and reads "Only {company} can confirm". State is in text ("Prepared — coordinator's part is done"), not colour alone. The attestation `Checkbox` uses the record's own wording and is disabled until Prepared.
6. **Print:** `Button` "Print handoff" → `window.print()`. `<Handoff>` is `hidden print:block`; `@media print` hides everything else; `@page { size: letter; margin: 0.5in }`; type sized so the longest record fits one page.
7. **Tier 2:** backup `Card` below the program: two lists labelled by source file and "Same town — verify by phone. Not ranked by distance.", typed contact field, FEMA line with origin label and "Historical declaration — not a forecast".

Layout: single column under 1024 px, two columns (town/company | card) above. MVP (14.1a, 14.2, 14.4): visible labels, visible focus rings (shadcn defaults, not removed) on the demo path, status in text. Tier 1 (14.1, 14.3, 14.5): full keyboard-order pass, no horizontal scroll at 375 px or 200% zoom, motion disabled under `prefers-reduced-motion`. No emoji; lucide icons only, each with text beside it. Light theme text at slate-900 / muted at slate-600 or darker.

## 8. Testing strategy

vitest + fast-check (third-party; our tests, not a Kiro feature). `pnpm test` runs `vitest run`; a task is done only when `pnpm test` and `pnpm build` pass. The scaffold is pnpm (`pnpm-lock.yaml`); use `pnpm add`, never `npm install`. Tests import `kits.ts` (which reads the real kits through `kit-sources.ts`), `programs.ts`, `reducer.ts`, `derive.ts` — never React.

Generators use real data: `fc.constantFrom(...townKeys)` over the 351 rows, `fc.constantFrom(...recordIds)`, arbitrary answer maps over a record's real field keys, arbitrary action sequences built from those. `numRuns: 200`. Seeds are logged on failure. Each property below is one `fc.assert` with its P-number in the test name (`"P1 company change clears answers"`). Every shrunk counterexample becomes a named regression test. Unit examples cover the named demo towns.

### Correctness properties

| # | Property | Requirements | Tier |
|---|---|---|---|
| P1 | **Company change clears answers.** For any towns A ≠ B and any answers / attestation / typed county on A, after `SELECT_TOWN(B)`: `answers` empty, `attestedSent` false, `backup` empty, and no `appText`, quote, renewal or return channel of A's company renders unless B resolves to the same company. Named example: Fitchburg → Leominster leaves no 603-227-4784, no Concord address, no 3/6/12 control, no equipment "yes". | 3.1, 3.4, 3.6 | MVP: 3.1, 3.4, 3.6 on the two MVP records (headline: Fitchburg → Leominster) |
| P2 | **Same company keeps records, clears household.** For towns A ≠ B with the same single company code, offered record ids are equal and `answers` (incl. street address) are empty. Example: Lawrence → Worcester. | 3.5 | MVP: 3.5 (Lawrence → Worcester on ng-outage) |
| P3 | **Reselecting is identity.** `SELECT_TOWN(current)`, `PICK_COMPANY(current)`, `PICK_PROGRAM(current)` return the same object; `SET_LANGUAGE(l)` twice equals once. | 3.3 | MVP: 3.3 |
| P4 | **Company comes only from the kit.** For every one of the 351 rows, displayed company codes equal `utility_code` split on `", "`, in order, and never the `utility` column. Gardner, Leominster, Shirley, Westminster show National Grid; Westfield is mixed: pick between Westfield Gas and Electric Light Department (blocked) and Eversource (blocked until tier 1), never National Grid; "West Townsend" is not found. | 1.1, 1.2, 1.3, 1.7, 1.8, 1.9 | MVP: 1.1–1.3, 1.7–1.9 over the 351 rows |
| P5 | **No card or print while blocked, not found or unpicked.** For any start state and any generated action sequence, after every step: if the resulting derived status is `blocked`, `not-found` or `mixed-unpicked`, the view has no card, tracker, print button, handoff, renewal or step, and a Holyoke block shows no phone number. The invariant is checked on the resulting state only; leaving such a state is allowed. Success examples: Holyoke → `SELECT_TOWN(FITCHBURG)` auto-selects Unitil and is `program-open`; Bellingham → `PICK_COMPANY(National Grid (Massachusetts Electric))` opens `ng-outage`. Blocked examples: Lynnfield → either pick; Chicopee → municipal pick. All 18 mixed rows start `mixed-unpicked`; no single-company row does. | 1.4, 1.4a, 1.4b, 1.5, 1.6, 4.7, 7.7 | MVP: 1.4, 1.4a, 1.4b, 1.5, 1.6, 4.7 (no card, step, renewal, print or handoff) / Tier 1: 7.7 (no tracker) |
| P6 | **Outage records never claim shutoff protection; no record claims priority.** For any `outage-notify` record and any answers, `claims.shutoffProtection === false` and no `appText` matches the protection ban; for every record and handoff, no `appText` matches the priority ban. NG outage card shows its non-termination and no-priority quotes. | 2.8, 5.5, 13.6 | MVP: 2.8 on ng-outage and unitil-lifesupport / Tier 1: 5.5, 13.6 and all records |
| P7 | **Renewal belongs to its record.** For any record, rendered renewal equals `${renewalLabel}: ${renewal.text}` (+ scope); `kind "none-stated"` ⇔ text is exactly "No interval stated"; the calendar-year text appears on `wmlp-chn` only — never on Holyoke, a blocked card, `ng-outage` or `ng-paper`; the 220 CMR 25.03 text is the renewal of `unitil-protection` only, and on `unitil-lifesupport` appears only as `regulationContext`. | 2.4, 2.4a, 2.6a, 5.3a, 9.1, 9.4, 9.5, 12.1 | MVP: 2.4, 2.4a, 2.6a on unitil-lifesupport and ng-outage / Tier 1: 5.3a (unitil-protection), 9.1, 9.4, 9.5 (wmlp-chn) / Tier 2: 12.1 (ng-paper) |
| P8 | **Unitil's box and regulation never become an outage-list term.** For any Unitil record and any answers: no card or handoff text matches `/protected for (3|6|12) months|12[- ]month protection/i`; the 3/6/12 label reads "clinician's anticipated length of the condition, not a protection period"; no coordinator field sets 3/6/12. On `unitil-lifesupport` card and handoff: renewal is "Outage-list renewal: No interval stated in the opened sources", the "Separate shutoff-protection certificate (220 CMR 25.03)" line is present as its own item, and no `appText` matches the outage-expiry ban (§5). | 2.6, 2.6a, 2.6b, 2.7, 4.1a | MVP: 2.6, 2.6a, 2.6b, 2.7, 4.1a on unitil-lifesupport |
| P9 | **Handoff is complete and single-record.** For any `program-open` state, the handoff has town, company code, program name, purpose, first open step + owner, every step + owner, renewal, a return channel and a source URL; every string comes from the open record, the current answers, the town row or fixed app labels; clinician-step owners equal the signer text; it never says confirmed; `limits` / `noGuarantee` only from the record; demo fixture ⇒ "synthetic demo household"; with `enabledTiers = ["mvp"]` there is no `trackerWord` and no Prepared / Submitted / Confirmed text. | 2.10, 4.1, 4.1a, 4.2a, 4.3–4.6, 4.8 | MVP: 2.10, 4.1, 4.1a, 4.2a, 4.3–4.6, 4.8 on the two MVP records |
| P10 | **Every source is dated by when it was opened.** Every record has ≥1 source with an `https://` URL and `openedAt === "2026-10-24"`; no `Source` has a `savedAt`, and every `KitSource` has `savedAt === "2026-10-18"` and no `openedAt`; no `openedAt` is computed from a clock (static check: no `new Date(` / `Date.now(` in `src/rules/`); every `sourceId` resolves on that record; every quote is `verbatim` and stored on one record only; every fax, phone, address and email string appears only on records whose sources contain it (603-227-4784 only on Unitil, 413-746-6495 only on ev-illness, Westwood only on ev-letter, Syracuse only on ng-medical); 781-441-3686 appears nowhere as a return channel. Runs over enabled records only: in the MVP (task 3) it checks `unitil-lifesupport` and `ng-outage` (603-227-4784 only on Unitil); the tier-1 strings (413-746-6495, Westwood, Syracuse) are checked when task 8 re-runs P10. | 2.2, 2.3, 2.5, 2.9, 13.1, 13.1a, 13.1b, 13.2, 13.3 | MVP: 2.2, 2.3, 2.5, 2.9 on unitil-lifesupport and ng-outage only / Tier 1: 13.1, 13.1a, 13.1b, 13.2, 13.3 source checks and every tier-1 fax/address string (413-746-6495, 1-866-460-8549, Westwood, Syracuse) |
| P11 | **Determinism.** `derive(s, ctx)` twice is deep-equal; neither `derive` nor `reduce` mutates its input. | 13.7 | Tier 1: 13.7 |
| P12 | **Missing is not zero.** For generated CSV text with blank, `0`, numeric and `Not Available` cells, the parser yields `null`, `0`, the number and the text respectively, and rendering yields "not reported", "0", the number, "Not Available". Real-kit examples: Harwich `limited_english_hh_pct` 0; Providence Behavior Health ICU 0; 30 CMS `Not Available` ratings. | 13.4, 10.5 | Tier 1: 13.4 (parser) / Tier 2: 10.5 (beds, ratings) |
| P13 | **Program switch clears the other record.** For any two records X ≠ Y of one company and any answers on X, after `PICK_PROGRAM(Y)` no `X.*` key exists and no X-only text renders. `ev-illness` never says outage list; `ev-letter` never says shutoff protection granted and never shows 413-746-6495; `ev-illness` never shows Westwood; `ng-medical` never shows the CPAP sentence or "No interval stated". | 5.4, 5.6, 5.8, 5.9 | Tier 1: 5.4, 5.6, 5.8, 5.9 |
| P14 | **CPAP gate.** For device ∈ {CPAP, BiPAP, APAP, VPAP, other} and age ∈ {null} ∪ [0, 1440] months, on any record: the sentence shows iff record is `ng-outage`, device is one of the four, and age > 6; when shown, it cites `ng-live` and links `ng-protect`; age null with a sleep-apnea device ⇒ age prompt; no state or text records a rejection, denial or eligibility decision; never on `ng-paper`. | 6.1–6.6 | Tier 1: 6.1–6.6 |
| P15 | **Confirmed is unreachable; finishing is not sending.** For any record and any action sequence: tracker ∈ {not-started, prepared, submitted}; submitted ⇒ `attestedSent`; all fields filled with `attestedSent === false` ⇒ prepared, not submitted; clearing a required field after submitted ⇒ not submitted; `confirmedLabel` is always "Only {company} can confirm". | 7.1–7.6, 7.2a | Tier 1: 7.1–7.6, 7.2a |
| P16 | **Language changes only by hand.** For any action sequence, `language` equals the last `SET_LANGUAGE` value (or "not-chosen"); no town, company, program or EJ value changes it; the EJ view for a town does not depend on `language`. | 3.2, 8.1–8.3 | MVP: 3.2 (town change keeps language; state only) / Tier 1: 8.1–8.3 (control, EJ independence) |
| P17 | **EJ mean matches the CSV.** For any municipality, mean = arithmetic mean of non-null `limited_english_hh_pct` over `ej === "Yes"` rows (±0.005), n = count; n = 0 ⇒ `kind "none"`, sorted after every town with a mean. Examples: Lawrence 28.88/56, Chelsea 26.20/36, Holyoke 20.54/29, Wellesley 0.00/2. | 8.4–8.6 | Tier 1: 8.4–8.6 |
| P18 | **Facilities are same-town only, never ranked.** For any town, every listed row's normalized `city` / `municipality` equals the town; list order is file order; no distance field; no text matching `/nearest|closest|safe|accepting|available|backup power/i` outside verbatim kit values; empty stays empty; the panel ignores `programId`. Examples: Lawrence CMS 220010 + empty hospitals list; Chelsea and Wellesley empty in both. | 10.1–10.6 | Tier 2: 10.1–10.6 |
| P19 | **FEMA needs a known county; non-county rows never match.** For any town and typed county: no county ⇒ no line; a line's row parses to exactly that county via the regex and is the latest by date (tie: higher `disasterNumber`); origin label is "from facility row" or "typed by coordinator"; the tribal, reservation and Statewide rows never match. Example: Lawrence → 2023-09-15 Hurricane Lee, Essex, from the CMS row. | 11.1–11.5 | Tier 2: 11.1–11.5 |
| P20 | **Paper notice stays separate.** `ng-paper` is never in National Grid's choice list, never shows the CPAP sentence or Wellesley's expiry, keeps "No interval stated", and shares no field key or option list with `ng-outage`. | 12.1–12.3 | Tier 2: 12.1–12.3 |
| P21 | **Step completion contract (regression for Jim 5).** For every enabled record: exactly one `send` and one `utility-wait` step, the wait step last; every `field` step has ≥1 required field. For any answers: a yes-no or select field set to "No" (or any option) is answered, `null` / `""` is not; a consent field is answered only when `true`. Regressions: (a) every household field filled, `attestedSent` false ⇒ the clinician's step (or, with no clinician step, the send step) is still open and is `firstOpenStep`; (b) `attestedSent` true ⇒ the `utility-wait` step is still open and is `firstOpenStep`; (c) the `utility-wait` step is never done under any action sequence. Unitil account protection: low-income field `null` ⇒ its step reads "Applicability not determined" and is open; either recorded outcome answers it; `unitil-lifesupport` has no low-income field and its steps never depend on one. | 2.10, 2.10a–2.10d, 5.10, 5.10a–5.10c, 7.2a | MVP: 2.10, 2.10a–2.10d on unitil-lifesupport and ng-outage (structure, isAnswered, regressions a–c) / Tier 1: 5.10, 5.10a–5.10c, 7.2a and all records |
| P22 | **Edit after send clears the attestation.** For any record, any Prepared answers and `SET_ATTESTED(true)`: `SET_ANSWER(k, v)` with `v` different from the current value ⇒ `attestedSent === false` and tracker ≠ submitted (including when a cleared field is refilled with its old value — two changes, no new attestation ⇒ not submitted); `SET_ANSWER(k, current)` returns the same state object and stays submitted. | 7.6, 7.6a | Tier 1: 7.6, 7.6a |

Not P-numbered (example or static checks):

- `validateKit` against each real kit: headers and 351 / 2,604 / 103 / 84 / 415 (13.8).
- Tier-gated loading (13.9–13.11): `loadKits(["mvp"])` parses only `utilities`; a malformed `utilities` string ⇒ `fatal`; a malformed `ej` / `hospitals` / `cms-hospitals` / `fema` string with its tier enabled ⇒ that kit `ok: false` and Fitchburg → Leominster → handoff still derives.
- CSV parser examples: quoted comma, `"LAWRENCE, MA"`, CRLF, empty cell.
- Static check: no `fetch(`, `XMLHttpRequest` or `navigator.sendBeacon` under `src/` (13.5).
- Unit examples per demo-check line in `requirements.md` (Fitchburg, Leominster, Lawrence, Holyoke, Bellingham, Lynnfield, Chelsea, Wellesley).
- Accessibility (Requirement 14): manual keyboard pass, 375 px and 200% zoom checks before deploy. Full WCAG conformance needs assistive-technology testing and is not claimed.
- Demo mutation: temporarily keep a Unitil answer across Fitchburg → Leominster (or attach Wellesley's renewal to Holyoke), show P1 (or P7) red, revert, show green. Screenshot both for the write-up.

### Kiro wiring (claimed only if used)

- `PostFileSave` hook reruns `pnpm test` on agent edits to `src/**`, `tests/**`.
- `PreToolUse` hook blocks agent writes under `public/data/` (exit 2).
- `Stop` hook runs `pnpm test`.
- Steering: `product.md`, `tech.md`, `bans.md`, `frontend.md`.
- Optional read-only MCP server over the five kits, tier 2, 25-minute timebox (Requirement 15).

## 9. Reconciliation notes

Changes from the hand draft, each traced to the repo or a source:

- **Kit paths:** `public/data/<kit>/data.csv` (what exists), imported by one module with `?raw`; guard hook path follows. `tech.md` still says `data/`.
- **FEMA:** the latest Essex row in the kit is disaster **3599** (type EM), 2023-09-15. `lifeline-sources.md` says 4736; the kit wins. The app shows the row's own fields and hardcodes no disaster number. The kit also has two non-county rows the hand draft did not list (Wampanoag Tribe of Gay Head (Aquinnah), Hassanamisco Indian Reservation); the regex excludes them.
- **EJ:** every row of this copy is `ej = "Yes"` and none is blank; means recomputed and match `FINAL-idea.md`. Missing-vs-zero is tested with generated CSV text plus real zeros.
- **CMS:** 30 `Not Available` ratings; Holyoke has two psychiatric rows besides Holyoke Medical Center.
- **Not-found:** typing alone does not clear state; Enter on unmatched text clears like a town change (`SUBMIT_UNMATCHED`), so no old-company text survives on a not-found screen.
- **Steps:** step completion is computable so the first open step is defined; superseded in Revision 1 by the `field` / `send` / `utility-wait` step kinds (§3, §10).
- **Text provenance:** `Sourced.verbatim` added; only `FINAL-idea.md`'s verbatim blocks are quotes. Unitil, NG Medical Protection, Wellesley and 220 CMR 25.03 render as paraphrases. Eversource illness has five verbatim blocks, not four.
- **No-guarantee line:** `noGuarantee` exists only on `ev-letter` and `wmlp-chn` (ban 15).
- **Uncovered fields:** where a form's field layout was not opened (NG live equipment list, NG Medical Protection application, WMLP online form, NG paper boxes), the checklist names what the source says is needed and lists the gap as UNVERIFIED.
- **Requirement IDs:** the P-table uses the approved numbering (e.g. print gating is 4.7, synthetic label 4.8, company line 1.9).

## 10. Revision 1 — Jim's review (`research/review-spec-jim.md`)

- **Unitil renewal split (Jim 1):** `renewalLabel`, `renewal.scope`, `regulationContext`, `formBoxNote` replace `renewalAlso`; new renewal kind `regulation-quarterly-semiannual` (unitil-protection only); records table, sources table, CardView, HandoffView, UI item 4, P7, P8 and the outage-expiry ban in §5.
- **MVP print without tracker (Jim 2):** §4 tracker note, HandoffView `trackerWord` only with tier 1, §5 MVP-handoff ban, P9.
- **Unitil low-income (Jim 3):** `unitil-protection` step 3 with "Applicability not determined" while `null`; two recorded outcomes; not on `unitil-lifesupport`; §6 row; P21.
- **Mixed towns (18 = 8 + 9 + 1):** §2 utilities row; P5 examples.
- **`openedAt` / `savedAt` (Jim 4):** `Source.openedAt`, `KitSource.savedAt`, sources-table note, P10.
- **Step completion contract (Jim 5, blocking):** `Field.kind` adds `yes-no` and `consent`; `isAnswered`; `Step` is a union of `field` / `send` / `utility-wait`, field steps typed non-empty; fields-and-steps table rewritten; clinician document steps use a coordinator-recorded consent; WMLP physician verification moved to a limits line; §4 `stepDone` / `firstOpenStep`; P21.
- **Edit after send (Jim 6):** `SET_ANSWER` no-op on equal value, otherwise clears `attestedSent`; tracker diagram; P22.
- **P5 scope (Jim 7):** P5 checks the resulting state only; Holyoke → Fitchburg is a success example.
- **Tier-gated kits (Jim 8):** §1 "Tier-gated kit loading", `loadKits` / `validateKit`, §6 rows, test bullet.

## 11. Revision 2 — Dwight's review (`research/review-spec-dwight.md`) and god's decision

- MVP gate at 6:30 PM; tier 1 6:30–7:00; tier 2 7:00–7:20 only if tier 1 is green; freeze 7:20 (clocks live in `requirements.md` and `tasks.md`).
- §1 Kit location: only `utilities` is loaded and validated in the MVP; stretch kits load with their tier.
- §7 UI: MVP town input is a typed `Input` + Enter; `Command` combobox and list polish are tier 1. Layout line split into MVP accessibility (14.1a, 14.2, 14.4) and tier 1 (14.1, 14.3, 14.5).
- §8: `pnpm test` / `pnpm build` / `pnpm add`; hooks run `pnpm test`. P10 runs over enabled records only (MVP records in task 3; tier-1 strings in task 8).

## 12. Revision 3 — Dwight via god

- §8 property table: every row has one Tier cell in the form "MVP: … / Tier 1: … / Tier 2: …". A property or part is MVP only if it tests Requirements 1–4 on `unitil-lifesupport` and `ng-outage`.
- Moved out of the MVP: P5's 7.7 tracker part, P6's 5.5 / 13.6 part, P7's 5.3a / 9.x (tier 1) and 12.1 (tier 2) parts, P10's 13.x source checks and tier-1 fax/address strings, P11 (all), P12 parser part (tier 1), P16's 8.1–8.3 part, P21's 5.10x / 7.2a part.

