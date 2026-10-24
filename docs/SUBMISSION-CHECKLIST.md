# LifeLine Power: final submission checklist (deadline 8:00 PM ET sharp)

Source of the rules: `research/site/gdoc.txt` (official Submission Requirements) and the event slides (`research/site/slides.txt`).

## Where to submit

The rules say "the submission form on the Hackathon Website". The links we saved are:
- Rules & Project Submittal guide: https://docs.google.com/document/d/1aDagPzc29sNGHdycZ-30GMf2z-Np2SwqZX_hY46tLrQ/edit?tab=t.0
- Event page: https://massaicoalition.com/hackachusetts (and the Sundai Discord)
- A Notion page linked from the event site: https://rich-uranium-d4e.notion.site/b836a9c5ce974d32a09bbec1bd38f928

UNVERIFIED: which one is the actual submit form. Open the Rules & Project Submittal guide or ask in the Discord now, before 7:30.

## Order of work

| Clock | Step | Done when |
|---|---|---|
| 7:15 | god confirms tests, build, 4 MVP checks, one-page print | god says "push" |
| 7:20 | Create a **public** GitHub repo, then run `research/ship-steps.md` (git init, add, commit, push) | Repo is public; `.kiro/` is visible at the root |
| 7:22 | GitHub: Settings > Pages > Source = GitHub Actions | The Actions run turns green |
| 7:25 | Open the live URL in a private window; paste it into README.md "Live URL" and push again | The app loads without login |
| 7:25-7:40 | Record the video from `research/VIDEO-SHOTLIST.md` (on the live URL or `pnpm preview`) | Under 3:00 |
| 7:40 | Upload to YouTube as **Public** (or Unlisted only if the form allows; the rules say "publicly visible") | Link opens in a private window |
| 7:45 | Paste the video link into README.md "Demo video"; push | |
| 7:45-7:55 | Fill the submission form (fields below) | Submitted before 7:55 |

## Hard requirements (missing one can disqualify)

- [ ] Built with Kiro, and `/.kiro` is at the repo root, committed, NOT in `.gitignore` (checked: it is not ignored)
- [ ] Public GitHub repo with all source, assets and run instructions (README has `pnpm install`, `pnpm dev`, `pnpm test`, `pnpm build`)
- [ ] Working link for judges, free, no login (GitHub Pages)
- [ ] Video under 3:00, shows the app running, public on YouTube/Vimeo/Facebook Video/Youku, no copyrighted music
- [ ] Text description of features and functionality
- [ ] Track named: **Healthcare & Biotech**
- [ ] Kiro write-up: `docs/KIRO-WRITEUP.md` (Pam's final refresh at 7:12)
- [ ] Team members added (solo: just you)
- [ ] No secrets in the repo (the 21st.dev key is only in your user-level Kiro config; rotate it after)

## Paste-ready form fields

**Project name:** LifeLine Power

**Track:** Healthcare & Biotech (challenge H3: Improving healthcare access and coordination)

**One-line tagline:** The right electric company's medical program, for one Massachusetts town, on one page.

**Description (features and functionality):**
In Massachusetts, 45,895 Medicare beneficiaries rely on electricity-dependent medical equipment (HHS emPOWER, state layer edited 2026-10-07). Each electric company runs its own medical programs with its own forms, signers and renewal rules, and families often confuse an outage-notification list with protection from shutoff for unpaid bills.

LifeLine Power is a tool for care coordinators. Type a town and it names that town's electric company from the state's own table (all 351 towns). It shows only that company's programs side by side, with who signs, where to send the form (fax or address), what each program does not do, and the renewal rule each source states, with every sentence linked to its source. A guided checklist and a tracker (Prepared, Submitted, Waiting for the utility) lead to a one-page printable handoff that names the next step and who owns it, in English or Spanish. Switching town clears the previous company's answers, so one company's rules never leak onto another's form. When a company's form has not been opened, or two official sources disagree (for example Leominster), the app says so instead of guessing.

Programs are loaded for Unitil, National Grid, Eversource and Wellesley Municipal Light Plant, covering 293 of 351 towns and 92.5% of the state's environmental-justice block groups. It does not submit or confirm anything, and it is not medical or legal advice; demo household data is synthetic.

**What's next:** an agent that drafts each company's form from the checklist answers for the coordinator to check, the patient to consent and the clinician to sign. People still sign and send; only the utility confirms. Not built tonight.

**How Kiro was used:** paste `docs/KIRO-WRITEUP.md` (it answers each question in the rules: tools used, spec-driven development, hooks, steering, MCP, property-based testing, powers). Claim only what is logged in `docs/kiro-notes.md`.

**Links:** GitHub repo URL · Live URL · Video URL

## Last-minute don'ts

- Do not claim Kiro Web, Crew, the IDE Correctness panel, a power, or the Bug Fix agent unless you actually used it and logged it.
- Do not say the app guarantees power, registers anyone, or proves anything.
- Say "Medicare beneficiaries", not "residents".
- After 8:00 PM nothing can change except removing infringing or private material.
