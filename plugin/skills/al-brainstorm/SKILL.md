---
name: al-brainstorm
description: "Internal main-chat orchestration for new AL feature brainstorming and approved SDD. Not knowledge, bugfix, review, translation, non-AL or plugin customization."
user-invocable: false
---

# Brainstorm orchestration (MAIN chat)

1. Pin the active consuming workspace, not tagged/installed plugin paths. Resolve
   [project layout](../al-project-layout/SKILL.md) read-only; do NOT invoke setup.
2. Launch the REAL named `al-brainstorm` agent using its host-specific Opus configuration.
   Claude uses `model: opus`; Copilot adapter requests `Claude Opus 4.6 (copilot)` only if
   that ID is actually available. Verify host inventory/selection and record agent ID and
   selected model. If unavailable, BLOCK with the model issue; don't silently substitute.
   A general-purpose adapter is allowed ONLY with a verified supported Opus ID supplied
   explicitly to its model selector and the same canonical research instructions. Do not
   pretend loading an agent markdown file launches an agent.
3. Main owns the question facility if the child cannot talk to the developer. Ask ONE
   next question at a time, send each answer to the SAME retained agent when host supports
   resume/message. Cache decisions/evidence in main if resume is unsupported; do not
   repeatedly reload everything or spawn unrelated specialists. Research is
   read-only and only as deep as needed for this feature.
4. Agree DIRECTION. Direction approval authorizes a draft ONLY, not AL or deployment.
   ONLY after agreed direction, launch ONE actual [al-spec](../../agents/al-spec.md)
   child with the agreed Opus context and [shared packet](../../references/specialist-handoff.md).
   It writes the numbered draft and index using `createNumberedSpec`: numeric max + 1,
   README/TEMPLATE excluded, duplicate prefixes/collisions block, no overwrite or
   renumbering. No draft before direction. MAIN does not write the draft itself.
   Drafter inherits model and never approves, writes AL or reserves IDs. Genuine gaps
   return questions to main; normally one invocation, no mandatory separate spec review
   or build step. Reuse research, do not restart the Opus design conversation.
5. Show the ACTUAL final artifact and tests, non-goals, exact allowlist/app/test/spec/index,
   dependencies/version, explicitly selected tenant/environmentName NONproduction Sandbox
   and permitted build/Synchronize publish/test operations. Get explicit FINAL-SPEC approval.
   Direction != final-spec approval. Record revision/hash and approval; meaningful scope,
   target or test contract changes invalidate approval. No production/ForceSync/Recreate.
6. Automatically launch REAL `al-sdd` with the approved packet, inherited model and
   [canonical SDD](../../agents/al-sdd.md). SDD retains coordinator state and owns the
   sequential tests/stubs -> assertion RED -> al-coder -> GREEN -> mutation RED ->
   restore GREEN -> DoD -> independent al-reviewer handoffs. al-build-fixer is conditional
   on compilation failure only. If children cannot launch there, MAIN performs actual
   isolated specialist launches on SDD's full packet and returns results to the retained
   coordinator. Session-bound SDD execution in MAIN still requires actual isolated coder/
   reviewer handoffs and target authorization. No supported facilities -> BLOCKED;
   never simulate isolation, tests or Opus.
   A named previously approved spec may skip new questions/drafting ONLY when its actual
   content and Sandbox permissions are explicitly approved and still valid.

All feature writes limited to app/test and exact spec/index; no layout migrations,
commits/push/PR, speculative IDs or extra artifacts. Main returns blockers rather than
allowing an isolated child to guess developer decisions.
