// Pure step logic for the Workspace flow. No React import; tests import this.
import type { ViewModel } from "@/types"

export type StepId = "town" | "program" | "checklist" | "handoff"

export const STEP_ORDER: readonly StepId[] = ["town", "program", "checklist", "handoff"]

/** Which steps can be opened, from derive() output only. */
export function stepAvailability(vm: ViewModel): Record<StepId, boolean> {
  return {
    town: true,
    program: vm.status === "program-choice" || vm.status === "program-open",
    checklist: vm.status === "program-open",
    handoff: vm.canPrint,
  }
}

/** The step actually shown: the requested one if it can be opened, else Town. */
export function currentStep(step: StepId, vm: ViewModel): StepId {
  return stepAvailability(vm)[step] ? step : "town"
}

/** The step after the shown one, or undefined at the end. Not gated: the UI disables it when unavailable. */
export function nextStep(step: StepId, vm: ViewModel): StepId | undefined {
  return STEP_ORDER[STEP_ORDER.indexOf(currentStep(step, vm)) + 1]
}

/** The step before the shown one, or undefined at the start. */
export function prevStep(step: StepId, vm: ViewModel): StepId | undefined {
  const i = STEP_ORDER.indexOf(currentStep(step, vm))
  return i > 0 ? STEP_ORDER[i - 1] : undefined
}
