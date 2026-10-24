import { describe, expect, it } from "vitest"
import fc from "fast-check"

import type { Action, AnswerValue, Ctx, RecordId, State } from "../src/types"
import { loadKits, townKeys, townRow, companyCodes } from "../src/lib/kits"
import { recordsFor, recordById } from "../src/rules/programs"
import { initialState, reduce } from "../src/state/reducer"
import { derive } from "../src/state/derive"
import { DEMO_ANSWERS, demoActions } from "../src/state/demo"

const RUNS = { numRuns: 200 }

const ctx: Ctx = { kits: loadKits(["mvp"]), enabledTiers: ["mvp"] }

const KEYS: string[] = townKeys(ctx.kits)

// Named keys (norm() uppercases). Guard that they exist in the kit before using.
const FITCHBURG = "FITCHBURG"
const LEOMINSTER = "LEOMINSTER"
const LAWRENCE = "LAWRENCE"
const WORCESTER = "WORCESTER"
const HOLYOKE = "HOLYOKE"
const BELLINGHAM = "BELLINGHAM"
const LYNNFIELD = "LYNNFIELD"

const NG_MASS_ELECTRIC = "National Grid (Massachusetts Electric)"
const EVERSOURCE = "Eversource Energy (NSTAR Electric)"

function fold(start: State, actions: Action[]): State {
  return actions.reduce((s, a) => reduce(s, a, ctx), start)
}

function select(key: string): State {
  return reduce(initialState, { type: "SELECT_TOWN", key }, ctx)
}

/** Reach program-open for a single-company town by selecting it. Returns null if not open. */
function openTown(key: string): State | null {
  const s = select(key)
  return derive(s, ctx).status === "program-open" ? s : null
}

/** An arbitrary answers map over a record's real field keys. */
function answersArb(id: RecordId): fc.Arbitrary<Record<string, AnswerValue>> {
  const record = recordById(id)
  const keys = record ? record.fields.map((f) => f.key) : []
  if (keys.length === 0) return fc.constant<Record<string, AnswerValue>>({})
  const valueArb = fc.oneof(
    fc.string(),
    fc.boolean(),
    fc.integer({ min: 0, max: 48 }),
    fc.constant<AnswerValue>(null),
  )
  return fc.dictionary(fc.constantFrom(...keys), valueArb)
}

/** Generate an action for a given reachable record (keys namespaced). */
function actionArb(programId: RecordId | null): fc.Arbitrary<Action> {
  const base: fc.Arbitrary<Action>[] = [
    fc.constantFrom(...KEYS).map((key) => ({ type: "SELECT_TOWN", key }) as Action),
    fc.string().map((query) => ({ type: "SUBMIT_UNMATCHED", query }) as Action),
    fc.constantFrom(NG_MASS_ELECTRIC, EVERSOURCE, "Peabody Municipal Light Plant", "Reading Municipal Light Department").map(
      (code) => ({ type: "PICK_COMPANY", code }) as Action,
    ),
    fc.constantFrom<RecordId>("unitil-lifesupport", "ng-outage", "ng-paper").map(
      (id) => ({ type: "PICK_PROGRAM", id }) as Action,
    ),
    fc.boolean().map((value) => ({ type: "SET_ATTESTED", value }) as Action),
    fc.constantFrom("not-chosen", "English", "Spanish", "Other").map(
      (value) => ({ type: "SET_LANGUAGE", value }) as Action,
    ),
    fc.string().map((value) => ({ type: "SET_LANGUAGE_OTHER", value }) as Action),
  ]
  if (programId) {
    const record = recordById(programId)
    const keys = record ? record.fields.map((f) => f.key) : []
    if (keys.length > 0) {
      base.push(
        fc
          .tuple(
            fc.constantFrom(...keys),
            fc.oneof(fc.string(), fc.boolean(), fc.integer({ min: 0, max: 48 }), fc.constant<AnswerValue>(null)),
          )
          .map(([key, value]) => ({ type: "SET_ANSWER", key, value }) as Action),
      )
    }
  }
  return fc.oneof(...base)
}

/** A sequence of actions threaded through the reducer, re-deriving the valid SET_ANSWER keys. */
function applySequence(start: State, raw: Action[]): State {
  let s = start
  for (const a of raw) {
    // SET_ANSWER is only ever valid for the open record; the reducer rejects others.
    s = reduce(s, a, ctx)
  }
  return s
}

const anyActionArb = fc.array(actionArb("unitil-lifesupport"), { maxLength: 12 })

// ---------------------------------------------------------------------------
// P1 — Company change clears answers.
// ---------------------------------------------------------------------------
describe("P1 company/town change clears answers", () => {
  it("P1 any A != B: after SELECT_TOWN(B) answers empty, attestedSent false, backup empty", () => {
    const distinctPair = fc
      .tuple(fc.constantFrom(...KEYS), fc.constantFrom(...KEYS))
      .filter(([a, b]) => a !== b)
    fc.assert(
      fc.property(distinctPair, ([a, b]) => {
        // Build a state on A carrying answers / attestation / typed county.
        const dirty: State = {
          ...select(a),
          answers: { "unitil-lifesupport.x": "kept", "ng-outage.y": true },
          attestedSent: true,
          backup: { typedCounty: "Essex", typedContact: "someone" },
        }
        const next = reduce(dirty, { type: "SELECT_TOWN", key: b }, ctx)
        expect(next.answers).toEqual({})
        expect(next.attestedSent).toBe(false)
        expect(next.backup).toEqual({ typedCounty: "", typedContact: "" })
      }),
      RUNS,
    )
  })

  it("P1 Fitchburg -> Leominster: derive JSON has no 603-227-4784, Concord, 3/6/12 note, equipment answer", () => {
    if (!KEYS.includes(FITCHBURG) || !KEYS.includes(LEOMINSTER)) return
    // Fill Fitchburg (Unitil) with the demo answers, then switch to Leominster.
    const onFitchburg = fold(initialState, demoActions())
    expect(derive(onFitchburg, ctx).status).toBe("program-open")
    const onLeominster = reduce(onFitchburg, { type: "SELECT_TOWN", key: LEOMINSTER }, ctx)
    const json = JSON.stringify(derive(onLeominster, ctx))
    expect(json).not.toContain("603-227-4784")
    expect(json).not.toContain("Concord")
    expect(json).not.toMatch(/3,?\s*6\s*(or|,)?\s*12/i)
    expect(json).not.toContain("Oxygen concentrator")
    // answers cleared
    expect(onLeominster.answers).toEqual({})
  })
})

// ---------------------------------------------------------------------------
// P2 — Same company keeps records, clears household.
// ---------------------------------------------------------------------------
describe("P2 same company keeps records, clears household", () => {
  it("P2 Lawrence -> Worcester: same record ids offered, answers empty", () => {
    if (!KEYS.includes(LAWRENCE) || !KEYS.includes(WORCESTER)) return
    const onLawrence = select(LAWRENCE)
    const onWorcester = reduce(onLawrence, { type: "SELECT_TOWN", key: WORCESTER }, ctx)

    const lawVm = derive(onLawrence, ctx)
    const worVm = derive(onWorcester, ctx)
    // Both single-company National Grid (Massachusetts Electric) -> ng-outage auto open.
    const idsOf = (s: State): RecordId[] => {
      const code = s.companyCode!
      return recordsFor(code, ctx.enabledTiers).map((r) => r.id)
    }
    expect(onLawrence.companyCode).toBe(NG_MASS_ELECTRIC)
    expect(onWorcester.companyCode).toBe(NG_MASS_ELECTRIC)
    expect(idsOf(onWorcester)).toEqual(idsOf(onLawrence))
    expect(onWorcester.answers).toEqual({})
    // Status is the same for both.
    expect(worVm.status).toBe(lawVm.status)
  })

  it("P2 property: any A != B with one shared company code -> same ids, empty answers", () => {
    const pair = fc
      .tuple(fc.constantFrom(...KEYS), fc.constantFrom(...KEYS))
      .filter(([a, b]) => a !== b)
    fc.assert(
      fc.property(pair, ([a, b]) => {
        const rowA = townRow(ctx.kits, a)!
        const rowB = townRow(ctx.kits, b)!
        const ca = companyCodes(rowA)
        const cb = companyCodes(rowB)
        fc.pre(ca.length === 1 && cb.length === 1 && ca[0] === cb[0])
        const onA: State = { ...select(a), answers: { "ng-outage.account": "x" } }
        const onB = reduce(onA, { type: "SELECT_TOWN", key: b }, ctx)
        expect(onB.answers).toEqual({})
        expect(recordsFor(cb[0], ctx.enabledTiers).map((r) => r.id)).toEqual(
          recordsFor(ca[0], ctx.enabledTiers).map((r) => r.id),
        )
      }),
      RUNS,
    )
  })
})

// ---------------------------------------------------------------------------
// P3 — Reselecting is identity.
// ---------------------------------------------------------------------------
describe("P3 reselecting is identity", () => {
  it("P3 SELECT_TOWN(current) returns same object", () => {
    fc.assert(
      fc.property(fc.constantFrom(...KEYS), (key) => {
        const s = select(key)
        expect(reduce(s, { type: "SELECT_TOWN", key }, ctx)).toBe(s)
      }),
      RUNS,
    )
  })

  it("P3 PICK_COMPANY(current) and PICK_PROGRAM(current) return same object", () => {
    if (!KEYS.includes(BELLINGHAM)) return
    const mixed = select(BELLINGHAM)
    const picked = reduce(mixed, { type: "PICK_COMPANY", code: NG_MASS_ELECTRIC }, ctx)
    expect(reduce(picked, { type: "PICK_COMPANY", code: NG_MASS_ELECTRIC }, ctx)).toBe(picked)
    expect(picked.programId).toBe("ng-outage")
    expect(reduce(picked, { type: "PICK_PROGRAM", id: "ng-outage" }, ctx)).toBe(picked)
  })

  it("P3 SET_LANGUAGE twice equals once", () => {
    fc.assert(
      fc.property(fc.constantFrom("English", "Spanish", "Other") as fc.Arbitrary<State["language"]>, (lang) => {
        const once = reduce(initialState, { type: "SET_LANGUAGE", value: lang }, ctx)
        const twice = reduce(once, { type: "SET_LANGUAGE", value: lang }, ctx)
        expect(twice).toBe(once)
      }),
      RUNS,
    )
  })
})

// ---------------------------------------------------------------------------
// P5 — No card / handoff / print while blocked, not found or unpicked.
// ---------------------------------------------------------------------------
describe("P5 no card or print while blocked / not-found / mixed-unpicked", () => {
  it("P5 generated sequences: blocked/not-found/mixed-unpicked -> no card, handoff, canPrint false", () => {
    fc.assert(
      fc.property(fc.constantFrom(...KEYS), anyActionArb, (startKey, actions) => {
        const start = select(startKey)
        const end = applySequence(start, actions)
        const vm = derive(end, ctx)
        if (vm.status === "blocked" || vm.status === "not-found" || vm.status === "mixed-unpicked") {
          expect(vm.card).toBeUndefined()
          expect(vm.handoff).toBeUndefined()
          expect(vm.canPrint).toBe(false)
          if (vm.status === "blocked" && vm.blocked?.reason === "holyoke-no-form") {
            expect(JSON.stringify(vm)).not.toMatch(/\d{3}-\d{3}-\d{4}/)
          }
        }
      }),
      RUNS,
    )
  })

  it("P5 Holyoke -> SELECT_TOWN(FITCHBURG) is program-open on unitil-lifesupport", () => {
    if (!KEYS.includes(HOLYOKE) || !KEYS.includes(FITCHBURG)) return
    const onHolyoke = select(HOLYOKE)
    expect(derive(onHolyoke, ctx).status).toBe("blocked")
    const onFitchburg = reduce(onHolyoke, { type: "SELECT_TOWN", key: FITCHBURG }, ctx)
    const vm = derive(onFitchburg, ctx)
    expect(vm.status).toBe("program-open")
    expect(onFitchburg.programId).toBe("unitil-lifesupport")
  })

  it("P5 Bellingham then PICK_COMPANY National Grid -> program-open ng-outage", () => {
    if (!KEYS.includes(BELLINGHAM)) return
    const s = reduce(select(BELLINGHAM), { type: "PICK_COMPANY", code: NG_MASS_ELECTRIC }, ctx)
    expect(derive(s, ctx).status).toBe("program-open")
    expect(s.programId).toBe("ng-outage")
  })

  it("P5 Bellingham PICK_COMPANY Eversource -> blocked no-form-loaded (MVP)", () => {
    if (!KEYS.includes(BELLINGHAM)) return
    const s = reduce(select(BELLINGHAM), { type: "PICK_COMPANY", code: EVERSOURCE }, ctx)
    const vm = derive(s, ctx)
    expect(vm.status).toBe("blocked")
    expect(vm.blocked?.reason).toBe("no-form-loaded")
  })

  it("P5 Lynnfield either pick is blocked", () => {
    if (!KEYS.includes(LYNNFIELD)) return
    const row = townRow(ctx.kits, LYNNFIELD)!
    const codes = companyCodes(row)
    expect(codes.length).toBe(2)
    for (const code of codes) {
      const s = reduce(select(LYNNFIELD), { type: "PICK_COMPANY", code }, ctx)
      expect(derive(s, ctx).status).toBe("blocked")
    }
  })

  it("P5 Holyoke blocked holyoke-no-form and JSON has no phone pattern", () => {
    if (!KEYS.includes(HOLYOKE)) return
    const vm = derive(select(HOLYOKE), ctx)
    expect(vm.status).toBe("blocked")
    expect(vm.blocked?.reason).toBe("holyoke-no-form")
    expect(JSON.stringify(vm)).not.toMatch(/\d{3}-\d{3}-\d{4}/)
  })
})

// ---------------------------------------------------------------------------
// P6 (MVP part) — outage records never claim shutoff protection; no priority.
// ---------------------------------------------------------------------------
describe("P6 outage records never claim protection; no priority", () => {
  const PROTECT = /protect(ed|ion|s)?\b.{0,40}\b(shut ?off|terminat|disconnect)/i
  const PRIORITY =
    /priorit|faster restoration|restored first|confirmed by|enrollment confirmed|not eligible|rejected|denied/i

  function appStringsFor(id: RecordId, answers: Record<string, AnswerValue>): string[] {
    // Build a program-open state carrying the answers, then collect app strings.
    let s: State
    if (id === "unitil-lifesupport") s = select(FITCHBURG)
    else s = reduce(select(BELLINGHAM), { type: "PICK_COMPANY", code: NG_MASS_ELECTRIC }, ctx)
    s = { ...s, answers }
    const vm = derive(s, ctx)
    const out: string[] = []
    if (vm.card) {
      out.push(...vm.card.appText)
    }
    if (vm.handoff) {
      out.push(vm.handoff.programName, vm.handoff.purposeText, vm.handoff.renewal)
      out.push(vm.handoff.firstOpenStep.label, vm.handoff.firstOpenStep.ownerText)
      for (const st of vm.handoff.steps) out.push(st.label, st.ownerText)
      if (vm.handoff.regulationContext) out.push(vm.handoff.regulationContext)
      if (vm.handoff.trackerWord) out.push(vm.handoff.trackerWord)
    }
    return out
  }

  it("P6 ng-outage: claims.shutoffProtection false; no app string claims protection or priority", () => {
    if (!KEYS.includes(BELLINGHAM)) return
    const rec = recordById("ng-outage")!
    expect(rec.claims.shutoffProtection).toBe(false)
    expect(rec.claims.restorationPriority).toBe(false)
    fc.assert(
      fc.property(answersArb("ng-outage"), (answers) => {
        for (const text of appStringsFor("ng-outage", answers)) {
          expect(text).not.toMatch(PROTECT)
          expect(text).not.toMatch(PRIORITY)
        }
      }),
      RUNS,
    )
  })

  it("P6 unitil-lifesupport: no app string claims protection or priority", () => {
    if (!KEYS.includes(FITCHBURG)) return
    const rec = recordById("unitil-lifesupport")!
    expect(rec.claims.shutoffProtection).toBe(false)
    fc.assert(
      fc.property(answersArb("unitil-lifesupport"), (answers) => {
        for (const text of appStringsFor("unitil-lifesupport", answers)) {
          expect(text).not.toMatch(PROTECT)
          expect(text).not.toMatch(PRIORITY)
        }
      }),
      RUNS,
    )
  })

  it("P6 ng-outage card limits include the non-termination and no-priority paragraphs", () => {
    if (!KEYS.includes(BELLINGHAM)) return
    const s = reduce(select(BELLINGHAM), { type: "PICK_COMPANY", code: NG_MASS_ELECTRIC }, ctx)
    const vm = derive(s, ctx)
    const quoteText = (vm.card?.limits ?? []).filter((q) => q.verbatim).map((q) => q.text).join("\n")
    // Non-termination paragraph and no-priority paragraph are present verbatim.
    expect(quoteText).toMatch(/terminat|shut ?off|does not protect/i)
    expect(quoteText).toMatch(/priorit|restoration/i)
  })
})

// ---------------------------------------------------------------------------
// P9 (MVP) — handoff complete and single-record; no tracker word in MVP.
// ---------------------------------------------------------------------------
describe("P9 handoff complete, single-record, no tracker in MVP", () => {
  const TRACKER_BAN = /\b(prepared|submitted|confirmed)\b/i

  function openMvp(id: RecordId): State {
    if (id === "unitil-lifesupport") return select(FITCHBURG)
    return reduce(select(BELLINGHAM), { type: "PICK_COMPANY", code: NG_MASS_ELECTRIC }, ctx)
  }

  it("P9 program-open handoff has required fields and no tracker word (enabledTiers mvp)", () => {
    const openIds: RecordId[] = ["unitil-lifesupport", "ng-outage"]
    for (const id of openIds) {
      if (id === "unitil-lifesupport" && !KEYS.includes(FITCHBURG)) continue
      if (id === "ng-outage" && !KEYS.includes(BELLINGHAM)) continue
      const s = openMvp(id)
      fc.assert(
        fc.property(answersArb(id), (answers) => {
          const vm = derive({ ...s, answers }, ctx)
          expect(vm.status).toBe("program-open")
          const h = vm.handoff!
          expect(h.town.length).toBeGreaterThan(0)
          expect(h.companyCode.length).toBeGreaterThan(0)
          expect(h.programName.length).toBeGreaterThan(0)
          expect(h.firstOpenStep.label.length).toBeGreaterThan(0)
          expect(h.renewal.length).toBeGreaterThan(0)
          expect(h.returnChannels.length).toBeGreaterThanOrEqual(1)
          expect(h.sourceUrls.length).toBeGreaterThanOrEqual(1)
          expect(h.trackerWord).toBeUndefined()
          // No Prepared/Submitted/Confirmed in app strings of the handoff.
          const appStrings = [
            h.programName,
            h.purposeText,
            h.renewal,
            h.firstOpenStep.label,
            h.firstOpenStep.ownerText,
            ...h.steps.flatMap((st) => [st.label, st.ownerText]),
            h.regulationContext ?? "",
            h.formBoxNote ?? "",
          ]
          for (const t of appStrings) expect(t).not.toMatch(TRACKER_BAN)
        }),
        RUNS,
      )
    }
  })

  it("P9 demo -> householdLabel set", () => {
    if (!KEYS.includes(FITCHBURG)) return
    const s = fold(initialState, demoActions())
    const vm = derive(s, ctx)
    expect(vm.status).toBe("program-open")
    expect(vm.handoff?.householdLabel).toBe("synthetic demo household")
    // Account value is the demo marker.
    expect(JSON.stringify(DEMO_ANSWERS)).toContain("DEMO — not a real account")
  })
})

// ---------------------------------------------------------------------------
// P16 (MVP) — language changes only by hand.
// ---------------------------------------------------------------------------
describe("P16 language changes only by hand", () => {
  it("P16 language equals last SET_LANGUAGE (or not-chosen); SELECT_TOWN never changes it", () => {
    fc.assert(
      fc.property(fc.constantFrom(...KEYS), anyActionArb, (startKey, actions) => {
        const all: Action[] = [{ type: "SELECT_TOWN", key: startKey }, ...actions]
        const end = fold(initialState, all)
        // Expected language: last SET_LANGUAGE value, else "not-chosen".
        let expected: State["language"] = "not-chosen"
        for (const a of all) if (a.type === "SET_LANGUAGE") expected = a.value
        expect(end.language).toBe(expected)
      }),
      RUNS,
    )
  })

  it("P16 SELECT_TOWN keeps language", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...KEYS),
        fc.constantFrom("English", "Spanish", "Other") as fc.Arbitrary<State["language"]>,
        (key, lang) => {
          const withLang = reduce(initialState, { type: "SET_LANGUAGE", value: lang }, ctx)
          const afterTown = reduce(withLang, { type: "SELECT_TOWN", key }, ctx)
          expect(afterTown.language).toBe(lang)
        },
      ),
      RUNS,
    )
  })
})

// ---------------------------------------------------------------------------
// P21 — step completion contract regressions (MVP records).
// ---------------------------------------------------------------------------
describe("P21 step completion contract", () => {
  const MVP_IDS: RecordId[] = ["unitil-lifesupport", "ng-outage"]

  it("P21 structure: exactly one send and one utility-wait (last); every field step has a required field", () => {
    for (const id of MVP_IDS) {
      const rec = recordById(id)!
      const sends = rec.steps.filter((s) => s.kind === "send")
      const waits = rec.steps.filter((s) => s.kind === "utility-wait")
      expect(sends.length).toBe(1)
      expect(waits.length).toBe(1)
      expect(rec.steps[rec.steps.length - 1].kind).toBe("utility-wait")
      for (const s of rec.steps) {
        if (s.kind === "field") expect(s.fields.length).toBeGreaterThanOrEqual(1)
      }
    }
  })

  // Fill every required household field of a record and return the state (program-open).
  function fillHousehold(id: RecordId): State {
    let s: State
    if (id === "unitil-lifesupport") s = select(FITCHBURG)
    else s = reduce(select(BELLINGHAM), { type: "PICK_COMPANY", code: NG_MASS_ELECTRIC }, ctx)
    const rec = recordById(id)!
    const answers: Record<string, AnswerValue> = {}
    for (const field of rec.fields) {
      // Give a definitely-answered value per kind.
      if (field.kind === "consent") answers[field.key] = true
      else if (field.kind === "yes-no" || field.kind === "select") answers[field.key] = field.options?.[0] ?? "Yes"
      else if (field.kind === "age-months") answers[field.key] = 12
      else answers[field.key] = "filled"
    }
    return { ...s, answers }
  }

  it("P21 (a) all household fields filled, attestedSent false -> firstOpenStep is the send step with signer ownerText", () => {
    if (!KEYS.includes(FITCHBURG)) return
    const s = fillHousehold("unitil-lifesupport")
    expect(s.attestedSent).toBe(false)
    const vm = derive(s, ctx)
    const rec = recordById("unitil-lifesupport")!
    const sendStep = rec.steps.find((st) => st.kind === "send")!
    expect(vm.card?.firstOpenStep.label).toBe(sendStep.label)
    // owner is the signer text on Unitil's clinician send step
    expect(vm.card?.firstOpenStep.ownerText).toBe(sendStep.ownerText)
    expect(sendStep.ownerText).toBe(rec.signer.text)
  })

  it("P21 (b) then SET_ATTESTED(true) -> firstOpenStep is the utility-wait step 'Waiting for Unitil to confirm'", () => {
    if (!KEYS.includes(FITCHBURG)) return
    const filled = fillHousehold("unitil-lifesupport")
    const attested = reduce(filled, { type: "SET_ATTESTED", value: true }, ctx)
    expect(attested.attestedSent).toBe(true)
    const vm = derive(attested, ctx)
    const rec = recordById("unitil-lifesupport")!
    const waitStep = rec.steps.find((st) => st.kind === "utility-wait")!
    expect(vm.card?.firstOpenStep.label).toBe(waitStep.label)
    expect(waitStep.label).toContain("Waiting for Unitil to confirm")
  })

  it("P21 (c) under any action sequence the utility-wait step is never done", () => {
    fc.assert(
      fc.property(fc.constantFrom(...MVP_IDS), anyActionArb, (id, actions) => {
        // Open the record, then run actions.
        let s: State
        if (id === "unitil-lifesupport") s = select(FITCHBURG)
        else s = reduce(select(BELLINGHAM), { type: "PICK_COMPANY", code: NG_MASS_ELECTRIC }, ctx)
        s = applySequence(s, actions)
        const vm = derive(s, ctx)
        if (vm.status === "program-open" && vm.card) {
          const rec = recordById(vm.card.recordId)!
          const waitStep = rec.steps.find((st) => st.kind === "utility-wait")!
          const view = vm.card.steps.find((st) => st.id === waitStep.id)
          if (view) expect(view.done).toBe(false)
        }
      }),
      RUNS,
    )
  })
})

// A tiny guard so the suite fails loudly if the kit did not load.
describe("ctx sanity", () => {
  it("utilities kit loaded, named MVP towns present", () => {
    expect(ctx.kits.fatal).toBeUndefined()
    expect(KEYS.length).toBe(351)
    expect(KEYS).toContain(FITCHBURG)
  })
})
