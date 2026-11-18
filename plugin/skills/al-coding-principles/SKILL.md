---
name: al-coding-principles
description: "Direct, maintainable AL: reuse Microsoft application behavior, avoid duplicate checks and speculative architecture."
user-invocable: false
---

# AL Coding Principles

Apply when designing or writing AL. The code-writing agent honours these without being reminded.

1. **Reuse behavior, not just fields.** Start with the nearest existing application implementation.
   Verify genuinely uncertain validation, preparation and posting APIs through
   [al-knowledge](../al-knowledge/SKILL.md). Follow relevant Microsoft source patterns, not invented
   frameworks presented as Microsoft standards. Never dig through symbol packages on disk.
2. **Same behavior, simpler implementation.** Choose the shortest clear path that meets the agreed spec.
   Before a large implementation, reconsider reuse and unnecessary layers. Ask once if substantial
   complexity remains; explain its concrete cause. Never silently reduce requirements to save lines.
3. **Objects must earn their place.** No new buffer table for screen state, table wrapper, action dispatcher,
   Meth codeunit, setup or integration event solely to satisfy a pattern. Use clear named procedures;
   extract reusable or substantial business logic into an appropriate codeunit when that helps.
4. **Validate once at the owning boundary.** Reuse checks already performed by called application routines.
   Add only missing feature-specific checks; repeat only when changed state or a separate entry point
   requires it. Keep lookups read-only; never call posting-oriented checks merely to populate a lookup.
   Do not swallow standard errors or add transaction changes to work around an unsuitable call.
5. **No speculative workflow.** Recovery, persistence, ownership policies, tampering checks and cleanup
   frameworks need an agreed requirement or demonstrated correctness need. When fixes accumulate,
   reconsider the controlling path instead of adding another guard or state flag.
6. **Concerns are not new requirements.** After implementation, record optional concerns and consequences
   in the spec's Implementation Log for developers. Do not turn them into runtime restrictions or
   speculative code. Known permission bypasses or data-integrity defects must be fixed within scope or
   reported as blockers, not deferred while claiming completion.
7. **BCQuality and company rules.** Follow BCQuality; load [company-rules](../company-rules/SKILL.md). Where
   the two disagree, company rules win.
8. **IDs and names.** IDs only from [al-object-index](../al-object-index/SKILL.md). Use the owning app's
   `AppSourceCop.json` affix for new object names and tableextension fields; never add `PTE` by default.
   If no affix is configured, inspect that app's existing extension fields and record a clearly evidenced
   convention in root `AGENTS.md`, preserving existing text. Ask if evidence is absent or ambiguous.
   Extend, never modify; keep page code focused on UI orchestration; UI text in Labels.
9. **Halt on repeated tool failure.** An MCP call silent for about 30 s is retried once, then that server is
   skipped for the session and the task continues another way. After about 5 failing MCP or tool requests without improvement, stop.
   Give a short progress statement (done, not done), list what the developer must check manually, and ask
   whether the user really wants this feature. Follow the [failure policy](../../references/mcp-failure-policy.md).
10. **Leave the knowledge current.** Docs are part of the change; see [project-docs](../project-docs/SKILL.md).
