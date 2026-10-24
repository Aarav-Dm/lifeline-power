// LifeLine Power — pure view model. The UI renders only this.
// Source of truth: .kiro/specs/lifeline/design.md §4–§6.

import type {
  Ctx,
  CardView,
  Field,
  HandoffView,
  ProgramRecord,
  State,
  Status,
  Step,
  StepView,
  TownListItem,
  TrackerView,
  ViewModel,
} from "../types"
import { companyCodes, ejStats, townKeys, townRow } from "../lib/kits"
import {
  HOLYOKE_CODE,
  PURPOSE_TEXT,
  isAnswered,
  isRequired,
  recordsFor,
} from "../rules/programs"

const DEMO_ACCOUNT_VALUE = "DEMO — not a real account"

const BLOCKED_HOLYOKE = "No form opened. No checklist."
const BLOCKED_NO_FORM = "No form loaded for this company in this build. No checklist."
const CHANNEL_LABEL = { fax: "Fax", mail: "Mail", web: "Online", email: "Email", phone: "Phone" } as const

// Req 6: the sleep-apnea device family for the National Grid CPAP sentence gate.
const SLEEP_APNEA_DEVICES = ["CPAP", "BiPAP", "APAP", "VPAP"] as const
const UNITIL_LIFESUPPORT_COMPANY = "Unitil (Fitchburg Gas & Electric)"
const AGE_PROMPT =
  "Enter the patient's age in months to check National Grid's sentence" as const

/** Step completion (design §3 / §4): field by isAnswered of every required field;
 *  send by attestedSent; utility-wait never. */
export function stepDone(step: Step, record: ProgramRecord, state: State): boolean {
  switch (step.kind) {
    case "field":
      return step.fields.every((key) => {
        const field = record.fields.find((f) => f.key === key)
        if (field == null) return false
        if (!isRequired(field, state.answers)) return true
        return isAnswered(field, state.answers[field.key])
      })
    case "send":
      return state.attestedSent === true
    case "utility-wait":
      return false
  }
}

function firstOpenStep(record: ProgramRecord, state: State): Step {
  // The utility-wait step is never done, so an open step always exists.
  const open = record.steps.find((s) => !stepDone(s, record, state))
  // Non-null by contract (wait step last, never done); fall back to last defensively.
  return open ?? record.steps[record.steps.length - 1]
}

function stepViews(record: ProgramRecord, state: State): StepView[] {
  return record.steps.map((s) => ({
    id: s.id,
    label: s.label,
    kind: s.kind,
    ownerText: s.ownerText,
    owner: s.owner,
    done: stepDone(s, record, state),
  }))
}

/** Compute the town status purely from state + ctx (no stored status field). */
function computeStatus(
  state: State,
  ctx: Ctx,
): { status: Status; companyCode: string | null; record: ProgramRecord | null } {
  if (state.notFound) return { status: "not-found", companyCode: null, record: null }
  if (state.townKey == null) return { status: "idle", companyCode: null, record: null }

  const row = townRow(ctx.kits, state.townKey)
  if (row == null) return { status: "idle", companyCode: null, record: null }

  const code = state.companyCode
  if (code == null) {
    // mixed town, no pick yet
    return { status: "mixed-unpicked", companyCode: null, record: null }
  }

  const enabled = recordsFor(code, ctx.enabledTiers)
  if (enabled.length === 0) {
    return { status: "blocked", companyCode: code, record: null }
  }

  if (state.programId == null) {
    return { status: "program-choice", companyCode: code, record: null }
  }

  const record = enabled.find((r) => r.id === state.programId) ?? null
  if (record == null) {
    // program id not valid for this company's enabled set — treat as choice
    return { status: "program-choice", companyCode: code, record: null }
  }
  return { status: "program-open", companyCode: code, record }
}

function blockedMessage(code: string): string {
  return code === HOLYOKE_CODE ? BLOCKED_HOLYOKE : BLOCKED_NO_FORM
}

function blockedReason(code: string): "holyoke-no-form" | "no-form-loaded" {
  return code === HOLYOKE_CODE ? "holyoke-no-form" : "no-form-loaded"
}

function renewalText(record: ProgramRecord): string {
  const scope = record.renewal.scope ? " " + record.renewal.scope : ""
  return record.renewal.text + scope
}

function hasDemoAccount(state: State): boolean {
  return Object.values(state.answers).some((v) => v === DEMO_ACCOUNT_VALUE)
}

function tierEnabled(ctx: Ctx, tier: Ctx["enabledTiers"][number]): boolean {
  return ctx.enabledTiers.includes(tier)
}

// ---------------------------------------------------------------------------
// Tracker (tier 1, design §4 / §5 / P15). Derived; never stored.
// ---------------------------------------------------------------------------

/** Every `field` step of the open record is done — the Prepared gate (§4). */
function everyFieldStepDone(record: ProgramRecord, state: State): boolean {
  return record.steps.every((s) => (s.kind === "field" ? stepDone(s, record, state) : true))
}

type TrackerState = TrackerView["state"]

function trackerStateOf(record: ProgramRecord, state: State): TrackerState {
  if (state.attestedSent) return "submitted"
  if (everyFieldStepDone(record, state)) return "prepared"
  return "not-started"
}

/** The submitted word: Unitil clinician-office records read differently (§3 table). */
function submittedWord(record: ProgramRecord): string {
  return record.companyCode === UNITIL_LIFESUPPORT_COMPANY
    ? "Submitted (per the clinician's office)"
    : "Submitted"
}

function trackerWordFor(record: ProgramRecord, ts: TrackerState): string {
  switch (ts) {
    case "not-started":
      return "Not started"
    case "prepared":
      return "Prepared"
    case "submitted":
      return submittedWord(record)
  }
}

function buildTracker(record: ProgramRecord, state: State): TrackerView {
  const ts = trackerStateOf(record, state)
  return {
    state: ts,
    word: trackerWordFor(record, ts),
    confirmedLabel: `Only ${record.companyNameOnPage} can confirm`,
  }
}

// ---------------------------------------------------------------------------
// CPAP notice / age prompt (Req 6, ng-outage only). Design §5 / §6 / P14.
// ---------------------------------------------------------------------------

function fieldOfKind(record: ProgramRecord, kind: Field["kind"]): Field | undefined {
  return record.fields.find((f) => f.kind === kind)
}

function isSleepApneaDevice(value: unknown): boolean {
  return (
    typeof value === "string" &&
    (SLEEP_APNEA_DEVICES as readonly string[]).includes(value)
  )
}

/** CPAP sentence + pointer when the gate is open (device in family AND age > 6 months). */
function cpapNoticeFor(
  record: ProgramRecord,
  state: State,
): { sentence: CardView["cpapNotice"]; agePrompt: boolean } {
  // Only National Grid Outage Life Support carries the sentence (ban 11).
  if (record.id !== "ng-outage" || record.cpapSentence == null) {
    return { sentence: undefined, agePrompt: false }
  }
  const deviceField = fieldOfKind(record, "device")
  const ageField = fieldOfKind(record, "age-months")
  if (deviceField == null || ageField == null) {
    return { sentence: undefined, agePrompt: false }
  }
  const device = state.answers[deviceField.key]
  if (!isSleepApneaDevice(device)) {
    return { sentence: undefined, agePrompt: false }
  }
  const age = state.answers[ageField.key]
  if (typeof age === "number" && Number.isFinite(age)) {
    if (age > 6) {
      const pointer = record.sources.find((s) => s.id === "ng-protect")
      if (pointer) {
        return {
          sentence: { sentence: record.cpapSentence, pointer },
          agePrompt: false,
        }
      }
    }
    // age <= 6 (or no pointer source): neither notice nor prompt.
    return { sentence: undefined, agePrompt: false }
  }
  // Sleep-apnea device with age null/undefined -> prompt for the age.
  return { sentence: undefined, agePrompt: true }
}

/** App-authored sentences only (purpose line, step labels, headings). Never source quotes. */
function buildAppText(record: ProgramRecord, fos: Step): string[] {
  const out: string[] = []
  out.push(PURPOSE_TEXT[record.purpose])
  out.push(record.programName)
  out.push(record.signer.text === "" ? "" : record.signer.text)
  for (const s of record.steps) out.push(s.label)
  out.push(`Next: ${fos.label}`)
  // Renewal label (app-authored) — the renewal *text* itself is a source string and lives in
  // card.renewal, not appText.
  out.push(record.renewalLabel)
  if (record.regulationContext) out.push(record.regulationContext.label)
  // Household field labels are app-authored.
  for (const f of record.fields) out.push(f.label)
  return out.filter((t) => t.length > 0)
}

function buildCard(record: ProgramRecord, state: State, ctx: Ctx): CardView {
  const fos = firstOpenStep(record, state)
  const card: CardView = {
    recordId: record.id,
    companyNameOnPage: record.companyNameOnPage,
    programName: record.programName,
    purposeText: PURPOSE_TEXT[record.purpose],
    signer: record.signer,
    signerAlso: record.signerAlso,
    appText: buildAppText(record, fos),
    quotes: record.quotes,
    limits: record.limits,
    contents: record.contents,
    noGuarantee: record.noGuarantee,
    renewal: { label: record.renewalLabel, text: renewalText(record), sourceId: record.renewal.sourceId },
    regulationContext: record.regulationContext
      ? {
          label: record.regulationContext.label,
          text: record.regulationContext.text,
          sourceId: record.regulationContext.sourceId,
        }
      : undefined,
    formBoxNote: record.formBoxNote,
    returnChannels: record.returnChannels,
    sources: record.sources,
    unverified: record.unverified,
    fields: record.fields,
    answers: state.answers,
    steps: stepViews(record, state),
    firstOpenStep: { label: fos.label, ownerText: fos.ownerText, owner: fos.owner, index: record.steps.indexOf(fos) + 1, total: record.steps.length },
  }

  // Tier 1 additions. With ["mvp"] these stay absent so the MVP output is unchanged.
  if (tierEnabled(ctx, "tier1")) {
    card.sendAttestation = record.sendAttestation
    card.attested = state.attestedSent
    card.canAttest = everyFieldStepDone(record, state)
    const { sentence, agePrompt } = cpapNoticeFor(record, state)
    if (sentence) card.cpapNotice = sentence
    if (agePrompt) card.agePrompt = AGE_PROMPT
  }

  return card
}

function answerLabelValue(record: ProgramRecord, state: State): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = []
  for (const f of record.fields) {
    const v = state.answers[f.key]
    if (v === undefined || v === null || v === "") continue
    out.push({ label: f.label, value: String(v) })
  }
  return out
}

function buildHandoff(
  record: ProgramRecord,
  state: State,
  ctx: Ctx,
  townDisplay: string,
  companyCode: string,
): HandoffView {
  const fos = firstOpenStep(record, state)
  const tier1 = tierEnabled(ctx, "tier1")
  const regLine = record.regulationContext
    ? `${record.regulationContext.label}: ${record.regulationContext.text}`
    : undefined

  const handoff: HandoffView = {
    town: townDisplay,
    companyCode,
    programName: record.programName,
    purpose: record.purpose,
    purposeText: PURPOSE_TEXT[record.purpose],
    firstOpenStep: { label: fos.label, ownerText: fos.ownerText },
    steps: record.steps.map((s) => ({ label: s.label, ownerText: s.ownerText, done: stepDone(s, record, state) })),
    renewal: `${record.renewalLabel}: ${renewalText(record)}`,
    regulationContext: regLine,
    formBoxNote: record.formBoxNote ? record.formBoxNote.text : undefined,
    returnChannels: record.returnChannels.map((c) => `${CHANNEL_LABEL[c.kind]}: ${c.text}`),
    sourceUrls: record.sources.map((s) => s.url),
    limits: record.limits.map((l) => l.text),
    contents: record.contents?.map((c) => c.text),
    noGuarantee: record.noGuarantee ? record.noGuarantee.text : undefined,
    unverified: record.unverified,
    answers: answerLabelValue(record, state),
  }

  if (tier1) {
    // Tracker word only when tier 1 is enabled (keep existing language logic). In the MVP there is none.
    handoff.trackerWord = trackerWordFor(record, trackerStateOf(record, state))
    if (state.language !== "not-chosen") {
      handoff.language = {
        value: state.language === "Other" ? state.languageOther || "Other" : state.language,
        label: "set by coordinator",
      }
    }
  }

  if (hasDemoAccount(state)) handoff.householdLabel = "synthetic demo household"

  return handoff
}

// ---------------------------------------------------------------------------
// Tier-1 town list + EJ (design §5 / §7 / P16, P17). Pure, file order.
// ---------------------------------------------------------------------------

function buildTownList(ctx: Ctx): TownListItem[] {
  const keys = townKeys(ctx.kits)
  return keys.map((key) => {
    const row = townRow(ctx.kits, key)
    const display = row ? row.town : key
    const item: TownListItem = { key, display }
    const ej = ejStats(ctx.kits, key)
    if (ej) item.ej = ej
    return item
  })
}

/** The EJ notice when the saved ej file failed its check (non-fatal). */
function ejNoticeFor(ctx: Ctx): string | undefined {
  const ej = ctx.kits.ej
  // KitCheckFailure has `ok: false` and a `check`; tier-disabled has a `reason` instead.
  if (ej.ok === false && "check" in ej) {
    return `Saved ej file failed check: ${ej.check}. EJ sort is off.`
  }
  return undefined
}

export function derive(state: State, ctx: Ctx): ViewModel {
  // Fatal passthrough: utilities kit failed validation → full-page error, no app.
  if (ctx.kits.fatal) {
    return {
      status: "idle",
      canPrint: false,
      language: { value: state.language, other: state.languageOther },
      fatal: ctx.kits.fatal,
    }
  }

  const { status, companyCode, record } = computeStatus(state, ctx)
  const tier1 = tierEnabled(ctx, "tier1")

  const vm: ViewModel = {
    status,
    canPrint: false,
    language: { value: state.language, other: state.languageOther },
  }

  // Tier-1 combobox list + EJ notice are page-level: present regardless of town status.
  if (tier1) {
    vm.townList = buildTownList(ctx)
    const notice = ejNoticeFor(ctx)
    if (notice) vm.ejNotice = notice
  }

  if (status === "not-found") {
    vm.notFoundMessage = "Not in the saved 351-town table"
    return vm
  }

  if (status === "idle") {
    return vm
  }

  // A town is resolved from here on.
  const row = state.townKey ? townRow(ctx.kits, state.townKey) : undefined
  if (row) {
    vm.town = { display: row.town, companyCodes: companyCodes(row) }
    if (tier1) {
      const ej = ejStats(ctx.kits, row.key)
      if (ej) vm.town.ej = ej
    }
  }

  if (status === "mixed-unpicked") {
    vm.mixed = { companyCodes: row ? companyCodes(row) : [], prompt: "Pick the company printed on the bill" }
    return vm
  }

  if (status === "blocked" && companyCode != null) {
    vm.blocked = {
      companyCode,
      reason: blockedReason(companyCode),
      message: blockedMessage(companyCode),
    }
    return vm
  }

  if (status === "program-choice" && companyCode != null) {
    const enabled = recordsFor(companyCode, ctx.enabledTiers)
    vm.choices = enabled.map((r) => ({ id: r.id, programName: r.programName, purpose: r.purpose }))
    return vm
  }

  if (status === "program-open" && record != null && companyCode != null) {
    const enabled = recordsFor(companyCode, ctx.enabledTiers)
    if (enabled.length > 1) {
      vm.choices = enabled.map((r) => ({ id: r.id, programName: r.programName, purpose: r.purpose }))
    }
    vm.card = buildCard(record, state, ctx)
    vm.handoff = buildHandoff(record, state, ctx, row ? row.town : "", companyCode)
    if (tier1) vm.tracker = buildTracker(record, state)
    vm.canPrint = true
    return vm
  }

  return vm
}
