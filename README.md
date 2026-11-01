# AL Agent Harness

A harness for coding agents working on Business Central AL. Clone it, use it Monday.

An agent without a harness writes decent AL - and nothing checks any of it. It picks its own
object IDs and reserves none, decides the design without asking, never compiles and never runs
its tests. The model is fine. It just has no idea what we consider done. A harness tells it: the always-on file,
the guardrails, the skills it loads on demand, the agents that run your process, and a
definition of done a machine can check.

This repo was built live at Directions EMEA 2026 ("Stop Inventing Your Own Way .. Let's Build
the AL Agent Harness Together"). It is what works for us, not The Truth. Take what you
believe in, delete the rest.

## What is in here

Historical demo: three parts, one commit per step, a branch and a tag per step.
These tagged steps retain the original commands; the current plugin has the four focused
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
| Node.js 20+ | the hook script, `npx` MCP servers | <https://nodejs.org> |
| `al` CLI | build fallback, AL MCP server, test runs | `dotnet tool install --global microsoft.dynamics.businesscentral.development.tools --prerelease` |
| AL Object ID Ninja | object ID reservations | MCP server via `.mcp.json` (npx, nothing to install); VS Code extension `vjeko.vjeko-al-objid` optional |
| BCQuality | curated BC/AL knowledge and the `al-code-review` skill | in Claude Code: `/plugin marketplace add microsoft/BCQuality` then `/plugin install bcquality@bcquality` |
| A BC SaaS sandbox | publishing and running tests | fill `environmentName` in `.vscode/launch.json` |
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

1. Change the affix in `app/AppSourceCop.json` and the ranges in `app.json` / `.objidconfig`
   (or point the harness at your own app folders and delete `app/` and `test/`).
2. Empty `rules/` and write your own rules: one short article plus a `.good.al` and a
   `.bad.al` per rule. The company rules skill and internal DoD pick them up automatically.
3. Read `AGENTS.md` and delete every line you do not believe in. Keep it short.
4. Keep `/AL-commit` focused on local commits; integrate your shop's PR tooling separately.
5. Switching tools is mechanical: `AGENTS.md`, `rules/`, `specs/` and the skills are shared
   markdown. Only agents, commands, MCP config and hooks are tool-specific. See
   `docs/PORTING.md`.

## Four focused commands

The plugin provides only these four command entry points. Each acts on the active
workspace, not the repository containing an attached command. The contract is recorded
in [specs/2-focused-commands.md](specs/2-focused-commands.md).

| Command | Does | Does not |
|---------|------|----------|
| `/AL-start` | Shallow setup inspection; create the standard folders, move existing project files without changing AL content, update necessary path references and missing local instructions. | Review code, implement features, generate AL or deploy. |
| `/AL-refactor` | Inspect existing code deeply, list sourced findings, fix verified behavior-preserving inconsistencies in existing files and validate. | Normalize folders, create a feature spec, silently merge different event/trigger semantics or upgrade BC. |
| `/AL-brainstorm` | Launch an Opus brainstorming agent, clarify the feature, draft a numbered spec and start SDD after explicit final-spec/sandbox approval. | Silently substitute a different model, implement before approval or deploy to production. |
| `/AL-commit` | Review uncommitted changes for grouping and create short meaningful local commits with explicit staging. | Edit code, perform a broad refactor, include secrets, rewrite history, push or create a PR. |

Startup and safe refactor fixes do not require the old multi-stage brainstorm/spec pipeline.
Only new-feature brainstorming continues into SDD. Required host permissions and real
ambiguities still apply. Missing validation is reported, not converted into success.

### Focused internal specialists

The four public commands use internal agents only when their phase needs them:

| Agent | Responsibility |
|-------|----------------|
| `al-spec` | Write the agreed numbered draft and index; main chat obtains final approval. |
| `al-coder` | Implement approved logic after an executed assertion failure proves RED. |
| `al-build-fixer` | Diagnose compilation failures with bounded, behavior-preserving fixes; not run on successful builds. |
| `al-reviewer` | Independent read-only review of the final validated delta; never review its own edits. |
| `al-sdd` | Coordinate tests/stubs, RED, implementation, GREEN, reversible mutation, RED, restore and final GREEN. |

SDD carries the same approved scope and source/package/test evidence across actual
handoffs. Final review is independent; any subsequent edits require fresh validation
and review. Refactoring can use build-failure support and final delta review without
entering a feature-spec/SDD pipeline. Setup and commit grouping do not launch these roles.

`AL-start` standardizes consuming AL workspaces to:

```text
app/                 Application project
test/                Test application
docs/                Maintained documentation
docs/specs/          Feature contracts
docs/generated/      Requested reusable AI reports (for example Excel or HTML)
docs/knowledge/      User-provided references (external specs, meeting transcripts, etc.)
```

Existing projects using `specs/` remain readable until setup safely migrates them. Where
both spec roots contain conflicting content, the workflow must not silently overwrite it. Setup
must update affected tasks, CI, launch settings, dependencies and documentation links.
Project-owned instructions and Definition of Done remain authoritative.
Creating an empty `test/` directory does not invent a test app or prove tests ran.

New specification names are numbered: `1-project-create.md`, `2-carrier-validation.md`,
`3-next-feature.md`. Allocate the next number above the highest existing numeric prefix;
do not reuse holes or sort `10` before `2`. Templates and indexes are excluded.

### Use with Copilot

In a terminal at this repository root, with standalone Copilot CLI installed:

```powershell
copilot plugin install ".\plugin"
copilot plugin list
```

For VS Code, use **Chat: Install Plugin from Source** and select the local `plugin`
directory. Enable it for the intended harness, then start a fresh chat and use slash
autocomplete to find **AL-start**, **AL-refactor**, **AL-brainstorm** or **AL-commit**. Use the namespace shown by
your host if it does not expose a bare command. Do not use `!AL-refactor`: `!` can
mean shell execution rather than a plugin command.

Brainstorming explicitly requires an available Opus model and actual agent invocation.
If the host cannot provide it, report that capability gap rather than substituting.
Other command agents inherit the host's model choice. Explicit commands keep the task
boundary clear and avoid spending credits on unrelated phases.
See [plugin/README.md](plugin/README.md) for workflow details and smoke tests, and
[docs/PORTING.md](docs/PORTING.md) for compatibility.
