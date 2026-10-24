import fc from "fast-check"
import { describe, expect, it } from "vitest"

import { companyCodes, loadKits, matchTown, townKeys, townRow } from "../src/lib/kits.ts"

const kits = loadKits(["mvp"])
const keys = townKeys(kits)

describe("town -> company (data layer)", () => {
  it("loads all 351 town keys in file order", () => {
    expect(keys).toHaveLength(351)
    expect(keys[0]).toBe("ABINGTON")
  })

  it("P4 companyCodes equals utility_code split on ', ' for every one of the 351 rows (full loop)", () => {
    for (const key of keys) {
      const row = townRow(kits, key)!
      const expected = row.utilityCode.split(", ")
      expect(companyCodes(row)).toEqual(expected)

      // Never derived from the `utility` column. Where the two columns disagree
      // (Westfield, the municipal mixed towns), companyCodes must track utility_code.
      if (row.utility !== row.utilityCode) {
        expect(companyCodes(row)).not.toEqual(row.utility.split(", "))
      }
    }
  })

  it("P4 property: for a random row, companyCodes comes from utility_code, never utility", () => {
    fc.assert(
      fc.property(fc.constantFrom(...keys), (key) => {
        const row = townRow(kits, key)!
        const codes = companyCodes(row)
        expect(codes).toEqual(row.utilityCode.split(", "))
        // The joined codes reconstruct the utility_code cell exactly.
        expect(codes.join(", ")).toBe(row.utilityCode)
      }),
      { numRuns: 200 },
    )
  })
})

describe("P4 named single-company examples", () => {
  const single: [string, string][] = [
    ["FITCHBURG", "Unitil (Fitchburg Gas & Electric)"],
    ["LEOMINSTER", "National Grid (Massachusetts Electric)"],
    ["GARDNER", "National Grid (Massachusetts Electric)"],
    ["SHIRLEY", "National Grid (Massachusetts Electric)"],
    ["WESTMINSTER", "National Grid (Massachusetts Electric)"],
    ["HOLYOKE", "Holyoke Gas & Electric Department"],
    ["NANTUCKET", "National Grid (Nantucket Electric)"],
  ]

  for (const [key, code] of single) {
    it(`${key} -> ["${code}"]`, () => {
      const row = townRow(kits, key)!
      expect(companyCodes(row)).toEqual([code])
    })
  }
})

describe("P4 mixed-company examples", () => {
  it("WESTFIELD is a two-code mixed town, from utility_code not utility", () => {
    const row = townRow(kits, "WESTFIELD")!
    expect(companyCodes(row)).toEqual([
      "Westfield Gas and Electric Light Department",
      "Eversource Energy (NSTAR Electric)",
    ])
    // utility column reads "Municipal, Massachusetts Electric d/b/a National Grid" — never used.
    expect(companyCodes(row)).not.toContain("National Grid (Massachusetts Electric)")
    expect(companyCodes(row)).not.toContain("Massachusetts Electric d/b/a National Grid")
  })

  const eversourceNationalGrid = [
    "BELLINGHAM",
    "CHESHIRE",
    "ERVING",
    "HANCOCK",
    "LENOX",
    "PEMBROKE",
    "SCITUATE",
    "WESTPORT",
  ]
  const municipalIou = [
    "CHESTER",
    "CHICOPEE",
    "DIGHTON",
    "GROTON",
    "HINGHAM",
    "LAKEVILLE",
    "MIDDLEBOROUGH",
    "RUSSELL",
    "WESTFIELD",
  ]
  const lynnfield = ["LYNNFIELD"]

  it("exactly 18 rows have more than one code (8 + 9 + 1)", () => {
    const multi = keys.filter((k) => companyCodes(townRow(kits, k)!).length > 1)
    expect(multi).toHaveLength(18)
    expect(new Set(multi)).toEqual(new Set([...eversourceNationalGrid, ...municipalIou, ...lynnfield]))
  })

  it("the 8 Eversource + National Grid rows split to exactly those two codes", () => {
    for (const key of eversourceNationalGrid) {
      expect(companyCodes(townRow(kits, key)!)).toEqual([
        "Eversource Energy (NSTAR Electric)",
        "National Grid (Massachusetts Electric)",
      ])
    }
  })

  it("the 9 municipal + IOU rows each have two codes", () => {
    for (const key of municipalIou) {
      expect(companyCodes(townRow(kits, key)!)).toHaveLength(2)
    }
  })

  it("LYNNFIELD is municipal + municipal (two codes)", () => {
    expect(companyCodes(townRow(kits, "LYNNFIELD")!)).toEqual([
      "Peabody Municipal Light Plant",
      "Reading Municipal Light Department",
    ])
  })
})

describe("matchTown — exact norm match only", () => {
  it('matchTown("West Townsend") is undefined (no such row)', () => {
    expect(matchTown(kits, "West Townsend")).toBeUndefined()
  })

  it('matchTown("  fitchburg ") resolves to FITCHBURG', () => {
    const row = matchTown(kits, "  fitchburg ")
    expect(row?.key).toBe("FITCHBURG")
    expect(companyCodes(row!)).toEqual(["Unitil (Fitchburg Gas & Electric)"])
  })

  it("P4 property: matchTown of a town's own display text resolves to that row", () => {
    fc.assert(
      fc.property(fc.constantFrom(...keys), (key) => {
        const row = townRow(kits, key)!
        const matched = matchTown(kits, row.town)
        expect(matched?.key).toBe(key)
      }),
      { numRuns: 200 },
    )
  })
})
