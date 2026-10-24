import { describe, expect, it } from "vitest"
import type { Ctx } from "../src/types"
import { loadKits } from "../src/lib/kits"
import { derive } from "../src/state/derive"
import { initialState, reduce } from "../src/state/reducer"

const ctx: Ctx = { kits: loadKits(["mvp", "tier1"]), enabledTiers: ["mvp", "tier1"] }

describe("R5.4 program switch stays possible (found in the browser check)", () => {
  it("Chelsea: with ev-letter open, both Eversource choices are still offered and switching opens ev-illness", () => {
    let s = reduce(initialState, { type: "SELECT_TOWN", key: "CHELSEA" }, ctx)
    s = reduce(s, { type: "PICK_PROGRAM", id: "ev-letter" }, ctx)
    const open = derive(s, ctx)
    expect(open.status).toBe("program-open")
    expect(open.choices?.map((c) => c.id)).toEqual(["ev-letter", "ev-illness"])
    s = reduce(s, { type: "PICK_PROGRAM", id: "ev-illness" }, ctx)
    expect(derive(s, ctx).card?.recordId).toBe("ev-illness")
  })
  it("Fitchburg (task 9): both Unitil uses are offered and nothing opens until one is picked", () => {
    const vm = derive(reduce(initialState, { type: "SELECT_TOWN", key: "FITCHBURG" }, ctx), ctx)
    expect(vm.status).toBe("program-choice")
    expect(vm.choices?.map((c) => c.id)).toEqual(["unitil-lifesupport", "unitil-protection"])
  })
  it("Holyoke (one blocked company): no choice list", () => {
    expect(derive(reduce(initialState, { type: "SELECT_TOWN", key: "HOLYOKE" }, ctx), ctx).choices).toBeUndefined()
  })
})

