# Bugfix: Next on the Leominster path opened Handoff instead of Checklist

Source: QA report `research/qa-dwight.md` (Dwight, 6:24 PM ET), BUG 1.

## Reported behaviour

Keyboard only, headless Edge, 375×812, `http://localhost:4318/`. Leominster → Household language Spanish → "Next: Program" → Space on the first program radio (National Grid Outage Life Support) → Tab to "Next: Checklist", Enter.

- Expected: the Checklist step is selected and its heading is shown.
- Actual: "4 Handoff" was `aria-selected`, the checklist heading was absent, and Print handoff / Imprimir en español were on screen. "Back: Checklist" then removed the print sheet, and "Next: Handoff" was not in the page.

## Reproduction on the current build

Not reproduced. Dwight tested an earlier build: the tabbed flow lived in an older `src/App.tsx`, served on :4318. The current build moved the flow to `src/screens/Workspace.tsx`. A headless Edge run at 6:41 PM on the current build did Leominster → pick Outage Life Support; the only Next button on the page was "Next: Checklist", and it opened Checklist.

## Likely root cause (old build, not confirmed)

In the old build each Tabs panel rendered its own Back/Next row, so more than one Next control was in the DOM at once. A Tab from the program radio could land on a different panel's Next (for example the Checklist panel's "Next: Handoff"), which matches both symptoms: Handoff opened, and from Handoff "Back: Checklist" worked while "Next: Handoff" was gone. We could not rerun the old build to prove it.

The current `Workspace.tsx` has one nav row outside every `TabsContent`, computed from the single current step. That shape cannot show two Next buttons.

## What this spec changes

- Current: the step order, availability, current-step fallback and next/prev logic are private to `Workspace.tsx` and have no test.
- Expected: that logic is a pure, exported module `src/screens/step-order.ts` (`STEP_ORDER`, `stepAvailability(vm)`, `currentStep(step, vm)`, `nextStep(current, vm)`, `prevStep(current, vm)`), used by `Workspace.tsx`, with a test that pins Next to the following step for every enabled program.
- Unchanged: rendered UI and behaviour of `Workspace.tsx`; `src/state`, `src/rules`, `src/lib`, every existing test. Bans stay binding; Holyoke stays blocked (ban 8), so its Program step stays unavailable.
