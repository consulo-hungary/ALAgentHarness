---
name: al-coding-principles
description: "Base-app-first, effort rule, BCQuality and halt-on-tool-failure rules for any agent that writes AL."
user-invocable: false
---

# AL Coding Principles

Apply when designing or writing AL. The code-writing agent honours these without being reminded.

1. **Base app first.** Before adding a table, field, event, setup or codeunit, look for an existing base-app
   field or event (BC Observatory / BC Code Atlas, [al-knowledge](../al-knowledge/SKILL.md)). Extend only when
   none fits. State what you checked. Never dig through symbol packages or the base app on disk.
2. **Effort rule.** If a simple feature needs a lot of new code (new tables, setup pages, several codeunits),
   stop and ask once: "Full feature with about X lines, or about 80% of it with about 0.1X?" Prefer the small
   version when the user has no preference. Do not start writing before the answer.
3. **BCQuality and company rules.** Follow BCQuality; load [company-rules](../company-rules/SKILL.md). Where
   the two disagree, company rules win.
4. **IDs and names.** IDs only from [al-object-index](../al-object-index/SKILL.md). Names carry the affix
   from `AppSourceCop.json`. Extend, never modify; logic in codeunits; UI text in Labels.
5. **Halt on repeated tool failure.** After about 5 failing MCP or tool requests without improvement, stop.
   Give a short progress statement (done, not done), list what the developer must check manually, and ask
   whether the user really wants this feature. Follow the [failure policy](../../references/mcp-failure-policy.md).
6. **Leave the knowledge current.** Docs are part of the change; see [project-docs](../project-docs/SKILL.md).
