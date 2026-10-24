# LifeLine Power — Frontend contract

Version 1, 24 Oct 2026, 5:00 PM ET. This is the one visual contract for the build. It sits under `.kiro/steering/bans.md` and `.kiro/specs/lifeline/` (requirements, design, tasks): if anything here conflicts with them, the bans and the spec win. MVP scope is unchanged by this doc.

## 1. Skills and what each one decides

| Skill (`.kiro/skills/`) | Used for | Output in this doc |
|---|---|---|
| `frontend-design` | Visual direction, the one signature element | §2 |
| `ui-ux-pro-max` | Palette, type, spacing. Ran `python .kiro/skills/ui-ux-pro-max/scripts/search.py "healthcare care coordinator utility medical program checklist accessible trustworthy" --design-system -p "LifeLine Power"` | §4 tokens |
| `apple-design` | Clarity, hierarchy, plain labels, instant feedback, 44 px touch targets, reduced motion | §3, §6 |
| `shadcn` | Every control. No hand-rolled controls | §5 |
| `impeccable` | Critique pass before the 6:30 gate and the 7:20 freeze | §8 |

What I took from `ui-ux-pro-max`: style "Accessible & Ethical" (high contrast, 16 px+ text, visible focus, semantic HTML), the medical-teal palette, Figtree + Noto Sans, 3–4 px focus rings, 44×44 px targets, its anti-patterns (no neon, no heavy motion, no purple/pink gradients). What I rejected: its page pattern ("Waitlist/Coming Soon", countdown, email capture) does not fit a work tool; its secondary `#22D3EE` and CTA green `#22C55E` fail 4.5:1 on white, so they are not used for text or buttons.

## 2. Visual direction

The subject is a paper routing slip that travels between a care coordinator, a clinician and a utility. The page's one job: show the right company's program and the next step, with who owns it.

- **Tone:** calm, clinical, plain. A work tool, not a landing page. No hero, no stats strip, no illustrations.
- **Signature element: the "Next step" band.** The top of every open program card is one full-width band: `Next step · {step label} · Owner: {owner text}`. It is the thing a coordinator reads first and the first line of the printout. Everything else on the page stays quiet.
- **Sources as readable links:** no superscript markers. Each rule sentence ends with a plain text link naming its source (e.g. "Source: Unitil MALFORM-MA PDF"), and the card ends with a source list showing each title and full URL. On screen each link has a 44 px tall tap target (`inline-flex min-h-11 items-center`). Verbatim quotes are in a `blockquote` with a left rule; paraphrases are plain text labelled "paraphrase".
- **Motion:** none beyond 150 ms colour/opacity transitions on hover and focus. No layout-shifting transforms. All motion off under `prefers-reduced-motion`.

## 3. Screens

One page, single column, max width 768 px (`max-w-3xl`), centred. Order top to bottom = keyboard order.

```
┌──────────────────────────────────────────────┐
│ LifeLine Power                               │
│ Finds the program for this town.             │
│ Does not submit or confirm anything.         │
├──────────────────────────────────────────────┤
│ Town  [ Fitchburg____________ ] [Find]       │  MVP: Input + Button (Enter)
│ Company: [Unitil (Fitchburg Gas & Electric)] │  Badge per company code
├──────────────────────────────────────────────┤
│ ▌Next step · Physician section… · Owner: …   │  signature band
│ Unitil — life-support identification         │
│ Purpose: outage notification                 │
│ Signer · Renewal · Return (fax, mail)        │
│ Steps (field / send / waiting)               │
│ Sources (text links)  UNVERIFIED badges       │
│ [ Print handoff ]                            │
└──────────────────────────────────────────────┘
```

| Screen / state | Tier | Content |
|---|---|---|
| Idle | MVP | Town field, hint "Type a Massachusetts town and press Enter". |
| Town search | MVP: `Input` matched on Enter. Tier 1: `Command` combobox in a `Popover` over the 351 towns | Company line as `Badge`s from `utility_code`. |
| Mixed town (18 rows) | MVP | `Alert` (neutral): "This town has more than one company. Pick the one printed on the bill." `RadioGroup` of company codes. No card until picked. |
| Blocked: Holyoke | MVP | `Alert` (warning): company name, "No form opened. No checklist." No card, no print. |
| Blocked: no record in this build | MVP | `Alert` (warning): exact company code, "No form loaded for this company in this build. No checklist." |
| Not found | MVP | `Alert` (neutral): "Not in the saved 351-town table." |
| Program card | MVP: one record auto-opens. Tier 1: `RadioGroup` choice between two records first | Next-step band, header (company as printed, program name, purpose `Badge`), signer, renewal box, return channels, steps list with owner, fields, sources, UNVERIFIED badges, Print button. |
| Unitil renewal box | MVP | Two separately labelled lines: "Outage-list renewal: No interval stated in the opened sources" and "Separate shutoff-protection certificate (220 CMR 25.03): …". 3/6/12 shown as "Clinician's anticipated length of the condition — not a protection period". |
| Tracker | Tier 1 | Three labelled items in a row: Prepared, Submitted, Confirmed. Confirmed is always muted text "Only {company} can confirm" with a lock icon; it is not a control. |
| Language + EJ sort | Tier 1 | `Select` "Household language" (default "Not chosen"), visually separate from the sort; town rows show `mean% · n=NN` with the full label "unweighted mean across EJ block groups — not a town-wide rate". |
| Facilities, FEMA | Tier 2 | Two `Card`s labelled by source file, "Same town — verify by phone. Not ranked by distance."; FEMA line "Historical declaration — not a forecast". |
| Print page | MVP | §7. |

Criterion each screen serves (`.kiro/steering/judging.md`):

| Screen / element | Criterion |
|---|---|
| Town search, company line | Potential Value (one town in; all 351 towns) |
| Mixed, blocked, not-found states | Quality and Design (honest states, never guessed) |
| Program card, source links, UNVERIFIED badges | Quality and Design (unique public data, honest gaps); Potential Value |
| "Next step" band | Potential Value (the coordinator knows the open step and owner); Quality and Design (signature element) |
| Tracker (tier 1) | Quality and Design (unconfirmed shown as unconfirmed) |
| Language + EJ sort (tier 1) | Potential Value (equity and language access) |
| Facilities, FEMA (tier 2) | Quality and Design (unique data, honest empty lists) |
| Print page | Potential Value (paper handoff for people without devices) |
| Tokens, contrast, keyboard, 44 px targets | Potential Value (accessibility); Quality and Design (polish) |
| shadcn components, `impeccable` critique | Quality and Design (polished, intentional UI) |

## 4. Tokens

Map these onto the shadcn CSS variables in `src/index.css` (`--background`, `--foreground`, `--primary`, …). Light theme only; the scaffold's dark theme is not used in the demo.

**Colour** (contrast measured against the background it sits on)

| Token | Hex | Use | Contrast |
|---|---|---|---|
| `background` | `#F0FDFA` | Page | — |
| `card` | `#FFFFFF` | Cards, inputs | — |
| `foreground` | `#134E4A` | Body and headings | 9.1:1 on `background` |
| `muted-foreground` | `#475569` | Secondary text, labels' hints | 7.6:1 on white |
| `primary` | `#0E7490` | Buttons, links, focus ring | 5.4:1 on white; white text on it 5.4:1 (computed 5.36) |
| `accent` | `#CFFAFE` | Next-step band background (text stays `foreground`) | `foreground` on it 8.5:1 |
| `border` | `#64748B` | Input and card borders | 4.8:1 on white (≥3:1 for UI parts) |
| `warning` bg / text | `#FFFBEB` / `#92400E` | Blocked alerts, UNVERIFIED badge | 6.8:1 |
| `destructive` | `#B91C1C` | Kit-load error only | 6.5:1 on white |

`#0891B2` (the skill's primary) is decorative only (icons ≥24 px, rules); it is 3.7:1 on white (`#22D3EE` 1.8:1, `#22C55E` 2.3:1), so never text.

**Type:** Figtree Variable (`@fontsource-variable/figtree`) for headings, Noto Sans (`@fontsource/noto-sans`) for body, self-hosted (`pnpm add`), replacing the scaffold's Geist import. No Google Fonts CDN: the app makes no runtime network call. Scale: body 16 px / 1.5; small 14 px (never below); H3 18 px 600; H2 20 px 600; H1 24 px 700. Tabular numbers for faxes and phones (`font-variant-numeric: tabular-nums`).

**Spacing:** Tailwind's 4 px scale only: 4, 8, 12, 16, 24, 32, 48. Card padding 24; gap between sections 32; between fields 16. Radius: set `--radius: 0.5rem` in `src/index.css` so `rounded-lg` is 8 px. Touch targets ≥44×44 px (`h-11` buttons and inputs).

## 5. Component map (shadcn names)

Add with `pnpm dlx shadcn@latest add <name>`. MVP set: `input label button badge card alert radio-group checkbox select separator`. Tier 1 adds `command popover`.

| UI piece | shadcn component |
|---|---|
| Town field (MVP) | `Label` + `Input` + `Button` "Find" (Enter submits) |
| Town combobox (tier 1) | `Popover` + `Command` (`CommandInput`, `CommandList`, `CommandItem`, `CommandEmpty` "Not in the saved 351-town table") |
| Company line | `Badge` (`variant="outline"`) per company code |
| Mixed-town pick, program choice | `RadioGroup` + `RadioGroupItem` + `Label` |
| Blocked, not found, kit error, stretch-kit notice | `Alert` + `AlertTitle` + `AlertDescription`. shadcn ships only `default` and `destructive`; add a `warning` variant to the `cva` call in `src/components/ui/alert.tsx` (warning tokens from §4) plus a lucide `TriangleAlert` icon. Never a hand-rolled alert. |
| Program card, facilities panels | `Card` + `CardHeader` + `CardTitle` + `CardContent` + `CardFooter` |
| Purpose, UNVERIFIED, tracker words | `Badge` (text always present; colour never the only signal) |
| Yes-no, consent, "I sent this" | `Checkbox` + `Label`, or `RadioGroup` for yes-no |
| Text fields (name, address, account) | `Label` + `Input` |
| Language, low-income outcome, device | `Select` |
| Section breaks | `Separator` |
| Print | `Button` → `window.print()` |
| Icons | `lucide-react` only (24 px). No emoji |

## 6. States per panel

| Panel | Empty | Blocked | Error |
|---|---|---|---|
| Town | Hint text | — | "Not in the saved 351-town table" |
| Company | — | Holyoke / no-record `Alert` (§3) | Utilities kit invalid: full-page `Alert` naming the file and check (R13.10) |
| Program card | Not rendered until a company resolves | Not rendered | — |
| Steps | Each open step says what is missing ("Not answered") | — | — |
| Tracker (tier 1) | "Not started" | Not rendered | — |
| EJ (tier 1) | "No EJ block groups" | — | Kit invalid: inline notice naming `ej`; town lookup keeps working (R13.11) |
| Facilities / FEMA (tier 2) | "No rows in this file for {town}" + typed contact; FEMA "Type a county to see the last saved declaration" | — | Kit invalid: inline notice for that panel only |

Every status is text first, colour second (R14.4).

## 7. Print (one US Letter page, black on white)

Only the `<Handoff>` block prints. Non-print UI uses `display: none` (not `visibility: hidden`, which keeps its space and can push the handoff onto a second page). On screen `<Handoff>` is `hidden`; in print it is `block`. No colour, no backgrounds, no shadows, no icons.

```css
@page { size: letter; margin: 0.5in; }
@media print {
  .no-print { display: none !important; }       /* every non-handoff region: header, town, card, buttons */
  #handoff { display: block !important; color: #000; background: #fff;
             font: 11pt/1.4 "Noto Sans", sans-serif; }
  #handoff * { color: #000 !important; background: transparent !important;
               box-shadow: none !important; border-color: #000 !important; }
  #handoff a::after { content: " (" attr(href) ")"; word-break: break-all; }
  #handoff section { break-inside: avoid; }
}```

Handoff order: title "Handoff — synthetic demo household" · Next step + owner (bold, first) · town, company code, program, purpose · every step with owner · renewal (Unitil: both labelled lines) · return channel(s) · source URLs in full · advisory line only if stored on the record (ban 15) · tracker word only in tier 1. Never the word Confirmed as a status. Check in browser print preview that it fits one US Letter page (task 6 accept).

## 8. Accessibility and critique gates

**MVP (by 6:30):** WCAG AA contrast is an explicit check: every text colour ≥4.5:1 and every UI border ≥3:1 against its background (§4 values were computed, not estimated; recompute if a token changes); visible label on every control; demo path by keyboard alone with a 3 px `primary` focus ring (`focus-visible:ring-[3px]`); status in text; contrast AA per §4; semantic landmarks (`header`, `main`); one `h1`.

**Tier 1 (task 14a):** full keyboard-order pass, 375 px width with no horizontal scroll, 200% zoom, `prefers-reduced-motion`.

**`impeccable` critique** before the 6:30 gate and again before the 7:20 freeze: run `/impeccable audit` (accessibility, contrast, states) and `/impeccable critique` on the running page. Its loader needs a PRODUCT.md; point it at `docs/` with `IMPECCABLE_CONTEXT_DIR=docs`, where `PRD.md` and this file are the product and design context. Fix only findings that keep within the spec and bans; log the rest.



