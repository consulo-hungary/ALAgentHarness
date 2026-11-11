# AL Agent Harness

A harness for coding agents working on Business Central AL. Clone it, use it Monday.

The default AI deliverable is now brainstorming and a precise one-page spec, not an
automated feature pipeline. Developers implement by default. Optional AI implementation
writes code and runs one build; tests, mutation, DoD and independent review require
explicit opt-in. Guardrails still protect IDs, user-facing text and existing work.
See [Budget Workspace Setup](plugin/README.md#budget-workspace-setup) to reduce fixed overhead.

This repo was built live at Directions EMEA 2026 ("Stop Inventing Your Own Way .. Let's Build
the AL Agent Harness Together"). It is what works for us, not The Truth. Take what you
believe in, delete the rest.

## What is in here

Historical demo: three parts, one commit per step, a branch and a tag per step.
These tagged steps retain the original commands; the current plugin has the five focused
commands documented below.

| Part | Step | Branch / tag | Adds |
|------|------|--------------|------|
| A | 00 | `step-00-intro` | the sample app, the test app, VS Code config. No harness. |
| A | 01 | `step-01-instructions` | `AGENTS.md` (+ a thin `CLAUDE.md`), the Never-list, a permission deny list, a hook that blocks hardcoded UI text |
| A | 02a | `step-02a-objectid-regex` | a first skill: a regex "ID oracle" script - the joke |
| A | 02b | `step-02b-objectid-al-tool` | the same skill on the AL extension's `al_getnextobjectid` (and its limitation) |
| A | 03 | `step-03-objectid-mcp` | AL Object ID Ninja MCP; the same skill now reserves through it |
| A | 04 | `step-04-agents-build-validation` | build validation skill (build, diagnose, fix) + the `al-build-fixer` agent |
| A | 05 | `step-05-knowledge` | BC knowledge: the BC Observatory plugin (Observatory, Code Atlas, Learn), BCQuality, the `al-lookup` agent |
| B | 06 | `step-06-specs` | `specs/`, the interactive `al-spec` agent, `/spec` |
| B | 07 | `step-07-coding` | the `al-coder` agent (subagent, applies BCQuality) |
| B | 08 | `step-08-dod` | `DEFINITION-OF-DONE.md`, `/done`, the `al-reviewer` agent |
| C | 09 | `step-09-company-rules` | `rules/` (example rules from one partner) + company rules skill |
| C | 10 | `step-10-sdd` | the `al-sdd` agent (spec -> test -> RED -> business logic -> GREEN -> mutation -> RED -> GREEN), DoD with tests run, `/pr`, chat export |
| C | 11 | `step-11-plugin` | the whole harness as a Claude Code plugin (`plugin/` + `.claude-plugin/marketplace.json`) |

- **Part A - what every BC dev needs.** No opinions. Object IDs, a green build, BC knowledge.
- **Part B - the process.** Spec, code, done. Opinionated, but partner-neutral.
- **Part C - make it yours.** Your company rules, your tooling, your plugin. This is the part
  that should never be generic.

`main` is the final state (step 11). Prefer a plugin over a clone?

```bash
claude plugin marketplace add waldo1001/waldo.BCObservatory
claude plugin marketplace add waldo1001/DirectionsEmea.ALAgentHarness
claude plugin install al-agent-harness@al-agent-harness   # brings bc-observatory along
```

## Prerequisites

| What | Why | Install |
|------|-----|---------|
| Claude Code | the agent host this repo is built for | <https://claude.com/claude-code> (Copilot: see `docs/PORTING.md`) |
| VS Code + AL Language extension | editing, F5, symbols | Marketplace: `ms-dynamics-smb.al` |
| Node.js 20+ | `/AL-init` helper, guardrail hooks, `npx` MCP servers | <https://nodejs.org> |
| `al` CLI (implementation only) | build fallback, AL MCP server; not needed for spec work | `dotnet tool install --global microsoft.dynamics.businesscentral.development.tools --prerelease` |
| Windows PowerShell 5.1 or `pwsh` | local object index and next free IDs (`Get-ALObjectIndex.ps1`); no subscription, no AL Object ID Ninja | preinstalled on Windows; <https://aka.ms/powershell> otherwise |
| BCQuality | curated BC/AL knowledge and the `al-code-review` skill | in Claude Code: `/plugin marketplace add microsoft/BCQuality` then `/plugin install bcquality@bcquality` |
| A BC SaaS sandbox (explicit publish/tests only) | not needed for default spec or code-only work | fill `environmentName` in `.vscode/launch.json` |
| Git | `/AL-commit` creates local logical commits | Install Git and configure your own repository identity; no push is implied |

## Clone it

```bash
git clone <this repo> al-agent-harness
cd al-agent-harness
git fetch --all --tags
claude            # approve the project MCP servers when asked
```

## Demo it

`demo.sh` walks the steps so nobody types branch names on stage.

```bash
./demo.sh list        # all steps, current one marked
./demo.sh goto 00     # start at the empty repo
./demo.sh next        # one step forward (prints the step title)
./demo.sh prev        # one step back
./demo.sh reset       # stash local edits (recoverable) and go back to step 00
```

The carrier task used in both demo runs is in `docs/TASK.md`. The full talk flow is in
`docs/DEMO-FLOW.md`.

## Make it yours

1. Change the affix in `app/AppSourceCop.json` and the ranges in `app.json`
   (or point the harness at your own app folders and delete `app/` and `test/`).
2. Empty `rules/` and write your own rules: one short article plus a `.good.al` and a
   `.bad.al` per rule. The company rules skill and internal DoD pick them up automatically.
3. Read `AGENTS.md` and delete every line you do not believe in. Keep it short.
4. Keep `/AL-commit` focused on local commits; integrate your shop's PR tooling separately.
5. Switching tools is mechanical: `AGENTS.md`, `rules/`, `specs/` and the skills are shared
   markdown. Only agents, commands, MCP config and hooks are tool-specific. See
   `docs/PORTING.md`.

## Budget-First Commands

The plugin provides five command entry points. Each acts on the active workspace, not
the repository containing an attached command. Earlier numbered harness specs describe
historical contracts; [plugin/README.md](plugin/README.md) describes the current defaults.

| Command | Does | Does not |
|---------|------|----------|
| `/AL-init` | Agentifies a new or existing repo: docs folders, project and technical overview, `AGENTS.md` rules, guardrail hooks, git docs check, local object index. | Overwrite user text, move AL, build or commit. |
| `/AL-brainstorm` | MAIN brainstorming, one batched question round (+1 if necessary), at-most-100-line numbered spec + README line, then STOP. | Default Opus/subagents, implementation, builds, tests or translation. |
| `/AL-implement <spec>` | Optional MAIN code-only implementation, one build after estimate/consent, then docs and spec log updates; `--full` opts into expensive SDD. | Default tests, publish, mutation, DoD, reviewer or translation; automatic build repair. |
| `/AL-review [scope]` | Read-only review of the whole codebase or one scope (e.g. `the object IDs`); report in `docs/generated/reviews/`. | Edit AL, build, or run without a report. |
| `/AL-commit` | Updates the technical docs, then creates short local commits with explicit staging. | Edit code, include secrets, rewrite history, push or create a PR. |

There is deliberately no whole-codebase refactor command. Brainstorming never continues into
implementation automatically. Missing validation is reported, not converted into success.

### Object IDs without a subscription

`plugin/scripts/Get-ALObjectIndex.ps1` parses every `.al` file and `app.json` into
`docs/knowledge/object-index.json` (objects, fields, ID usage, free blocks, issues) and returns next free
IDs (`-NextId`, `-NextMemberId`). IDs are not reserved; duplicate detection catches branch collisions.

### Focused internal specialists

The specialists below are expensive full-mode opt-ins, never default steps:

| Agent | Responsibility |
|-------|----------------|
| `al-coder` | Implement approved logic after an executed assertion failure proves RED. |
| `al-build-fixer` | Full mode only: one compiler fix/rebuild cycle, then human handoff. |
| `al-reviewer` | Independent read-only review of the final validated delta; never review its own edits. |
| `al-sdd` | Coordinate tests/stubs, RED, implementation, GREEN, reversible mutation, RED, restore and final GREEN. |
| `al-commit` | Group reviewed changes into small local commits. |

Only `/AL-implement <spec> --full` starts SDD after cost consent and exact nonproduction
Sandbox permission. Evidence stays in session, not an inflated spec.

### What `/AL-init` leaves in a repo

```text
AGENTS.md / CLAUDE.md          Harness block: rules every chat follows (preserves your own text)
.github/copilot-instructions.md Pointer to AGENTS.md for Copilot
.github/hooks/                 al-guardrails (no literal UI text, no base-app digging), al-docs-check
.claude/settings.json          Same guardrail for Claude Code (only if the file did not exist)
.git/hooks/pre-commit          Requires docs/knowledge/technical-overview.md with AL/spec changes
docs/specs/                    Feature specs (up to 100 lines; Implementation Log grows)
docs/knowledge/                Your inputs + project-overview.md, technical-overview.md, object-index.json
docs/generated/                ONLY output folder for generated files, reports and exports
```

New specification names are numbered: `1-project-create.md`, `2-carrier-validation.md`. Allocate the
next number above the highest existing prefix. Every spec MUST include `status` (`draft`, `approved`,
`implemented`) and a last-updated `date` (`YYYY-MM-DD`).

### Use with Copilot

In a terminal at this repository root, with standalone Copilot CLI installed:

```powershell
copilot plugin install ".\plugin"
copilot plugin list
```

For VS Code, use **Chat: Install Plugin from Source** and select the local `plugin`
directory. Enable it for the intended harness, then start a fresh chat and use slash
autocomplete to find **AL-init**, **AL-brainstorm**, **AL-implement**, **AL-review** or
**AL-commit**. Use the namespace shown by your host if it does not expose a bare command.
Do not use `!AL-review`: `!` can mean shell execution rather than a plugin command.

Use the latest enabled Claude model (Sonnet-class for design and code, Haiku for mechanical edits; GPT is
fine for docs). Opus only after you grant it. Spec work normally needs no MCP servers.
See [plugin/README.md](plugin/README.md) for details and [docs/PORTING.md](docs/PORTING.md) for compatibility.
