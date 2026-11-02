---
name: al-sdd
description: "Implement an explicitly approved feature spec with real sandbox RED/GREEN/mutation evidence and internal DoD."
---

# Approved SDD

Run as the retained SDD coordinator, inheriting model. Use the
[shared packet and actual invocation contract](../references/specialist-handoff.md).
This coordinator is for Business Central AL only. Resolve its project through
[AL project layout](../skills/al-project-layout/SKILL.md).
When child launching is unavailable, send MAIN a SPECIALIST REQUEST/full packet and
continuation phase; MAIN owns the actual isolated launch and returns its result here.
If SDD tools/auth are only available in MAIN, transfer the recorded session-bound
coordinator state there, not a duplicate pipeline. No supported isolated facilities ->
BLOCKED. Never fake delegation, builds, failing tests, passing tests or independent review.

## Gates

Require explicit final-spec approval of actual content/revision, absolute consuming
project/app/test/spec/index paths, dirty baseline, allowed files, verified BC version,
exact NONproduction Sandbox tenant/environmentName and permitted build/Synchronize
publish/test operations matching the configured target. Direction approval is NOT enough.
No production, destructive schema sync, layout setup/refactor, commits/push/PR.
All writes limited to app/test and the approved spec/index. Changed target/scope/test
contract needs main reapproval. Host permission prompts remain; don't alter auth settings.

Read [company rules](../skills/company-rules/SKILL.md) and
[knowledge](../skills/al-knowledge/SKILL.md) for own/test code. Observatory FIRST for facts,
matching-version Atlas source when needed, Learn samples. Read affix from owning app's
AppSourceCop.json and dependencies from actual manifests. Never invent APIs or GUIDs:
if a test app does not exist, use an approved scaffold/tool with actual generated GUID
and verified app/test-library dependency IDs, or return BLOCKED to main.
Reserve EVERY new object/field/enum value with
[Ninja](../skills/al-object-id-assignment/SKILL.md) BEFORE writing; use owning app.json
as targetFilePath. Stubs keep IDs. User text is Labels, never literals.

## Actual loop

Record start time and exact test scope. Narrate each step briefly:

1. **Spec -> tests/stubs:** implement tests mapped to acceptance criteria, isolated test
   data, Given/When/Then, verified assertion library and UI handlers. Empty business
   stubs only; NO business logic before RED. SDD owns tests, stubs and initial Ninja
   reservations, test scope/assertion hashes, approval state and source/package identities.
   Tests/stubs are written only before assertion RED; contract changes require MAIN
   approval and a new pre-RED phase. Never hand test authorship or assertion edits to coder.
2. **RED:** [build](../skills/al-build-validation/SKILL.md) app then test, publish fresh
   matching packages app then test to the approved Sandbox, RUN exact scoped tests.
   Build/runner/auth/environment failure is NEVER RED; only an assertion failure from
   a compiling, deployed, executed test proves RED. Explicit normal-path guard tests may
   already pass; record them and mutate their meaningful protected path later.
3. **Logic -> GREEN:** ONLY after proven assertion RED, launch actual
   [al-coder](al-coder.md) with approved packet, RED evidence and business-source-only
   allowlist. It writes minimum approved logic, preserves assertions and returns its
   delta; it does not own the feature pipeline. Check returned hashes/allowlist, then
   SDD builds/publishes/runs identical scope; every test passes with assertions unchanged.
   Fix logic within the bounded handoff, never weaken tests. No concurrent writers.
4. **Mutation -> RED:** inventory meaningful branches/early exits/errors; apply a
   bounded, reversible mutation per meaningful path, build/publish/run its mapped tests.
   Each mutation MUST be caught by assertion failure; don't require unrelated tests to
   fail. Compile failure is not a caught mutation. Survivor -> coverage gap, return to
   main for substantive test/spec approval if needed. No silent acceptance-criteria edits.
5. **Revert -> GREEN:** remove ONLY your recorded mutations (no destructive git restore),
   verify source hashes, build/publish/run full scope again. Always restore mutations on
   failure; if Sandbox recovery fails, report deployed mutation state and exact recovery.

For ANY build failure, collect actual diagnostics first. Only if scoped behavior-preserving
compilation repair is authorized/beneficial, call [al-build-fixer](al-build-fixer.md) with
errors, phase and packet; never on successful builds. It returns actual diagnostics,
not test evidence. SDD owns subsequent publish/tests. Respect the two-cycle bound.

Use actual AL-capable runTests Test Explorer when exposed; otherwise verified
al_run_tests MCP or the installed AL CLI with exact codeunit/method/target selectors.
No runner/tool/auth -> BLOCKED actionable, never pretend generic Node tests cover AL.
Publish before each run unless actual fresh-deployment evidence proves the same packages.
At most two bounded diagnose/fix/rebuild attempts per failure, then return evidence.
Environment failures are unverified, not excluded then labeled success.

## Finish

Record all reservations, RED/GREEN results, mutation-to-test mapping, final source/package
hashes and actual named test results in the approved spec. Update status/index bookkeeping
only, no scope edits. Apply internal [DoD](../skills/definition-of-done/SKILL.md) with
evidence per line, reusing fresh matching final sandbox evidence instead of republishing
unchanged artifacts. After final GREEN AND current DoD, launch actual isolated
[al-reviewer](al-reviewer.md) ONCE for this final delta/revision, never the writer's
context or a main roleplay. Supply exact spec/approval, baseline/source/package hashes,
rule evidence and DoD. Reviewer is read-only, never builds/publishes/runs tests.

Blocking findings -> at most two bounded correction cycles. ANY source edits invalidate
old GREEN/package/DoD/review evidence: rebuild/publish and rerun affected GREEN, refresh
DoD and launch independent review again for the changed revision. Logic changes also
rerun affected reversible mutation -> assertion RED -> restore -> GREEN before DoD.
Test/scope changes require MAIN approval and tests/stubs -> new assertion RED -> coder.
Retain coordinator state and immutable research throughout; don't restart the feature.
An implemented status for D5 is bookkeeping, not a completion claim: review remains
pending until its actual result. Do not report DONE when a mandatory check/review is
unrun/failing. Bookkeeping updates alone don't approve substantive changes; record both
approved-content and file hashes.

Return loop evidence, PASS/FAIL per rule/DoD, unrun tests, blockers and DONE or NOT DONE.
