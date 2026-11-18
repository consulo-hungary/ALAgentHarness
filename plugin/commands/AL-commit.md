---
description: "Group reviewed task changes into meaningful local commits while preserving unrelated staging; never push."
argument-hint: "[optional task scope or trailer opt-out]"
---

FIRST, in MAIN, when relevant changes touch `.al`, `app.json` or a spec: consider the docs step of
[project-docs](../skills/project-docs/SKILL.md) (refresh the object index, update
`docs/knowledge/technical-overview.md`, the project overview and the spec log) so the docs
can be committed with the code. Missing or intentionally deferred technical docs only warrant a warning;
never block a commit or push for missing documentation and never create placeholders just for Git.
Then invoke ONE actual `al-commit` agent with [canonical instructions](../agents/al-commit.md)
in the active workspace, NOT this tagged plugin path. Haiku tier (easy task).
Before launch, estimate the bounded calls/output and ask once under
[bc-workflow](../skills/bc-workflow/SKILL.md); pass the Haiku tier as the subagent `model`.
Invocation AUTHORIZES logical local commits without routine confirmation; inspect the
index and all diffs FIRST. Block conflicts, uncertain sensitive data or identity/signing.
No source edits, push, PR, sandbox operations or self-modifications.
This is a chat command; `!AL-commit` is shell execution, NOT a safe invocation.
