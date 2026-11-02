---
name: feature-design
description: "Internal main-chat orchestration for Opus brainstorming and approved SDD in the active Business Central AL project. Not knowledge, bugfix, review, translation or plugin customization."
user-invocable: false
---

# Brainstorm orchestration (MAIN chat)

1. Pin the active workspace, not tagged/installed plugin paths. Resolve the
   [AL project layout](../al-project-layout/SKILL.md) read-only; do NOT invoke setup. Ask MAIN to resolve conflicting or multi-project targets.
   Pass `knowledgeRoot` and its inventory to the brainstormer using
   [project knowledge reading](../../references/project-knowledge.md). It reads relevant
   external specs/transcripts before proposing direction; MAIN resolves material conflicts.
2. Resolve the user's `opus` family request using [Opus selection](../../references/opus-selection.md).
   Launch the REAL named `al-brainstorm` agent with the resolved host model ID supplied
   explicitly to the launch selector. No fixed version or literal `opus` alias on Copilot.
   Record inventory evidence, agent ID and actual selected model; verify it is Opus.
   If the named launch cannot select that model, a real isolated general-purpose adapter
   is allowed with that same exact ID and the canonical research instructions/restrictions.
   If selection or isolation is unavailable, BLOCK with the specific facility issue;
   don't silently substitute or misreport it as missing Opus. Do not pretend loading
   an agent markdown file launches an agent.
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
   renumbering. Use the project's own template/root when established; otherwise use
      the AL template. No draft before direction.
   MAIN does not write the draft itself.
   Drafter inherits model and never approves, writes AL or reserves IDs. Genuine gaps
   return questions to main; normally one invocation, no mandatory separate spec review
   or build step. Reuse research, do not restart the Opus design conversation.
5. Show the ACTUAL final artifact, acceptance criteria/tests, non-goals, exact project
   roots/spec/index/allowlist, dependencies and validation commands, BC version,
   explicitly selected tenant/environmentName NONproduction Sandbox and permitted
   build/Synchronize publish/test operations. Get explicit FINAL-SPEC approval.
   Direction != final-spec approval. Record revision/hash and approval; meaningful scope,
   target or test contract changes invalidate approval. No production/ForceSync/Recreate.
6. Launch REAL `al-sdd` with the approved packet and the
   [canonical AL SDD](../../agents/al-sdd.md): tests/stubs -> assertion RED -> al-coder ->
   GREEN -> mutation RED -> restore GREEN -> DoD -> independent al-reviewer; al-build-fixer
   is conditional on compilation failure only. If children cannot
   launch, MAIN performs actual isolated role launches on the coordinator's full packet
   and returns results to the retained coordinator. No supported isolation or approved
   validation -> BLOCKED; never simulate delegation, tests or Opus.
   A named previously approved spec may skip new questions/drafting ONLY when its actual
   content and the target-specific operation permissions are explicitly approved and still
   valid.

Feature writes are limited to app/test and the exact spec/index. No layout migrations,
commits/push/PR, speculative IDs or extra artifacts. MAIN returns blockers rather than
allowing an isolated child to guess developer decisions.

MCP failures follow the [MCP failure policy](../../references/mcp-failure-policy.md): a child
returns `QUESTION: MCP <server> failed 3x`, MAIN asks the user (Retry / Continue without
<server> / Stop) in the question dialog and relays the answer to the same child. No child
or MAIN may compensate by downloading, unzipping or browsing base-app source on disk.
