import { describe, expect, it } from "vitest"

import type { KitSource } from "../src/types.ts"
import { parseCsv } from "../src/lib/csv.ts"
import { KIT_SOURCES } from "../src/lib/kit-sources.ts"
import { loadKits, norm, validateKit } from "../src/lib/kits.ts"

const utilitiesText = KIT_SOURCES.find((s) => s.name === "utilities")!.text

describe("parseCsv — RFC 4180 examples", () => {
  it("parses a quoted field with an embedded comma", () => {
    const { header, rows } = parseCsv('a,b\n"x,y",z\n')
    expect(header).toEqual(["a", "b"])
    expect(rows).toEqual([["x,y", "z"]])
  })

  it('keeps "LAWRENCE, MA" as one field', () => {
    const { rows } = parseCsv('name,municipality\nFoo,"LAWRENCE, MA"\n')
    expect(rows).toEqual([["Foo", "LAWRENCE, MA"]])
  })

  it("accepts CRLF line endings", () => {
    const { header, rows } = parseCsv("a,b\r\n1,2\r\n3,4\r\n")
    expect(header).toEqual(["a", "b"])
    expect(rows).toEqual([
      ["1", "2"],
      ["3", "4"],
    ])
  })

  it("accepts LF line endings", () => {
    const { rows } = parseCsv("a,b\n1,2\n3,4\n")
    expect(rows).toEqual([
      ["1", "2"],
      ["3", "4"],
    ])
  })

  it("maps a blank (unquoted empty) cell to null", () => {
    const { rows } = parseCsv("a,b,c\n1,,3\n")
    expect(rows).toEqual([["1", null, "3"]])
  })

  it('reads a doubled quote ("") as a single literal quote', () => {
    const { rows } = parseCsv('a,b\n"she said ""hi""",z\n')
    expect(rows).toEqual([['she said "hi"', "z"]])
  })

  it("ignores a trailing newline (no extra empty row)", () => {
    const withNl = parseCsv("a,b\n1,2\n")
    const withoutNl = parseCsv("a,b\n1,2")
    expect(withNl.rows).toEqual([["1", "2"]])
    expect(withoutNl.rows).toEqual([["1", "2"]])
  })

  it('distinguishes a quoted empty field ("") from a blank cell', () => {
    const { rows } = parseCsv('a,b\n"",\n')
    expect(rows).toEqual([["", null]])
  })
})

describe("norm", () => {
  it("trims, collapses whitespace and uppercases", () => {
    expect(norm("  fitchburg ")).toBe("FITCHBURG")
    expect(norm("new   bedford")).toBe("NEW BEDFORD")
  })
})

describe("validateKit — real utilities kit", () => {
  it("passes with the exact header and 351 rows", () => {
    const result = validateKit("utilities", utilitiesText)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.header).toEqual(["town", "utility_code", "utility"])
      expect(result.rows).toHaveLength(351)
    }
  })

  it("fails and names public/data/utilities/data.csv when the header is renamed", () => {
    const renamed = utilitiesText.replace(/^town,/, "township,")
    const result = validateKit("utilities", renamed)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.file).toBe("public/data/utilities/data.csv")
      expect(result.check).toMatch(/header/i)
    }
  })

  it("fails on the wrong row count", () => {
    const shortened = utilitiesText.split("\n").slice(0, 10).join("\n")
    const result = validateKit("utilities", shortened)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.file).toBe("public/data/utilities/data.csv")
      expect(result.check).toMatch(/351 rows/)
    }
  })
})

describe("loadKits — fatal on utilities failure", () => {
  it("a renamed utilities header makes loadKits fatal and leaves utilities empty", () => {
    const badUtilities: KitSource = {
      name: "utilities",
      path: "public/data/utilities/data.csv",
      savedAt: "2026-10-18",
      tier: "mvp",
      text: utilitiesText.replace(/^town,/, "township,"),
    }
    const kits = loadKits(["mvp"], [badUtilities])
    expect(kits.fatal).toBeDefined()
    expect(kits.fatal!.file).toBe("public/data/utilities/data.csv")
    expect(kits.utilities).toEqual([])
  })
})

// A KitSource list whose stretch texts are deliberately malformed. If loadKits ever
// parsed a disabled-tier kit, these would surface as {ok:false, file, check} failures.
const malformedStretch = (): KitSource[] => [
  { name: "utilities", path: "public/data/utilities/data.csv", savedAt: "2026-10-18", tier: "mvp", text: utilitiesText },
  { name: "ej", path: "public/data/ej/data.csv", savedAt: "2026-10-18", tier: "tier1", text: "garbage,header\n1,2\n" },
  {
    name: "hospitals",
    path: "public/data/hospitals/data.csv",
    savedAt: "2026-10-18",
    tier: "tier2",
    text: "nope\nx\n",
  },
  {
    name: "cms-hospitals",
    path: "public/data/cms-hospitals/data.csv",
    savedAt: "2026-10-18",
    tier: "tier2",
    text: "nope\nx\n",
  },
  { name: "fema", path: "public/data/fema/data.csv", savedAt: "2026-10-18", tier: "tier2", text: "nope\nx\n" },
]

describe("loadKits — tier gating", () => {
  it('loadKits(["mvp"]) leaves every stretch kit tier-disabled and never parses them', () => {
    const kits = loadKits(["mvp"], malformedStretch())
    expect(kits.fatal).toBeUndefined()
    expect(kits.utilities).toHaveLength(351)
    // Every stretch kit is tier-disabled — proof they were never parsed despite malformed text:
    // a parsed malformed kit would be {ok:false, file, check}, which would FAIL the reason check.
    for (const name of ["ej", "hospitals", "cms-hospitals", "fema"] as const) {
      const entry = kits[name]
      expect(entry.ok).toBe(false)
      expect(entry).toHaveProperty("reason", "tier-disabled")
      expect(entry).not.toHaveProperty("check")
    }
  })

  it('loadKits(["mvp","tier1"]) with malformed ej -> ej ok:false (file/check) but utilities fine', () => {
    const kits = loadKits(["mvp", "tier1"], malformedStretch())
    expect(kits.fatal).toBeUndefined()
    expect(kits.utilities).toHaveLength(351)

    const ej = kits.ej
    expect(ej.ok).toBe(false)
    expect(ej).toHaveProperty("file", "public/data/ej/data.csv")
    expect(ej).toHaveProperty("check")
    expect(ej).not.toHaveProperty("reason")

    // tier2 kits stay disabled (and unparsed) when only mvp+tier1 are enabled.
    for (const name of ["hospitals", "cms-hospitals", "fema"] as const) {
      expect(kits[name]).toHaveProperty("reason", "tier-disabled")
    }
  })

  it("parses a valid enabled stretch kit to {ok:true, rows}", () => {
    const ejSource = KIT_SOURCES.find((s) => s.name === "ej")!
    const kits = loadKits(["mvp", "tier1"], [KIT_SOURCES[0], ejSource])
    const ej = kits.ej
    expect(ej.ok).toBe(true)
    if (ej.ok) expect(ej.rows).toHaveLength(2604)
  })
})
