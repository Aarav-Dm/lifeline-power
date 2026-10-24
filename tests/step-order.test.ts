// Regression tests for .kiro/specs/lifeline-step-order:
// Next on every enabled program opens the following step, never one further.
import { describe, expect, it } from "vitest"
import type { Ctx, RecordId, ViewModel } from "../src/types"
import { companyCodes, loadKits } from "../src/lib/kits"
import { ENABLED_TIERS, PROGRAMS } from "../src/rules/programs"
import { derive } from "../src/state/derive"
import { initialState, reduce } from "../src/state/reducer"
import { STEP_ORDER, nextStep, stepAvailability } from "../src/screens/step-order"

const ctx: Ctx = { kits: loadKits(ENABLED_TIERS), enabledTiers: ENABLED_TIERS }

function vmFor(townKey: string, programId?: RecordId): ViewModel {
  let s = reduce(initialState, { type: "SELECT_TOWN", key: townKey }, ctx)
  if (programId) s = reduce(s, { type: "PICK_PROGRAM", id: programId }, ctx)
  return derive(s, ctx)
}

function expectFullOrder(vm: ViewModel) {
  expect(nextStep("town", vm)).toBe("program")
  expect(nextStep("program", vm)).toBe("checklist")
  expect(nextStep("checklist", vm)).toBe("handoff")
  expect(nextStep("handoff", vm)).toBeUndefined()
}

describe("lifeline-step-order", () => {
  it("STEP_ORDER is exactly town, program, checklist, handoff", () => {
    expect([...STEP_ORDER]).toEqual(["town", "program", "checklist", "handoff"])
  })

  const enabled = PROGRAMS.filter((p) => ENABLED_TIERS.includes(p.tier))

  it("covers at least one enabled program", () => {
    expect(enabled.length).toBeGreaterThan(0)
  })

  for (const p of enabled) {
    it(`${p.id}: Next goes town -> program -> checklist -> handoff -> none`, () => {
      const row = ctx.kits.utilities.find((r) => {
        const codes = companyCodes(r)
        return codes.length === 1 && codes[0] === p.companyCode
      })
      expect(row, `a single-company town for ${p.companyCode}`).toBeDefined()
      const vm = vmFor(row!.key, p.id)
      expect(vm.status).toBe("program-open")
      expect(vm.card?.recordId).toBe(p.id)
      expectFullOrder(vm)
    })
  }

  for (const id of ["ng-outage", "ng-medical"] as RecordId[]) {
    it(`Leominster + ${id}: Next after Program is Checklist (qa-dwight BUG 1)`, () => {
      const vm = vmFor("LEOMINSTER", id)
      expect(vm.card?.recordId).toBe(id)
      expect(stepAvailability(vm)).toEqual({ town: true, program: true, checklist: true, handoff: true })
      expectFullOrder(vm)
    })
  }

  it("Holyoke: Next from Town names Program, but Program is unavailable (blocked)", () => {
    const vm = vmFor("HOLYOKE")
    expect(nextStep("town", vm)).toBe("program")
    expect(stepAvailability(vm).program).toBe(false)
  })
})
