# AL Agent Harness

Semi-automation for Business Central AL teams. The agent gives senior-engineer guidance, writes lean specs
and keeps the project knowledge current; developers still read, look up and change code themselves.
Brainstorming and a precise spec are the default deliverable. Implementation, tests, review pipelines and
translation are explicit opt-ins because they cost tokens.

| Command | Boundary |
|---------|----------|
| `/AL-init` | Merge workflow into root/shared `AGENTS.md`, create project docs and guardrails, refresh advisory Git docs check. Preserve custom text. |
| `/AL-brainstorm <idea>` | MAIN, Claude Sonnet-class, interactive question boxes in one batch (at most two rounds), lean spec (up to 100 lines), then STOP. `--deep` allows ONE Opus consultation after estimate and a Yes in a dialog box. |
| `/AL-implement <spec>` | One writer, independent clean-code review, at most one correction, ONE build after bundle consent. `--full` opts into SDD/tests/mutation/DoD. |
| `/AL-review [scope]` | Read-only review. No scope = whole codebase; `/AL-review the object IDs` = objects, names, IDs, fields, gaps. Writes `docs/generated/reviews/<date>-<slug>.md`. |
| `/AL-commit` | Small local commits; include relevant available docs, warn if missing, preserve unrelated staging; no push or PR. |

Use slash autocomplete (possibly namespaced). `!AL-init` and other `!` forms are shell execution, NOT chat
commands. Target the active consuming workspace, never this plugin. There is deliberately no command that
refactors a whole codebase.

## Implementation style

Meet the same agreed behavior with the smallest clear change. Reuse existing Microsoft and local
application validation, preparation and posting rather than recreating their checks. No mandatory Meth
layers, table wrappers, dispatchers, event scaffolding or speculative workflows. Every new object needs
a concrete purpose. Keep lookups read-only; when fixes accumulate, reconsider the call path.
After implementation, record optional concerns with consequences in the spec's Implementation Log for
developers, not as unapproved runtime restrictions. Known permission/data-integrity defects remain blockers.

Explicit implementation and scoped refactoring use one [al-coder](agents/al-coder.md), then one
independent [al-reviewer](agents/al-reviewer.md), coordinated by MAIN. After consent to the bounded
2-3-call bundle, allow at most one writer correction for concrete defects or unnecessary complexity.
MAIN checks corrections; no second reviewer or automatic loops. Optional preferences are nonblocking.
Default review needs no RED, DoD or sandbox. If isolated agents or writer edit access are unavailable,
report the blocker and stop; do not fall back to main-chat work.

## Start in a repo

Run `/AL-init` once. It scans the workspace (`scripts/al-init.mjs`), asks one batch of questions (move existing
specs into `docs/specs/`? which knowledge documents matter?), then:

- creates the three docs folders and `docs/knowledge/project-overview.md` + `technical-overview.md`;
- merges the harness block into root `AGENTS.md` and `.github/agent/AGENTS.md`, and routing into `.github/copilot-instructions.md`;
  MAIN reviews existing Copilot instructions and transfers useful rules without losing uncertain content. The rules
  cover the harness, precision, BCQuality, base-app field/event first,
  the effort rule (same agreed behavior, simpler implementation), halt after about 5 failing tool requests;
- deploys the guardrails that plugin-level hooks could not reliably deliver: `.github/hooks/al-guardrails.*` (no
  literal UI text, no digging in base-app packages), and an advisory git pre-commit docs check. Copilot discovers the shared
  hook configuration directly from `.github/hooks/`; no separate settings file is generated;
- builds `docs/knowledge/object-index.json` and lets the agent fill both overviews from the code.

Copilot is instructed to read `.github/agent/AGENTS.md` via `.github/copilot-instructions.md`. Root and
shared custom text outside managed blocks is preserved; MAIN reports conflicting project rules.
`/AL-init` does not create or modify `CLAUDE.md` or `.claude/`.
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
- **Technical overview**: purpose of every object, new fields, specs. Keep it current when relevant.
  Missing or intentionally deferred docs only warn; neither agents nor the docs hook block commits/pushes.
  Rerun `/AL-init` to replace an older deployed blocking checker; unrelated Git hooks are preserved.
- **Specs** follow the [lean template](templates/spec-TEMPLATE.md): `status` and `date` frontmatter, seven sections,
  at most 100 lines for the planning part, at most 10 manual checks. After implementation the Implementation Log
  grows without limit: dated entries with what changed, why (git has the code), features gained or lost, and
  re-reviews. `draft` becomes `approved` only by a developer; `implemented` only after confirmed completion.

ALL generated files go ONLY under `docs/generated/`. Specs live in `docs/specs/`; an established legacy
`specs/` root is kept. Relevant `.docx` files are converted once, with consent, to
`docs/generated/knowledge/`.

## Models and cost

- Claude family only: Sonnet for hard tasks (design, writing AL, compiler repair), Haiku for easy tasks (code review,
  lookups, mechanical edits, commit grouping); GPT is fine for writing docs. Always the latest enabled version,
  never pinned. Opus only for a very hard reasoning task and only after the user says Yes in a dialog box.
- No brainstorming subagents. Explicit implementation/refactoring includes a writer, independent reviewer
  and at most one correction; estimate calls/output/builds and ask once for the bundle. No relay-only calls.
- Default implementation: production code only, small edits, one build, compiler errors go to the human, no
  automatic repair loop. A red or unavailable build is reported as incomplete, never as compiled.
- Only `--full` enables [al-sdd](agents/al-sdd.md), [al-build-fixer](agents/al-build-fixer.md) and
  [DoD](skills/definition-of-done/SKILL.md); it needs bundle consent and exact nonproduction Sandbox permission.
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
4. Report conflicts with existing project instructions. Remove stale automatic SDD/DoD rules only with
  developer consent; keep the bounded default clean-code review distinct from full SDD.

## Parts

`commands/` chat commands, `agents/` specialists (one file each, read by VS Code, Copilot CLI and Claude Code), `skills/` on-demand knowledge,
`scripts/` index, init and commit helpers, `templates/` files that `/AL-init` deploys, `references/` policies.
The plugin itself registers no hooks; `/AL-init` deploys them into each repo so they also work there.
