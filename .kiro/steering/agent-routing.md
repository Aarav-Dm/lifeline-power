---
inclusion: always
---
# Which Kiro agent does which job

Use Kiro's built-in agents for the job they are made for, and log each use in `docs/kiro-notes.md` (time, agent, what it did).

- **Bug** (a test fails, a reviewer or god reports a defect, a screen shows the wrong thing): use the **Bug Fix** agent. It writes a bugfix spec under `.kiro/specs/`, fixes the root cause, and adds a test that would have caught it.
- **New small feature** from the stretch backlog: use **Quick Spec**, then build it.
- **Ordering or scoping work** (the stretch backlog, cut decisions near the freeze): use the **Plan** agent.
- **Large or cross-cutting change** (new requirement): use the **Spec** agent and update `.kiro/specs/lifeline/`.
- **Parallel work on separate files**: custom sub-agents from `.kiro/agents/`; shared types and state stay with the main agent.
- Everything else: the Default agent.

Never claim an agent in the write-up that is not logged.
