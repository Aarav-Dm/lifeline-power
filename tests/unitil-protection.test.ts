import fc from "fast-check"
import { describe, expect, it } from "vitest"
import type { Ctx, State } from "../src/types"
import { loadKits } from "../src/lib/kits"
import { recordById } from "../src/rules/programs"
import { derive } from "../src/state/derive"
import { initialState, reduce } from "../src/state/reducer"

const ctx: Ctx = { kits: loadKits(["mvp", "tier1"]), enabledTiers: ["mvp", "tier1"] }
const open = (id: "unitil-lifesupport" | "unitil-protection"): State =>
  reduce(reduce(initialState, { type: "SELECT_TOWN", key: "FITCHBURG" }, ctx), { type: "PICK_PROGRAM", id }, ctx)

describe("task 9: Unitil account protection", () => {
  it("P7/P8: 220 CMR 25.03 is unitil-protection's renewal, only regulationContext on unitil-lifesupport; no protection term from the 3/6/12 box", () => {
    const prot = derive(open("unitil-protection"), ctx)
    expect(prot.card?.renewal.text).toMatch(/^220 CMR 25\.03: a serious-illness certificate is renewed quarterly; a chronic certificate every six months$/)
    expect(prot.card?.regulationContext).toBeUndefined()
    expect(prot.card?.formBoxNote?.text).toContain("not a protection period")
    const life = derive(open("unitil-lifesupport"), ctx)
    expect(life.card?.renewal.text).toBe("No interval stated in the opened sources")
    expect(life.card?.regulationContext?.label).toBe("Separate shutoff-protection certificate (220 CMR 25.03)")
    for (const vm of [prot, life]) expect(JSON.stringify(vm)).not.toMatch(/protected for (3|6|12) months|12[- ]month protection/i)
  })
  it("P21 low-income: unanswered reads 'Applicability not determined' and its step is open; either recorded outcome answers it; never on unitil-lifesupport", () => {
    const rec = recordById("unitil-protection")!
    const f = rec.fields.find((x) => x.key === "unitil-protection.low-income")!
    expect(f.unansweredText).toBe("Applicability not determined")
    expect(recordById("unitil-lifesupport")!.fields.some((x) => /low-income/.test(x.key))).toBe(false)
    fc.assert(
      fc.property(fc.constantFrom<string | null>(null, "Verification supplied", "Utility confirmed not applicable"), (v) => {
        const s = reduce(open("unitil-protection"), { type: "SET_ANSWER", key: f.key, value: v }, ctx)
        const step = derive(s, ctx).card!.steps.find((x) => x.id === "unitil-protection.low-income-step")!
        expect(step.done).toBe(v !== null)
      }),
    )
  })
  it("P13 Unitil pair: answers on one use never survive a switch to the other", () => {
    let s = open("unitil-lifesupport")
    s = reduce(s, { type: "SET_ANSWER", key: "unitil-lifesupport.customer-name", value: "Robert Pell" }, ctx)
    s = reduce(s, { type: "PICK_PROGRAM", id: "unitil-protection" }, ctx)
    expect(Object.keys(s.answers)).toEqual([])
    expect(JSON.stringify(derive(s, ctx))).not.toContain("Robert Pell")
  })
  it("claims: account protection is shutoff-protection and never an outage list", () => {
    const r = recordById("unitil-protection")!
    expect(r.claims).toEqual({ outageNotification: false, shutoffProtection: true, restorationPriority: false })
  })
})
