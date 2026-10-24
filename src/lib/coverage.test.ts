import { describe, expect, it } from "vitest"

import { PROGRAMS } from "../rules/programs.ts"
import { parseCsv } from "./csv.ts"
import { coverage, loadedCompanyCodes, type CoverageEjRow, type CoverageTown } from "./coverage.ts"
import { KIT_SOURCES } from "./kit-sources.ts"
import { norm } from "./kits.ts"

const text = (name: string) => KIT_SOURCES.find((s) => s.name === name)!.text

const towns: CoverageTown[] = parseCsv(text("utilities")).rows.map((r) => ({
  key: norm(r[0] ?? ""),
  town: r[0] ?? "",
  utilityCode: r[1] ?? "",
}))

const ej: CoverageEjRow[] = parseCsv(text("ej")).rows.map((r) => ({
  key: norm(r[0] ?? ""),
  population: r[1] === null || r[1] === "" ? null : Number(r[1]),
}))

const mvp = coverage(towns, ej, loadedCompanyCodes(["mvp"], PROGRAMS))
const tier1 = coverage(towns, ej, loadedCompanyCodes(["mvp", "tier1"], PROGRAMS))

describe("coverage ledger (utilities x ej)", () => {
  it("MVP: National Grid + Unitil single-company towns = 163 towns, 1,166 of 2,604 EJ block groups (44.8%)", () => {
    expect(mvp.towns).toBe(163)
    expect(mvp.ejBlockGroups).toBe(1166)
    expect(mvp.ejBlockGroupsTotal).toBe(2604)
    expect(mvp.ejBlockGroupsPct).toBe(44.8)
    expect(mvp.people).toBe(1631879)
    expect(mvp.peopleTotal).toBe(3487681)
    expect(mvp.peoplePct).toBe(46.8)
  })

  it("tier 1: adds Eversource and Wellesley = 293 towns, 2,409 block groups (92.5%)", () => {
    expect(tier1.towns).toBe(293)
    expect(tier1.ejBlockGroups).toBe(2409)
    expect(tier1.ejBlockGroupsPct).toBe(92.5)
    expect(tier1.people).toBe(3215679)
    expect(tier1.peoplePct).toBe(92.2)
  })

  it("next forms to open (tier 1) are single-company towns ranked by EJ block groups, with n", () => {
    expect(tier1.nextForms.slice(0, 5).map((f) => [f.town, f.ejBlockGroups])).toEqual([
      ["HOLYOKE", 29],
      ["BRAINTREE", 22],
      ["TAUNTON", 19],
      ["PEABODY", 15],
      ["SHREWSBURY", 14],
    ])
    // mixed towns (Chicopee, Westfield) are never listed as single-company gaps
    expect(tier1.nextForms.some((f) => f.town === "CHICOPEE" || f.town === "WESTFIELD")).toBe(false)
  })

  it("every EJ municipality joins to a utilities town, and covered + uncovered block groups never exceed the total", () => {
    const keys = new Set(towns.map((t) => t.key))
    expect(ej.every((r) => keys.has(r.key))).toBe(true)
    const listed = tier1.nextForms.reduce((n, f) => n + f.ejBlockGroups, 0)
    expect(tier1.ejBlockGroups + listed).toBeLessThanOrEqual(tier1.ejBlockGroupsTotal)
  })

  it("a blank population is not read as 0 people-weighted data loss: the block group still counts", () => {
    const one = coverage(
      [{ key: "A", town: "A", utilityCode: "X" }],
      [{ key: "A", population: null }],
      new Set(["X"]),
    )
    expect(one.ejBlockGroups).toBe(1)
    expect(one.people).toBe(0)
  })
})
