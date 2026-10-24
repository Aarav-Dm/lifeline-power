import fc from "fast-check"
import { describe, expect, it } from "vitest"

import type { EjRow, KitSource } from "../src/types.ts"
import { parseCsv } from "../src/lib/csv.ts"
import { KIT_SOURCES } from "../src/lib/kit-sources.ts"
import { companyCodes, ejStats, loadKits, matchTown, norm, sortTowns, validateKit } from "../src/lib/kits.ts"

const utilitiesText = KIT_SOURCES.find((s) => s.name === "utilities")!.text
const ejSource = KIT_SOURCES.find((s) => s.name === "ej")!
const ejText = ejSource.text

// Tier 1 enabled: ej is parsed and typed to EjRow.
const kits = loadKits(["mvp", "tier1"])

// ---------- validateKit on the real ej kit ----------

describe("validateKit — real ej kit", () => {
  it("passes with the exact header and 2604 rows", () => {
    const result = validateKit("ej", ejText)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.header).toEqual([
        "municipality",
        "population",
        "minority_pct",
        "limited_english_hh_pct",
        "block_group_income",
        "ej",
        "criteria",
      ])
      expect(result.rows).toHaveLength(2604)
    }
  })

  it("loadKits([\"mvp\",\"tier1\"]) parses ej to 2604 EjRow", () => {
    expect(kits.ej.ok).toBe(true)
    if (kits.ej.ok) expect(kits.ej.rows).toHaveLength(2604)
  })
})

// ---------- Independent recomputation from the raw ej rows ----------

// Reparse the real ej kit the same way loadKits does, to build the expected arithmetic truth
// without reusing the module under test's selectors.
const ejRaw = (() => {
  const { rows } = parseCsv(ejText)
  return rows.map((r) => {
    const municipality = r[0] ?? ""
    const leCell = r[3]
    const limitedEnglishHhPct = leCell === null || leCell === "" ? null : Number(leCell)
    return { municipality, key: norm(municipality), limitedEnglishHhPct, ej: r[5] } satisfies EjRow
  })
})()

const ejKeys = [...new Set(ejRaw.filter((r) => r.ej === "Yes").map((r) => r.key))]

function expectedMean(key: string): { n: number; mean: number | null } {
  const rows = ejRaw.filter((r) => r.ej === "Yes" && r.key === key)
  const vals = rows.map((r) => r.limitedEnglishHhPct).filter((v): v is number => v !== null)
  const mean = vals.length === 0 ? 0 : vals.reduce((a, b) => a + b, 0) / vals.length
  return { n: rows.length, mean: rows.length === 0 ? null : mean }
}

// ---------- P17 — EJ mean matches the CSV ----------

describe("P17 — EJ mean matches the CSV", () => {
  it("returns undefined when the ej kit did not load", () => {
    const disabled = loadKits(["mvp"]) // ej tier-disabled
    expect(ejStats(disabled, "LAWRENCE")).toBeUndefined()
  })

  it("P17 property: ejStats mean/n equals the arithmetic truth for every municipality (±0.005)", () => {
    fc.assert(
      fc.property(fc.constantFrom(...ejKeys), (key) => {
        const view = ejStats(kits, key)
        expect(view).toBeDefined()
        const want = expectedMean(key)
        if (view!.kind === "none") {
          expect(want.n).toBe(0)
        } else {
          expect(view!.n).toBe(want.n)
          expect(Math.abs(view!.meanPct - (want.mean as number))).toBeLessThanOrEqual(0.005)
          expect(view!.label).toBe("unweighted mean across EJ block groups — not a town-wide rate")
        }
      }),
      { numRuns: 300 },
    )
  })

  const examples: [string, number, number][] = [
    ["LAWRENCE", 28.88, 56],
    ["CHELSEA", 26.2, 36],
    ["HOLYOKE", 20.54, 29],
  ]
  for (const [key, mean, n] of examples) {
    it(`${key} -> mean ≈ ${mean} · n=${n}`, () => {
      const view = ejStats(kits, key)
      expect(view?.kind).toBe("mean")
      if (view?.kind === "mean") {
        expect(view.n).toBe(n)
        expect(Math.abs(view.meanPct - mean)).toBeLessThanOrEqual(0.005)
      }
    })
  }

  it("WELLESLEY is a mean of 0.00 over n=2, not 'none'", () => {
    const view = ejStats(kits, "WELLESLEY")
    expect(view?.kind).toBe("mean")
    if (view?.kind === "mean") {
      expect(view.n).toBe(2)
      expect(Math.abs(view.meanPct - 0)).toBeLessThanOrEqual(0.005)
    }
  })

  it("a town with no EJ block groups -> kind 'none' sorted/labelled, never 0.00", () => {
    // A utilities town with no ej rows (not in the ej Yes set).
    const noRowKey = kits.utilities.map((r) => r.key).find((k) => !ejKeys.includes(k))
    expect(noRowKey).toBeDefined()
    const view = ejStats(kits, noRowKey!)
    expect(view).toEqual({ kind: "none", label: "No EJ block groups" })
  })
})

// ---------- sortTowns ----------

describe("sortTowns", () => {
  it("az mode is file order", () => {
    expect(sortTowns(kits, "az").map((r) => r.key)).toEqual(kits.utilities.map((r) => r.key))
  })

  it("ej mode: means descending, no-mean towns last, ties A–Z", () => {
    const sorted = sortTowns(kits, "ej")
    expect(sorted).toHaveLength(kits.utilities.length)

    const meanFor = (key: string): number | null => {
      const v = ejStats(kits, key)
      return v && v.kind === "mean" ? v.meanPct : null
    }
    const means = sorted.map((r) => meanFor(r.key))

    // Partition point: every town with a mean precedes every town without one.
    const firstNull = means.findIndex((m) => m === null)
    if (firstNull !== -1) {
      expect(means.slice(firstNull).every((m) => m === null)).toBe(true)
    }
    // Means are non-increasing in the with-mean prefix.
    const prefix = firstNull === -1 ? means : means.slice(0, firstNull)
    for (let i = 1; i < prefix.length; i++) {
      expect((prefix[i - 1] as number) >= (prefix[i] as number)).toBe(true)
    }
    // Lawrence (28.88, the highest named example) sorts ahead of Chelsea (26.20).
    const li = sorted.findIndex((r) => r.key === "LAWRENCE")
    const ci = sorted.findIndex((r) => r.key === "CHELSEA")
    expect(li).toBeLessThan(ci)
  })

  it("ej mode with the ej kit disabled: every town has no mean, so order is A–Z by key", () => {
    const disabled = loadKits(["mvp"])
    const sorted = sortTowns(disabled, "ej").map((r) => r.key)
    const azByKey = disabled.utilities.map((r) => r.key).slice().sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    expect(sorted).toEqual(azByKey)
  })
})

// ---------- Malformed ej with tier 1 enabled ----------

const withMalformedEj = (): KitSource[] => [
  { name: "utilities", path: "public/data/utilities/data.csv", savedAt: "2026-10-18", tier: "mvp", text: utilitiesText },
  { name: "ej", path: "public/data/ej/data.csv", savedAt: "2026-10-18", tier: "tier1", text: "garbage,header\n1,2\n" },
]

describe("loadKits — malformed ej with tier 1 enabled", () => {
  it("ej is ok:false (file/check) while utilities stay fine", () => {
    const bad = loadKits(["mvp", "tier1"], withMalformedEj())
    expect(bad.fatal).toBeUndefined()
    expect(bad.utilities).toHaveLength(351)

    const ej = bad.ej
    expect(ej.ok).toBe(false)
    expect(ej).toHaveProperty("file", "public/data/ej/data.csv")
    expect(ej).toHaveProperty("check")
    expect(ej).not.toHaveProperty("reason")

    // EJ features are off: ejStats returns undefined; Fitchburg -> Leominster still resolves.
    expect(ejStats(bad, "LAWRENCE")).toBeUndefined()
    expect(companyCodes(matchTown(bad, "Fitchburg")!)).toEqual(["Unitil (Fitchburg Gas & Electric)"])
    expect(companyCodes(matchTown(bad, "Leominster")!)).toEqual(["National Grid (Massachusetts Electric)"])
  })
})

// ---------- P12 parser part (tier 1, Req 13.4) ----------

// Build CSV text from generated cells, parse it, and check missing is not zero. A blank (unquoted
// empty) cell -> null; "0" stays "0" (and is 0 where numeric); "Not Available" stays text.
describe("P12 — missing is not zero (parser)", () => {
  // One generated cell can be: a blank, "0", an integer, a decimal, or "Not Available".
  const cellArb = fc.oneof(
    fc.constant({ raw: "", kind: "blank" as const }),
    fc.constant({ raw: "0", kind: "zero" as const }),
    fc.integer({ min: 1, max: 9999 }).map((n) => ({ raw: String(n), kind: "int" as const })),
    fc
      .tuple(fc.integer({ min: 0, max: 99 }), fc.integer({ min: 1, max: 9999 }))
      .map(([a, b]) => ({ raw: `${a}.${b}`, kind: "dec" as const })),
    fc.constant({ raw: "Not Available", kind: "text" as const }),
  )

  it("P12 property: blank -> null, '0' -> '0' (numeric 0), numbers parse, 'Not Available' kept", () => {
    fc.assert(
      fc.property(fc.array(cellArb, { minLength: 1, maxLength: 8 }), (cells) => {
        // A single-column CSV: header "v", then one data row per cell. "Not Available" has a space
        // but no comma, so it needs no quoting in a one-column file.
        const text = "v\n" + cells.map((c) => c.raw).join("\n") + "\n"
        const { header, rows } = parseCsv(text)
        expect(header).toEqual(["v"])
        expect(rows).toHaveLength(cells.length)

        cells.forEach((c, i) => {
          const cell = rows[i][0]
          if (c.kind === "blank") {
            // Missing is null — never 0.
            expect(cell).toBeNull()
          } else if (c.kind === "zero") {
            expect(cell).toBe("0")
            expect(Number(cell)).toBe(0)
          } else if (c.kind === "int" || c.kind === "dec") {
            expect(cell).toBe(c.raw)
            expect(Number(cell)).toBeCloseTo(Number(c.raw), 9)
          } else {
            // Not Available kept as text, never coerced to a number.
            expect(cell).toBe("Not Available")
          }
        })
      }),
      { numRuns: 300 },
    )
  })

  it("maps a blank limited_english_hh_pct to null, never 0 (EjRow mapping)", () => {
    // Synthesize a tiny valid-shaped ej cell set and run it through the same mapping loadKits uses,
    // by parsing a one-row body and checking the null-vs-0 distinction the EjRow mapper enforces.
    const { rows } = parseCsv(
      "municipality,population,minority_pct,limited_english_hh_pct,block_group_income,ej,criteria\n" +
        "Testville,100,10,,50000,Yes,Income\n" +
        "Zeroville,100,10,0,50000,Yes,Income\n",
    )
    const blankCell = rows[0][3]
    const zeroCell = rows[1][3]
    expect(blankCell).toBeNull() // blank -> null
    expect(zeroCell).toBe("0") // literal zero stays "0"
    const mappedBlank = blankCell === null || blankCell === "" ? null : Number(blankCell)
    const mappedZero = zeroCell === null || zeroCell === "" ? null : Number(zeroCell)
    expect(mappedBlank).toBeNull()
    expect(mappedZero).toBe(0)
  })

  it("real Harwich limited_english_hh_pct is a real 0 (EjRow), not null", () => {
    // Harwich's first ej Yes row has limited_english_hh_pct == 0 in the saved kit.
    if (kits.ej.ok) {
      const harwich = kits.ej.rows.filter((r) => r.key === "HARWICH" && r.ej === "Yes")
      expect(harwich.length).toBeGreaterThan(0)
      // At least one Harwich row carries a real 0 (not null).
      expect(harwich.some((r) => r.limitedEnglishHhPct === 0)).toBe(true)
      // None of the real rows in this copy is null (the source has no blanks), so Harwich's mean is defined.
      const view = ejStats(kits, "HARWICH")
      expect(view?.kind).toBe("mean")
    }
  })
})
