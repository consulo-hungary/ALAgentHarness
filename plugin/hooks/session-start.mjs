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
- Default: selected mid-tier model in MAIN. Cheap tier for mechanical edits. Opus is --deep opt-in only, at most one consultation; never block on model availability.
- Read the project's AGENTS.md for the affix, the folders and the BC version.
- Public chat commands: AL-start, AL-refactor, AL-brainstorm, AL-implement, AL-commit. ! syntax is unsafe shell execution, not a chat command.
- Target the ACTIVE WORKSPACE, never a tagged plugin resource path. AL-start shallow setup preserves AL bytes; never migrate this plugin repository.
- AL-refactor is code-first in existing files, no layout setup or spec gate; uncertain semantics are deferred, sandbox publish is not implicit.
- AL-brainstorm: MAIN only, no subagents, about 10 targeted reads/greps and 15 total tool calls; 3-6 questions with defaults in one batch, at most two rounds. Ask write spec?, MAIN writes at most 80 lines and one README index line, then STOP. No hashes/locks/approval ledger.
- AL-implement <spec>: explicit code-only MAIN step, ONE build after estimate/consent, errors returned to human. No tests/test app, publish, mutation, DoD, reviewer, build-fixer, translation or layout polish by default.
- --full is expensive opt-in only: al-sdd, al-coder, al-build-fixer (one compiler fix cycle), definition-of-done and al-reviewer. Sandbox operations require exact explicit nonproduction permission; no destructive sync or global autoApprove changes.
- Before any subagent, build/publish or >150-line code step, show estimated calls/output/build counts and ask once for the bounded step/bundle. Never relaunch a child to relay an answer; never reread unchanged files or cosmetically repeat calls.
- Follow skills/bc-workflow/SKILL.md: docs/specs/ for new specs, respect explicit legacy specs/; no automatic layout resolver. With consent convert relevant docs/knowledge/*.docx once to .md, reuse text. MCP docs only for uncertain BC facts.
- Developers run NAB translation commands manually; AI translation only on explicit request, cheap tier, current-feature units only, never automatic even in --full.
- AL-commit authorizes logical local commits after index/diff inspection; preserve unrelated staging and exclude unreviewed mixed-file edits. No push or PR.
- MCP servers (bc-observatory, bc-code-atlas, microsoft-learn, al, al-object-id-ninja): if one does not start or a call fails 3 attempts in total, STOP and ask the user with the question dialog (Retry / Continue without <server> / Stop). Never compensate on the file system: no downloading or unzipping base-app source, no extracting .app/.zip, no searching .alpackages. Subagents return QUESTION to MAIN. See references/mcp-failure-policy.md.
Templates when the project has none: ${root}/templates (spec template, DEFINITION-OF-DONE.md, rules README).`);
