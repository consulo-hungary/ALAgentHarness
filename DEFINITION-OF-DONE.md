# Definition of Done

EXPENSIVE opt-in full mode only, never a default brainstorm/spec or code-only gate.
Reservation/test evidence stays in session; do not expand the lean spec with bookkeeping.

A change is done when every line below is green. Every line has a check a machine can run, so
"done" is a fact you can show, not a feeling. The internal `definition-of-done` skill runs
these checks for feature SDD and answers with one
word: **done** or **not done**.

| # | Done means | Proven by |
|---|------------|-----------|
| D1 | Both apps build with zero errors. | `al_build` + `al_getdiagnostics` on `app/` then `test/` (or `al compile`) |
| D2 | Every new object and field ID was reserved with Ninja. | Actual session Ninja evidence, owning app confirmed, none declared twice; never derive IDs from idRanges |
| D3 | No hardcoded user-facing text. | no `Error(`, `Message(` or `Confirm(` with a literal (also via `StrSubstNo`) in the changed `.al` files |
| D4 | Nothing changed outside `app/`, `test/` and the feature's spec (plus its row in the `specs/README.md` index). | `git diff --name-only <base>` + untracked files |
| D5 | The named lean spec exists with status/date and no material open questions. | Valid approved/implemented status and last-updated date; implemented only after requested gates pass |
| D6 | New business logic has targeted tests. | Test codeunits cover the agreed full-mode session plan, no one-test-per-criterion requirement |
| D7 | Every applicable company rule in `rules/` passes. | the `company-rules` skill: PASS / FAIL / N/A per rule file, with `file:line` |
| D8 | Tests passed on the explicitly approved nonproduction Sandbox after the last edit. | Fresh matching deployment and actual named test results for the full-mode session plan |

## What this proves

| | Proven by |
|---|---|
| It **compiles**, app and tests, with zero errors | D1 |
| IDs, UI text, scope, spec, the existence of tests and the company rules are **checked** | D2-D7 |
| It **works**: the tests ran on the sandbox and passed | D8 |
| Code was **reviewed** | evidence-backed review within the requested workflow; a separate reviewer is not automatically spawned |

The tests proving something is the `al-sdd` agent's job: its loop (spec -> test -> RED (the
test fails) -> business logic -> GREEN (the test passes) -> mutation (break the logic on
purpose) -> RED (the test catches it) -> GREEN (revert, the test passes again)) shows that
the tests fail when the logic is wrong. D8 only proves they pass now.

`<base>` is where the work started: `git merge-base HEAD main` unless you say otherwise.

Not on this list, on purpose: style preferences. Those are review findings, not a gate.
Add a line here only when you can name the check that proves it. This feature checklist is
not a requirement to launch SDD for folder setup, code-only refactoring or commit grouping.
