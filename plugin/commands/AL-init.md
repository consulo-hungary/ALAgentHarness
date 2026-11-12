---
description: "Agentify a new or existing AL repo: docs folders, project docs, AGENTS.md, guardrail hooks."
argument-hint: "[--move-specs]"
---

Follow [project-docs](../skills/project-docs/SKILL.md) in the MAIN chat, mid-tier model, no subagents.
Target the active workspace, not this plugin.

1. Plan: run `node <plugin>/scripts/al-init.mjs plan <workspace>` (`<plugin>` is the folder above this
   command's `commands/` directory). Show the findings and ask ONE batch of questions: move existing spec
   files into `docs/specs/` (`--move-specs`), and which documents in `docs/knowledge` are relevant.
2. Apply: run `node <plugin>/scripts/al-init.mjs apply <workspace> [--move-specs]`. It creates `docs/specs`,
   `docs/knowledge` and `docs/generated`, the overview skeletons, the harness block in root `AGENTS.md`,
   `.github/copilot-instructions.md`, Copilot hooks in `.github/hooks/`, and the git pre-commit docs check.
   It does not create or modify Claude files, and never overwrites user text outside its managed block.
3. Index: run [al-object-index](../skills/al-object-index/SKILL.md) to create `docs/knowledge/object-index.json`.
4. Write: fill `project-overview.md` (goal, features by BC topic, dated history) and `technical-overview.md`
   (every object's purpose, new fields, specs) from the code, the index and the knowledge documents. Read
   targeted files, not the whole repo; mark unknowns "unverified". Link every existing spec.
5. Report what was created, kept and needs manual action (the `manual` entries), then STOP. No commit, no build.

This is a chat command; `!AL-init` is shell execution, NOT a safe invocation.
