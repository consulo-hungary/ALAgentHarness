# AGENTS.md

Always-on instructions for every coding agent in this repo. GitHub Copilot loads this file by
default; Claude Code reads it through `CLAUDE.md`. Keep it short: if something is a workflow,
it is a skill in `.claude/skills/`, not a paragraph here.

## This repo

- `app/` - "Directions Demo", a Business Central per-tenant extension (PTE) in AL.
- `test/` - its test app. Depends on `app/`.
- `specs/` - one spec per feature: the contract for the implementation (`specs/README.md`).
- `rules/` - company rules, one article + `.good.al` / `.bad.al` each. On top of BCQuality; they win where the two disagree.
- The base application is Microsoft's. You extend it; you never modify it.

## Look it up, never assume

- **Affix:** `mandatoryAffixes` in `app/AppSourceCop.json`. Every new object name carries it.
- **Object IDs:** reserved with AL Object ID Ninja, never picked. Do not read `idRanges`.
- **BC version:** `application` and `runtime` in `app/app.json`.

## How we write AL

- Extend, never modify: `tableextension`, `pageextension`, event subscribers.
- Business logic lives in codeunits, not in page triggers.
- Text shown by `Error`, `Message` and `Confirm` is a `Label` variable, never a literal.
- Identify AL objects as `Type ID "Name"`: `Table 18 "Customer"`,
  `Codeunit 414 "Release Sales Document"`.

## Never

- Never invent an object, field or enum-value ID. No guess, no "next free number".
- Never hardcode user-facing text. A literal in `Error(`, `Message(` or `Confirm(` is blocked.
- Never edit files outside `app/`, `test/` and the feature's spec in `specs/` for an AL task.
- Never rewrite git history: no force push, no rebase or reset of commits others may have.
- Never report AL implementation done without a green build. Feature completion is
  `DEFINITION-OF-DONE.md`, checked internally by `definition-of-done`.

## Skills (loaded on demand)

Skills, agents, commands, the guardrail hook and the MCP servers come from the
`al-agent-harness` plugin (`plugin/`). This file keeps what is specific to this repo.

| When | Skill |
|------|-------|
| a new object, field or enum value; deleting one you reserved | `al-object-id-assignment` |
| after changing any `.al` file or `app.json`; before saying done | `al-build-validation` |
| a "how should I" question about AL/BC; checking an event, property or pattern | `al-knowledge` |
| "is it done?", before review or a PR | `definition-of-done` |
| before writing, designing or reviewing AL | `company-rules` |

## Four focused commands

| Task | Command |
|------|-----|
| normalize an active consuming AL workspace | `/AL-start` - folder setup, byte-preserving moves and required local configuration; no AL source edits |
| review and improve existing AL code | `/AL-refactor` - findings and verified behavior-preserving fixes; no layout setup or feature pipeline |
| design a new feature | `/AL-brainstorm` - real Opus brainstorming agent, then approved numbered spec and SDD; routes AL to AL SDD and web/Python/custom projects to project SDD |
| group and commit existing changes | `/AL-commit` - small grouping agent, short local commits; no code edits, push or PR |

Commands target the active workspace, not tagged plugin resources. Do not run consuming
project setup on this harness repository. New specs use ascending numeric prefixes, such
as `1-project-create.md`, `2-carrier-validation.md`; templates and indexes are not specs.
Do not launch unrelated command phases. Only brainstorming leads to new-feature SDD.

## Internal specialists

Four commands do not limit the number of internal roles. Use `al-spec` for the agreed
numbered draft, `al-coder` for approved logic after SDD proves RED, `al-build-fixer` only
on compilation failures, and `al-reviewer` for independent read-only final review.
`al-sdd` owns AL test scope, RED/GREEN/mutation evidence and sequential handoffs;
`project-sdd` coordinates approved non-AL SDD and `project-reviewer` performs its separate
read-only final review. Pass the same approved paths, scope, source revision and evidence
to each actual subagent.
Keep startup and commit grouping separate; never run all specialists on every command.