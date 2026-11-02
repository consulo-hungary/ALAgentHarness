---
name: existing-code-review
description: "Internal scope for explicit code-first refactoring of existing AL. Not knowledge, bugfix, translation or harness plugin customization."
user-invocable: false
---

# Existing-code scope

The command authorizes safe behavior-preserving EXISTING-file fixes by ONE real
[al-refactor agent](../../agents/al-refactor.md), inheriting the model. Main passes
active workspace, optional selected existing scope, dirty/index baseline and actual
test/publish authorization. No forced direction/final spec. Ambiguous semantic changes
are deferred with evidence, not guessed.

Do not ask which objects or what exact refactor when inferable from the existing code.
Inspect full own AL scope/dependencies/call graph; use company rules and BCQuality, BC
Observatory first for facts, correct-version Atlas for source behavior, Learn for guidance.
No layout normalization, AL-start invocation, folder creation, numbered specs, functional
upgrade, SDD, new file/object without explicit main permission, commits or implicit sandbox
publish. Root/custom project paths are valid; no target development-baseline conversion.

Preserve object IDs/names/API/schema/runtime/captions/labels and transaction/event semantics.
Prove subscriber relocation within existing codeunits; never blindly unify table triggers
and subscribers. Target existing app/test baseline and post-change builds, authorized
regressions, at most two safe fix cycles; report deferred changes and unrun tests honestly.

Keep the initial deep inspection and safe fixing continuous. Only on actual compilation
failure may a beneficial bounded [al-build-fixer](../../agents/al-build-fixer.md) repair
the authorized delta. After changes are verified, launch one independent read-only
[al-reviewer](../../agents/al-reviewer.md) for the final changed delta, not a second initial
scan. Zero changes -> no reviewer. No mandatory spec or SDD/feature DoD. Pass the
[shared packet](../../references/specialist-handoff.md); MAIN launches actual isolated
specialists if this host cannot nest, returning results to retained refactor state.
No supported isolation -> BLOCKED, never self-review dressed as independent review.
Source edits after findings require fresh affected validation and independent review again.
