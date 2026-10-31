---
name: al-brainstorm
description: "Internal main-chat orchestration for Opus brainstorming and approved SDD in the active AL, web, Python, or custom project. Not knowledge, bugfix, review, translation or plugin customization."
user-invocable: false
---

# Brainstorm orchestration (MAIN chat)

1. Pin the active workspace, not tagged/installed plugin paths. Resolve the project's
   language/framework from [project profiles](../project-profiles/SKILL.md). For AL,
   additionally resolve [AL project layout](../al-project-layout/SKILL.md) read-only;
   do NOT invoke setup. Ask MAIN to resolve conflicting or multi-project targets.
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
4. Agree DIRECTION. Direction approval authorizes a draft ONLY, not implementation,
   package installation, deployment or external side effects.
   ONLY after agreed direction, launch ONE actual [al-spec](../../agents/al-spec.md)
   child with the agreed Opus context and [shared packet](../../references/specialist-handoff.md).
   It writes the numbered draft and index using `createNumberedSpec`: numeric max + 1,
   README/TEMPLATE excluded, duplicate prefixes/collisions block, no overwrite or
   renumbering. Use the project's own template/root when established; otherwise AL uses
   the AL template and non-AL uses the generic project template. No draft before direction.
   MAIN does not write the draft itself.
   Drafter inherits model and never approves, writes AL or reserves IDs. Genuine gaps
   return questions to main; normally one invocation, no mandatory separate spec review
   or build step. Reuse research, do not restart the Opus design conversation.
5. Show the ACTUAL final artifact, acceptance criteria/tests, non-goals, exact project
   roots/spec/index/allowlist, profile evidence, dependencies and validation commands.
   For AL, also show BC version, explicitly selected tenant/environmentName NONproduction
   Sandbox and permitted build/Synchronize publish/test operations. For every other stack,
   list exact commands and ask permission for external or state-changing operations. Get
   explicit FINAL-SPEC approval.
   Direction != final-spec approval. Record revision/hash and approval; meaningful scope,
   target or test contract changes invalidate approval. For AL, no
   production/ForceSync/Recreate.
6. Route the approved packet by the selected profile. AL launches REAL `al-sdd` with the
   [canonical AL SDD](../../agents/al-sdd.md): tests/stubs -> assertion RED -> al-coder ->
   GREEN -> mutation RED -> restore GREEN -> DoD -> independent al-reviewer; al-build-fixer
   is conditional on compilation failure only. Non-AL launches REAL
   [project-sdd](../../agents/project-sdd.md), which uses only repository-verified commands,
   isolated test-author/coder handoffs and a read-only project-reviewer. If children cannot
   launch, MAIN performs actual isolated role launches on the coordinator's full packet
   and returns results to the retained coordinator. No supported isolation or approved
   validation -> BLOCKED; never simulate delegation, tests or Opus.
   A named previously approved spec may skip new questions/drafting ONLY when its actual
   content and the target-specific operation permissions are explicitly approved and still
   valid.

AL feature writes are limited to app/test and exact spec/index; non-AL writes are limited
to the approved project/test allowlist and exact spec/index. No layout migrations,
commits/push/PR, speculative IDs or extra artifacts. MAIN returns blockers rather than
allowing an isolated child to guess developer decisions.
