import fc from "fast-check"
import { describe, expect, it } from "vitest"
import type { Ctx, RecordId } from "../src/types"
import { loadKits } from "../src/lib/kits"
import { HANDOFF_LABELS_ES } from "../src/i18n/handoff-es"
import { derive } from "../src/state/derive"
import { handoffText } from "../src/state/handoff-text"
import { initialState, reduce } from "../src/state/reducer"

const ctx: Ctx = { kits: loadKits(["mvp", "tier1"]), enabledTiers: ["mvp", "tier1"] }
const CASES: [string, RecordId][] = [
  ["FITCHBURG", "unitil-lifesupport"],
  ["FITCHBURG", "unitil-protection"],
  ["LEOMINSTER", "ng-outage"],
  ["LEOMINSTER", "ng-medical"],
  ["CHELSEA", "ev-letter"],
  ["CHELSEA", "ev-illness"],
  ["WELLESLEY", "wmlp-chn"],
]

function handoffFor(town: string, id: RecordId) {
  let s = reduce(initialState, { type: "SELECT_TOWN", key: town }, ctx)
  s = reduce(s, { type: "PICK_PROGRAM", id }, ctx)
  s = reduce(s, { type: "SET_LANGUAGE", value: "Spanish" }, ctx)
  return derive(s, ctx).handoff!
}

describe("Spanish handoff (Pam's labels)", () => {
  it("every record/source string appears unchanged in the Spanish print, inside 'Texto original en inglés' blocks", () => {
    fc.assert(
      fc.property(fc.constantFrom(...CASES), ([town, id]) => {
        const h = handoffFor(town, id)
        const es = handoffText(h, "es")
        expect(es.originalNotice).toBe("Texto original en inglés")
        const originalLines = es.sections.filter((s) => s.original).flatMap((s) => s.lines)
        const recordStrings = [h.renewal, h.regulationContext, h.formBoxNote, ...h.returnChannels, ...h.limits, h.noGuarantee, ...h.sourceUrls].filter(
          (x): x is string => typeof x === "string",
        )
        for (const r of recordStrings) expect(originalLines).toContain(r)
        const all = es.sections.flatMap((s) => s.lines).join("\n")
        for (const st of h.steps) expect(all).toContain(st.label)
        expect(all).toContain(h.firstOpenStep.ownerText)
      }),
    )
  })
  it("never adds Pam's generic no-guarantee or 220 CMR notices (ban 15)", () => {
    for (const [town, id] of CASES) {
      const text = JSON.stringify(handoffText(handoffFor(town, id), "es"))
      expect(text).not.toContain(HANDOFF_LABELS_ES.honestLimits.noGuaranteeSummary)
      expect(text).not.toContain(HANDOFF_LABELS_ES.honestLimits.statutorySeparationNotice)
    }
  })
  it("English print is unchanged: no Spanish labels, no original-text notice", () => {
    const en = handoffText(handoffFor("FITCHBURG", "unitil-lifesupport"), "en")
    expect(en.originalNotice).toBeUndefined()
    expect(JSON.stringify(en)).not.toContain("Siguiente paso")
  })
})
