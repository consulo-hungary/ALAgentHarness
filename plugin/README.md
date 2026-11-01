# AL agent harness 2.2

Exactly four chat commands, shared between Claude Code and Copilot. The historical
`/AL-brainstorm` name is retained, but its feature workflow is project-aware:

| Command | Boundary |
|---|---|
| `/AL-start` | Shallow safe consuming-workspace setup; byte-preserving moves into app/test/docs, empty test is valid. Production source belongs under its app project; test-only source under its test project, never duplicate both. Empty root `PageExtensions`/`TableExtension` buckets are removed; non-empty source moves into the owning project. No AL generation, publish or commits. |
| `/AL-refactor` | One continuous inherited-model agent inspects/fixes existing AL. Conditional compilation repair; independent final changed-delta review after verification. No layout/spec/SDD pipeline or implicit publish. |
| `/AL-brainstorm` | One REAL Opus researcher; main resolves the active project profile and asks questions. After agreed direction al-spec writes a numbered draft/index; MAIN approves the actual spec and exact validation/side-effect contract. AL routes to the strict AL/Sandbox SDD; web, Python and custom projects route to generic project SDD. |
| `/AL-commit` | One small inherited-model agent reviews index/diffs, groups task changes and makes authorized local commits. No edits, unrelated staging, push or PR. |

Type `/` and select the command (the host may display a plugin namespace). A tagged file
is an instruction resource, not the target: the ACTIVE WORKSPACE remains the default.
`!AL-start` (and other `!` forms) is unsafe shell execution, **not** a chat command.
Never run workspace migration on this harness/sample repository.

## Project documents

`/AL-start` creates these directories if missing and preserves their existing contents:

| Directory | Purpose |
|---|---|
| `docs/generated/` | Requested AI/agent-generated reports and exports |
| `docs/specs/` | Numbered feature specs and their approval/execution contract |
| `docs/knowledge/` | User-provided references: external specs, meeting transcripts and supporting files |

The [project knowledge policy](references/project-knowledge.md) applies to AL and non-AL
feature work. Brainstorming inventories this folder and reads relevant documents before
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

Eleven canonical agents have matching thin Copilot adapters; only four commands are public.
Internal specialists are `user-invocable: false` in Copilot and inherit the model except
the required Opus brainstormer. Setup/commit do not launch unnecessary specialists.

| Internal specialist | Conditional boundary |
|---|---|
| [al-spec](agents/al-spec.md) | One noninteractive draft/index invocation after agreed Opus direction; numeric max+1 helper. Never approves, writes AL or reserves IDs. MAIN owns actual final-spec approval. |
| [al-coder](agents/al-coder.md) | Minimum approved business logic ONLY after compiling/deployed assertion RED; business-source allowlist, Ninja IDs and Labels/rules, assertions unchanged. No feature orchestration or tests/publish/review. |
| [al-build-fixer](agents/al-build-fixer.md) | Beneficial behavior-preserving compilation repair ONLY after real build failure with errors/scope/packet; at most two cycles. Never tests/publishes or invents IDs. |
| [al-reviewer](agents/al-reviewer.md) | Real writer-distinct isolated final delta review after final GREEN + current DoD, or verified actual refactor changes. Read/search/BC-source only, no edit/execute/build/publish/tests. Priority/file:line/rule/rationale/confidence findings. |
| [project-sdd](agents/project-sdd.md) | Approved non-AL coordinator: repository-evidenced profile/commands, test-only RED, isolated coder after RED, actual GREEN, meaningful mutation where feasible, and independent review. |
| [project-reviewer](agents/project-reviewer.md) | Writer-distinct non-AL final reviewer, strictly read-only; requires current validation evidence. |

[al-sdd](agents/al-sdd.md) owns approval state, tests/stubs/reservations before assertion
RED, exact test scope, source/built/deployed package hashes and sequential RED -> actual
coder -> GREEN -> reversible mutation RED -> restore GREEN -> DoD -> independent review.
Blocking fixes get at most two bounded cycles; any source edits require fresh GREEN/DoD/
independent review, logic edits also refresh affected mutation evidence. Test/scope changes
need MAIN approval and a new pre-RED phase. Bookkeeping remains mutable, substantive
changes invalidate approval. Sandbox authorization never enables production/destructive
sync or global security toggles. Refactor keeps one initial deep scan/fixer and reviews
only the verified changed delta, never zero changes or a forced feature pipeline.
The [project profile resolver](skills/project-profiles/SKILL.md) keeps common discovery and
validation evidence language-neutral. The generic project workflow never borrows AL IDs,
Sandbox assumptions or BC tools; it uses the repository's own commands and explicit
permissions. For custom projects without existing tests, validation must be agreed before
implementation rather than invented.

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
  PageExtensions/TableExtension placeholders and intact legacy specs migration;
  creates missing docs/specs, docs/generated and docs/knowledge directories;
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

Run `node --test plugin/tests/*.test.mjs` from the repository root.
Fixtures live under plugin/tests and are removed. Tests validate command/adapters,
relative links, resolver boundaries, hooks, byte-preserving setup, numbering and real
local-git fixture staging. They do NOT prove live host dispatch/Opus availability,
consuming-project config rewrites, AL builds, authentication or sandbox SDD execution.
