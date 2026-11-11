---
description: "Brainstorm in main chat and write a lean spec; stop before implementation."
argument-hint: "<idea> [--deep]"
---

Follow [bc-workflow](../skills/bc-workflow/SKILL.md) in the MAIN chat.
Use `$ARGUMENTS` as the idea; target the active consuming workspace, not this plugin.
Default: the selected Claude model (Sonnet-class), no Opus, no subagents, at most two batched
question rounds, then main writes an at-most-100-line spec and one README index line. STOP.
`--deep` explicitly permits at most ONE optional Opus consultation per feature, after a cost
estimate and consent. Never block on model availability. Main retains all questions and spec writing.
Check the base app for an existing field or event first, and apply the effort rule
(full feature with X lines or 80% with about 0.1X) before writing a large spec.
This is a chat command; `!AL-brainstorm` is shell execution, NOT a safe invocation.
