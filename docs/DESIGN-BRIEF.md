# LifeLine Power: redesign brief (v2, 24 Oct, 6:20 PM)

Use this file three ways: as Stanley's build contract, as a prompt for Google Stitch, and as a prompt for Claude design. Section 1 is the paste-ready prompt. Sections 2 to 6 are the contract.

## 1. Paste-ready prompt (Stitch or Claude design)

Design a calm, confident, premium web app called **LifeLine Power** for hospital and community care coordinators in Massachusetts. A coordinator helps a patient who depends on electrically powered medical equipment (oxygen concentrator, ventilator, CPAP) get onto the right electric company's medical programs. The app finds the town's electric company, shows that company's own programs side by side (an outage-notification list versus shutoff protection for unpaid bills, which people often confuse), walks the coordinator through a checklist, and produces a one-page printable handoff that names the unfinished step and who owns it.

Mood: trustworthy clinical tool, not a hospital website. Think Linear meets a well-designed health record: generous white space, crisp hierarchy, one deep teal brand colour with a warm amber accent for "action needed", soft neutral greys, subtle depth (1 px borders, very soft shadows), rounded 12 px cards, Figtree for headings and Noto Sans for body. Light mode first, with a matching dark mode.

Screens:
1. **Home dashboard.** Left sidebar (Home, New handoff, Coverage, Sources, About) with the logo at top. A top bar with a large town search (command-palette style, shortcut Ctrl K) and a "New handoff" primary button. Below: four KPI cards (Towns with a program loaded: 293 of 351; Environmental-justice block groups covered: 92.5%; Program records: 7; Electric companies loaded: 4 (Unitil, National Grid, Eversource, Wellesley)). A "Recent handoffs" list showing demo rows with town, company, next step, owner chip and status badge (Prepared, Submitted, Waiting for utility). A "Next forms to open" ranked bar list (Holyoke 29, Braintree 22, Taunton 19).
2. **Handoff workspace** (the core screen). Three columns on desktop. Left: a vertical stepper (1 Town, 2 Program, 3 Checklist, 4 Handoff) with done/current states. Centre: the current step's content in cards. Right: a sticky live "Handoff preview" card that fills in as the coordinator works: town, company, program, next step band (amber rail, "Next step: Clinician faxes the physician section within 7 days", owner chip), renewal rule, where to send it. The **Next step band** is the signature element and appears at the top of the centre column too.
   - Town step: big search with suggestions showing each town's limited-English average as a small muted badge; a company result card with the company logo-free name, a "Source disagreement" info alert when two official sources disagree, and a blocked state card ("No form opened for this company. Nothing is guessed.").
   - Program step: two program cards side by side with clear titles ("Outage notification list" vs "Shutoff protection"), a short "What it does / What it does not do" comparison, quoted source sentences in a subtle quote style with a source link, and a radio choice.
   - Checklist step: grouped form fields in cards, a tracker with three stages (Prepared, Submitted, Waiting for the utility) where the last stage can never be set by the app.
   - Handoff step: an on-screen preview of the printable page, buttons "Print handoff" and "Imprimir en español".
3. **Coverage.** A table of all 351 towns with company, programs loaded (badge), environmental-justice average with n, filters and sort.
4. **Sources.** A table of every source: title, publisher, link, date opened, and an "Unverified" badge where something is not confirmed.
5. **About.** The problem in two sentences, the figure "45,895 Massachusetts Medicare beneficiaries rely on electricity-dependent medical equipment" with its source (HHS emPOWER), and the honest limits: does not submit, does not confirm, not medical or legal advice, demo data is synthetic.

Accessibility: WCAG AA contrast, visible focus rings, 44 px targets, keyboard-first, works at 375 px wide (sidebar becomes a top sheet), no motion that ignores reduced-motion.

## 2. Build contract for Stanley (Kiro)

- **Do not change** `src/state/`, `src/rules/`, `src/lib/` logic or any test. Only layout, components and styles. All tests and `pnpm build` stay green.
- The 4 MVP checks must still pass: Fitchburg card with fax and Concord address; print is one page; Leominster clears Unitil answers; Holyoke blocked.
- Print stays plain black on white, one US Letter page. Screen redesign must not leak into print CSS.
- KPI numbers come from code (`coverage.ts`, `PROGRAMS`), never typed in. "Recent handoffs" rows are clearly labelled demo data.
- No runtime network calls. Components from 21st.dev or shadcn are copied into the repo as code.
- Keep the honest states: blocked, mixed (pick the company printed on the bill), unverified, waiting for utility.

## 3. Skills and tools, each with a job (log every use in `docs/kiro-notes.md`)

| Skill / tool | Job in this redesign |
|---|---|
| `frontend-design` | Direction and the signature Next-step band |
| `ui-ux-pro-max` | Run its `--design-system` search again for "clinical coordinator dashboard"; tokens |
| `apple-design` | Hierarchy, spacing rhythm, labels, 44 px targets, motion restraint |
| `shadcn` | Sidebar, Command (Ctrl K), Card, Tabs, Table, Badge, Alert, Tooltip, Sheet, Chart if quick; install with `pnpm dlx shadcn@latest add <name>` |
| `web-design-guidelines` (Vercel) | Audit the finished UI against its rules |
| `vercel-react-best-practices` (Vercel) | Component structure and render performance check |
| `vercel-composition-patterns` (Vercel) | Layout composition for the shell and workspace |
| `impeccable` | Final critique pass; fix the top issues |
| 21st.dev MCP (only if Aarav has connected it) | `search` / `get_component` for a polished sidebar, KPI card and stepper; adapt to shadcn tokens |

## 4. Tokens

- Brand teal `#0E6E7A` (text on white passes AA), teal tint `#E6F4F5`, amber accent `#B45309` for action needed (AA on white), neutral greys from shadcn `zinc`, success `#15803D`, danger `#B91C1C`.
- Radius 12 px cards, 8 px controls. Shadow: `0 1px 2px rgb(0 0 0 / 0.05)`; elevated cards `0 4px 16px rgb(0 0 0 / 0.06)`.
- Type: Figtree 600/700 headings (32/24/18), Noto Sans 400/500 body 15/14.
- Spacing scale 4, 8, 12, 16, 24, 32, 48.

## 5. Order of work (stop starting new items at 7:05)

1. Shell: sidebar + top bar + routes (Home, Workspace, Coverage, Sources, About). 
2. Workspace three-column layout with the live preview.
3. Home dashboard KPIs and lists.
4. Coverage and Sources tables.
5. Dark mode toggle (theme provider already exists).
6. impeccable + web-design-guidelines audit, fix top issues.

## 6. Done when

All screens above exist, the 4 MVP checks pass in a browser, tests and build are green, print is one page, and each skill or tool used has a line in `docs/kiro-notes.md`.
