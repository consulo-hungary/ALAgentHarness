---
bc-version: [all]
domain: style
keywords: [tableextension, naming, affix, prefix, suffix, field]
technologies: [al]
countries: [w1]
application-area: [all]
---

# New tableextension fields use the app's affix

## Description

Name each new field in a `tableextension` with the owning app's configured prefix or suffix
from `AppSourceCop.json`. Do not add `PTE` merely because the app is a per-tenant extension.
When the app has no configured affix, inspect existing extension fields in that app, record a
clearly evidenced convention in the workspace root `AGENTS.md` without overwriting existing
instructions, and use it. If the evidence is absent or ambiguous, ask the developer rather
than inventing an affix. Configuration takes precedence over an inferred convention.

Applies to new tableextension fields, not fields only being modified. Procedures do not
require an extra suffix under this rule. Check new fields against the owning app's
configuration or its documented, verified fallback.

## Best Practice

For an app configured with `DIR`, use `field(50100; "DIR Preferred Carrier"; Code[20])`.
Keep the caption user-friendly (`Caption = 'Preferred Carrier'`).

## Anti Pattern

Adding a hard-coded `PTE` suffix in addition to the app's affix, or choosing an affix without
configuration or sufficient evidence. The old `tableextension-pte-suffix` sample files
illustrate a retired naming rule and must not be used as naming guidance.