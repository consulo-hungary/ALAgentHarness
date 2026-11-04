# Definition of Done

EXPENSIVE opt-in full mode only. Not required for brainstorm/spec or default implementation.
Keep execution and reservation evidence in session, not by expanding the lean spec.

A change is done when every line below is green. Every line has a check a machine can run, so
"done" is a fact you can show, not a feeling. The internal DoD runs all of them and answers with one
word: **done** or **not done**.

| # | Done means | Proven by |
|---|------------|-----------|
| D1 | Both apps build with zero errors. | `al_build` + `al_getdiagnostics` on `app/` then `test/` (or `al compile`) |
| D2 | Every new object and field ID was reserved with Ninja. | Actual session Ninja evidence for each declared ID, owning app confirmed, none declared twice |
| D3 | No hardcoded user-facing text. | no `Error(`, `Message(` or `Confirm(` with a literal (also via `StrSubstNo`) in the changed `.al` files |
| D4 | Feature changes stay in resolved appRoot/testRoot, specPath and its specIndex row, subject to stronger project instructions. | Task delta from git base + dirty baseline; exact approved allowlist, no layout or blanket docs/CI permission |
| D5 | The named lean spec exists and has no material open questions. | `## Open Questions`; no approval/status bookkeeping |
| D6 | New business logic has targeted tests; existing regressions may be reused. | Test codeunits cover the agreed full-mode session plan; no one-test-per-criterion requirement |
| D7 | Every applicable company rule in `rules/` passes. | the `company-rules` skill: PASS / FAIL / N/A per rule file, with `file:line` |
| D8 | Exact spec tests ran on the explicitly approved NONproduction Sandbox and passed after the last edit. | Matching source hashes/fresh deployed packages and actual named method results; app then test publish only after final-spec target authorization; no skipped tests or invented preservation |

## What this proves

Use the optional `bc-workflow` resolver or supplied paths: new consuming projects default to docs/specs/,
legacy specs/ remains active absent approved migration; both roots require one main-chat
choice. A project's stronger AGENTS/DoD wins. This feature gate is not a required
setup/refactor/commit pipeline. Authorization never includes production, destructive
schema sync, commits/push/PR or bypassing host permission prompts.

| | Proven by |
|---|---|
| It **compiles**, app and tests, with zero errors | D1 |
| IDs, UI text, scope, spec, the existence of tests and the company rules are **checked** | D2-D7 |
| It **works**: the tests ran on the sandbox and passed | D8 |
| Final task delta was independently reviewed | Actual isolated read-only al-reviewer after final GREEN and current DoD, bound to source/spec/package revision |

The tests proving something is the `al-sdd` agent's job: its loop (spec -> test -> RED (the
test fails) -> business logic -> GREEN (the test passes) -> mutation (break the logic on
purpose) -> RED (the test catches it) -> GREEN (revert, the test passes again)) shows that
the tests fail when the logic is wrong. D8 only proves they pass now.
SDD owns tests/stubs/reservations before assertion RED, then actual al-coder writes minimum
approved logic. al-build-fixer is conditional on compilation failure only. Blocking review
compiler fixes are bounded to one cycle: after source edits refresh affected GREEN/DoD and independent
review; logic edits also refresh affected mutation RED -> restore -> GREEN. Never weaken
assertions or change test scope without MAIN approval and a new pre-RED phase.

`<base>` is where the work started: `git merge-base HEAD main` unless you say otherwise.

Not on this list, on purpose: style preferences. Those are review findings, not a gate.
Add a line here only when you can name the check that proves it.