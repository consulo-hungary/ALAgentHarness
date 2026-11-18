---
description: "Brainstorm in main chat and write a lean spec; stop before implementation."
argument-hint: "<idea> [--deep]"
---

Follow [bc-workflow](../skills/bc-workflow/SKILL.md) in the MAIN chat.
Use `$ARGUMENTS` as the idea; target the active consuming workspace, not this plugin.
Default: Sonnet (hard task), no Opus, no subagents, at most two batched
question rounds, then main writes an at-most-100-line spec and one README index line. STOP.
Use the host's interactive question tool (in VS Code, `vscode_askQuestions`) for question boxes with
selectable options and recommended defaults. Fall back to plain text only if no such tool is available.
`--deep` permits at most ONE Opus consultation per feature, and only after a cost estimate and the user's
Yes in a dialog box (`vscode_askQuestions`, options Yes once / No). Declined or unavailable: stay on Sonnet.
Main retains all questions and spec writing.
Check existing application behavior first, and apply the effort rule: the same agreed behavior
with fewer layers, not a silent scope reduction. Explain genuinely necessary complexity before a large spec.
This is a chat command; `!AL-brainstorm` is shell execution, NOT a safe invocation.
