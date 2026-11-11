---
description: "Review the whole AL codebase or one part and write a report to docs/generated/reviews."
argument-hint: "[scope, e.g. 'the object IDs' or 'sales posting']"
---

Follow [review-report](../skills/review-report/SKILL.md) in the MAIN chat, mid-tier model, no subagents,
using `$ARGUMENTS` as the scope (empty means the whole codebase). Target the active workspace.
Read-only for AL: no edits, no build. The only file written is the report under `docs/generated/reviews/`.
For ID/structure scopes, build the report from [al-object-index](../skills/al-object-index/SKILL.md) output
instead of reading code. Answer with the report path and the top three findings.

This is a chat command; `!AL-review` is shell execution, NOT a safe invocation.
