# Design: lifeline-qa-bugs

## Data (`src/rules/programs.ts`, `src/types.ts`)

- Q1: replace the MyUnitil line in `unitilLifesupport.unverified`; `unitilProtection` inherits it by spread.
- Q2: `UNITIL_COMPANY_NAME_ON_PAGE = "Unitil"`.
- Q4: `ngOutage.quotes = [ngQuote1]`; `ngOutage.limits = [ngQuote2, ngQuote3]` as `{ verbatim: true, sourceId: "ng-live" }`.
- Q5: `ProgramRecord.contents?: Sourced[]`. Only `ngMedical` sets it (three sentences, `ng-protect`, verbatim: false).

## View model (`src/types.ts`, `src/state/derive.ts`)

- `CardView.contents?: Sourced[]` copied from the record.
- `HandoffView.contents?: string[]` and `HandoffView.unverified: string[]` copied from the record in `buildHandoff`.

## Render

- `ProgramCard.tsx`: limits heading "From the source"; new "The letter must state" list (with source link) before it when `card.contents` is set; channel UNVERIFIED badge only when `c.unverified && !c.text.includes("UNVERIFIED")`.
- `handoff-text.ts`: section order is next step, header, steps, renewal, answers, send it to, The letter must state, From the source, Sources, Not verified (last). New sections are `original: true`; Spanish headings "La carta debe indicar" and "No verificado". Unverified lines are `"UNVERIFIED: " + item`.

## One-page print

The added lines are short except the two National Grid paragraphs (~5 lines at 11pt on 7.5in). Longest handoff (ng-outage, ev-illness) stays within one Letter page at the existing 11pt/0.5in margins; the print preview is the manual check.

## Tests (`tests/qa-bugs.test.ts`)

One test per bug, using real kit towns: Fitchburg, Lawrence, Chelsea. The FINAL-idea check reads `../research/FINAL-idea.md` relative to the repo and is skipped when that file is not present (it is outside the public repo). Existing pins updated: `records.test.ts` ng quotes [1]/[2] now `ng.limits[0]/[1]`; `state.test.ts` P6 looks in `card.limits`.
