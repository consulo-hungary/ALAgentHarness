---
description: "Agentify a new or existing AL repo: docs folders, project docs, AGENTS.md, guardrail hooks."
argument-hint: "[--move-specs]"
---

Follow [project-docs](../skills/project-docs/SKILL.md) in the MAIN chat, mid-tier model, no subagents.
Target the active workspace, not this plugin.

1. Plan: run `node <plugin>/scripts/al-init.mjs plan <workspace>` (`<plugin>` is the folder above this
   command's `commands/` directory). Show the findings and ask ONE batch of questions: move existing spec
   files into `docs/specs/` (`--move-specs`), and which documents in `docs/knowledge` are relevant.
2. Before apply, read any existing `.github/copilot-instructions.md` and `.github/agent/AGENTS.md`.
   Identify useful project rules and context to transfer; preserve uncertain or conflicting content, and do
   not copy the old harness-managed block. Leave any root `AGENTS.md` unchanged.
3. Apply: run `node <plugin>/scripts/al-init.mjs apply <workspace> [--move-specs]`. It creates `docs/specs`,
   `docs/knowledge` and `docs/generated`, the overview skeletons, the harness block in `.github/agent/AGENTS.md`,
   the routing block in `.github/copilot-instructions.md`, Copilot hooks in `.github/hooks/`, and the git
   pre-commit docs check. It does not create or modify Claude files or user text outside managed blocks.
4. Transfer the useful existing Copilot instructions into `.github/agent/AGENTS.md` outside the managed block,
   without duplicating existing rules. Only remove original text after its meaning has been preserved there;
   keep uncertain or conflicting text in place and report it. Keep the Copilot routing block. On repeat runs,
   do not duplicate transferred content. The script alone preserves existing text; this review is done by MAIN.
5. Index: run [al-object-index](../skills/al-object-index/SKILL.md) to create `docs/knowledge/object-index.json`.
6. Write: fill `project-overview.md` (goal, features by BC topic, dated history) and `technical-overview.md`
   (every object's purpose, new fields, specs) from the code, the index and the knowledge documents. Read
   targeted files, not the whole repo; mark unknowns "unverified". Link every existing spec.
7. Report what was created, transferred, kept and needs manual action (the `manual` entries), then STOP. No commit, no build.

This is a chat command; `!AL-init` is shell execution, NOT a safe invocation.
