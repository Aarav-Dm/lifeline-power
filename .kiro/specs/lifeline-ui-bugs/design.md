# Design: regression protection for the UI bugs

The fixes are already in the code. The design question is how to keep them without adding a DOM test stack (no jsdom or Testing Library in this repo, and none is added).

## Approach

One file, `tests/ui-bugs.test.ts`, run by `pnpm test` with the rest of the suite.

1. Source checks (B1-B4). Read the file with `node:fs` and assert the fix is present. Same pattern as `tests/static.test.ts`. Cheap and exact, but it checks the code shape, not the rendered pixels.
   - B1: `index.html` contains `<title>LifeLine Power</title>`.
   - B2: `HouseholdLanguage.tsx` has `<SelectValue>` with a render function that looks up `OPTIONS` labels; `OPTIONS` maps `not-chosen` to `"Not chosen"`.
   - B3: `TownCombobox.tsx` has `autoFocus` on `CommandInput` and `if (o) setQuery("")` in `onOpenChange`.
   - B4: `ProgramCard.tsx` renders `c.kind === "web"` as `<a href={c.text}` with `break-all`.
2. Data check (B4). Through the pure layers: `loadKits` -> `reduce` (Leominster, pick `ng-outage`) -> `derive`. Assert the card's single return channel is `web` with the live-form URL and `sourceId` `ng-live`, and the handoff line is `Online: <url>`. This proves the row was never empty in the view model.

## Limits

- Source checks can be fooled by a refactor that keeps the text but breaks behaviour. Browser checks on the dev server remain the final word for focus and wrapping.
- No app code changes unless a test fails.
