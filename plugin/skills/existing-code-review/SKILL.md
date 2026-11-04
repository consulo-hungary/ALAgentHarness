---
name: existing-code-review
description: "Targeted behavior-preserving existing-AL refactoring with one build and no default review agent."
user-invocable: false
---

# Existing-code scope

The command authorizes safe behavior-preserving EXISTING-file fixes by ONE real
[al-refactor agent](../../agents/al-refactor.md), inheriting the model. Main passes
active workspace, optional selected existing scope, preserved user changes and actual
test/publish authorization. No forced direction/final spec. Ambiguous semantic changes
are deferred with evidence, not guessed.

Do not ask which objects or what exact refactor when inferable from the existing code.
Inspect targeted own AL scope/nearby callers; use company rules and BCQuality, BC
Observatory first for facts, correct-version Atlas for source behavior, Learn for guidance.
No layout normalization, AL-start invocation, folder creation, numbered specs, functional
upgrade, SDD, new file/object without explicit main permission, commits or implicit sandbox
publish. Root/custom project paths are valid; no target development-baseline conversion.

Preserve object IDs/names/API/schema/runtime/captions/labels and transaction/event semantics.
Prove subscriber relocation within existing codeunits; never blindly unify table triggers
and subscribers. ONE owning-app build after estimate/consent; return errors to the human.
Baseline builds, regressions and independent review are explicit opt-ins.

Follow [bc-workflow](../bc-workflow/SKILL.md) for research/model/cost limits. No automatic
build-fixer, reviewer, DoD, tests or translation. Explicit independent review is read-only,
changed-delta only and requires an estimate and consent; zero changes means no reviewer.
