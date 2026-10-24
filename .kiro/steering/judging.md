---
inclusion: always
---
# Judging rules (Hackachusetts official rules, research/site/gdoc.txt)

Every spec, task, UI choice and doc must help at least one criterion and break no requirement. Three criteria, no published weights: never write "33%".

## Hard requirements (break one = disqualified or unscored)
- Built with Kiro. Keep `/.kiro` at the repo root, committed, never in `.gitignore`.
- Track: Healthcare & Biotech, stated in the submission.
- Public GitHub repo with all source, assets and run instructions (README: `pnpm install`, `pnpm dev`, `pnpm test`, live URL).
- Working project link for judges (GitHub Pages), free, no login.
- Video under 3:00, public on YouTube or Vimeo, showing the app running. No third-party trademarks or copyrighted music beyond what is needed to name the utilities.
- Text description of features, and a Kiro write-up.
- All in English. Original work; open-source libraries only under their licenses.

## Potential Value
- Real, clearly defined problem: care coordinators filing the right utility medical form. Show who benefits and how it scales (more towns, more companies, more languages).
- Accessibility and equity: WCAG AA contrast, keyboard use, plain language, Spanish-first reasoning backed by the EJ and ACS data, print for people without devices.
- Easy to use: one town in, one handoff out.

## Implementation (Kiro use; also decides Best Use of Kiro)
- Use and record real Kiro features: Spec agent specs, steering (always + fileMatch), hooks, property-based tests tied to requirements, skills, sub-agents, CLI and IDE, MCP only if built.
- Keep notes for the write-up as you go: what each feature caught or sped up. Claim only what was actually used and logged in docs/kiro-notes.md; Web or Crew only if Aarav actually ran them.

## Quality and Design
- Unique public data: MA utilities by town, utility forms, 220 CMR 25.03, EJ block groups, HHS emPOWER (pitch only).
- Polished, intentional UI built with the frontend skills and shadcn; no placeholder text in the demo path.
- Honest states: blocked, mixed and unconfirmed are shown, never guessed.
