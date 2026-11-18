---
bc-version: [all]
domain: style
keywords: [business-logic, codeunit, validation, table, tableextension, architecture]
technologies: [al]
countries: [w1]
application-area: [all]
---

# Use the smallest clear business API

## Description

Reuse existing table validation and application procedures before adding business logic.
Keep record invariants with their owning record; use an appropriate codeunit for substantial
or reusable operations. Call that API directly with clearly named procedures.

No mandatory Meth codeunit, table wrapper, single-public-procedure limit, `Run(Action)`
dispatcher or `OnBefore`/`OnAfter`/`IsHandled` event scaffolding. Add an object or extension
point only for a concrete requirement, reuse need or demonstrated complexity reduction.
Never introduce a table merely to make a screen operation fit this pattern.

Check: each new object or forwarding layer has a concrete purpose; custom checks do not
duplicate guarantees of the application routines being called. Existing Meth codeunits
need not be rewritten unless required by the task.

## Best Practice

A page action calls the existing preparation/registration API. A small missing operation
is added to the appropriate owner, without a new framework or repeated standard validation.

## Anti Pattern

A screen-only buffer table, table wrapper and action dispatcher introduced solely to route
one operation, with repeated checks at scanning, preparation and posting.

The legacy filename is retained for existing links. Its `.good.al` and `.bad.al` samples
are retired and must not be used as guidance; they illustrate the superseded mandatory pattern.
