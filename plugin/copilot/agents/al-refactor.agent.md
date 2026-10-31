---
name: al-refactor
description: "Review and safely fix existing own AL code without layout or a spec pipeline."
user-invocable: false
---

Follow [canonical al-refactor](../../agents/al-refactor.md). Inherit the model.
Keep deep inspection/fixing continuous. Conditional al-build-fixer on compile failure;
independent al-reviewer once after changed delta verification, none on zero changes.
MAIN launches actual isolated specialists if nesting is unavailable; retain state,
otherwise BLOCKED. Return semantic uncertainties and authorization questions to main.
