---
description: "Review and safely refactor existing AL code in the active workspace, without layout setup or a spec pipeline."
argument-hint: "[existing AL scope or refactor goal]"
---

Target the active workspace/session working directory, NOT the directory containing this
tagged command. No input: inspect the existing own AL scope and infer safe inconsistencies.
Invoke ONE actual `al-refactor` agent using [canonical instructions](../agents/al-refactor.md)
and [scope contract](../skills/existing-code-review/SKILL.md). Inherit the session model.
Invocation authorizes safe existing-file fixes, not new artifacts, layout normalization,
functional changes, sandbox publishing, or commits. Return uncertainties to main.
Keep initial inspection/fixing continuous; conditional al-build-fixer only on compile
failure is full-mode-only. No automatic independent review, tests, DoD or translation.
Estimate and ask before the initial agent launch and ONE owning-app build, following
[bc-workflow](../skills/bc-workflow/SKILL.md). Return remaining compiler errors to the human.
This is a chat command; `!AL-refactor` is shell execution, NOT a safe invocation.
