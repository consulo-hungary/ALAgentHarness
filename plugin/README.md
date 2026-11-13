# AL Agent Harness

Semi-automation for Business Central AL teams. The agent gives senior-engineer guidance, writes lean specs
and keeps the project knowledge current; developers still read, look up and change code themselves.
Brainstorming and a precise spec are the default deliverable. Implementation, tests, review pipelines and
translation are explicit opt-ins because they cost tokens.

| Command | Boundary |
|---------|----------|
| `/AL-init` | Agentify a new or existing repo: docs, `.github/agent/AGENTS.md` rules, guardrail hooks and git docs check. Preserves existing instructions during migration. |
| `/AL-brainstorm <idea>` | MAIN, Claude Sonnet-class, interactive question boxes in one batch (at most two rounds), lean spec (up to 100 lines), then STOP. `--deep` allows ONE Opus consultation after estimate/consent. |
| `/AL-implement <spec>` | Explicit code-only step, ONE build after estimate/consent, then docs and spec log update. `--full` is the EXPENSIVE SDD/tests/mutation/DoD/review bundle. |
| `/AL-review [scope]` | Read-only review. No scope = whole codebase; `/AL-review the object IDs` = objects, names, IDs, fields, gaps. Writes `docs/generated/reviews/<date>-<slug>.md`. |
| `/AL-commit` | Updates the technical docs first, then small local commits; preserves unrelated staging; no push or PR. |

Use slash autocomplete (possibly namespaced). `!AL-init` and other `!` forms are shell execution, NOT chat
commands. Target the active consuming workspace, never this plugin. There is deliberately no command that
refactors a whole codebase.

## Start in a repo

Run `/AL-init` once. It scans the workspace (`scripts/al-init.mjs`), asks one batch of questions (move existing
specs into `docs/specs/`? which knowledge documents matter?), then:

- creates the three docs folders and `docs/knowledge/project-overview.md` + `technical-overview.md`;
- writes the harness block into `.github/agent/AGENTS.md` and a routing block into `.github/copilot-instructions.md`;
  MAIN reviews existing Copilot instructions and transfers useful rules without losing uncertain content. The rules
  cover the harness, precision, BCQuality, base-app field/event first,
  the effort rule (full feature with X lines or 80% with about 0.1X), halt after about 5 failing tool requests;
- deploys the guardrails that plugin-level hooks could not reliably deliver: `.github/hooks/al-guardrails.*` (no
  literal UI text, no digging in base-app packages), and a git pre-commit check. Copilot discovers the shared
  hook configuration directly from `.github/hooks/`; no separate settings file is generated;
- builds `docs/knowledge/object-index.json` and lets the agent fill both overviews from the code.

Copilot is instructed to read `.github/agent/AGENTS.md` via `.github/copilot-instructions.md`. Existing root
`AGENTS.md` files remain untouched. `/AL-init` does not create or modify `CLAUDE.md` or `.claude/`.
Re-running the script refreshes only managed blocks; MAIN avoids duplicating transferred instructions.

## Object index (no subscription)

`scripts/Get-ALObjectIndex.ps1` (Windows PowerShell 5.1 or `pwsh`) parses every `.al` file and `app.json` into
`docs/knowledge/object-index.json`: apps, idRanges, affixes, objects, fields, enum values, ID usage, free blocks
and issues (duplicates, out of range, missing affix, several objects per file). `-NextId <type>` and
`-NextMemberId <object>` return the next free IDs. IDs are not reserved: a duplicate check catches branch
collisions at merge time. See [al-object-index](skills/al-object-index/SKILL.md).

## Knowledge and specs

Lookup order for people and AI: project overview, technical overview, spec, code. See
[project-docs](skills/project-docs/SKILL.md).

- **Project overview**: extension goal, features per BC topic, dated change history.
- **Technical overview**: purpose of every object, new fields, specs. The pre-commit hook requires it to be
  staged with any commit touching `.al`, `app.json` or a spec (developer override: `AL_DOCS_SKIP=1`).
- **Specs** follow the [lean template](templates/spec-TEMPLATE.md): `status` and `date` frontmatter, seven sections,
  at most 100 lines for the planning part, at most 10 manual checks. After implementation the Implementation Log
  grows without limit: dated entries with what changed, why (git has the code), features gained or lost, and
  re-reviews. `draft` becomes `approved` only by a developer; `implemented` only after confirmed completion.

ALL generated files go ONLY under `docs/generated/`. Specs live in `docs/specs/`; an established legacy
`specs/` root is kept. Relevant `.docx` files are converted once, with consent, to
`docs/generated/knowledge/`.

## Models and cost

- Claude family by default (Haiku mechanical, Sonnet design and code); GPT is fine for writing docs. Always the
  latest enabled version, never pinned. Opus only after the user grants it.
- No subagents by default. Before a subagent, build/publish or a step of more than about 150 lines of code,
  estimate calls, output and builds and ask once. Never reread unchanged files; never relaunch a child to relay.
- Default implementation: production code only, small edits, one build, compiler errors go to the human, no
  automatic repair loop. A red or unavailable build is reported as incomplete, never as compiled.
- Only `--full` enables [al-sdd](agents/al-sdd.md), [al-coder](agents/al-coder.md),
  [al-build-fixer](agents/al-build-fixer.md), [DoD](skills/definition-of-done/SKILL.md) and
  [al-reviewer](agents/al-reviewer.md); it needs bundle consent and exact nonproduction Sandbox permission.
- Developers run NAB refresh/translation by hand. AI XLF work is excluded even from full mode.

## When tools fail

After about 5 failing MCP requests without improvement, an agent halts, gives a short progress statement, lists
what must be checked manually and asks whether the feature is really wanted. It never works around the failure
on disk. See the [failure policy](references/mcp-failure-policy.md).

## Budget workspace setup

1. Pick a Sonnet-class model for MAIN; model switching is a host action the plugin cannot force.
2. Disable MCP servers a task does not need. Spec work needs none; implementation needs at most the `al` server
   (build). Enable bc-code-atlas, bc-observatory and Learn only for genuinely uncertain BC facts.
3. Disable unrelated skill providers for this workspace and keep NAB translation instructions off unless
   translating. Start a fresh chat after provider or model changes.
4. Existing project instructions win over generated ones: remove stale automatic SDD/DoD/reviewer rules
   with developer consent.

## Parts

`commands/` chat commands, `agents/` specialists (`copilot/agents/` adapters), `skills/` on-demand knowledge,
`scripts/` index, init and commit helpers, `templates/` files that `/AL-init` deploys, `references/` policies.
The plugin itself registers no hooks; `/AL-init` deploys them into each repo so they also work there.
