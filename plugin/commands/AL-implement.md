---
description: "Optionally implement a spec in main chat with one build; --full opts into expensive SDD."
argument-hint: "<spec> [--full]"
---

Follow [bc-workflow](../skills/bc-workflow/SKILL.md) in MAIN using `$ARGUMENTS`.
Target the active consuming workspace, not this plugin resource. Require a named spec.
Default: code only, ONE build after estimate/consent, compiler errors returned to the human.
IDs from the local object index ([al-object-index](../skills/al-object-index/SKILL.md)), principles from
[al-coding-principles](../skills/al-coding-principles/SKILL.md). After the code, update the object index,
`docs/knowledge` overviews and the spec's Implementation Log ([project-docs](../skills/project-docs/SKILL.md)).
No tests, test app, mutation, DoD, subagents, publish or translation.
`--full` explicitly opts into expensive [al-sdd](../agents/al-sdd.md), after bundle cost
consent and exact nonproduction Sandbox permission. No automatic translation even in full mode.
Never block because a preferred model is unavailable; use what is selected.
This is a chat command; `!AL-implement` is shell execution, NOT a safe invocation.
