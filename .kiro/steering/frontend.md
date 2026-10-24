---
inclusion: always
---
# Frontend

For any UI task, load these five workspace skills from `.kiro/skills/` and follow `docs/FRONTEND.md`, the visual contract:

- `frontend-design` — visual direction and the one signature element (the "Next step" band).
- `ui-ux-pro-max` — palette, type and spacing (already captured in `docs/FRONTEND.md` §4).
- `apple-design` — clarity, hierarchy, plain labels, instant feedback, 44 px touch targets, reduced motion.
- `shadcn` — every control. Components live in `src/components/ui` and are added with `pnpm dlx shadcn@latest add <name>`. Do not hand-roll a button, input, dialog, or any other control that shadcn/ui already provides.
- `impeccable` — critique and audit pass before the 6:30 PM MVP gate and the 7:20 PM freeze.

Skills never override `.kiro/steering/bans.md` or the spec in `.kiro/specs/lifeline/`. They do not change MVP scope. The print page stays plain black on white. No runtime network calls (fonts are self-hosted via `@fontsource`).
