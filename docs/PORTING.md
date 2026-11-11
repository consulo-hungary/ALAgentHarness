# Porting the harness to GitHub Copilot

The harness is built in Claude Code. Most of it is plain markdown that any agent host reads.
This is what moves where.

| Claude Code | GitHub Copilot (VS Code) | Notes |
|-------------|--------------------------|-------|
| `AGENTS.md` | `AGENTS.md` | Shared as-is: recent Copilot versions load `AGENTS.md` by default. `CLAUDE.md` stays for Claude Code and only imports it. |
| `.claude/skills/*/SKILL.md` | same folder, or `.github/skills/` | Shared where the host supports skills; keep the `description` frontmatter, it is the trigger. |
| `.claude/agents/<name>.md` | `.github/agents/<name>.agent.md` | Same body. Map `model` and the tool list to Copilot's frontmatter. |
| `.claude/commands/<name>.md` | `.github/prompts/<name>.prompt.md` | Same body; add `agent:` frontmatter where the command starts an agent. |
| `.mcp.json` | `.vscode/mcp.json` | Same servers. Copilot uses `"servers"` instead of `"mcpServers"`. Object IDs need no server: the local `Get-ALObjectIndex.ps1` script serves them. |
| `.claude/settings.json` permissions | host tool approval controls | Plugin instructions cannot grant permissions. Use **Chat: Manage Tool Approval** for trusted read tools; do not require global auto-approval. |
| `.claude/hooks/*` | host-specific hook configuration | The plugin registers no hooks; `/AL-init` deploys `.github/hooks/` and `.claude/settings.json` guardrails into each repo (see Hooks below); instructions alone are not enforcement. |
| `specs/`, `rules/`, `DEFINITION-OF-DONE.md` | same | Tool-neutral. |
| AL extension tools (`al_getnextobjectid`, `al_build`, ...) via the `al` MCP server (`al launchmcpserver`) | the same tools, built into the AL extension | Copilot needs no MCP for them. |
| `al_run_tests` (AL MCP server) or `al runtests` | the built-in `runTests` tool | `runTests` drives the AL extension's Test Explorer ("AL Tests"). |
| a plugin (`plugin/`, `.claude-plugin/marketplace.json`, step 11) | agent plugins (Preview): a local clone registered in `chat.pluginLocations` | VS Code reads the same `.claude-plugin/` manifests. Hooks in a plugin: check what your VS Code version runs. |
| BC Observatory plugin (step 05) | its MCP servers in `.vscode/mcp.json` | Copilot gets the servers; the bcobs skills come with the agent plugin. |

Tool names differ per host. Skills name the tool by what it does ("the AL build tool,
`al_build`") and tell the agent to use whatever the session actually exposes, so they port
without edits.

## Packaged Copilot workflow

The five commands `AL-init`, `AL-brainstorm`, `AL-implement`, `AL-review` and `AL-commit` support standalone
**GitHub Copilot CLI** (`copilot`), not the GitHub repository CLI (`gh`).

The plugin keeps its Claude manifest and canonical agent instructions. A legacy Copilot root `plugin.json`
registers command, skill and Copilot agent-adapter paths. Copilot agents use `.agent.md` files; adapters refer to
the canonical workflows rather than maintaining a second implementation.

Install the local `plugin` directory with **Chat: Install Plugin from Source** in VS Code, or run
`copilot plugin install ".\plugin"` from the repository root. Check that the plugin is enabled in the intended
harness and start a new session. Use slash autocomplete for the installed command spelling; namespaces depend on
the host. `!AL-review` is not a supported plugin command and can be interpreted as a shell request.

### Hooks live in the consuming repo

Plugin-level hooks did not reliably appear in other repositories, so the plugin registers none. `/AL-init` deploys
`.github/hooks/al-guardrails.json` + `al-guardrails.mjs` (VS Code Copilot / Copilot CLI; reads `toolName` +
`toolArgs`), `.claude/settings.json` (Claude Code; only if absent) and a git `pre-commit` hook that runs
`al-docs-check.mjs`. One script serves both hosts. Check **Chat: Open Customizations** for the hook after init.

### Instructions

Copilot loads root `AGENTS.md` and `.github/copilot-instructions.md`; `.github/AGENTS.md` is not auto-loaded.
`/AL-init` therefore writes a managed block into root `AGENTS.md`, imports it from `CLAUDE.md`, and adds a pointer in
`.github/copilot-instructions.md`. Existing text outside the managed block is never changed.

### Defaults

`AL-brainstorm` runs in MAIN on the selected Claude model: about 10 targeted reads, about 15 tool calls, one batch
of 3-6 questions with defaults (at most two rounds), then a spec of at most 100 lines and STOP. `--deep` permits
one Opus consultation after estimate/consent. `AL-implement <spec>` is a separate code-only request with ONE
build, compiler errors returned to the human, then object index, technical overview and spec log updates.
Only `--full` starts expensive SDD specialists. `AL-review [scope]` is read-only and writes a report to
`docs/generated/reviews/`. `AL-commit` updates the technical docs, then commits locally and never pushes.
Object IDs come from `plugin/scripts/Get-ALObjectIndex.ps1` (PowerShell 5.1 or `pwsh`), not from a service.

New specs use `<next-number>-<kebab-title>.md` in the active spec root, numerically ordered.
Existing project-owned constraints remain authoritative; instruction changes must be explicit.

### Host smoke tests

Static plugin tests verify packaging and instruction contracts, not live LLM behavior. After installation, verify
these cases in an expendable AL project:

1. Exactly five command files are packaged (`AL-init`, `AL-brainstorm`, `AL-implement`, `AL-review`, `AL-commit`).
2. Run `AL-init`: the three docs folders, both overviews, the `AGENTS.md` block, `.github/hooks/` and the git
   pre-commit hook exist; rerunning changes nothing. Write `Error('x')` into an `.al` file through the agent: the
   guardrail must block it. Commit an `.al` change without the technical overview: the commit must be refused.
3. Run `AL-review the object IDs`: a report appears in `docs/generated/reviews/` and no AL file changed.
4. Run `AL-brainstorm` with a feature that needs new tables: the effort question (full vs about 80%) is asked, at
   most two question rounds, spec of at most 100 lines, then STOP.
5. Run `AL-implement <spec>`: production code, one build result, updated index/overviews and a spec log entry; a red
   build returns errors to the human.
6. Run `AL-commit` in a disposable Git repository: logical local commits, preserved unrelated staging, no push.
7. Make the MCP server fail repeatedly: after about five failures the agent halts with a progress statement.

Sources:

- [VS Code agent plugin authoring reference](https://code.visualstudio.com/docs/agents/reference/agent-plugin-reference)
- [GitHub Copilot CLI plugin reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference)
- [VS Code tool approvals](https://code.visualstudio.com/docs/agents/run/approvals)
