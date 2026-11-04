---
name: definition-of-done
description: "EXPENSIVE opt-in full-mode DoD evidence report; never a default feature completion gate."
user-invocable: false
---

# Definition of Done

FULL MODE ONLY or an explicit DoD request, after cost consent. Never load on default spec
approval or `/AL-implement` without flags. Report evidence, no automatic build/publish.
Use session test/reservation evidence; do not inflate the lean spec with execution tables.

Run every line of the project's `DEFINITION-OF-DONE.md` (none in the project: the plugin's
`templates/DEFINITION-OF-DONE.md`, path given at session start) and show the evidence. A line without evidence is
red. You report; you do not fix (fixes belong to the authorized implementation).

## When to use

- After approved SDD and again after an authorized fix; not a public slash alternative.
- Final GREEN precedes this check; current DoD precedes actual isolated al-reviewer.
  ANY source edits stale prior package/GREEN/DoD/review evidence. Refresh affected GREEN,
  mutation evidence for logic edits, DoD and independent review. Bookkeeping alone must
  not change the approved substantive spec/test contract.

## Procedure

### 0. Scope

- D8 may publish/test only the explicitly approved matching NONproduction Sandbox.
  No authorization/tools: report NOT DONE, never infer permission. Reuse fresh final
  SDD deployment/test evidence if source/package hashes and target still match.

- Use supplied paths from [bc-workflow](../bc-workflow/SKILL.md); honor supplied absolute
  projectRoot/appRoot/testRoot/specRoot/specPath/specIndex and stronger project DoD.
  All app/test references below mean those resolved roots.
- For an orchestrated task, use its start commit AND dirty/untracked content inventory to
  calculate the task delta. Show pre-existing user changes separately, never overwrite or
  silently include them. Use current staged/unstaged/untracked state, not HEAD alone.

- `BASE` = the base the user gives, else `git merge-base HEAD main`.
- Changed files = `git diff --name-only $BASE` plus `git ls-files --others --exclude-standard`.
- The spec = the path the user gives, else the spec in selected specRoot among changed files. None or
  several: D5 is red and says so.
- Changed AL = changed files ending in `.al`, excluding `*.good.al` / `*.bad.al`.

### 1. D1 - build green

Follow `al-build-validation` on `app/` then `test/`, or reuse actual current final builds
whose source/package hashes and analyzer scope still match. Green = zero errors in both.
Paste its report line. al-reviewer only reads this supplied evidence, never builds.

### 2. D2 - every new ID reserved

1. New declarations in changed AL: object lines
   `^\s*(table|tableextension|page|pageextension|codeunit|report|reportextension|enum|enumextension|query|xmlport|permissionset|permissionsetextension)\s+(\d+)`
   and field lines `^\s*field\((\d+);` that are added since `BASE`
   (`git diff $BASE -- <file>` for tracked files, the whole file for untracked ones).
2. Each (type, ID) must have actual owning-app Ninja reservation evidence in session.
3. Validate the owning app and range confirmation from the actual Ninja reservation report.
   Do not read idRanges to assign/guess IDs. Missing reservation/range evidence is red.
4. No (type, ID) may be declared twice in the same app:
   `grep -rniE "^\s*<type>\s+<id>\b" <app>/`.

Evidence: a table with ID, type, file, reserved yes/no, in range yes/no.

### 3. D3 - no literal UI text

```bash
grep -niE "\b(Error|Message|Confirm)\s*\(\s*(StrSubstNo\s*\(\s*)?'" <changed AL files>
```

Zero hits = green. Every hit is listed as `file:line`.

### 4. D4 - nothing outside the scope

Every task-changed file must be inside resolved appRoot/testRoot, the exact specPath or its
specIndex row. For an explicitly approved relocation, validate EACH additional path against
the final spec's exact allowlist/old -> new map, including reference updates. No blanket
docs/CI permission. List every disallowed path. A stronger consuming DoD/AGENTS restriction
still blocks until the developer explicitly changes it with scoped approval; never override.
Build output and `.alpackages/` are git-ignored and never count as permission to move sources.

### 5. D5 - the spec

The named lean spec exists and its `## Open Questions` has no unresolved material question.
No implemented status, hashes, approval records or ID tables are required.

### 6. D6 - tests

Only when changed AL in `app/` declares a codeunit, or adds a procedure or event subscriber to
one. Then: a changed file in `test/` with `Subtype = Test` and `[Test]` methods, and every test
name from the agreed full-mode session test plan appears as a procedure there. Not applicable = green,
with the reason.
Behavior-preserving refactors may reuse unchanged existing regression tests named in the
session plan; verify they exist and cover the preservation criteria. Do not require changing a
test solely to satisfy this check. New business behavior still requires matching tests.

### 7. D7 - company rules

Follow the `company-rules` skill in checking mode on the changed AL. Every rule file in
`rules/` gets its own line: PASS, FAIL or N/A. Any FAIL makes D7 red. A rule added a minute
ago shows up here without any other change.

### 8. D8 - tests ran and passed

1. Find all exact codeunits/IDs/methods in the agreed full-mode session test plan, including existing
   regression tests for a refactor, not only changed tests from D6.
2. A test run of that codeunit **in this session, after the last change to a `.al` file**
   (for example the final GREEN of the `al-sdd` agent) counts: quote its result.
   Bind results to source content hashes/revision after the last edit AND matching fresh
   deployed app/test packages. HEAD alone cannot prove dirty-source identity.
3. Otherwise, ONLY with explicit final-spec authorization for an explicitly selected
   NONproduction Sandbox, run now: build (D1 already did), publish appRoot then testRoot to
   the pinned tenant/environmentName/environmentType: Sandbox (`al_publish`, Synchronize
   only), then run the codeunit with the first runner the
   session exposes: the built-in `runTests` tool (VS Code), `al_run_tests` (AL MCP server),
   or `al runtests <id> --project test --environmentname <name> --environmenttype Sandbox`.
   runTests counts only if it discovers actual AL tests and binds to this target/deployment.
   A read-only reviewer never publishes/runs tests; it uses the supplied current evidence.
   No authorization/target: red; return to main developer, never pick a launch.json default.
   No Production/OnPrem, ForceSync/Recreate, permission bypass or autoApprove toggle.
4. Green = every test named in the full-mode session plan ran and passed. A test that did not run
   is red, not skipped.

For refactor require real baseline app/test builds/tests and post-change equivalence evidence
for the same scope. Missing/failing baseline is preservation unproven and NOT DONE, even if
the developer explicitly chooses to continue; ask only in main, never fake equivalence.

No sandbox configured or no runner: D8 is red with the reason. Never mark it green on a
build alone.

### 9. Report

```
Definition of Done - <resolved specPath>   base <short sha>   files <n>
  [x] D1 build green          app 0 errors / test 0 errors (al_build)
  [x] D2 IDs reserved         5 of 5 in Reserved IDs, all in range, no duplicates
  [ ] D3 no literal UI text   app/src/DIRCarrierCheck.Codeunit.al:14  Error('No carrier')
  [x] D4 scope                9 task files within resolved roots/exact approved allowlist
  [x] D5 spec                 implemented, 0 open questions
  [x] D6 tests                DIRCarrierTests.Codeunit.al: 3 of 3 spec tests present
  [x] D7 company rules        5 rules: 4 PASS, 1 N/A
         PASS tableextension-pte-suffix   DIRCustomer.TableExt.al:5
         ...
  [x] D8 tests ran            3 of 3 passed, al_run_tests on codeunit 80100 after publish
Verdict: NOT DONE (1 red: D3)
```

Every line carries its evidence. The verdict is one word, **DONE** or **NOT DONE**, and lists
the red lines. Nothing is "mostly done".

## Never

- Never mark a line green without having run its check in this session.
- Never fix while checking. Report, then the developer decides who fixes.
- Never report a test result you did not get from a runner in this session.

## Related

- `al-build-validation` - D1.
- `al-object-id-assignment` - fills the `## Reserved IDs` table D2 compares against.
- `company-rules` - D7.
- [al-reviewer](../../agents/al-reviewer.md) independently reviews the final SDD delta
  AFTER final GREEN and current DoD. The coordinator/MAIN launches it for real, never
  substitutes writer self-review. Blocking findings require bounded fixes and fresh evidence.