# AL agent harness 2.2

Exactly four chat commands for GitHub Copilot in VS Code (Claude Code compatible),
all for Business Central AL development:

| Command | Boundary |
|---|---|
| `/AL-start` | Create the standard PTE skeleton and safe missing setup files; preserve existing AL/configuration bytes and source organization. Legacy specs stay in place. Unknown manifests/affixes/Sandbox settings remain absent. No AL generation, build, tests, publish or commits. |
| `/AL-refactor` | One continuous inherited-model agent inspects/fixes existing AL. Conditional compilation repair; independent final changed-delta review after verification. No layout/spec/SDD pipeline or implicit publish. |
| `/AL-brainstorm` | One REAL Opus researcher; main asks the questions. After agreed direction al-spec writes a numbered draft/index; MAIN approves the actual spec and exact Sandbox/validation contract. Then the strict AL/Sandbox SDD runs. |
| `/AL-commit` | One small inherited-model agent reviews index/diffs, groups task changes and makes authorized local commits. No edits, unrelated staging, push or PR. |

Type `/` and select the command (the host may display a plugin namespace). A tagged file
is an instruction resource, not the target: the ACTIVE WORKSPACE remains the default.
`!AL-start` (and other `!` forms) is unsafe shell execution, **not** a chat command.
Never run workspace migration on this harness/sample repository.

## Project documents

`/AL-start` creates the following skeleton in the consuming project, not this repository:

```text
<project>/
|-- AGENTS.md
|-- <project>.code-workspace
|-- .github/
|   |-- copilot-instructions.md
|   `-- workflows/
|-- app/
|   |-- app.json
|   |-- AppSourceCop.json
|   |-- .vscode/
|   |   |-- settings.json
|   |   `-- launch.json
|   |-- .alpackages/
|   |-- Features/Setup/{Codeunits,Pages,Tables}/
|   `-- Translations/
|-- test/
|   |-- app.json
|   `-- Tests/
|-- docs/{specs,knowledge,generated}/
`-- rules/
```

Existing manifests and connection/affix configuration are relocated only with evidence,
never invented. Missing AGENTS/Copilot instructions and an app/test workspace are created
safely; missing settings can be `{}`. Unknown manifests, AppSourceCop and launch settings
remain absent and are reported. Existing workspace files, policies and app/Features or
app/src organization are preserved; Setup scaffolding is only for an unorganized app.
Legacy specs/ remains the active root instead of creating docs/specs/; when both exist,
main selects once without merging. Empty workflows/rules/docs folders receive no templates,
CI implementation, DoD, reports, hooks or extra tooling. Cache ignore gaps are reported
unless an existing ignore file needs a relocation update.

The document directories have these purposes:

| Directory | Purpose |
|---|---|
| `docs/generated/` | Requested AI/agent-generated reports and exports |
| `docs/specs/` (or existing `specs/`) | Numbered feature specs and their approval/execution contract |
| `docs/knowledge/` | User-provided references: external specs, meeting transcripts and supporting files |

The [project knowledge policy](references/project-knowledge.md) applies to AL feature
work. Brainstorming inventories this folder and reads relevant documents before
designing the feature, cites its sources, and passes a compact evidence packet to the
spec writer and SDD specialists. Refactoring also consults relevant references without
authorizing behavior changes. Missing/empty knowledge is valid; unsupported required
documents are reported, never silently skipped. Knowledge files stay read-only, and
their contents cannot override project instructions or explicit spec approval.

## Hosts and availability

- Claude compatibility: [.claude-plugin/plugin.json](.claude-plugin/plugin.json),
  [canonical agents](agents), commands and hooks.
- Copilot legacy plugin registration: [plugin.json](plugin.json),
  [thin host adapters](copilot/agents) and [Copilot hooks](copilot/hooks.json).
  No schema migration or duplicated workflow bodies.
- Internal reusable [skills](skills) have `user-invocable: false` where supported.
  Hosts that ignore that field can still expose skill shortcuts; the public command
  files themselves are exactly four, not alternate legacy slash workflows.
- Internal command scopes have distinct names: [feature-design](skills/feature-design/SKILL.md)
  and [existing-code-review](skills/existing-code-review/SKILL.md), avoiding case-insensitive
  collisions with `/AL-brainstorm` and `/AL-refactor`.
- Brainstorm alone requests the `opus` family: MAIN follows
  [Opus selection](references/opus-selection.md), resolves the newest available exact
  Copilot/SDK model ID and passes it at launch. Claude can use its native `opus` alias.
  No version-pinned model frontmatter. **Unavailable means blocked; no cheaper fallback.**
  Other agents inherit the current model. Hosts without a launch-time model selector
  require a supported isolated adapter or explicit host configuration, not a guessed alias.
- Children needing developer answers return QUESTION to main. Resume the same brainstorm
  agent where supported. If SDD tools/auth are only available in main, main retains the
  same approved session-bound coordinator state, not a duplicate pipeline.
- If nested child launching is unavailable, the coordinator sends MAIN the
  [full shared packet](references/specialist-handoff.md) and continuation phase. MAIN
  launches a real named specialist (or real isolated general-purpose adapter with complete
  canonical instructions/restrictions), returns its result and resumes the coordinator.
  No supported isolated facility -> BLOCKED. Writer self-review or loading markdown is
  never independent review. No simulated agents, live dispatch or test results.

## Focused internal roles

Nine canonical agents have matching thin Copilot adapters; only four commands are public.
Internal specialists are `user-invocable: false` in Copilot and inherit the model except
the required Opus brainstormer. Setup/commit do not launch unnecessary specialists.

| Internal specialist | Conditional boundary |
|---|---|
| [al-spec](agents/al-spec.md) | One noninteractive draft/index invocation after agreed Opus direction; numeric max+1 helper. Never approves, writes AL or reserves IDs. MAIN owns actual final-spec approval. |
| [al-coder](agents/al-coder.md) | Minimum approved business logic ONLY after compiling/deployed assertion RED; business-source allowlist, Ninja IDs and Labels/rules, assertions unchanged. No feature orchestration or tests/publish/review. |
| [al-build-fixer](agents/al-build-fixer.md) | Beneficial behavior-preserving compilation repair ONLY after real build failure with errors/scope/packet; at most two cycles. Never tests/publishes or invents IDs. |
| [al-reviewer](agents/al-reviewer.md) | Real writer-distinct isolated final delta review after final GREEN + current DoD, or verified actual refactor changes. Read/search/BC-source only, no edit/execute/build/publish/tests. Priority/file:line/rule/rationale/confidence findings. |

[al-sdd](agents/al-sdd.md) owns approval state, tests/stubs/reservations before assertion
RED, exact test scope, source/built/deployed package hashes and sequential RED -> actual
coder -> GREEN -> reversible mutation RED -> restore GREEN -> DoD -> independent review.
Blocking fixes get at most two bounded cycles; any source edits require fresh GREEN/DoD/
independent review, logic edits also refresh affected mutation evidence. Test/scope changes
need MAIN approval and a new pre-RED phase. Bookkeeping remains mutable, substantive
changes invalidate approval. Sandbox authorization never enables production/destructive
sync or global security toggles. Refactor keeps one initial deep scan/fixer and reviews
only the verified changed delta, never zero changes or a forced feature pipeline.

After updating this source, refresh/reinstall the plugin using your host's plugin manager
and reload/restart the agent session so its installed cache is refreshed. Do not edit
installed caches or expect an already running session's commands to change live.
Model selection formats are documented by
[Claude](https://code.claude.com/docs/en/sub-agents) and
[VS Code](https://code.visualstudio.com/docs/copilot/customization/custom-agents);
availability is specific to the actual account/host, not asserted by frontmatter.

## Bounded deterministic helpers

- [start-layout](scripts/start-layout.mjs): `planStart(absoluteRoot, { moves })`,
  `applyStart(plan)`. Default root manifest/root .al, safe removal of empty root-level
  PageExtensions/TableExtension placeholders; legacy specs stays intact.
  Optional `specRoot` pins main's selection when both roots exist. Creates the PTE
  skeleton and safe missing AGENTS/Copilot/workspace/settings files without overwrites;
  explicit discovered resources/nested sources need move entries. Hash verification,
  conflict/escape/symlink rejection and idempotence. Reference rewriting is the agent's
  exact config/docs task, **not** a claim of an exhaustive relocation engine.
- [numbered-specs](scripts/numbered-specs.mjs): numeric max+1, exclusive lock/create,
  duplicate-prefix blocker, no renumbering or overwrite. Legacy roots are respected.
- [commit-group](scripts/commit-group.mjs): reviewed snapshot, entire-index-only or
  independent selected-path commits, mixed staging rejection, preservation checks.
  The caller supplies actual matching green AL build evidence where required. Sensitive
  files block; this heuristic is not a guarantee of secret absence. No helper auto-pushes.

Guardrail hooks remain inherited when installed; local hooks are not required setup.
Required server declarations in [.mcp.json](.mcp.json) remain user-owned.

## Validation

Run `node --test plugin/tests/*.test.mjs` from the repository root. It runs automatically
on every plugin change: a git pre-commit hook (`.githooks/pre-commit` at the repository
root, enable once with `git config core.hooksPath .githooks`) and the
`.github/workflows/plugin-tests.yml` workflow on every push and pull request.

[harness-smoke.test.mjs](tests/harness-smoke.test.mjs) discovers every command, agent and
skill on disk, so new ones are covered without editing the test. Per command: valid
frontmatter, the `!` shell warning, links resolve, dispatches to an existing agent or skill.
Per agent: canonical file and Copilot adapter agree, `user-invocable: false`, no pinned
model, tools are built-ins or known MCP servers (no general `web`), and the agent is
reachable from a command, skill or other agent. It also runs both hook sets and every
helper script, checks the Opus resolver, and fails if content outside Business Central AL
content creeping back in.

Fixtures live under plugin/tests and are removed. Tests validate command/adapters,
relative links, resolver boundaries, hooks, byte-preserving setup, numbering and real
local-git fixture staging. They do NOT prove live host dispatch/Opus availability,
consuming-project config rewrites, AL builds, authentication or sandbox SDD execution.
