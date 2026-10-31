# Internal specialist handoff

These are internal roles, not additional commands or skills. MAIN owns developer
questions and approvals. Reuse immutable observations; do not repeat research or restart
the coordinator just to cross a role boundary.

## Actual invocation and isolation

Launch the named canonical agent through a supported host facility and record its actual
agent/session ID. A real isolated general-purpose child is an adapter only when given the
complete canonical instructions, this packet and the same role/tool/write restrictions.
Reading markdown or roleplaying in the writer's conversation is NOT independent review.
Only brainstorm selects Opus; all other roles inherit the host's current model.

If a coordinator cannot launch children, it returns `SPECIALIST REQUEST` to MAIN with the
full packet, role and continuation phase. MAIN launches the actual child and returns its
result to the SAME retained coordinator (or restores the recorded coordinator state when
resume is unavailable). The external caller owns launching, not a second SDD pipeline.
No supported isolated facility -> `BLOCKED`; do not pretend isolation or drop a required
review. Tool/auth absence returns an actionable blocker, never invented execution.

## Packet (explicit values, not inferred defaults)

- Active consuming projectRoot, appRoot, testRoot, source layout, specRoot, specPath and
  the one specIndex; missing test/spec resources explicitly marked, never reselected.
- Git start revision plus dirty/staged/untracked baseline inventory and content hashes;
  distinguish pre-existing user edits from the task delta. Exact task file allowlist.
- Task/non-goals, phase, expected write restrictions, dependencies/application/runtime,
  affix, verified target-version events/source anchors, company rules and BCQuality evidence.
- Agreed Opus direction/context and actual draft identity; actual FINAL-SPEC approval
  reference and approved substantive-content hash (or explicitly pending for al-spec).
  MAIN owns approval. Bookkeeping/status/ID/index updates may change the file hash;
  record them separately. Substantive spec/scope/test/target changes invalidate approval.
- Explicit authorized NONproduction Sandbox tenant/environmentName/environmentType and
  permitted operations (build, Synchronize publish, exact test codeunit IDs/methods).
  No inferred production permission, ForceSync/Recreate or global security/autoApprove
  toggles. Host permission prompts remain. Refactor has only supplied operation permission,
  not a forced spec or implicit sandbox grant.
- Current coordinator state, assertions/test scope hash, real assertion RED evidence,
  GREEN results and DoD evidence with timestamps, source and built/deployed app/test
  package hashes/revisions/target. Compilation/auth/runner failure never counts as RED.
- Reservation ledger, reversible mutation inventory, original/mutated source identities,
  mutation-to-test mapping/results and recovery/deployed-state record.

The caller checks actual returned source delta against the allowlist and baseline before
accepting a handoff. Writers/build/publish/tests are sequential, never concurrent on shared
sources or packages. No specialist invents missing approval, IDs, tool execution or evidence.

## Freshness and bounded correction

Any source edit invalidates prior build/package/GREEN/DoD/review evidence for that revision.
Rebuild and, where authorized/required, publish and rerun affected GREEN before fresh DoD
and a NEW independent review. Logic edits also rerun affected mutation RED -> restore ->
GREEN evidence. Any test contract/scope change needs MAIN approval, tests/stubs before a
new assertion RED, then coder; never weaken assertions to pass.

Allow at most two bounded fix cycles per failure or blocking review, then `BLOCKED` with
remaining evidence. The coordinator restores its own recorded mutations even on failure;
report any remaining deployed mutation and recovery steps. Reuse unchanged current evidence
and the same specialist definition, not the writer's context, for subsequent independent
review of a changed revision.
