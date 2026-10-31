#!/usr/bin/env node
// SessionStart hook: a plugin cannot ship an always-on CLAUDE.md / AGENTS.md, so the harness's
// always-on rules travel this way. The project's own AGENTS.md (affix, folders, BC version) still
// applies on top. Plain stdout from a SessionStart hook becomes session context.
const root = process.env.PLUGIN_ROOT || process.env.CLAUDE_PLUGIN_ROOT || '';
console.log(`AL agent harness (plugin) - always-on rules:
- Extend, never modify the base app: tableextension, pageextension, event subscribers.
- Business logic lives in codeunits, not in page triggers.
- Text shown by Error, Message and Confirm is a Label variable, never a literal (a hook blocks literals).
- Object, field and enum-value IDs come from the al-object-id-assignment skill (Ninja). Never invent one.
- Identify AL objects as Type ID "Name": Table 18 "Customer", Codeunit 414 "Release Sales Document".
- Never report AL implementation done without a green build and internal definition-of-done evidence.
- Read the project's AGENTS.md for the affix, the folders and the BC version.
- Exactly four public chat commands: AL-start, AL-refactor, AL-brainstorm, AL-commit. ! syntax is unsafe shell execution, not a chat command.
- Target the ACTIVE WORKSPACE, never a tagged plugin resource path. AL-start shallow setup preserves AL bytes; never migrate this plugin repository.
- AL-refactor is code-first in existing files, no layout setup or spec gate; uncertain semantics are deferred, sandbox publish is not implicit.
- AL-brainstorm uses a REAL Opus agent and main-chat questions ONE at a time; direction approval != final-spec approval. Numbered specs use numeric max + 1, never count.
- After agreed direction only, actual internal al-spec writes the draft/index; MAIN owns final approval. SDD owns tests/stubs/reservations before assertion RED, then actual al-coder writes minimum logic.
- al-build-fixer is conditional on compilation failure only. Actual isolated read-only al-reviewer follows final GREEN + DoD (or verified changed refactor); source edits require fresh validation/review, logic edits also refresh mutation evidence. At most two bounded fix cycles.
- If nested launching is unavailable, MAIN launches specialists with full packets and retained coordinator state. No supported isolated facility means BLOCKED, never roleplayed independent review. Setup/commit do not dispatch these specialists.
- Resolve one active spec root with al-project-layout: docs/specs/ for new projects, legacy specs/ respected; both exist -> main selects once. Pass paths to actual agents, never roleplay delegation.
- Final-spec approval pins the NONproduction Sandbox and permitted operations before actual SDD RED/GREEN/mutation tests. No production, destructive sync or global autoApprove changes.
- AL-commit authorizes logical local commits after index/diff inspection; preserve unrelated staging and exclude unreviewed mixed-file edits. No push or PR.
Templates when the project has none: ${root}/templates (spec template, DEFINITION-OF-DONE.md, rules README).`);
