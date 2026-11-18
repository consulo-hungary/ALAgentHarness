---
description: "Agentify a new or existing AL repo: docs folders, project docs, AGENTS.md, guardrail hooks."
argument-hint: "[--move-specs]"
---

Follow [project-docs](../skills/project-docs/SKILL.md) in the MAIN chat, Sonnet-class model, no subagents.
Target the active workspace, not this plugin.

1. Plan: run `node <plugin>/scripts/al-init.mjs plan <workspace>` (`<plugin>` is the folder above this
   command's `commands/` directory). Show the findings and ask ONE batch of questions: move existing spec
   files into `docs/specs/` (`--move-specs`), and which documents in `docs/knowledge` are relevant.
2. Before apply, read any existing root `AGENTS.md`, `.github/copilot-instructions.md` and `.github/agent/AGENTS.md`.
   Identify useful project rules and context to transfer; preserve uncertain or conflicting content, and do
   not copy the old harness-managed block. Preserve root and shared custom text outside managed blocks;
   report conflicts with the new workflow rather than silently deleting project rules.
3. Apply: run `node <plugin>/scripts/al-init.mjs apply <workspace> [--move-specs]`. It creates `docs/specs`,
   `docs/knowledge` and `docs/generated`, the overview skeletons, the harness block in root `AGENTS.md`
   and `.github/agent/AGENTS.md`,
   the routing block in `.github/copilot-instructions.md`, Copilot hooks in `.github/hooks/`, and the git
   advisory pre-commit docs check. Existing deployed docs checkers are refreshed so missing technical docs
   never block commits or pushes. Unrelated Git hooks are preserved. It does not modify Claude files or
   user text outside managed blocks. The installed workflow uses one writer, independent clean-code review
   and at most one correction for explicit implementation/refactoring; brainstorming remains in MAIN.
4. Transfer the useful existing Copilot instructions into `.github/agent/AGENTS.md` outside the managed block,
   without duplicating existing rules. Only remove original text after its meaning has been preserved there;
   keep uncertain or conflicting text in place and report it. Keep the Copilot routing block. On repeat runs,
   do not duplicate transferred content. The script alone preserves existing text; this review is done by MAIN.
5. Index: run [al-object-index](../skills/al-object-index/SKILL.md) to create `docs/knowledge/object-index.json`.
6. Naming: for each app with no configured `AppSourceCop.json` affix, inspect its existing extension fields.
   If they clearly establish a prefix or suffix, record the app-specific convention in root `AGENTS.md` without
   replacing existing text. If evidence is absent or ambiguous, ask the developer; never infer `PTE` from
   per-tenant status. Configured affixes take precedence.
7. Write: fill `project-overview.md` (goal, features by BC topic, dated history) and `technical-overview.md`
   (every object's purpose, new fields, specs) from the code, the index and the knowledge documents. Read
   targeted files, not the whole repo; mark unknowns "unverified". Link every existing spec.
8. Report what was created, transferred, kept and needs manual action (the `manual` entries), then STOP. No commit, no build.

This is a chat command; `!AL-init` is shell execution, NOT a safe invocation.
