---
description: "Brainstorm in main chat and write a lean spec; stop before implementation."
argument-hint: "<idea> [--deep]"
---

Follow [bc-workflow](../skills/bc-workflow/SKILL.md) in the MAIN chat.
Use `$ARGUMENTS` as the idea; target the active consuming workspace, not this plugin.
Default: selected mid-tier model, no Opus, no subagents, at most two batched question
rounds, then main writes an at-most-80-line spec and one README index line. STOP.
`--deep` explicitly permits at most ONE optional Opus consultation per feature,
after a cost estimate and consent. Never block on model availability; keep using
the selected model if unavailable. Main retains all questions and spec writing.
This is a chat command; `!AL-brainstorm` is shell execution, NOT a safe invocation.
