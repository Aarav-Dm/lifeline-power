import { describe, expect, it } from "vitest"

import { companyCodes, loadKits, norm } from "../lib/kits.ts"
import { disagreementNotice, UNITIL_DISAGREEMENTS, UNITIL_PAGE_URL } from "./disagreements.ts"

const kits = loadKits(["mvp"])

describe("Unitil page vs state table", () => {
  it("each listed town resolves in the kit to the company recorded here (West Townsend: not in the table)", () => {
    for (const d of UNITIL_DISAGREEMENTS) {
      const row = kits.utilities.find((u) => u.key === norm(d.town))
      if (d.stateTableCode === null) {
        expect(row).toBeUndefined()
      } else {
        expect(row).toBeDefined()
        expect(companyCodes(row!)).toEqual([d.stateTableCode])
      }
      expect(d.pageUrl).toBe(UNITIL_PAGE_URL)
    }
    expect(disagreementNotice("Leominster")).toBe(
      "Unitil's life-support page also lists Leominster. The state table assigns it to National Grid (Massachusetts Electric). This tool follows the state table.",
    )
    expect(disagreementNotice("Fitchburg")).toBeUndefined()
  })
})
