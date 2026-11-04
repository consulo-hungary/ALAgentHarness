---
description: "Initialize docs and automatic plugin routing; --layout explicitly opts into PTE relocation."
argument-hint: "[optional workspace root] [--layout]"
---

Target the ACTIVE WORKSPACE, not this tagged plugin resource. Follow
[bc-workflow](../skills/bc-workflow/SKILL.md) in MAIN on the selected mid-tier model.
Default: no subagents. Use [setup helper](../scripts/start-layout.mjs) `planDocsStart(root)`
then `applyStart(plan)` to create only docs/specs/, docs/knowledge/, docs/generated/ and
missing root AGENTS.md plus .github/copilot-instructions.md. Respect an established legacy
spec root; ask once if both roots exist. Do not generate a spec or index during setup.
Root instructions route ordinary feature requests to installed plugin skills without slash
commands; agents are NOT launched automatically. Generated supporting files go ONLY in
docs/generated/; docs/knowledge/ is read-only user input. Do not copy plugin skills/agents
or create a generic local Agent folder, app/test scaffolding, workspace/settings or hooks.
Preserve existing instructions byte-for-byte; report whether they already contain routing
and output rules. Ask before appending missing guidance; never claim automatic routing is
configured merely because old instruction files exist. Never migrate this harness repository.

Only `--layout` invokes ONE actual `al-start` agent with
[layout instructions](../agents/al-start.md), after bounded cost estimate/consent. That mode
uses `planStart`/`applyStart` for the previous byte-preserving PTE layout behavior.
No AL content edits, builds, tests, publish, IDs, staging or commits in either setup mode.
This is a chat command; `!AL-start` is shell execution, NOT a safe invocation.
