// Shared types for LifeLine Power. Owned by the main agent; sub-agents import, never edit.
// Source of truth: .kiro/specs/lifeline/design.md §2–§5.

// ---------- Tiers and kits ----------

export type Tier = "mvp" | "tier1" | "tier2"
export type KitName = "utilities" | "ej" | "hospitals" | "cms-hospitals" | "fema"

export interface KitSource {
  name: KitName
  path: `public/data/${string}/data.csv`
  savedAt: "2026-10-18" // kit snapshot date; never an openedAt
  tier: Tier // tier that first parses it
  text: string // raw CSV text (?raw import); not parsed until loadKits
}

export interface UtilityRow {
  town: string // display value as in the kit (uppercase)
  key: string // norm(town)
  utilityCode: string // raw utility_code cell
  utility: string // raw utility cell (category label only; never a key)
}

export interface EjRow {
  municipality: string // display value as in the kit
  key: string // norm(municipality)
  limitedEnglishHhPct: number | null // blank -> null, never 0
  ej: string | null // "Yes" / other / null
}

export type KitCheckFailure = { ok: false; file: string; check: string }
export type KitDisabled = { ok: false; reason: "tier-disabled" }

export interface LoadedKits {
  fatal?: { file: string; check: string } // utilities failed → full-page error
  utilities: UtilityRow[] // empty when fatal
  /** Stretch kits: parsed only when their tier is enabled (later tasks fill the ok:true shapes). */
  ej: KitDisabled | KitCheckFailure | { ok: true; rows: EjRow[] }
  hospitals: KitDisabled | KitCheckFailure | { ok: true; rows: unknown[] }
  "cms-hospitals": KitDisabled | KitCheckFailure | { ok: true; rows: unknown[] }
  fema: KitDisabled | KitCheckFailure | { ok: true; rows: unknown[] }
}

// ---------- Program records ----------

export type Purpose = "outage-notify" | "shutoff-protection" | "UNVERIFIED"
export type OwnerRole = "coordinator" | "clinician" | "utility"
export type RecordId =
  | "unitil-lifesupport"
  | "unitil-protection"
  | "ng-outage"
  | "ng-medical"
  | "ng-paper"
  | "ev-letter"
  | "ev-illness"
  | "wmlp-chn"

export interface Source {
  id: string
  title: string
  url: `https://${string}`
  openedAt: "2026-10-24" // literal; never computed from a clock
  note?: string
}

/** One string from one source. Never composed from two. */
export interface Sourced {
  text: string
  sourceId: string // must resolve to a Source on the same record
  verbatim: boolean // true only for text copied from FINAL-idea.md's verbatim section
}

export type FieldKind = "text" | "yes-no" | "select" | "consent" | "device" | "age-months"

export interface Field {
  key: `${RecordId}.${string}`
  label: string
  kind: FieldKind
  options?: string[]
  unansweredText?: string
  required: boolean
  requiredWhen?: { key: string; notEquals: string }
  note?: Sourced
}

export type Step =
  | { kind: "field"; id: string; label: string; owner: OwnerRole; ownerText: string; fields: [string, ...string[]] }
  | { kind: "send"; id: string; label: string; owner: OwnerRole; ownerText: string }
  | { kind: "utility-wait"; id: string; label: `Waiting for ${string} to confirm`; owner: "utility"; ownerText: string }

export type RenewalKind =
  | "none-stated"
  | "days-90-180"
  | "annual"
  | "calendar-year-or-need"
  | "regulation-quarterly-semiannual"

export interface ProgramRecord {
  id: RecordId
  tier: Tier
  companyCode: string // exact utilities-kit utility_code
  companyNameOnPage: string
  programName: string
  purpose: Purpose
  signer: Sourced
  signerAlso?: Sourced
  renewalLabel: string
  renewal: Sourced & { kind: RenewalKind; scope?: "in the opened sources" }
  regulationContext?: Sourced & { label: "Separate shutoff-protection certificate (220 CMR 25.03)" }
  formBoxNote?: Sourced
  returnChannels: (Sourced & { kind: "fax" | "mail" | "web" | "email" | "phone"; unverified?: true })[]
  quotes: Sourced[] // verbatim === true only
  limits: Sourced[]
  contents?: Sourced[] // what the clinician's letter must state (ng-medical only)
  noGuarantee?: Sourced
  cpapSentence?: Sourced // ng-outage only; rendered only in tier 1 (Req 6)
  unverified: string[]
  fields: Field[]
  steps: Step[] // field steps, then exactly one send step, then exactly one utility-wait step (last)
  sendAttestation: string
  claims: { outageNotification: boolean; shutoffProtection: boolean; restorationPriority: false }
  sources: Source[]
}

export const NO_INTERVAL = "No interval stated" as const

// ---------- State ----------

export type Language = "not-chosen" | "English" | "Spanish" | "Other"
export type AnswerValue = string | boolean | number | null

export interface State {
  townKey: string | null
  townQuery: string
  notFound: boolean
  companyCode: string | null
  programId: RecordId | null
  answers: Record<string, AnswerValue>
  attestedSent: boolean
  language: Language
  languageOther: string
  backup: { typedCounty: string; typedContact: string }
}
// No `confirmed`, `status` or `rejected` field: Confirmed is not representable.

export type Action =
  | { type: "SELECT_TOWN"; key: string }
  | { type: "SUBMIT_UNMATCHED"; query: string }
  | { type: "PICK_COMPANY"; code: string }
  | { type: "PICK_PROGRAM"; id: RecordId }
  | { type: "SET_ANSWER"; key: string; value: AnswerValue }
  | { type: "SET_ATTESTED"; value: boolean }
  | { type: "SET_LANGUAGE"; value: Language }
  | { type: "SET_LANGUAGE_OTHER"; value: string }
  | { type: "SET_TYPED_COUNTY"; value: string }
  | { type: "SET_BACKUP_CONTACT"; value: string }

export interface Ctx {
  kits: LoadedKits
  enabledTiers: Tier[]
}

// ---------- View model ----------

export type Status = "idle" | "not-found" | "mixed-unpicked" | "blocked" | "program-choice" | "program-open"

export interface StepView {
  owner: OwnerRole
  id: string
  label: string
  kind: Step["kind"]
  ownerText: string
  done: boolean
}

export interface CardView {
  recordId: RecordId
  companyNameOnPage: string
  programName: string
  purposeText: string
  signer: Sourced
  signerAlso?: Sourced
  appText: string[] // every sentence the app writes in its own words
  quotes: Sourced[]
  limits: Sourced[]
  contents?: Sourced[]
  noGuarantee?: Sourced
  renewal: { label: string; text: string; sourceId: string }
  regulationContext?: { label: string; text: string; sourceId: string }
  formBoxNote?: Sourced
  returnChannels: ProgramRecord["returnChannels"]
  sources: Source[]
  unverified: string[]
  fields: Field[]
  answers: Record<string, AnswerValue>
  steps: StepView[]
  firstOpenStep: { label: string; ownerText: string; owner: OwnerRole; index: number; total: number }
  // Tier 1 (absent when tier 1 is disabled)
  sendAttestation?: string // the record's own wording
  attested?: boolean
  canAttest?: boolean // true only when every field step is done (Prepared)
  cpapNotice?: { sentence: Sourced; pointer: Source } // Req 6.1 only
  agePrompt?: "Enter the patient's age in months to check National Grid's sentence" // Req 6.2
}

export type EjView =
  | { kind: "mean"; meanPct: number; n: number; label: "unweighted mean across EJ block groups — not a town-wide rate" }
  | { kind: "none"; label: "No EJ block groups" }

export interface TrackerView {
  state: "not-started" | "prepared" | "submitted"
  word: string // "Not started" / "Prepared" / "Submitted" / "Submitted (per the clinician's office)"
  confirmedLabel: string // always "Only {companyNameOnPage} can confirm"
}

export interface TownListItem {
  key: string
  display: string
  ej?: EjView // tier 1 only, when the ej kit loaded
}

export interface HandoffView {
  town: string
  companyCode: string
  programName: string
  purpose: Purpose
  purposeText: string
  firstOpenStep: { label: string; ownerText: string }
  steps: { label: string; ownerText: string; done: boolean }[]
  renewal: string
  regulationContext?: string
  formBoxNote?: string
  returnChannels: string[]
  sourceUrls: string[]
  limits: string[]
  contents?: string[]
  noGuarantee?: string
  unverified: string[]
  answers: { label: string; value: string }[]
  trackerWord?: string // only when tier 1 is enabled; absent in the MVP
  language?: { value: string; label: "set by coordinator" }
  householdLabel?: "synthetic demo household"
}

export interface ViewModel {
  status: Status
  town?: { display: string; companyCodes: string[]; ej?: EjView }
  notFoundMessage?: "Not in the saved 351-town table"
  blocked?: { companyCode: string; reason: "holyoke-no-form" | "no-form-loaded"; message: string }
  mixed?: { companyCodes: string[]; prompt: "Pick the company printed on the bill" }
  choices?: { id: RecordId; programName: string; purpose: Purpose }[]
  card?: CardView
  tracker?: TrackerView // tier 1, program-open only
  handoff?: HandoffView
  townList?: TownListItem[] // tier 1: all 351 towns for the combobox, file order
  ejNotice?: string // tier 1: "Saved ej file failed check: {check}. EJ sort is off."
  canPrint: boolean
  language: { value: Language; other: string }
  fatal?: { file: string; check: string }
}


