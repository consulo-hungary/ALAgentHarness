# Budget-First AL Agent Harness

Brainstorming and a precise spec are the default deliverable. Developers implement.
Simple, high-quality code matters more than process completeness; automated regression
proof is an accepted opt-out trade-off, not a hidden completion gate.

| Command | Boundary |
|---------|----------|
| `/AL-brainstorm <idea>` | MAIN, mid-tier, one batch of questions (at most two rounds), lean spec and STOP. |
| `/AL-brainstorm <idea> --deep` | At most ONE optional Opus consultation, only after estimate/consent; MAIN still asks and writes. |
| `/AL-implement <spec>` | Explicit optional MAIN code-only step, ONE build after estimate/consent; compiler errors go to the human. |
| `/AL-implement <spec> --full` | EXPENSIVE opt-in SDD/tests/mutation/DoD/independent review; bundle consent and exact Sandbox permission required. |
| `/AL-start` | Explicit optional PTE setup with byte-preserving relocation; never automatic feature polish. |
| `/AL-refactor` | Targeted existing-file fixes and one build; no automatic fixer, tests or independent review. |
| `/AL-commit` | Explicit local git grouping/commits, preserve unrelated staging; no code edits, push or PR. |

Use slash autocomplete (possibly namespaced). `!AL-start` and other `!` forms are shell
execution, NOT chat commands. Target the active consuming workspace, not attached plugin
resources. Never run consuming-project setup on this harness repository.

## Default Feature Flow

```text
/AL-brainstorm <idea>
  -> MAIN: about 10 targeted reads/greps, about 15 tool calls total
  -> one dialog with 3-6 questions and recommended defaults (+1 round only if needed)
  -> direction summary + write spec?
  -> MAIN writes docs/specs/NNN-<slug>.md + one README link line
  -> approve spec; STOP. Developers implement.
```

The [bc-workflow](skills/bc-workflow/SKILL.md) combines feature design, local project
discovery, knowledge reuse and short handoffs. The [lean template](templates/spec-TEMPLATE.md)
has seven sections, at most about 80 lines and 10 manual acceptance checks. No execution
contract, hashes, allowlist, approvals ledger, locks, labels table or test-per-check table.
New IDs say `assign at implementation`. Choose a free number above the current maximum;
no numbering helper. Preserve explicitly established legacy `specs/` without migration.

Read only relevant `docs/knowledge/` text. Convert relevant `.docx` to sibling `.md` once
with consent, preserve the original and reuse the text. If no converter exists, request
text rather than repeatedly extracting documents. Missing knowledge is valid.

Default implementation writes only production code, with small targeted edits. No tests,
test app, publish, mutation, DoD, review agent, symbol downloads or translations. One build
reports compile errors only, no automatic repair/rebuild. A red/unavailable build is an
honest incomplete result for the human, never reported as compiled or tested.

## Budget Workspace Setup

1. Select a mid-tier (Sonnet-class) main-chat model. Use a cheap tier (Haiku or mini-class)
   for mechanical renames, captions, translations and small edits. Model switching is a
   host/user action: instructions cannot force or verify picker availability. No Opus
   resolver or availability block; use what is selected. `--deep` is exceptional, not a tier.
2. Disable MCP servers not needed for the task in the host's workspace MCP/plugin controls.
   Typical spec work needs NONE. Implementation needs at most `al-mcp` (this plugin's `al`
   server, for build) and Object ID Ninja. Enable bc-code-atlas, bc-observatory and Learn
   only for genuinely uncertain BC facts, then disable them again. Declarations are not
   a requirement to enable every server. The Observatory plugin dependency can also be
   disabled for spec work; enabling it may expose both skills and servers.
3. Disable unrelated skill/instruction providers for this AL workspace: Pylance/Python,
   TypeScript and GitHub PR providers; disable NAB translation instructions unless actually
   translating. Use workspace-scoped extension/provider controls where supported; otherwise
   a dedicated budget AL profile. Keep AL Language enabled for developers' normal editing.
4. Refresh/reinstall this plugin and start a fresh chat after provider/model changes. Already
   injected skills, deferred-tool catalogs and NAB instructions cannot be removed by this
   repository or retroactively removed from a running session. Server config stays user-owned.
5. Review existing consuming AGENTS/Copilot instructions with developer consent: remove old
   automatic SDD/DoD/reviewer requirements and oversized spec templates. Setup preserves
   existing policies; a stronger stale project rule otherwise still wins. New generated
   instructions use budget defaults. No layout conversion or test manifest is needed for specs.

## Costs And Optional Full Mode

Before a subagent, build/publish or >150-line code step, show an estimate of calls, output
and builds/deployments, then ask once for that bounded step/bundle. Never invent measured
credits; rates/context differ by host. Never reread unchanged files, cosmetically retry
calls or relaunch children just to relay answers. Final responses stay short.

Only explicit `--full` enables expensive [al-sdd](agents/al-sdd.md), [al-coder](agents/al-coder.md),
[al-build-fixer](agents/al-build-fixer.md), [DoD](skills/definition-of-done/SKILL.md) and
[al-reviewer](agents/al-reviewer.md). Compiler repair has at most ONE fix/rebuild cycle,
then human handoff. Full-mode evidence stays in session or a requested report, not the spec.
No production, destructive sync, permission bypass or implicit Sandbox target. Individual
test/publish/review requests authorize only that extra, not the whole full-mode pipeline.

Developers run NAB refresh/translation extension commands by hand. AI XLF work is excluded
even from full mode. Explicit translation only: cheap tier and current-feature units.

## Packaging And Validation

Both [Claude manifest](.claude-plugin/plugin.json) and [Copilot manifest](plugin.json) register
five commands. Internal agents have [thin adapters](copilot/agents), selected-model inheritance
and no public feature drafter or brainstorm child. Skills have short one-line descriptions.
Optional [setup helper](scripts/start-layout.mjs), [layout resolver](skills/bc-workflow/scripts/resolve-layout.mjs)
and [git helper](scripts/commit-group.mjs) retain preservation/scope protections.

[MCP failure policy](references/mcp-failure-policy.md) and inherited guardrails prohibit
base-app filesystem digging. Do not cosmetically retry failed calls; single-build mode
returns its first result, while explicitly authorized server recovery follows the policy.

Run `node --test plugin/tests/*.test.mjs` at the repository root. CI and the opt-in local
pre-commit hook run the same harness tests. They check budget routing, template shape,
frontmatter/links, adapters/hooks, optional layout and setup/git preservation. They do NOT
prove a live feature's 15-call budget, actual credit savings, host model selection, AL
compilation or Sandbox results. Verify those in a fresh, configured consuming workspace.
