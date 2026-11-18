---
description: "Implement a spec with a writer and independent clean-code reviewer; --full opts into SDD."
argument-hint: "<spec> [--full]"
---

Follow [bc-workflow](../skills/bc-workflow/SKILL.md) in MAIN using `$ARGUMENTS`.
Target the active consuming workspace, not this plugin resource. Require a named spec.
Default: MAIN delegates to the registered `al-coder` subagent, then an independent registered
`al-reviewer` subagent, with at most one writer correction under
[bc-workflow](../skills/bc-workflow/SKILL.md). The writer runs on Sonnet, the reviewer on Haiku (pass the tier
as the subagent `model`); never Opus unless the user granted it in a dialog box. Confirm the coder has the
workspace `edit` tool before handoff. If the
host cannot provide these agents or the coder's edit tool, stop and report the blocker; do not switch
the implementation or review into MAIN. Estimate this bounded bundle and ask once.
ONE build after the final edit and consent; compiler errors returned to the human.
IDs from the local object index ([al-object-index](../skills/al-object-index/SKILL.md)), principles from
[al-coding-principles](../skills/al-coding-principles/SKILL.md). After the code, update the object index,
`docs/knowledge` overviews and the spec's Implementation Log ([project-docs](../skills/project-docs/SKILL.md)).
Use the smallest clear implementation of the same agreed behavior: reuse application validation and
posting, no mandatory Meth layers, dispatchers, screen-state tables or speculative checks. Each new
object needs a concrete purpose. Record optional concerns with consequences in the Implementation Log,
not as runtime restrictions; fix known permission/data-integrity defects within scope or report blockers.
No tests, test app, mutation, DoD, publish or translation by default. Review must not add speculative
checks or frameworks; optional improvements go in the spec log. No repeated review loop.
`--full` explicitly opts into expensive [al-sdd](../agents/al-sdd.md), after bundle cost
consent and exact nonproduction Sandbox permission. No automatic translation even in full mode.
Never block because a preferred model is unavailable; continue on the selected model and say so.
This is a chat command; `!AL-implement` is shell execution, NOT a safe invocation.
