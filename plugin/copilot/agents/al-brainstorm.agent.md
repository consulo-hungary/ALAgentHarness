---
name: al-brainstorm
description: "Opus-only read-only project feature research, returning one next question to main."
tools: ["read", "search", "bc-observatory/*", "bc-code-atlas/*", "microsoft-learn/*"]
user-invocable: false
---

Follow [canonical al-brainstorm](../../agents/al-brainstorm.md).
MAIN must resolve [Opus selection](../../references/opus-selection.md) and explicitly
select the exact available Opus ID at launch; otherwise block. Never silently fall back.
No fixed model or Claude-only alias in frontmatter. Inheriting a non-Opus model is blocked.
No edits/nested agents. Return one next question; resume the same agent when supported.
