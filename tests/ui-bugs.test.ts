// Regression tests for .kiro/specs/lifeline-ui-bugs (B1-B4).
// The fixes were made by hand on the dev server; these keep them in place.
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import type { Ctx } from "../src/types"
import { loadKits } from "../src/lib/kits"
import { derive } from "../src/state/derive"
import { initialState, reduce } from "../src/state/reducer"

const ROOT = join(import.meta.dirname, "..")
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8")
const NG_LIVE_FORM = "https://www.nationalgridus.com/Form/MA-Electric-Outage-Life-Support-Form"

describe("lifeline-ui-bugs regression (source checks)", () => {
  it("B1: index.html tab title is LifeLine Power", () => {
    const html = read("index.html")
    expect(html).toContain("<title>LifeLine Power</title>")
    expect(html).not.toMatch(/<title>\s*vite/i)
  })

  it("B2: HouseholdLanguage renders the option label, not the raw value", () => {
    const t = read("src", "components", "HouseholdLanguage.tsx")
    expect(t).toMatch(/\{\s*value:\s*"not-chosen",\s*label:\s*"Not chosen"\s*\}/)
    // SelectValue must have a render child that maps value -> OPTIONS label.
    expect(t).toMatch(/<SelectValue>\s*\{\s*\(v[^)]*\)\s*=>\s*OPTIONS\.find\([^\n]*?\)\?\.label/)
    expect(t).not.toMatch(/<SelectValue\s*\/>/)
  })

  it("B3: TownCombobox focuses the filter and clears it on every open", () => {
    const t = read("src", "components", "TownCombobox.tsx")
    expect(t).toMatch(/<CommandInput[^>]*\bautoFocus\b/)
    expect(t).toMatch(/onOpenChange=\{\(o\)\s*=>\s*\{\s*if\s*\(o\)\s*setQuery\(""\)/)
  })

  it("B4: ProgramCard renders web return channels as a wrapping link", () => {
    const t = read("src", "components", "ProgramCard.tsx")
    expect(t).toMatch(/c\.kind === "web"[\s\S]{0,120}<a\s+href=\{c\.text\}/)
    const anchor = t.match(/<a\s+href=\{c\.text\}[\s\S]*?>/)?.[0] ?? ""
    expect(anchor).toContain("break-all")
  })
})

describe("lifeline-ui-bugs regression (view model)", () => {
  const ctx: Ctx = { kits: loadKits(["mvp", "tier1"]), enabledTiers: ["mvp", "tier1"] }

  it("B4: ng-outage 'Send it to' is the live-form URL on the card and the handoff", () => {
    let s = reduce(initialState, { type: "SELECT_TOWN", key: "LEOMINSTER" }, ctx)
    s = reduce(s, { type: "PICK_PROGRAM", id: "ng-outage" }, ctx)
    const vm = derive(s, ctx)
    expect(vm.card?.recordId).toBe("ng-outage")
    expect(vm.card?.returnChannels).toEqual([
      expect.objectContaining({ kind: "web", text: NG_LIVE_FORM, sourceId: "ng-live" }),
    ])
    expect(vm.handoff?.returnChannels).toEqual([`Online: ${NG_LIVE_FORM}`])
  })
})
