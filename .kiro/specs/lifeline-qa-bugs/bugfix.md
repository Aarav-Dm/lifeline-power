# Bugfix: LifeLine QA batch (Oscar, 24 Oct ~6:20 PM)

Source report: `research/qa-oscar.md` (outside this repo). Oscar drove the dev server and compared it to `research/FINAL-idea.md`, the sources, the spec and the bans. Five bugs, none blocking the demo path, plus one polish item (b) taken here. Polish a and c are out of scope.

Bans in `.kiro/steering/bans.md` stay binding. Every new string is copied from `research/FINAL-idea.md`; nothing is invented (ban 12).

## Q1. Present-tense MyUnitil claim

- Current: both Unitil records list "MyUnitil forms were still unavailable at demo time." under Not verified.
- Expected: "When the Unitil page was opened on 24 Oct 2026 it said MyUnitil forms were unavailable; whether that is still true is not verified." (FINAL-idea.md line 273: "At the time of the fetch the page also said MyUnitil forms were unavailable").
- Unchanged: the other two Unitil unverified lines; the phone 1-888-301-7700 channel.
- Root cause: the line was written as a present-tense status nobody checked at demo time. `unitil-protection` spreads `unitilLifesupport`, so one string fixes both.

## Q2. Unitil company name not traceable

- Current: `companyNameOnPage` is "Fitchburg Gas and Electric Light Company d/b/a Unitil" (card header, utility-wait owner). Found only in a research note, not in FINAL-idea, the sources, the kit, or the opened page.
- Expected: "Unitil", the name the opened page and PDF use (FINAL-idea.md lines 273-275).
- Unchanged: `companyCode` stays the kit's `Unitil (Fitchburg Gas & Electric)`; the wait label "Waiting for Unitil to confirm".
- Root cause: a name copied from a secondary note, not from an opened source (spec 2.2 says "as printed on the opened page").

## Q3. Misfiled limit heading on the card

- Current: `ProgramCard` heads the limits list "What this program does not do", but it holds lines like "The page tells the customer to keep a backup source of electricity" and "WMLP may ask for physician verification".
- Expected: heading "From the source", the same heading the handoff uses.
- Unchanged: list content, source links, the "Paraphrase:" marker.
- Root cause: the heading assumed every limit is a negative; the records also carry neutral source statements.

## Q4. Handoff drops sourced warnings and every UNVERIFIED item

- Current: Lawrence > Outage Life Support handoff prints no non-termination or no-priority sentence, because they sit in `quotes`, which the handoff never prints. No handoff prints the record's `unverified` list (e.g. Chelsea letter's "Bedford copy, May 2023 filename — currency UNVERIFIED").
- Expected: `ngQuote2` and `ngQuote3` move from `quotes` to `limits` (verbatim: true, sourceId ng-live), so the existing "From the source" block prints them; `ngQuote1` stays in quotes. The handoff ends with a "Not verified" section ("No verificado" in Spanish), each line "UNVERIFIED: " + the record's unverified item, marked original.
- Unchanged: the CPAP sentence stays separate; ng-outage renewal stays "No interval stated" (ban 3); claims unchanged.
- Root cause: `HandoffView` had no `unverified` field and `buildHandoff` never copied it; the National Grid warnings were filed as quotes.

## Q5. National Grid Medical Protection card is thin

- Current: signer, 90/180 and channels only.
- Expected: a "The letter must state" list ("La carta debe indicar" in Spanish) on card and handoff, three sentences copied from FINAL-idea.md line 269, verbatim: false, sourceId ng-protect:
  - "The document is on the letterhead of a registered physician, physician assistant, nurse practitioner, or local board of health, with that office's address and phone."
  - "It states the patient's name and address and whether the illness is serious (90 days) or chronic (180 days)."
  - "If the account is not on a discount rate, a financial-hardship statement is also required."
- Unchanged: ng-medical fields, steps, channels, renewal.
- Root cause: `ProgramRecord` had no place for letter contents; they were only implied by a step label.

## Polish b. Doubled UNVERIFIED on the email channel

- Current: ng-medical email channel text already ends "— UNVERIFIED" and the card also renders an UNVERIFIED badge, reading "UNVERIFIEDUNVERIFIED".
- Expected: no badge when the channel text already contains "UNVERIFIED".
- Unchanged: the channel's `unverified: true` flag and text.
