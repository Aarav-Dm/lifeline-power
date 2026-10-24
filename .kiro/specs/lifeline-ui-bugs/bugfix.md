# Bugfix: LifeLine UI bugs (dev-server pass)

Status: all four bugs were found on the dev server and fixed by hand at about 5:52-6:05 PM, before this spec was written. This spec records each one honestly, names its root cause, and adds a regression test so it cannot come back unnoticed. No app code is changed by this spec unless a regression test fails.

Bans in `.kiro/steering/bans.md` stay binding. None of these fixes adds rule text to a component, merges programs, carries state across a town change, or infers a language.

## B1. Browser tab title was "vite-app"

- Current (before fix): the tab read "vite-app", the Vite scaffold default.
- Expected: the tab reads "LifeLine Power".
- Unchanged: `index.html` stays the Vite entry; `<html lang="en">`, the viewport meta and the `/src/main.tsx` module script are untouched.
- Root cause: `index.html` `<title>` was never edited after `pnpm create vite`.
- Regression check: `index.html` contains `<title>LifeLine Power</title>`.

## B2. Household language showed "not-chosen"

- Current (before fix): the Select trigger showed the raw value `not-chosen` (and `English`, etc. by value) instead of the label.
- Expected: the trigger shows the option label, "Not chosen" by default (ban 9: language starts "Not chosen").
- Unchanged: the stored value is still `"not-chosen"`; the reducer, `Language` type, and the rule that language only changes when the person changes it.
- Root cause: in `src/components/HouseholdLanguage.tsx`, `<SelectValue />` had no children. The shadcn Select (Base UI) renders the raw value when no label render is given; it does not look up the matching `SelectItem` text before the popup has mounted.
- Regression check: `HouseholdLanguage.tsx` passes a render function to `SelectValue` that maps the value to `OPTIONS[].label`, with "Not chosen" as the fallback.

## B3. Town filter lost keystrokes and kept old text

- Current (before fix): (a) typing right after opening the town list did not go into the filter box; (b) reopening the list kept the previous filter, so Leominster then Holyoke submitted "LeominsterHolyoke" as an unmatched town.
- Expected: opening the list puts focus in the filter box, and every open starts with an empty filter.
- Unchanged: Enter on an unmatched filter still submits it as unmatched (not-found message); selecting a town still clears answers per ban 2; the EJ sort and its label are unchanged.
- Root cause: in `src/components/TownCombobox.tsx`, `CommandInput` had no `autoFocus`, so focus stayed on the trigger button; and `query` state lived in the component with nothing resetting it, so it survived close/reopen.
- Regression check: `CommandInput` has `autoFocus`, and the Popover `onOpenChange` calls `setQuery("")` when opening.

## B4. National Grid "Send it to" looked empty

- Current (before fix): for National Grid Outage Life Support the "Send it to" row showed "Online:" with no visible address.
- Expected: the row shows the live-form URL as a link that wraps inside the card.
- Unchanged: the record (`src/rules/programs.ts`, `ng-outage`) is not changed; it already carried `https://www.nationalgridus.com/Form/MA-Electric-Outage-Life-Support-Form` with `sourceId: "ng-live"`. Fax and mail channels still render as text. The renewal stays exactly "No interval stated" (ban 3).
- Root cause: `src/components/ProgramCard.tsx` rendered the long unbroken URL as plain text in a grid cell with no wrapping, so it overflowed out of view. The data was never missing.
- Regression check: `ProgramCard.tsx` renders `web` channels as an `<a href={c.text}>` with `break-all`; a derive-level test confirms `ng-outage`'s card and handoff return channel is the live-form URL.
