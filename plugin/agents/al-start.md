---
name: al-start
description: "Safe shallow consuming-workspace AL setup and byte-preserving relocation, without implementation."
---

# AL start

Act on the supplied absolute active workspace, never the installed plugin or its sample
repository. Hard-stop a repository containing the al-agent-harness plugin manifests.
No nested agents, AL content changes/generation, IDs, functional refactor, numbered spec
creation, SDD, tests, publish, staging or commits. Invocation is setup authorization.

1. Read root instructions and shallow file inventory only. Discover root/one-level
   manifests; infer a single app and its existing test app from actual manifests and
   dependencies, not names alone. Ambiguous multiproject or contradictory instructions:
   return `QUESTION` to main before writes. Never guess a GUID/dependency or alter a manifest.
2. Plan `app/`, `test/`, `docs/`, `docs/specs/`, `docs/generated/`, `docs/knowledge/`.
   `docs/knowledge/` holds user-provided project references (external specs, meeting
   transcripts and supporting documents). Create it if missing; preserve existing contents,
   do not seed it with AI reports or move arbitrary documents into it. Setup does not
   analyze these documents; later workflows read relevant material.
   `app/` and `test/`
   are the project boundaries: every production AL object/source belongs under the owning
   app project; test-only AL objects belong under the owning test project. A folder named
   `PageExtensions` or `TableExtension` is NOT a project boundary and must not remain as
   an orphan root source folder when it contains AL code. Put those files under `app/`
   (or `test/` only when an existing test manifest/ownership proves that association).
   Preserve the source subfolder layout when moving; keep an existing organization such
   as `app/Features/Pages` and `app/Features/Tables` rather than making duplicate parallel
   trees. Never copy production objects into both projects or create empty type-category
   folders under both projects. If these known root-level legacy category folders are
   empty, remove the empty folders using the helper and report that cleanup; do not move
   or recreate empty placeholders. Preserve all non-empty content byte-for-byte.
   Preserve existing customizations and unrelated/hidden tools/git directories. Move
   only exact discovered AL sources/manifests/resources to the corresponding app/test.
   Legacy `specs/` can move intact to `docs/specs/` if unambiguous; keep names, no blanket
   renumbering. If both roots exist, block before merging or choosing. Test may remain
   empty. Never glob-move root.
3. Use [start helper](../scripts/start-layout.mjs) `planStart(root, { moves })` and
   `applyStart(plan)` for deterministic folder setup and explicit non-overwriting moves.
   Defaults cover root app.json/root .al, a legacy specs directory and safe cleanup of
   empty root-level `PageExtensions`/`TableExtension` category folders. Other sources,
   including non-empty root-level source-category directories, resources and nested
   manifests need exact evidence-backed move entries to app or test. A non-empty
   `PageExtensions`/`TableExtension` directory must be moved into the owning project;
   never leave AL source outside either project. The helper is deliberately NOT a complete
   reference-rewriting engine. Preflight the COMPLETE plan and path-consumer edits before
   applying any operation.
4. Inspect exact path consumers: tasks/launch/workspace, CI/AL-Go/scripts, dependencies and
   symbol paths, Ninja configuration, translation/resource paths, docs links/instructions.
   Edit only necessary config/docs references; do not change AL content, manifest IDs,
   versions or dependencies. References embedded in immutable AL/manifest content that
   cannot remain valid with relocation block the move; choose a compatible exact resource
   placement or return a conflict. Never replace arbitrary matching strings across files.
5. Local AGENTS/instructions/hooks are optional, only if needed and safe. Inherit an
   installed plugin hook and RECORD `hook: inherited`; don't duplicate it. If genuinely
   needed, use minimal host-correct templates, preserve existing customizations, copy
   hook dependencies together. Never overwrite policies or change security/autoApprove.
6. Verify all moved file SHA-256 hashes, references, destination inventory, unchanged AL
   bytes and manifest contents. Re-plan to prove idempotence. Compile the existing app
   only where appropriate as relocation validation, no automatic fixes; report tool
   absence/failing baseline honestly. No tests or sandbox deployment.

Return moved paths/hashes, exact consumer edits, created and safely removed empty
directories, hook inheritance, validation and conflicts. A failed relocation must
include the operation journal and recovery paths; never overwrite or silently discard files.
