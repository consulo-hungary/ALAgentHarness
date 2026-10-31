# Porting the harness to GitHub Copilot

The harness is built in Claude Code. Most of it is plain markdown that any agent host reads.
This is what moves where.

| Claude Code | GitHub Copilot (VS Code) | Notes |
|-------------|--------------------------|-------|
| `AGENTS.md` | `AGENTS.md` | Shared as-is: recent Copilot versions load `AGENTS.md` by default. `CLAUDE.md` stays for Claude Code and only imports it. |
| `.claude/skills/*/SKILL.md` | same folder, or `.github/skills/` | Shared where the host supports skills; keep the `description` frontmatter, it is the trigger. |
| `.claude/agents/<name>.md` | `.github/agents/<name>.agent.md` | Same body. Map `model` and the tool list to Copilot's frontmatter. |
| `.claude/commands/<name>.md` | `.github/prompts/<name>.prompt.md` | Same body; add `agent:` frontmatter where the command starts an agent. |
| `.mcp.json` | `.vscode/mcp.json` | Same servers. Copilot uses `"servers"` instead of `"mcpServers"`. The Ninja VS Code extension already exposes its tools to Copilot, no MCP needed. |
| `.claude/settings.json` permissions | host tool approval controls | Plugin instructions cannot grant permissions. Use **Chat: Manage Tool Approval** for trusted read tools; do not require global auto-approval. |
| `.claude/hooks/*` | host-specific hook configuration | The plugin includes separate Claude/Copilot payload adapters. Check the client's supported hook schema; instructions alone are not enforcement. |
| `specs/`, `rules/`, `DEFINITION-OF-DONE.md` | same | Tool-neutral. |
| AL extension tools (`al_getnextobjectid`, `al_build`, ...) via the `al` MCP server (`al launchmcpserver`) | the same tools, built into the AL extension | Copilot needs no MCP for them. |
| `al_run_tests` (AL MCP server) or `al runtests` | the built-in `runTests` tool | `runTests` drives the AL extension's Test Explorer ("AL Tests"). |
| a plugin (`plugin/`, `.claude-plugin/marketplace.json`, step 11) | agent plugins (Preview): a local clone registered in `chat.pluginLocations` | VS Code reads the same `.claude-plugin/` manifests. Hooks in a plugin: check what your VS Code version runs. |
| BC Observatory plugin (step 05) | its MCP servers in `.vscode/mcp.json` | Copilot gets the servers; the bcobs skills come with the agent plugin. |

Tool names differ per host. Skills name the tool by what it does ("the AL build tool,
`al_build`") and tell the agent to use whatever the session actually exposes, so they port
without edits.

## Packaged Copilot workflow

The four commands `AL-start`, `AL-refactor`, `AL-brainstorm` and `AL-commit` target standalone
**GitHub Copilot CLI** (`copilot`), not the GitHub repository CLI (`gh`).

The plugin keeps its Claude manifest and canonical agent instructions. A legacy
Copilot root `plugin.json` registers command, skill and Copilot agent-adapter paths.
Copilot agents use `.agent.md` files; adapters refer to the canonical workflows rather
than maintaining a second implementation.

Install the local `plugin` directory with **Chat: Install Plugin from Source** in VS Code,
or run `copilot plugin install ".\plugin"` from the repository root. Check that the plugin
is enabled in the intended harness and start a new session. Use slash autocomplete for
the installed command spelling; namespaces depend on the host. `!AL-refactor` is not a
supported plugin command and can be interpreted as a shell request.

Use the four explicit commands for predictable task boundaries. Supporting skills are
internal workflow guidance, not additional command entry points. Hosts differ in whether
internal skills can be hidden from slash menus; discovery is not an enforcement guarantee.

Only `AL-brainstorm` needs an Opus brainstorming subagent and then the approved SDD feature
loop. Resolve the host's actual Opus model; do not silently fall back to a different family.
When a child cannot ask the developer directly, main chat relays one question at a time.
Other commands use small bounded agents with inherited model selection.
The numbered draft is written by internal `al-spec` after direction agreement; main chat
still obtains explicit approval. SDD coordinates `al-coder` only after proven RED,
`al-build-fixer` only for compilation failures, and independent read-only `al-reviewer`
after the final GREEN. These are not extra slash commands. Preserve coordinator state,
approval, source hashes and exact test scope across every real invocation.
If a host cannot nest isolated agents, main chat must dispatch the requested specialist
and return its evidence to the retained SDD coordinator. Do not replace independent
review with a writer changing personas. Missing actual delegation remains a blocker.
If the harness cannot create a real subagent, report the missing capability; do not
pretend that changing personas is delegation. Autopilot does not disable tool approval.

`AL-start` performs consistent folder setup and byte-preserving moves with only necessary
configuration/instruction updates. It never edits AL source or invokes a code review.
`AL-refactor` reviews and improves existing code, not folder layout; event subscribers
and table triggers must retain their distinct execution semantics unless equivalence is
actually established. `AL-commit` groups already-existing changes and commits locally,
preserving staging intent and excluding sensitive files. It does not push or edit sources.
These commands do not run the former shared brainstorm/spec/implementation pipeline.

New specs use `<next-number>-<kebab-title>.md` in the active spec root, numerically ordered.
Legacy `specs/` remains supported until setup migrates it without collisions. Existing
project-owned constraints remain authoritative; instruction changes must be explicit.

### Host smoke tests

Static plugin tests verify packaging and instruction contracts, not live LLM behavior.
After installation, verify these cases in an expendable AL project:

1. Exactly the four command files are packaged; obsolete `spec`, `sdd`, `done` and `pr`
   command entry points are absent. Verify current installed-cache contents after updating.
2. Run `AL-start` on root-level AL sources: compare file hashes, check the standard folders
   and required path references, then rerun and verify no additional changes.
3. Run `AL-refactor`: verify findings and safe existing-file fixes without folder setup,
   a feature spec, unrelated behavior changes or automatic sandbox publishing.
4. Run `AL-brainstorm`: verify real Opus invocation, questions and ascending spec number.
   Decline final approval and verify no AL edits; then approve with a selected sandbox and
   inspect actual SDD RED/GREEN/mutation evidence.
   Verify spec/coder/reviewer activity and absence of build-fixer calls on green builds.
   Make a blocking reviewer finding in a disposable scenario and verify that fixes
   invalidate previous evidence and receive fresh validation and independent review.
5. Run `AL-commit` in a disposable Git repository: verify logical local commits, preserved
   unrelated staging, no secrets, no code edits and no push.
6. Provide an unavailable Opus model, ambiguous setup collisions, production target or
   failing validation; verify an actionable blocked result, never substituted success.

Sources:

- [VS Code agent plugin authoring reference](https://code.visualstudio.com/docs/agents/reference/agent-plugin-reference)
- [GitHub Copilot CLI plugin reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference)
- [VS Code tool approvals](https://code.visualstudio.com/docs/agents/run/approvals)

The historical demo steps in this repository describe the original Claude-first command
set. The current plugin intentionally exposes only the four commands above.
