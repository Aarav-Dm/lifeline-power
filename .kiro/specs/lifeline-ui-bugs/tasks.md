# Tasks: lifeline-ui-bugs

Fixes B1-B4 were applied by hand at about 5:52-6:05 PM. These tasks add the regression protection.

- [x] 1. Record the four bugs with current / expected / unchanged behaviour and root cause (`bugfix.md`).
- [x] 2. Add `tests/ui-bugs.test.ts` source checks
  - B1 `index.html` title is "LifeLine Power"
  - B2 `HouseholdLanguage` renders the option label in `SelectValue`
  - B3 `TownCombobox` `CommandInput` has `autoFocus`; query resets on open
  - B4 `ProgramCard` renders web channels as `<a>` with `break-all`
- [x] 3. Add derive-level check: `ng-outage` return channel is the live-form URL (card and handoff).
- [x] 4. Run `pnpm test`; green. No app code change was needed.
