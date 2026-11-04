---
name: al-start
description: "Explicit AL-start --layout only: PTE scaffolding and byte-preserving relocation."
---

# AL start

Run only for explicit `/AL-start --layout`, after cost consent. Plain `/AL-start` stays
in MAIN and calls `planDocsStart`; it never launches this layout agent. All relocation
instructions below apply ONLY to --layout, not ordinary chats or default startup.

Act on the supplied absolute active workspace, never the installed plugin or its sample
repository. Hard-stop a repository containing the al-agent-harness plugin manifests.
No nested agents, AL content changes/generation, IDs, functional refactor, numbered spec
creation, SDD, tests, publish, staging or commits. Invocation is setup authorization.

1. Read root instructions and shallow file inventory only. Discover root/one-level
   manifests; infer a single app and its existing test app from actual manifests and
   dependencies, not names alone. Ambiguous multiproject or contradictory instructions:
   return `QUESTION` to main before writes. Never guess a GUID/dependency or alter a manifest.
2. Plan ONLY this layout (project name is the workspace basename, not a fixed CPA name):

   ```text
   <project>/
   |-- AGENTS.md
   |-- <project>.code-workspace
   |-- .github/
   |   |-- copilot-instructions.md
   |   `-- workflows/
   |-- app/
   |   |-- app.json
   |   |-- AppSourceCop.json
   |   |-- .vscode/
   |   |   |-- settings.json
   |   |   `-- launch.json
   |   |-- .alpackages/
   |   |-- Features/Setup/
   |   |   |-- Codeunits/
   |   |   |-- Pages/
   |   |   `-- Tables/
   |   `-- Translations/
   |-- test/
   |   |-- app.json
   |   `-- Tests/
   |-- docs/
   |   |-- specs/
   |   |-- knowledge/
   |   `-- generated/
   `-- rules/
   ```

   File entries are conditional on real project data: move existing manifests/configs
   byte-for-byte, never manufacture application/test manifests, GUIDs, dependencies,
   affixes or launch/Sandbox settings. Leave unknown files absent and report them.
   Create missing AGENTS.md with the project map, actual affix/application/runtime
   (or explicit "not configured") and safety rules. Missing Copilot instructions point
   to that map. Create a workspace listing app/test only if no workspace file exists;
   preserve an existing workspace and edit only necessary path references. Missing
   app/.vscode/settings.json may be an empty JSON object, never guessed settings.
   Only create Features/Setup category scaffolding when no existing app/Features or
   app/src organization (including planned moves) exists. Existing organization wins;
   do not create a duplicate parallel tree. No AL source files are generated.
   Workflows, rules, test/Tests and docs directories remain empty unless content already
   exists. Do not seed templates, DoD, specs/indexes, rules README, reports, CI jobs,
   hooks, CLAUDE.md or extra tooling. Preserve cache ignore rules; update an existing
   ignore file only if relocation requires it, otherwise report missing cache ignores.
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
   Resolve ONE active spec root through [bc-workflow](../skills/bc-workflow/SKILL.md)'s optional resolver.
   Legacy `specs/` stays intact; do not create a parallel docs/specs/ or migrate it.
   If both roots exist, main selects once before writes; pass that selection as specRoot
   to the helper. Never merge, renumber or split spec writers. Test may remain
   empty. Never glob-move root.
3. Use [start helper](../scripts/start-layout.mjs) `planStart(root, { moves })` and
   `applyStart(plan)` for deterministic folder/setup-file creation and explicit
   non-overwriting moves. Pass the selected project-relative specRoot when necessary.
   Defaults cover root app.json/root .al and safe cleanup of
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
5. Preserve existing AGENTS/instructions/policies. Inherit the installed plugin hook and
   RECORD `hook: inherited`; never duplicate it or add hooks during setup. Never change
   security/autoApprove. No extra approval gates or workflow steps.
6. Verify all moved file SHA-256 hashes, references, destination inventory, unchanged AL
   bytes and manifest contents. Re-plan with the same specRoot to prove idempotence.
   Check created workspace/settings JSON and actual paths. This is setup verification,
   not AL implementation: no build, tests, symbol downloads or sandbox deployment.

Return moved paths/hashes, exact consumer edits, created and safely removed empty
directories/files, missing evidence-backed configuration, hook inheritance, validation
and conflicts. A failed relocation must
include the operation journal and recovery paths; never overwrite or silently discard files.
