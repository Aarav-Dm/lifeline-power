// LifeLine Power — tier-1 view model + state properties (design §4–§6, §8).
// P5 (tier-1), P11, P13, P14, P15, P16 (tier-1), P21 (tier-1), P22, plus the
// Unitil submitted-word example. ctx enables ["mvp","tier1"]; tests pass the
// tiers explicitly so ENABLED_TIERS in programs.ts can stay ["mvp"].
//
// Owned file: this test, src/state/derive.ts, src/state/reducer.ts.

import { describe, expect, it } from "vitest"
import fc from "fast-check"

import type { Action, AnswerValue, Ctx, RecordId, State } from "../src/types"
import { loadKits, townKeys, townRow, companyCodes } from "../src/lib/kits"
import { recordsFor, recordById } from "../src/rules/programs"
import { initialState, reduce } from "../src/state/reducer"
import { derive } from "../src/state/derive"

const RUNS = { numRuns: 200 }

const ctx: Ctx = { kits: loadKits(["mvp", "tier1"]), enabledTiers: ["mvp", "tier1"] }

const KEYS: string[] = townKeys(ctx.kits)

// Representative single-company towns (verified against public/data/utilities/data.csv).
const TOWN_FOR_COMPANY: Record<string, string> = {
  "Unitil (Fitchburg Gas & Electric)": "FITCHBURG",
  "National Grid (Massachusetts Electric)": "ABINGTON",
  "Eversource Energy (NSTAR Electric)": "ACTON",
  "Wellesley Municipal Light Plant": "WELLESLEY",
}
const UNITIL_COMPANY = "Unitil (Fitchburg Gas & Electric)"

function select(key: string): State {
  return reduce(initialState, { type: "SELECT_TOWN", key }, ctx)
}

function fold(start: State, actions: Action[]): State {
  return actions.reduce((s, a) => reduce(s, a, ctx), start)
}

/** Open a record to program-open: select its company's town, then pick the program if needed. */
function openRecord(id: RecordId): State | null {
  const rec = recordById(id)
  if (rec == null) return null
  const townKey = TOWN_FOR_COMPANY[rec.companyCode]
  if (townKey == null || !KEYS.includes(townKey)) return null
  let s = select(townKey)
  if (s.programId !== id) {
    s = reduce(s, { type: "PICK_PROGRAM", id }, ctx)
  }
  return derive(s, ctx).status === "program-open" && s.programId === id ? s : null
}

/** Every record reachable under ["mvp","tier1"] via the mapped single-company towns. */
function reachableTier1Records(): RecordId[] {
  const seen = new Set<RecordId>()
  for (const [code, key] of Object.entries(TOWN_FOR_COMPANY)) {
    if (!KEYS.includes(key)) continue
    for (const r of recordsFor(code, ctx.enabledTiers)) seen.add(r.id)
  }
  return [...seen]
}

const TIER1_IDS: RecordId[] = reachableTier1Records()

/** Fill every required field of a record with a definitely-answered value. */
function filledAnswers(id: RecordId): Record<string, AnswerValue> {
  const rec = recordById(id)!
  const answers: Record<string, AnswerValue> = {}
  for (const field of rec.fields) {
    if (field.kind === "consent") answers[field.key] = true
    else if (field.kind === "yes-no" || field.kind === "select" || field.kind === "device")
      answers[field.key] = field.options?.[0] ?? "Yes"
    else if (field.kind === "age-months") answers[field.key] = 12
    else answers[field.key] = "filled"
  }
  return answers
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

/** A generated action for a reachable record (keys namespaced to it). */
function actionArb(programId: RecordId | null): fc.Arbitrary<Action> {
  const base: fc.Arbitrary<Action>[] = [
    fc.constantFrom(...KEYS).map((key) => ({ type: "SELECT_TOWN", key }) as Action),
    fc.string().map((query) => ({ type: "SUBMIT_UNMATCHED", query }) as Action),
    fc
      .constantFrom(...Object.keys(TOWN_FOR_COMPANY), "Peabody Municipal Light Plant")
      .map((code) => ({ type: "PICK_COMPANY", code }) as Action),
    fc
      .constantFrom<RecordId>(...(TIER1_IDS.length ? TIER1_IDS : (["ng-outage"] as RecordId[])))
      .map((id) => ({ type: "PICK_PROGRAM", id }) as Action),
    fc.boolean().map((value) => ({ type: "SET_ATTESTED", value }) as Action),
    fc
      .constantFrom("not-chosen", "English", "Spanish", "Other")
      .map((value) => ({ type: "SET_LANGUAGE", value }) as Action),
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

function applySequence(start: State, raw: Action[]): State {
  return raw.reduce((s, a) => reduce(s, a, ctx), start)
}

// ===========================================================================
// P11 — Determinism and no mutation.
// ===========================================================================
describe("P11 determinism and no mutation", () => {
  it("P11 derive(s, ctx) twice is deep-equal", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...KEYS),
        fc.array(actionArb("ng-outage"), { maxLength: 12 }),
        (startKey, actions) => {
          const s = applySequence(select(startKey), actions)
          const a = derive(s, ctx)
          const b = derive(s, ctx)
          expect(a).toEqual(b)
        },
      ),
      RUNS,
    )
  })

  it("P11 derive does not mutate its input state", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...KEYS),
        fc.array(actionArb("ng-outage"), { maxLength: 12 }),
        (startKey, actions) => {
          const s = applySequence(select(startKey), actions)
          const before = structuredClone(s)
          derive(s, ctx)
          expect(s).toEqual(before)
        },
      ),
      RUNS,
    )
  })

  it("P11 reduce does not mutate its input state", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...KEYS),
        actionArb("ng-outage"),
        fc.array(actionArb("ng-outage"), { maxLength: 8 }),
        (startKey, action, prefix) => {
          const s = applySequence(select(startKey), prefix)
          const before = structuredClone(s)
          reduce(s, action, ctx)
          expect(s).toEqual(before)
        },
      ),
      RUNS,
    )
  })
})

// ===========================================================================
// P13 — Program switch clears the other record (NG and Eversource).
// ===========================================================================
describe("P13 program switch clears the other record", () => {
  // X/Y pairs for the two two-record companies, when both records are enabled.
  function pairsFor(code: string): [RecordId, RecordId][] {
    const ids = recordsFor(code, ctx.enabledTiers).map((r) => r.id)
    const out: [RecordId, RecordId][] = []
    for (const x of ids) for (const y of ids) if (x !== y) out.push([x, y])
    return out
  }

  it("P13 after answers on X then PICK_PROGRAM(Y): no X.* key, no X-only strings", () => {
    const companies = [
      "National Grid (Massachusetts Electric)",
      "Eversource Energy (NSTAR Electric)",
    ]
    for (const code of companies) {
      const townKey = TOWN_FOR_COMPANY[code]
      if (!KEYS.includes(townKey)) continue
      for (const [x, y] of pairsFor(code)) {
        fc.assert(
          fc.property(answersArb(x), (answers) => {
            // Reach X (pick when the company has >1 record).
            let s = select(townKey)
            if (s.programId !== x) s = reduce(s, { type: "PICK_PROGRAM", id: x }, ctx)
            s = { ...s, answers }
            // Switch to Y.
            const sy = reduce(s, { type: "PICK_PROGRAM", id: y }, ctx)
            expect(Object.keys(sy.answers)).toEqual([])
            const json = JSON.stringify(derive(sy, ctx))
            // No X.* namespaced key leaks.
            expect(json).not.toContain(`${x}.`)
          }),
          { numRuns: 50 },
        )
      }
    }
  })

  it("P13 ev-illness JSON has no 'Westwood'; ev-letter JSON has no '413-746-6495'", () => {
    const code = "Eversource Energy (NSTAR Electric)"
    const townKey = TOWN_FOR_COMPANY[code]
    if (!KEYS.includes(townKey)) return
    const ids = recordsFor(code, ctx.enabledTiers).map((r) => r.id)
    if (ids.includes("ev-illness" as RecordId)) {
      const s = openRecord("ev-illness")
      if (s) expect(JSON.stringify(derive(s, ctx))).not.toContain("Westwood")
    }
    if (ids.includes("ev-letter" as RecordId)) {
      const s = openRecord("ev-letter")
      if (s) expect(JSON.stringify(derive(s, ctx))).not.toContain("413-746-6495")
    }
  })

  it("P13 ng-medical JSON has no CPAP sentence and no 'No interval stated'", () => {
    const s = openRecord("ng-medical")
    if (s == null) return
    const json = JSON.stringify(derive(s, ctx))
    expect(json).not.toContain("sleep apnea machines for patients over 6 months")
    expect(json).not.toContain("No interval stated")
  })
})

// ===========================================================================
// P14 — CPAP gate (ng-outage only). device × age ∈ {null} ∪ [0, 1440].
// ===========================================================================
describe("P14 CPAP gate", () => {
  const SLEEP = ["CPAP", "BiPAP", "APAP", "VPAP"]
  const REJECT = /reject|denied|not eligible/i

  function deviceKey(id: RecordId): string | undefined {
    return recordById(id)?.fields.find((f) => f.kind === "device")?.key
  }
  function ageKey(id: RecordId): string | undefined {
    return recordById(id)?.fields.find((f) => f.kind === "age-months")?.key
  }

  const deviceArb = fc.constantFrom("CPAP", "BiPAP", "APAP", "VPAP", "Other — type it")
  const ageArb = fc.oneof(fc.constant<AnswerValue>(null), fc.integer({ min: 0, max: 1440 }))

  it("P14 ng-outage: cpapNotice iff sleep-apnea device and age > 6; agePrompt iff device and age null", () => {
    const base = openRecord("ng-outage")
    if (base == null) return
    const dk = deviceKey("ng-outage")!
    const ak = ageKey("ng-outage")!
    fc.assert(
      fc.property(deviceArb, ageArb, (device, age) => {
        const s: State = { ...base, answers: { [dk]: device, [ak]: age } }
        const vm = derive(s, ctx)
        const card = vm.card!
        const sleepApnea = SLEEP.includes(device)
        const ageNum = typeof age === "number" ? age : null

        if (sleepApnea && ageNum !== null && ageNum > 6) {
          expect(card.cpapNotice).toBeDefined()
          expect(card.cpapNotice!.sentence.sourceId).toBe("ng-live")
          expect(card.cpapNotice!.pointer.id).toBe("ng-protect")
          expect(card.agePrompt).toBeUndefined()
        } else {
          expect(card.cpapNotice).toBeUndefined()
        }

        if (sleepApnea && age === null) {
          expect(card.agePrompt).toBeDefined()
        } else {
          expect(card.agePrompt).toBeUndefined()
        }

        // No rejection / denial / eligibility decision anywhere in the view JSON.
        expect(JSON.stringify(vm)).not.toMatch(REJECT)
      }),
      RUNS,
    )
  })

  it("P14 cpapNotice never appears on records other than ng-outage", () => {
    for (const id of TIER1_IDS) {
      if (id === "ng-outage") continue
      const base = openRecord(id)
      if (base == null) continue
      const dk = deviceKey(id)
      const ak = ageKey(id)
      // Even if a record happened to have device/age fields, feed sleep-apnea + age>6.
      const answers: Record<string, AnswerValue> = {}
      if (dk) answers[dk] = "CPAP"
      if (ak) answers[ak] = 600
      const vm = derive({ ...base, answers }, ctx)
      expect(vm.card?.cpapNotice).toBeUndefined()
    }
  })
})

// ===========================================================================
// P15 — Confirmed is unreachable; finishing is not sending.
// ===========================================================================
describe("P15 confirmed unreachable; finishing is not sending", () => {
  it("P15 tracker.state in the three; submitted => attestedSent; confirmedLabel is the fixed phrase", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...KEYS),
        fc.array(actionArb("ng-outage"), { maxLength: 16 }),
        (startKey, actions) => {
          const s = applySequence(select(startKey), actions)
          const vm = derive(s, ctx)
          if (vm.status !== "program-open" || vm.tracker == null) return
          const t = vm.tracker
          expect(["not-started", "prepared", "submitted"]).toContain(t.state)
          if (t.state === "submitted") expect(s.attestedSent).toBe(true)
          expect(t.confirmedLabel).toMatch(/^Only .+ can confirm$/)
          // No "confirmed" tracker state anywhere.
          expect(t.state).not.toBe("confirmed")
          expect(JSON.stringify(vm)).not.toMatch(/"state"\s*:\s*"confirmed"/)
        },
      ),
      RUNS,
    )
  })

  it("P15 all fields filled and not attested => prepared", () => {
    for (const id of TIER1_IDS) {
      const base = openRecord(id)
      if (base == null) continue
      const s: State = { ...base, answers: filledAnswers(id), attestedSent: false }
      const vm = derive(s, ctx)
      expect(vm.tracker?.state).toBe("prepared")
      expect(vm.tracker?.word).toBe("Prepared")
    }
  })

  it("P15 confirmedLabel is 'Only {companyNameOnPage} can confirm'", () => {
    for (const id of TIER1_IDS) {
      const base = openRecord(id)
      if (base == null) continue
      const rec = recordById(id)!
      const vm = derive(base, ctx)
      expect(vm.tracker?.confirmedLabel).toBe(`Only ${rec.companyNameOnPage} can confirm`)
    }
  })
})

// ===========================================================================
// P22 — Edit after send clears the attestation.
// ===========================================================================
describe("P22 edit after send clears the attestation", () => {
  it("P22 submitted -> SET_ANSWER(different) => attestedSent false and not submitted", () => {
    for (const id of TIER1_IDS) {
      const base = openRecord(id)
      if (base == null) continue
      const rec = recordById(id)!
      // Prepare and submit.
      const prepared: State = { ...base, answers: filledAnswers(id) }
      const submitted = reduce(prepared, { type: "SET_ATTESTED", value: true }, ctx)
      expect(submitted.attestedSent).toBe(true)
      expect(derive(submitted, ctx).tracker?.state).toBe("submitted")

      // Pick a field whose value we can change to a definitely-different value.
      const target = rec.fields.find((f) => f.kind === "text" || f.kind === "consent" || f.kind === "yes-no")
      if (target == null) continue
      const current = submitted.answers[target.key]
      let different: AnswerValue
      if (target.kind === "consent") different = false
      else if (target.kind === "yes-no") different = current === "No" ? "Yes" : "No"
      else different = current === "changed-x" ? "changed-y" : "changed-x"

      const edited = reduce(submitted, { type: "SET_ANSWER", key: target.key, value: different }, ctx)
      expect(edited.attestedSent).toBe(false)
      expect(derive(edited, ctx).tracker?.state).not.toBe("submitted")
    }
  })

  it("P22 clear then refill old value => still not submitted (two changes, no new attestation)", () => {
    for (const id of TIER1_IDS) {
      const base = openRecord(id)
      if (base == null) continue
      const rec = recordById(id)!
      const target = rec.fields.find((f) => f.kind === "text")
      if (target == null) continue
      const filled = filledAnswers(id)
      const old = filled[target.key]
      const prepared: State = { ...base, answers: filled }
      const submitted = reduce(prepared, { type: "SET_ATTESTED", value: true }, ctx)
      expect(submitted.attestedSent).toBe(true)
      // Clear (to "") then refill the old value.
      const cleared = reduce(submitted, { type: "SET_ANSWER", key: target.key, value: "" }, ctx)
      expect(cleared.attestedSent).toBe(false)
      const refilled = reduce(cleared, { type: "SET_ANSWER", key: target.key, value: old }, ctx)
      expect(refilled.attestedSent).toBe(false)
      expect(derive(refilled, ctx).tracker?.state).not.toBe("submitted")
    }
  })

  it("P22 SET_ANSWER(same value) returns the same object and stays submitted", () => {
    for (const id of TIER1_IDS) {
      const base = openRecord(id)
      if (base == null) continue
      const rec = recordById(id)!
      const target = rec.fields.find((f) => f.kind === "text")
      if (target == null) continue
      const filled = filledAnswers(id)
      const prepared: State = { ...base, answers: filled }
      const submitted = reduce(prepared, { type: "SET_ATTESTED", value: true }, ctx)
      expect(submitted.attestedSent).toBe(true)
      const same = reduce(submitted, { type: "SET_ANSWER", key: target.key, value: filled[target.key] }, ctx)
      expect(same).toBe(submitted)
      expect(derive(same, ctx).tracker?.state).toBe("submitted")
    }
  })
})

// ===========================================================================
// P5 (tier-1 part) — blocked / not-found / mixed-unpicked => no tracker.
// ===========================================================================
describe("P5 tier-1: no tracker while blocked / not-found / mixed-unpicked", () => {
  it("P5 generated sequences: those statuses carry no tracker", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...KEYS),
        fc.array(actionArb("ng-outage"), { maxLength: 14 }),
        (startKey, actions) => {
          const s = applySequence(select(startKey), actions)
          const vm = derive(s, ctx)
          if (
            vm.status === "blocked" ||
            vm.status === "not-found" ||
            vm.status === "mixed-unpicked" ||
            vm.status === "idle" ||
            vm.status === "program-choice"
          ) {
            expect(vm.tracker).toBeUndefined()
            expect(vm.card).toBeUndefined()
            expect(vm.canPrint).toBe(false)
          } else {
            expect(vm.tracker).toBeDefined()
          }
        },
      ),
      RUNS,
    )
  })
})

// ===========================================================================
// P16 (tier-1) — language only by SET_LANGUAGE; vm.town.ej independent of language.
// ===========================================================================
describe("P16 tier-1: language only by hand; EJ independent of language", () => {
  it("P16 language equals last SET_LANGUAGE (or not-chosen)", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...KEYS),
        fc.array(actionArb("ng-outage"), { maxLength: 14 }),
        (startKey, actions) => {
          const all: Action[] = [{ type: "SELECT_TOWN", key: startKey }, ...actions]
          const end = fold(initialState, all)
          let expected: State["language"] = "not-chosen"
          for (const a of all) if (a.type === "SET_LANGUAGE") expected = a.value
          expect(end.language).toBe(expected)
        },
      ),
      RUNS,
    )
  })

  it("P16 vm.town.ej is identical for every language", () => {
    const langs: State["language"][] = ["not-chosen", "English", "Spanish", "Other"]
    fc.assert(
      fc.property(fc.constantFrom(...KEYS), (key) => {
        const base = select(key)
        const ejByLang = langs.map((lang) => {
          const s: State = { ...base, language: lang, languageOther: lang === "Other" ? "Klingon" : "" }
          return JSON.stringify(derive(s, ctx).town?.ej ?? null)
        })
        for (const e of ejByLang) expect(e).toBe(ejByLang[0])
      }),
      RUNS,
    )
  })
})

// ===========================================================================
// P21 (tier-1 regression) — ng-medical: household filled, consent not given ->
// first open step is the clinician letter step, owner = signer text.
// ===========================================================================
describe("P21 tier-1 ng-medical regression", () => {
  it("P21 ng-medical: household fields filled, consent not given -> firstOpenStep is the clinician letter step", () => {
    const base = openRecord("ng-medical")
    if (base == null) return
    const rec = recordById("ng-medical")!
    // The clinician letter step is the field step owned by the signer (ownerText === signer.text).
    const letterStep = rec.steps.find((st) => st.kind === "field" && st.ownerText === rec.signer.text)
    expect(letterStep).toBeDefined()
    const clinicianFieldKeys = letterStep!.kind === "field" ? letterStep!.fields : []

    // Fill every field EXCEPT the clinician step's own field(s). For a select with a
    // requiredWhen gate (discount rate), choose a value that KEEPS the gated field required,
    // then fill that gated field, so the household step is genuinely complete.
    const answers: Record<string, AnswerValue> = {}
    for (const field of rec.fields) {
      if (clinicianFieldKeys.includes(field.key)) continue // leave the clinician consent unanswered
      if (field.kind === "consent") answers[field.key] = true
      else if (field.kind === "select") {
        // Pick an option that is NOT any downstream field's notEquals gate, so gated fields stay required.
        const gates = rec.fields
          .map((f) => f.requiredWhen)
          .filter((rw): rw is NonNullable<typeof rw> => rw != null && rw.key === field.key)
          .map((rw) => rw.notEquals)
        const opt = (field.options ?? ["Yes"]).find((o) => !gates.includes(o)) ?? field.options?.[0] ?? "Yes"
        answers[field.key] = opt
      } else if (field.kind === "yes-no" || field.kind === "device") answers[field.key] = field.options?.[0] ?? "Yes"
      else if (field.kind === "age-months") answers[field.key] = 12
      else answers[field.key] = "filled"
    }
    const s: State = { ...base, answers }
    const vm = derive(s, ctx)
    expect(vm.card?.firstOpenStep.label).toBe(letterStep!.label)
    expect(vm.card?.firstOpenStep.ownerText).toBe(rec.signer.text)
  })
})

// ===========================================================================
// Unitil submitted-word example.
// ===========================================================================
describe("Unitil submitted word", () => {
  it("Unitil record submitted tracker word reads 'Submitted (per the clinician's office)'", () => {
    const code = UNITIL_COMPANY
    const townKey = TOWN_FOR_COMPANY[code]
    if (!KEYS.includes(townKey)) return
    const ids = recordsFor(code, ctx.enabledTiers).map((r) => r.id)
    for (const id of ids) {
      const base = openRecord(id)
      if (base == null) continue
      const submitted = reduce({ ...base, answers: filledAnswers(id) }, { type: "SET_ATTESTED", value: true }, ctx)
      expect(submitted.attestedSent).toBe(true)
      const vm = derive(submitted, ctx)
      expect(vm.tracker?.state).toBe("submitted")
      expect(vm.tracker?.word).toBe("Submitted (per the clinician's office)")
      expect(vm.handoff?.trackerWord).toBe("Submitted (per the clinician's office)")
    }
  })

  it("non-Unitil submitted word is plain 'Submitted'", () => {
    const base = openRecord("ng-outage")
    if (base == null) return
    const submitted = reduce({ ...base, answers: filledAnswers("ng-outage") }, { type: "SET_ATTESTED", value: true }, ctx)
    const vm = derive(submitted, ctx)
    expect(vm.tracker?.state).toBe("submitted")
    expect(vm.tracker?.word).toBe("Submitted")
  })
})

// ===========================================================================
// townList / ejNotice presence (tier-1 page-level view model).
// ===========================================================================
describe("tier-1 townList and ejNotice", () => {
  it("vm.townList lists all 351 towns in file order with displays", () => {
    const vm = derive(initialState, ctx)
    expect(vm.townList?.length).toBe(KEYS.length)
    expect(vm.townList?.map((t) => t.key)).toEqual(KEYS)
    for (const item of vm.townList ?? []) {
      const row = townRow(ctx.kits, item.key)!
      expect(item.display).toBe(row.town)
    }
  })

  it("ejNotice present iff the ej kit failed its check", () => {
    const vm = derive(initialState, ctx)
    const ej = ctx.kits.ej
    if (ej.ok === false && "check" in ej) {
      expect(vm.ejNotice).toBe(`Saved ej file failed check: ${ej.check}. EJ sort is off.`)
    } else {
      expect(vm.ejNotice).toBeUndefined()
    }
  })
})

// A sanity guard so the suite fails loudly if the kit or tier-1 records did not load.
describe("tier-1 ctx sanity", () => {
  it("utilities loaded; tier-1 records reachable", () => {
    expect(ctx.kits.fatal).toBeUndefined()
    expect(KEYS.length).toBe(351)
    expect(TIER1_IDS.length).toBeGreaterThan(0)
  })
})
