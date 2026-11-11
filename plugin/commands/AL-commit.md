---
description: "Group reviewed task changes into meaningful local commits while preserving unrelated staging; never push."
argument-hint: "[optional task scope or trailer opt-out]"
---

FIRST, in MAIN, when the changes touch `.al`, `app.json` or a spec: run the docs step of
[project-docs](../skills/project-docs/SKILL.md) (refresh the object index, update
`docs/knowledge/technical-overview.md`, the project overview and the spec log) so the docs
are committed together with the code. The git pre-commit hook blocks the commit otherwise.
Then invoke ONE actual `al-commit` agent with [canonical instructions](../agents/al-commit.md)
in the active workspace, NOT this tagged plugin path. Inherit the session model.
Before launch, estimate the bounded calls/output and ask once under
[bc-workflow](../skills/bc-workflow/SKILL.md); prefer the selected mid-tier model.
Invocation AUTHORIZES logical local commits without routine confirmation; inspect the
index and all diffs FIRST. Block conflicts, uncertain sensitive data or identity/signing.
No source edits, push, PR, sandbox operations or self-modifications.
This is a chat command; `!AL-commit` is shell execution, NOT a safe invocation.
