import { describe, expect, it } from "vitest"
import { aboutCoverage } from "../src/lib/coverage-view"
import { loadKits } from "../src/lib/kits"
import { disagreementNotice } from "../src/rules/disagreements"

describe("About coverage + disagreement wiring", () => {
  it("tier 1 build: 293 towns, 2,409 of 2,604 EJ block groups (92.5%) — same as coverage.test.ts", () => {
    const c = aboutCoverage(loadKits(["mvp", "tier1"]), ["mvp", "tier1"])!
    expect([c.towns, c.townsTotal, c.ejBlockGroups, c.ejBlockGroupsTotal, c.ejBlockGroupsPct]).toEqual([293, 351, 2409, 2604, 92.5])
    expect(c.nextForms.length).toBeGreaterThan(0)
  })
  it("MVP build (ej not loaded): nothing shown", () => {
    expect(aboutCoverage(loadKits(["mvp"]), ["mvp"])).toBeUndefined()
  })
  it("Leominster gets the state-table notice; Fitchburg gets none", () => {
    expect(disagreementNotice("LEOMINSTER")).toMatch(/follows the state table/)
    expect(disagreementNotice("FITCHBURG")).toBeUndefined()
  })
})
