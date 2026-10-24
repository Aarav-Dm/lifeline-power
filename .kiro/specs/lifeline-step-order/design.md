# Design: lifeline-step-order

## Module

`src/screens/step-order.ts`, no React import, imports only `ViewModel` from `@/types`.

- `STEP_ORDER: readonly StepId[] = ["town", "program", "checklist", "handoff"]`
- `stepAvailability(vm)`: `town` always; `program` when `vm.status` is `program-choice` or `program-open`; `checklist` when `program-open`; `handoff` when `vm.canPrint`. Same as the old private `availability`.
- `currentStep(step, vm)`: `step` if available, else `"town"`. Same as the old inline fallback.
- `nextStep(step, vm)` / `prevStep(step, vm)`: the neighbour of `currentStep(step, vm)` in `STEP_ORDER`, or `undefined` at the ends. Not gated by availability: Workspace still renders Next disabled when the next step is unavailable (Holyoke: Next: Program shown, disabled).

## Workspace

Labels stay in `Workspace.tsx` (`STEP_LABEL`). `current`, `prev`, `next` and `available` come from the helper. One nav row, outside every `TabsContent`, unchanged.

## Test (`tests/step-order.test.ts`)

- `STEP_ORDER` equals the four ids exactly.
- For every `PROGRAMS` record whose tier is in `ENABLED_TIERS`: pick a town whose `companyCodes(row)` is exactly `[companyCode]`, `SELECT_TOWN`, `PICK_PROGRAM`, `derive`; assert town→program→checklist→handoff→undefined.
- Leominster with `ng-outage` and `ng-medical` explicitly (the reported path).
- Holyoke: `nextStep("town")` is `"program"`, `stepAvailability(vm).program` is false.
