---
description: "Review and safely refactor existing AL code in the active workspace, without layout setup or a spec pipeline."
argument-hint: "[existing AL scope or refactor goal]"
---

Target the active workspace/session working directory, NOT the directory containing this
tagged command. No input: inspect the existing own AL scope and infer safe inconsistencies.
Invoke ONE actual `al-refactor` agent using [canonical instructions](../agents/al-refactor.md)
and [scope contract](../skills/al-refactor/SKILL.md). Inherit the session model.
Invocation authorizes safe existing-file fixes, not new artifacts, layout normalization,
functional changes, sandbox publishing, or commits. Return uncertainties to main.
Keep initial inspection/fixing continuous; conditional al-build-fixer only on compile
failure and independent al-reviewer only after verified actual changes. MAIN supplies
actual isolated launches if nested capability is unavailable, not roleplayed review.
This is a chat command; `!AL-refactor` is shell execution, NOT a safe invocation.
