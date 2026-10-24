# LifeLine Power — Requirements

Spec: `lifeline` (Feature, Requirements-First). Phase: requirements only. Written 24 Oct 2026 from `LIFELINE-BUILD-PLAN.md` (its build order wins any conflict), `FINAL-idea.md` including "Fallback hardening" (every rule, quote, address, fax, number), `lifeline-features.md` (M1–M4, S1–S5, T1–T3), `lifeline-sources.md` (URLs, fields), Kevin's draft in `lifeline-kiro-plan.md` §3.1 (reordered), and the reconciled hand draft `research/spec-hand-draft/requirements.md` (numbering and tiers kept).

Every rule, number and URL below traces to `FINAL-idea.md` or `lifeline-sources.md`. Anything not opened is **UNVERIFIED**; the app shows it that way and never fills it in.

## Introduction

A Massachusetts care coordinator types a town, sees only that town's electric company from the saved 351-town `utilities` kit, opens that company's own program, and prints a one-page handoff naming the unfinished step, its owner, and the renewal rule that program's form actually states. Switching town or company clears the old company's answers. Outage-notification programs and shutoff-protection programs are different programs and are never merged.

Named user (synthetic): Dana Okonkwo, care coordinator, on the phone with James Pell about his father Robert Pell, who uses an oxygen concentrator at home in Fitchburg. The bill says Unitil. No real account number, no real patient.

Static Vite + React + TypeScript + Tailwind + shadcn/ui page on GitHub Pages. Tests: vitest + fast-check.

## Glossary

- **Kit** — one of the five saved Hackachusetts CSVs (`utilities`, `ej`, `hospitals`, `cms-hospitals`, `fema`), committed verbatim and never edited. Its snapshot date is `savedAt` 2026-10-18 (each kit README).
- **Opened date** — `openedAt`, the day a program source (form, page, PDF, statute, regulation) was actually opened: 2026-10-24 for every source in this build. It is separate from a kit's `savedAt`. A source that was not opened has no `openedAt` and is shown UNVERIFIED.
- **Normalized name** — a name after `trim()`, collapsing whitespace to one space, and upper-casing. Every town join uses it.
- **Town row** — one row of the `utilities` kit (`town`, `utility_code`, `utility`).
- **Company code** — one value of `utility_code`, after splitting a multi-company cell on `", "`. This exact string is the company line on screen.
- **Mixed town** — a town row whose `utility_code` names more than one company. The kit has exactly 18: 8 name Eversource and National Grid (Bellingham, Cheshire, Erving, Hancock, Lenox, Pembroke, Scituate, Westport); 9 name a municipal company and an investor-owned company (Chester, Chicopee, Dighton, Groton, Hingham, Lakeville, Middleborough, Russell, Westfield); 1 names two municipal companies (Lynnfield). All 18 wait for a company pick.
- **Program record** — one program one company publishes, typed in `src/rules/` with its own company, program name, purpose, signer, renewal, return channel(s), source(s), steps, limits and UNVERIFIED list. A company with two programs has two records.
- **Loaded company** — a company code with at least one program record in the current build tier.
- **Blocked** — the resolved company has no program record. The company is named; no program, step, checklist, renewal or tracker is shown.
- **Purpose** — `outage-notify`, `shutoff-protection`, or `UNVERIFIED`.
- **Answers** — anything the coordinator types or ticks for the household, including attestations.
- **Step kinds** — every step on a record is exactly one of:
  - **Field step** — done when every required field in it is answered. A valid "No" (or any chosen option) counts as answered; a blank does not; a required consent checkbox counts only when true.
  - **Send step** — done only by an explicit send attestation. Filling fields never completes it.
  - **Utility-wait step** — the company's confirmation. Never done in this app.
- **Household fields** — the fields in field steps whose owner is the coordinator.
- **Prepared / Submitted / Confirmed** — tracker words (tier 1). Prepared: every field step on the open record is done. Submitted: Prepared, and the send step is attested. Confirmed: only the utility can confirm; the app has no way to set it.
- **No interval stated** — the exact renewal text for a record whose opened artifact states no interval.

## Requirements by build tier

| Tier | Requirements | Clock | Gate |
|---|---|---|---|
| MVP | 1 (M1), 2 (M2), 3 (M3), 4 (M4), 13 (source integrity), 14 MVP part (14.1a, 14.2, 14.4) | 4:30–6:30 PM | — |
| Tier 1 | 5 (S1), 6 (S2), 7 (S3), 8 (S4), 9 (S5), 14 tier-1 part (14.1, 14.3, 14.5) | 6:30–7:00 PM | MVP tests green |
| Tier 2 | 10 (T1), 11 (T2), 12 (T3), 15 (optional MCP) | 7:00–7:20 PM | Tier 1 tests green; freeze at 7:20 |

The 6:30 PM demo is Fitchburg (Unitil) → Leominster (National Grid), with Holyoke blocked for one second. The facilities / backup panel is tier 2.

---

## MVP

### Requirement 1 — Town to company (M1)

**User Story:** As Dana, I want to type Robert's town and see the electric company the state table names for it, so that I start on the right company's program and never a guessed one.

#### Acceptance Criteria

1.1 WHEN the user selects a town whose normalized name matches a town row, THE system SHALL display the company code(s) from that row's `utility_code` and no other company.
1.2 THE system SHALL offer all 351 towns in the `utilities` kit and no town that is not in it.
1.2a (MVP) THE town input SHALL be a typed text field; on Enter, THE system SHALL match the normalized text against the 351 town rows. A searchable list, scrolling suggestions and any sorting of the 351-town list are tier 1 (the EJ sort is 8.4).
1.3 IF the user's typed text matches no town row, THEN THE system SHALL display "Not in the saved 351-town table" and SHALL NOT guess a company.
1.4 WHEN the selected town's `utility_code` names more than one company, THE system SHALL display every named company, ask "Pick the company printed on the bill", and SHALL NOT load a program, checklist or renewal until one company is picked.
1.4a THE rule in 1.4 SHALL apply to all 18 mixed-company rows in the kit — the 8 Eversource + National Grid rows, the 9 municipal + investor-owned rows and Lynnfield's two municipal companies — and to no single-company row.
1.4b WHEN a mixed-town pick resolves to a company with no program record (every municipal pick in this build), THE system SHALL show the blocked state of 1.6.
1.5 WHEN the resolved company is `Holyoke Gas & Electric Department`, THE system SHALL display that name and "No form opened. No checklist.", and SHALL NOT display a program, step, renewal, tracker, phone number or another company's rule.
1.6 WHEN the resolved company is any other company with no program record in the current tier (including every unloaded municipal company, `National Grid (Nantucket Electric)`, and a loaded company whose records belong to a later tier), THE system SHALL display that company code and "No form loaded for this company in this build. No checklist.", and SHALL NOT substitute another company's program.
1.7 WHEN the user selects a town that Unitil's life-support page lists but the kit assigns to National Grid (Gardner, Leominster, Shirley, Westminster), THE system SHALL display the kit's company.
1.8 IF the user types "West Townsend", THEN THE system SHALL treat it as not in the table (1.3).
1.9 THE company line SHALL come from `utility_code`, never from the `utility` column or from a utility website.

Demo check: Fitchburg → `Unitil (Fitchburg Gas & Electric)`. Leominster → `National Grid (Massachusetts Electric)`. Holyoke → `Holyoke Gas & Electric Department`, no checklist. Bellingham → both companies named, no checklist until one is picked. Chicopee → `Chicopee Municipal Lighting Plant` and Eversource named; no checklist until one is picked. Lynnfield → two municipal companies named; either pick is blocked.

### Requirement 2 — One program card (M2)

**User Story:** As Dana, I want the loaded company's program shown as one card with its signer, renewal, where to send it and its source link, so that I can tell James exactly what the form needs.

MVP records: Unitil life-support identification and National Grid Outage Life Support. Other records arrive in tier 1 (Requirements 5, 9).

#### Acceptance Criteria

2.1 WHEN the resolved company is loaded and has exactly one program record in the current tier, THE system SHALL open that record's card without asking.
2.2 THE card SHALL display the record's company name as printed on the opened page, program name, purpose, signer, renewal, return channel(s) and source URL(s), each URL as a clickable link.
2.3 THE card SHALL render only text stored on the selected record; THE system SHALL NOT compose a claim from two records.
2.4 IF the record's renewal is no interval stated, THEN THE card SHALL display exactly "No interval stated" and SHALL NOT display any interval.
2.4a A record MAY show a renewal label before that text and the scope "in the opened sources" after it (2.6a); the interval text itself SHALL stay exactly "No interval stated".
2.5 WHEN the record is Unitil life-support identification, THE card SHALL display the MALFORM-MA PDF URL (`https://unitil.com/sites/default/files/2021-08/MALFORM-MA.pdf`), the life-support page URL (`https://unitil.com/outages-emergencies/life-support-customers`), fax 603-227-4784, the mail address "Unitil, c/o Customer Services – Life Support, 5 McGuire Street, Concord, NH 03301", the clinician list (physician, physician assistant, nurse practitioner, or local board of health) sending from the office within seven days, and the page's advice to keep a backup source of electricity.
2.6 WHEN the record is a Unitil record, THE card SHALL label the 3 / 6 / 12 month box "Clinician's anticipated length of the condition — not a protection period" and SHALL NOT display "protected for 12 months" or any equivalent.
2.6a WHEN the record is Unitil life-support identification, THE card SHALL display its renewal as "Outage-list renewal: No interval stated in the opened sources", and SHALL display, separately labelled and not as this record's renewal, "Separate shutoff-protection certificate (220 CMR 25.03): serious illness renewed quarterly; chronic every six months" citing `https://www.law.cornell.edu/regulations/massachusetts/220-CMR-25-03`.
2.6b THE system SHALL NOT state or imply that the Unitil outage-list enrollment expires, lapses or renews on the 220 CMR 25.03 schedule or on the 3 / 6 / 12 box. The 220 CMR 25.03 renewal is the renewal of the Unitil account-protection record only (5.3a).
2.7 WHEN the record is Unitil life-support identification, THE card SHALL leave the 3 / 6 / 12 choice to the clinician step and SHALL NOT pre-select it.
2.8 WHEN the record is National Grid Outage Life Support, THE card SHALL display the live-form URL (`https://www.nationalgridus.com/Form/MA-Electric-Outage-Life-Support-Form`), the purpose sentence (phone notification for an extended planned or unplanned outage), the sentence that participation does not protect the account from termination for non-payment, the sentence that it does not sign the account up for higher restoration priority, and renewal "No interval stated".
2.9 THE card SHALL display each item in the record's UNVERIFIED list with the label "UNVERIFIED".
2.10 THE card SHALL list the record's steps in order, each with its owner. A clinician-signed step's owner SHALL be the signer text on that record; the confirming step's owner SHALL be the company.
2.10a EVERY step SHALL be exactly one step kind (Glossary): field step, send step or utility-wait step. A field step SHALL have at least one required field. A record SHALL have exactly one send step and exactly one utility-wait step, the utility-wait step last.
2.10b A field step SHALL be done only when every required field in it is answered: a chosen option, including "No", is answered; a blank is not; a required consent checkbox is answered only when true.
2.10c A send step SHALL be done only by an explicit send attestation; filling household fields SHALL NOT complete a clinician's step or a send step.
2.10d THE utility-wait step SHALL never be done in this app; it SHALL show "Waiting for {company} to confirm" with the company as owner.

Demo check: Fitchburg shows the Concord address, fax 603-227-4784, the 3/6/12 box labelled as the clinician's anticipated length of the condition, "Outage-list renewal: No interval stated in the opened sources", and the separately labelled 220 CMR 25.03 shutoff-protection certificate line. With every household field filled, the clinician's send step is the first unfinished step. Lawrence shows the National Grid live-form URL and "No interval stated".

### Requirement 3 — Company change clears answers (M3)

**User Story:** As Dana, when James asks about his sister in another town, I want every answer from the old company gone, so that a Unitil form cannot follow us into a National Grid town.

#### Acceptance Criteria

3.1 WHEN the user selects a town different from the current town, THE system SHALL clear the company pick, the selected program, every answer, every attestation, the tracker state and the typed backup county.
3.2 WHEN the user selects a town different from the current town, THE system SHALL NOT change the household language.
3.3 WHEN the user selects the town that is already selected, THE system SHALL leave the state unchanged.
3.4 WHEN the user picks a different company in a mixed town, THE system SHALL clear the selected program, every answer, every attestation and the tracker state.
3.5 WHEN the new town resolves to the same company as the previous town, THE system SHALL offer the same program records and SHALL still clear every field named in 3.1, including the street address.
3.6 THE system SHALL NOT render an answer, return channel, renewal line or quote belonging to a company other than the currently resolved company.

Demo check (headline property test): Fitchburg → Leominster. No Unitil fax, no Concord address, no 3/6/12 control, and no "life-support equipment: yes" remain. Lawrence → Worcester (both National Grid) keeps the National Grid card and clears the street address.

### Requirement 4 — Print the handoff (M4)

**User Story:** As Dana, I want to print one page for the clinician or the mailbox, so that whoever holds it knows the program, the step still open, who owns it, the renewal rule and the source.

#### Acceptance Criteria

4.1 WHEN a program card is open and the user chooses "Print handoff", THE system SHALL print one US Letter page containing: town, company code, program name, purpose, the first unfinished step and its owner, every step with its owner, renewal text, return channel(s) and source URL(s).
4.1a WHEN the record is Unitil life-support identification, THE handoff SHALL print the two separately labelled lines of 2.6a and the 3 / 6 / 12 label of 2.6, and SHALL NOT print the 220 CMR 25.03 line as the outage-list renewal.
4.2 WHERE Requirement 7 is built, THE handoff SHALL also show the tracker word; WHERE Requirement 8 is built and the person set a language, THE handoff SHALL show it (8.7).
4.2a WHILE only the MVP tier is enabled, THE handoff SHALL show the next unfinished step and its owner and SHALL NOT show the words Prepared, Submitted or Confirmed. Printing SHALL NOT depend on Requirement 7.
4.3 THE handoff SHALL use only the selected record's fields and the current answers.
4.4 THE owner of each step SHALL be the owner stored on that step of the record; a clinician step's owner SHALL be that record's signer text; the confirming step's owner SHALL be the company.
4.5 THE handoff SHALL NOT state or imply that the utility has confirmed enrollment.
4.6 THE handoff SHALL include a limit or no-guarantee sentence only if that sentence is stored on the selected record. THE system SHALL NOT add a generic "not a guarantee of power" line.
4.7 IF the town is blocked, not found, or a mixed town with no company picked, THEN THE system SHALL NOT offer "Print handoff".
4.8 THE handoff SHALL label the household "synthetic demo household" when the demo fixture is in use.

Demo check: the printed Fitchburg page names Unitil, the MALFORM-MA PDF URL, the clinician signer text, fax 603-227-4784, "Outage-list renewal: No interval stated in the opened sources", the separately labelled 220 CMR 25.03 shutoff-protection certificate line, the clinician's send step as the next unfinished step with the signer text as owner, and "Waiting for Unitil to confirm" (owner Unitil) still open. Its only advisory line is the Unitil page's own advice to keep a backup source of electricity (a labelled paraphrase from `https://unitil.com/outages-emergencies/life-support-customers`, 2.5); it prints no generic "not a guarantee of power" sentence (4.6, ban 15). It shows no tracker word and does not say confirmed.

### Requirement 13 — Source integrity and refusals (cross-cutting, MVP)

**User Story:** As a judge or a coordinator, I want every rule on screen to come from a page that was opened, so that nothing on the handoff is invented.

#### Acceptance Criteria

13.1 EVERY program record SHALL carry at least one source with an `https://` URL and `openedAt` "2026-10-24" (the day that artifact was opened), and every rule string SHALL carry the `sourceId` it came from.
13.1a EVERY kit SHALL carry its own snapshot date `savedAt` "2026-10-18", stored separately from any `openedAt`.
13.1b A source that was not opened SHALL have no `openedAt` and SHALL be shown UNVERIFIED. THE system SHALL NOT default `openedAt` to the build date or today's date.
13.2 EVERY verbatim quote SHALL be stored once, on the record whose source contains it, and rendered unedited (including Eversource's repeated phrase "or a chronic serious illness").
13.3 EVERY number shown SHALL come from a committed kit or a program record, or be computed only from those.
13.4 A missing value SHALL render "not reported"; a real zero SHALL render as zero; THE system SHALL NOT turn a blank into 0. "Not Available" in a kit SHALL stay distinct from blank and from zero.
13.5 THE system SHALL NOT submit anything to a utility, call a live API at runtime, use real household data, give medical advice, or decide eligibility.
13.6 THE system SHALL NOT state that any program grants higher or faster restoration priority, and SHALL NOT turn M.G.L. c.164 §124A's "fail to restore" into a restoration promise.
13.7 THE same state and the same kits SHALL produce the same view model.
13.8 THE kits SHALL be committed verbatim and SHALL NOT be edited by the build. All five stay committed in every tier.
13.9 THE system SHALL parse and validate only the kits of enabled tiers: `utilities` in the MVP; `ej` from tier 1; `hospitals`, `cms-hospitals` and `fema` from tier 2.
13.10 IF the `utilities` kit fails validation, THEN THE system SHALL show a full-page error naming the file and the failed check.
13.11 IF a stretch kit is disabled or fails validation, THEN THE system SHALL turn off only the feature that uses it, with a text notice naming the file, and SHALL NOT block town lookup, the program card, a town change or printing (Fitchburg → Leominster → print).

### Requirement 14 — Accessibility baseline (MVP)

**User Story:** As a coordinator using a keyboard or zoom, I want the page to work without a mouse, so that the tool is usable on any office machine.

#### Acceptance Criteria

MVP: 14.1a, 14.2, 14.4. Tier 1: 14.1, 14.3, 14.5. The MVP gate does not fail on a tier-1 criterion.

14.1 (tier 1) THE app SHALL be operable by keyboard alone, in visual order, with a visible focus indicator on every control (full keyboard-order pass).
14.1a (MVP) THE demo path (type town, Enter, pick company, fill the card, Print handoff) SHALL be operable by keyboard with a visible focus indicator.
14.2 (MVP) EVERY control SHALL have a visible label.
14.3 (tier 1) THE app SHALL remain usable at 200% zoom and at 375 CSS px width without horizontal scrolling.
14.4 (MVP) Status (blocked, not found, prepared, submitted) SHALL be conveyed by text, not colour alone.
14.5 (tier 1) THE app SHALL respect `prefers-reduced-motion`.

---

## Tier 1 (6:30–7:00 PM, only after MVP tests pass)

### Requirement 5 — Two programs per company, never merged (S1)

**User Story:** As Dana, on a National Grid, Eversource or Unitil town I want to choose outage notification or shutoff protection, so that I fill the program the household actually needs and never a blend of both.

#### Acceptance Criteria

5.1 WHEN the resolved company is `National Grid (Massachusetts Electric)`, THE system SHALL offer exactly two records — "Outage Life Support" (`outage-notify`) and "Medical Protection" (`shutoff-protection`) — and SHALL require a choice.
5.2 WHEN the resolved company is `Eversource Energy (NSTAR Electric)`, THE system SHALL offer exactly two records — "Life Support Equipment Certification" (Bedford copy, `outage-notify`) and "Medical Certification of Illness" (`shutoff-protection`) — and SHALL require a choice.
5.3 WHEN the resolved company is `Unitil (Fitchburg Gas & Electric)`, THE system SHALL offer the two uses of the one MALFORM-MA PDF — life-support identification (`outage-notify`) and account protection (`shutoff-protection`) — as two records and SHALL require a choice.
5.3a WHEN Unitil account protection is open, THE card and handoff SHALL show its renewal as the 220 CMR 25.03 line (serious-illness certificate renewed quarterly; chronic certificate every six months), with the 3 / 6 / 12 box labelled as in 2.6 beside it and not collapsed into it.
5.4 WHEN the user switches from one record to another, THE system SHALL clear the previous record's answers, attestations and tracker state.
5.5 WHILE an `outage-notify` record is open, THE system SHALL NOT display or imply that the account is protected from shutoff.
5.6 WHILE a `shutoff-protection` record is open, THE system SHALL NOT display or imply that the household is on an outage notification list.
5.7 WHEN National Grid Medical Protection is open, THE card SHALL show the source URL `https://www.nationalgrid.com/us/ma/electric/home/billing-payments/bill-help/special-protections`; 90 days (serious illness) and 180 days (chronic illness); the financial-hardship condition; the signer (registered physician, physician assistant, nurse practitioner, or local board of health, on letterhead with that office's address and phone); that the document states the patient's name and address and whether the illness is serious or chronic; that a financial-hardship statement is also required if the account is not on a discount rate; return by the online Customer Protections Form, fax 1-866-460-8549, or mail "National Grid, Attention: Protections, D1, 300 Erie Blvd W, Syracuse, NY 13202"; and the page's email as "masked on the opened page — UNVERIFIED", never guessed.
5.8 WHEN the Eversource letter is open, THE card SHALL show the source URL `https://bedfordma.gov/DocumentCenter/View/5556/EMA-Life-Support-Equipment-Certification-5-2023`, signer "a medical doctor, on letterhead", annual certification, mail to "Eversource, 247 Station Drive SW200, Westwood, MA 02090", the letter's required contents (electric life-sustaining equipment in use, its type, the patient's name and address, a primary and an alternate phone), its verbatim sentences that certification does not prioritize restoration and has no impact on medical protection already applied, and the label "Bedford copy, May 2023 filename — currency UNVERIFIED". It SHALL NOT say shutoff protection was granted.
5.9 WHEN Eversource Medical Certification of Illness is open, THE card SHALL show the source URL `https://www.eversource.com/docs/default-source/spanish/medical-certification-of-illness-form-egma-span.pdf?sfvrsn=46e9f0a5_1`; 90 days (serious illness) and 180 days (serious chronic illness); the financial-hardship condition; return by fax 413-746-6495 or eversource.com/upload; the form's certifiers (registered physician, board-of-health official, APRN, PA) and, separately, the certifiers named in M.G.L. c.164 §124A (registered physician or local board of health) citing `https://malegislature.gov/Laws/GeneralLaws/PartI/TitleXXII/Chapter164/Section124a`. It SHALL NOT show the Westwood address, fax 781-441-3686, or form code MN0324 as verified.
5.10 WHEN Unitil account protection is open, THE card SHALL show the footnote that low-income verification, if applicable, is also required, and SHALL keep the account-protection step unfinished until that verification is recorded.
5.10a THE low-income verification item SHALL start as "Applicability not determined", shown as unfinished in text. It SHALL be answered only by recording one of two outcomes: "Verification supplied" or "Utility confirmed not applicable".
5.10b THE system SHALL NOT decide whether low-income verification applies, and SHALL NOT infer either outcome from any other answer or kit value.
5.10c THE low-income verification item SHALL exist only on the Unitil account-protection record and SHALL NEVER gate, appear on, or block Unitil life-support identification.
5.11 THE intent-to-file note on Unitil's page SHALL be displayed, if at all, as a separate unchecked item labelled "not the physician certificate".

Demo check: Leominster → choosing Medical Protection removes "No interval stated" and shows 90/180, Syracuse and hardship. Chelsea → the letter shows Westwood and annual; the illness certificate removes Westwood and shows 90/180 and fax 413-746-6495.

### Requirement 6 — Quoted CPAP limit (S2)

**User Story:** As Dana, when a family names a sleep-apnea machine on National Grid's outage form, I want National Grid's own sentence and its pointer, so that I neither promise enrollment nor stamp a rejection.

#### Acceptance Criteria

6.1 WHEN National Grid Outage Life Support is open AND the selected device is CPAP, BiPAP, APAP or VPAP AND the entered age is greater than 6 months, THE system SHALL display the live form's sentence beginning "The Following are generally not considered life-sustaining" verbatim, cite the live-form URL, and point to the Medical Protection application.
6.2 IF the age is blank, THEN THE system SHALL NOT display that sentence and SHALL ask for the age.
6.3 IF the age is 6 months or under, THEN THE system SHALL NOT display that sentence and SHALL NOT state any rule for that age.
6.4 THE system SHALL NOT record a rejection, denial or eligibility decision for any device.
6.5 THE system SHALL NOT display that sentence on any other record, and SHALL NOT cite the National Grid paper notice for it.
6.6 THE Medical Protection pointer SHALL be a link only; THE system SHALL NOT invent that application's fields.

### Requirement 7 — Tracker: prepared, submitted, confirmed (S3)

**User Story:** As Dana, I want to see whether the packet is prepared, sent, or confirmed as three different things, so that a finished checklist is never mistaken for enrollment.

#### Acceptance Criteria

7.1 THE system SHALL display three distinct labels: Prepared, Submitted, Confirmed.
7.2 WHEN every coordinator-recordable item on the open record is filled, THE system SHALL show Prepared.
7.2a "Filled" SHALL follow 2.10b: every field step done. Prepared SHALL NOT complete the send step or the utility-wait step.
7.3 WHEN Prepared is shown AND the person ticks the record's send attestation ("I sent this" or the record's own sender wording), THE system SHALL show Submitted.
7.3a WHEN the record's send step is done by the clinician's office (Unitil: "The clinician's office says it faxed or mailed this"), THE tracker word SHALL read "Submitted (per the clinician's office)".
7.4 THE system SHALL NOT provide any control, action or state transition that sets Confirmed; the Confirmed label SHALL always read "Only {company} can confirm".
7.5 Completing every checklist item SHALL NOT set Submitted or Confirmed.
7.6 IF an answer is cleared after Submitted, THEN THE system SHALL drop back to the state the remaining answers support.
7.6a WHEN any packet answer on the open record changes to a different value after the send attestation is recorded, THE system SHALL clear the send attestation, so Submitted requires a new attestation. Setting an answer to the value it already has SHALL change nothing.
7.7 IF the town is blocked, not found, or a mixed town with no company picked, THEN no tracker SHALL be shown or settable.

### Requirement 8 — Manual language and the EJ limited-English sort (S4)

**User Story:** As Dana, I want to set the household language myself and see which towns have higher limited-English shares, so that the tool helps me plan language support without guessing a family's language.

#### Acceptance Criteria

8.1 THE household-language control SHALL start at "Not chosen".
8.2 WHEN the user changes the language, THE system SHALL change only the language field.
8.3 THE system SHALL NOT set or change the language from a town, a name, an EJ value or any other field.
8.4 WHEN the town list is shown, THE system SHALL be able to sort towns by the unweighted mean of `limited_english_hh_pct` over `ej` kit rows where `ej` = "Yes" and normalized `municipality` equals the town, descending, and SHALL show `n` (the number of those rows) beside every mean.
8.5 THE mean SHALL be labelled "unweighted mean across EJ block groups — not a town-wide rate".
8.6 IF a town has no EJ = "Yes" rows, THEN THE system SHALL show "No EJ block groups" and sort it after every town with a mean. A town whose rows average 0 (Wellesley, 0.00%, n=2) SHALL show 0.00% with its n.
8.7 THE printed handoff SHALL show the language only if the person set it, labelled "set by coordinator".

Demo check: Lawrence 28.88% (n=56), Chelsea 26.20% (n=36), Holyoke 20.54% (n=29), Wellesley 0.00% (n=2). Changing language does not change a mean; changing town does not change the language.

### Requirement 9 — Wellesley's own expiry, never on another company (S5)

**User Story:** As Dana, I want Wellesley's calendar-year rule only on Wellesley's form, so that I never tell a Holyoke or National Grid family their registration ends in December.

#### Acceptance Criteria

9.1 WHEN the resolved company is `Wellesley Municipal Light Plant`, THE system SHALL open the Critical Health Need for Electricity record (`outage-notify`, source `https://www.wellesleyma.gov/FormCenter/Municipal-Light-Plant-5/Critical-Health-Need-for-Electricity-118`) with renewal "the rest of this calendar year, or until the need ends, whichever is first; renew with the same form".
9.2 THE Wellesley card SHALL show that the list is for notice of a planned interruption so the customer can arrange backup power, that physician verification may be requested (not required), that the classification does not exempt the customer from disconnection for an unpaid bill, and that no utility can guarantee electricity 24 hours a day.
9.3 THE Wellesley card SHALL show return by the online form or by mail / in person to WMLP, 4 Municipal Way, Wellesley, MA 02481, phone 781-235-7600.
9.4 THE system SHALL NOT display Wellesley's expiry, or any calendar-year rule, on any other record, on Holyoke, or on any blocked company.
9.5 IF a record's artifact states no interval, THEN THE system SHALL keep "No interval stated" and SHALL NOT inherit an interval from any other record or town.

---

## Tier 2 (only if tier 1 is green; stop at 7:20 PM)

### Requirement 10 — Same-town facilities to verify (T1)

**User Story:** As Dana, I want to see which hospitals share the town's name, and an honest empty list when there are none, so that I can phone and verify a backup plan without being told a place is safe.

#### Acceptance Criteria

10.1 THE system SHALL list `cms-hospitals` rows whose normalized `city` equals the normalized town, and separately `hospitals` rows whose normalized `municipality` equals the normalized town, each list labelled by its source file and "Same town — verify by phone. Not ranked by distance."
10.2 THE system SHALL NOT sort by distance or label any row nearest, safe, accepting, available, or a source of backup power.
10.3 IF a list has no rows, THEN THE system SHALL show "No rows in this file for {town}" and SHALL NOT substitute a nearby facility.
10.4 IF both lists are empty, THEN THE system SHALL offer a typed backup-contact field.
10.5 A bed count of 0 SHALL display as 0 with the note "0 in the file is not proof the unit is closed"; a blank SHALL display "not reported".
10.6 THE panel SHALL derive from the town only, never from the program, and SHALL clear with the town (3.1).

Demo check: Lawrence shows CMS 220010 Merrimack Health Lawrence Hospital (Acute, emergency Yes, 2 stars) and an empty hospitals-file list. Chelsea and Wellesley are empty in both and show the typed field. Holyoke shows Holyoke Medical Center in both files.

### Requirement 11 — Historical FEMA line (T2)

**User Story:** As Dana, I want the last saved disaster declaration for the county, marked as history, so that I can mention storm context without forecasting.

#### Acceptance Criteria

11.1 THE system SHALL show a FEMA line only when a county is known: either every same-town facility row names the same county, or the user typed a county.
11.2 THE system SHALL label the county's origin as "from facility row" or "typed by coordinator".
11.3 THE system SHALL match a FEMA row to a county only when its `designatedArea` matches `^(.+?)\s*\(County\)` and the captured name equals the county; a tribal, statewide or other designation SHALL NOT match.
11.4 THE line SHALL show the latest matching row by `declarationDate`, with its date, incident type and title, labelled "Historical declaration — not a forecast".
11.5 IF no county is known, THEN THE system SHALL show no FEMA line and SHALL NOT infer a county.

Demo check: Lawrence → Hurricane Lee, 2023-09-15, Essex, from the CMS row. Chelsea → blank until a county is typed. The 2026-06-30 Mashpee Wampanoag Tribe row never attaches.

### Requirement 12 — National Grid paper notice stays separate (T3)

**User Story:** As Dana, I want the National Grid paper notice as its own record, so that its equipment boxes and the live form's rules never mix.

#### Acceptance Criteria

12.1 WHEN shown, THE paper notice SHALL be a separate record: source `https://www.nationalgridus.com/media/pdfs/storms-outages/ma-notice-of-life-sustaining-equipment.pdf`, form code shown as printed "CM10226 (10/24)" (not as a revision date), purpose UNVERIFIED, signer the customer, renewal "No interval stated", return by email box.OutageLifeSupport@nationalgrid.com or mail PO Box 960, Northboro, MA 01532-0960.
12.2 THE system SHALL NOT union its equipment boxes with the live form's, SHALL NOT show the CPAP sentence on it, and SHALL NOT attach Wellesley's expiry to it.
12.3 THE paper notice SHALL NOT count as one of National Grid's two programs in 5.1.

### Requirement 15 — Optional read-only MCP server (tier 2, 25-minute timebox)

**User Story:** As the builder, I want the kit CSVs exposed to Kiro through narrow read-only tools, so that the agent uses the same normalization as the app.

#### Acceptance Criteria

15.1 IF built, THE server SHALL be configured in `.kiro/settings/mcp.json` and expose only read-only tools over the committed kits, using the same normalization as the app.
15.2 IF it is not connected within its 25-minute timebox, THEN the config SHALL be removed and the write-up SHALL say "MCP: not used".
15.3 Requirement 15 is not in the feature spec (`lifeline-features.md`). It stays optional, capped at 25 minutes, and stops at the 7:20 PM freeze whether or not it is connected; it never blocks the demo.

---

## Non-goals

- No Holyoke form, and no program for any company whose form was not opened.
- No submission to any utility, no login, no backend, no database, no live API call at runtime, no telemetry.
- No language inference.
- No distance ranking, "nearest safe hospital", or backup-power promise.
- No weather forecast.
- No merging of National Grid's paper equipment list with the live form.
- No restoration-priority claim on any program.
- No real household data; the demo household is synthetic.

## UNVERIFIED (shown as such, never filled in)

- Holyoke Gas & Electric's form (none opened; Holyoke stays blocked).
- The National Grid protections email (masked on the opened page).
- National Grid Medical Protection application fields (not transcribed).
- National Grid paper notice purpose.
- Whether Eversource still uses the Bedford "5-2023" letter.
- Eversource illness form code MN0324 (seen only in a search index); fax 781-441-3686 (from a copy not downloaded).
- Whether Unitil has a medical PDF newer than the 2021-08 file.
- What Unitil does when the 12-month box is checked and the six-month chronic renewal has passed.
- Whether MyUnitil forms are still unavailable at demo time.
- Revision dates of the National Grid live form and the Eversource illness PDF (none shown).

## Reconciliation notes

Changes from the hand draft, each traced to a source:

- 1.6: a loaded company whose records belong to a later tier (Eversource, Wellesley in the MVP) shows the blocked "no form loaded in this build" state until its tier ships, per the build plan's MVP scope.
- 1.9: company line from `utility_code` only. The kit's Westfield row is mixed: `utility_code` names Westfield Gas and Electric Light Department and Eversource, while `utility` reads "Municipal, Massachusetts Electric d/b/a National Grid"; the two columns disagree, and the pick is between Westfield G&E (blocked) and Eversource (blocked until tier 1).
- Lynnfield added to the 1.x demo check: its `utility_code` names two municipal companies, both unloaded.
- 2.5, 2.6, 5.7–5.9, 9.1, 12.1: source URLs, signer and required-contents text added from `FINAL-idea.md` so each card criterion is testable.
- 4.2: tracker word and language on the handoff are gated on Requirements 7 and 8, so the MVP handoff does not depend on tier 1.
- 13.1, 13.4, 13.8: `sourceId` per rule string, "Not Available" kept distinct, kits never edited (from steering `tech.md`).
- Kevin's draft R3.3 ("no 0.00 for a town with no rows") is kept only for towns with no rows; Wellesley's real 0.00% (n=2) shows (8.6). Kevin's universal "not a guarantee of power" handoff line is dropped (4.6, ban 15). Kevin's early backup panel is tier 2 and Unitil is MVP, per the build plan.
- `lifeline-sources.md` §2.1 lists the 8 Eversource + National Grid mixed towns incorrectly (it names Chester, Chicopee and others that pair a municipal company with an IOU). The kit's 8 are Bellingham, Cheshire, Erving, Hancock, Lenox, Pembroke, Scituate, Westport. The spec relies on the kit, not that list.

## Revision 1 — Jim's review (`research/review-spec-jim.md`, 24 Oct 2026)

Numbering kept; new text is added as lettered sub-criteria.

- Unitil renewal split (Jim 1): 2.6 relabelled; 2.6a, 2.6b, 4.1a, 5.3a added. Source: `FINAL-idea.md` Fallback hardening says 220 CMR 25.03 is the shutoff rule, not an outage-call-list rule; `lifeline-sources.md` §3.2 says the same. The Unitil page and PDF state no outage-list interval.
- MVP print without the tracker (Jim 2): 4.2a; Fitchburg print demo check updated.
- Unitil low-income verification (Jim 3): 5.10a–5.10c. Source: the MALFORM-MA footnote ("low-income verification, if applicable, is also required"). "Utility confirmed not applicable" is a recorded outcome, not an app decision.
- Mixed towns (Jim checks-passed + this revision): Glossary, 1.4a, 1.4b, Chicopee demo check. 18 rows = 8 + 9 + 1, re-read from the kit.
- `openedAt` / `savedAt` (Jim 4): Glossary, 13.1, 13.1a, 13.1b.
- Step completion contract (Jim 5, blocking): Glossary "Step kinds" and "Household fields", 2.10a–2.10d, 7.2a.
- Edit after send (Jim 6): 7.6a.
- Tier-gated kit loading (Jim 8): 13.8 (all five stay committed), 13.9–13.11.
- P5 scope (Jim 7) is a design property change; no requirement text changed.

## Revision 2 — Dwight's review (`research/review-spec-dwight.md`) and god's decision

- MVP gate moves to 6:30 PM (Aarav approved): tier table and tier-1 heading now read MVP 4:30–6:30, tier 1 6:30–7:00, tier 2 7:00–7:20 only if tier 1 is green, freeze 7:20.
- Requirement 14 split: MVP keeps 14.1a (demo path by keyboard with visible focus), 14.2, 14.4; tier 1 takes 14.1 (full keyboard-order pass), 14.3 (375 px, 200% zoom), 14.5 (reduced motion).
- 1.2a: the MVP town input is a typed field matched on Enter; list / search / sort polish is tier 1.
- 15.3: MCP is not in the feature spec; optional, 25-minute cap, stops at 7:20.

