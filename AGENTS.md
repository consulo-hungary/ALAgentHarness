# AGENTS.md

Always-on instructions for every coding agent in this repo. GitHub Copilot loads this file by
default; Claude Code reads it through `CLAUDE.md`. Keep it short: if something is a workflow,
it is a skill in `.claude/skills/`, not a paragraph here.

## This repo

- `app/` - "Directions Demo", a Business Central per-tenant extension (PTE) in AL.
- `test/` - its test app. Depends on `app/`.
- `specs/` - lean feature specs; new consuming projects use `docs/specs/`.
- `rules/` - company rules, one article + `.good.al` / `.bad.al` each. On top of BCQuality; they win where the two disagree.
- The base application is Microsoft's. You extend it; you never modify it.

## Look it up, never assume

- **Affix:** use the owning app's `AppSourceCop.json` configuration for new object names and
  tableextension fields; never add `PTE` just because the app is a PTE. If no affix is configured,
  inspect existing extension fields in that app, record a clear convention in the workspace root
  `AGENTS.md`, and use it. If unclear, ask the developer rather than inventing one.
- **Object IDs:** from the local object index (`plugin/scripts/Get-ALObjectIndex.ps1`), never picked or guessed. No Ninja.
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
- AL source edits stay in `app/` or `test/`; specs stay in `specs/`. ALL generated
  supporting files/reports/exports/scratch files go ONLY under `docs/generated/`.
- Never rewrite git history: no force push, no rebase or reset of commits others may have.
- Never claim compilation success without a green build. Default implementation has
  ONE build after estimate/consent; return compiler errors to the human, no automatic retry.
- DoD, tests, mutation, independent review, translation and structure polish are opt-ins,
  never default completion gates. `DEFINITION-OF-DONE.md` applies only in explicit full mode.

## Skills (loaded on demand)

Skills, agents, commands, the guardrail hook and the MCP servers come from the
`al-agent-harness` plugin (`plugin/`). This file keeps what is specific to this repo.
For ordinary BC/AL feature-design requests, load the installed `bc-workflow` skill even
without slash commands. Other skills load only when relevant; specialists never auto-run.

| When | Skill |
|------|-------|
| a new object, field or enum value; deleting one you reserved | `al-object-id-assignment` |
| after changing `.al` or `app.json`; one build, no default repair | `al-build-validation` |
| a "how should I" question about AL/BC; checking an event, property or pattern | `al-knowledge` |
| explicit full mode or requested DoD report only (expensive) | `definition-of-done` |
| before writing, designing or reviewing AL | `company-rules` |

## Budget workflow

Use a selected mid-tier model in MAIN; cheap tier for mechanical tasks. Opus is opt-in
`--deep` only, at most one consultation, never an availability blocker. Follow `bc-workflow`.
MAIN brainstorms with about 10 targeted reads/greps and 15 total tool calls, one batch of
3-6 questions with defaults (at most two rounds), then writes an at-most-100-line spec and
one README link line after agreed direction. STOP for developers after spec approval.
Every spec MUST have `status: draft | approved | implemented` and `date: YYYY-MM-DD`
(last updated). Developer approval sets approved; confirmed completion sets implemented.
No feature subagents, repeated reads, hashes, locks or approval bookkeeping by default.
Before subagents, build/publish or >150-line code steps, estimate cost and ask once.

## Focused commands

| Task | Command |
|------|-----|
| initialize or agentify a repo | `/AL-init` - docs folders, project/technical overview, AGENTS.md block, guardrail hooks, git docs check |
| review the codebase or one part | `/AL-review [scope]` - read-only; report in `docs/generated/reviews/` |
| design a new feature | `/AL-brainstorm` - MAIN questions + lean numbered spec, then STOP |
| explicitly implement a spec | `/AL-implement <spec>` - MAIN code only, one build; `--full` is expensive opt-in |
| group and commit existing changes | `/AL-commit` - small grouping agent, short local commits; no code edits, push or PR |

Commands target the active workspace, not tagged plugin resources. Do not run consuming
project setup on this harness repository. New specs use ascending numeric prefixes;
templates and indexes are not specs. Brainstorming NEVER starts implementation or SDD.

## Internal specialists

Only explicit expensive `--full` enables `al-sdd`, `al-coder`, `al-build-fixer` (one fix
cycle) and `al-reviewer`; DoD also needs opt-in. Never relaunch a child to relay an answer.
Keep startup/commit grouping separate. Developers run NAB translations manually; explicit
AI translation uses the cheap tier and only current-feature units, even in full mode.