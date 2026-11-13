---
bc-version: [all]
domain: ui
keywords: [page, pageextension, local-procedure, business-logic, action, trigger]
technologies: [al]
countries: [w1]
application-area: [all]
---

# Keep page logic focused on the UI

## Description

A page shows data, coordinates UI state and starts actions. New small local procedures and
trigger code may handle presentation, screen state and UI orchestration. Business validation,
calculations and decisions belong in the appropriate codeunit, not in the page.

Existing page procedures are grandfathered: changing a page does not require refactoring
unrelated existing logic. Do not add business logic to those procedures; move it when the
scope of a change calls for it. Follow the source-table and Meth pattern where appropriate
for new table business logic (see `meth-codeunit-single-public-procedure`).

Check: review new or changed page procedures and triggers for business logic; allow UI-only
helpers and do not require unrelated legacy procedures to be rewritten.

## Best Practice

The action delegates the business check to the owning application logic. UI-only helpers may
update presentation state. Business rules can then be reused without opening the page.

See sample: [`page-no-local-procedures.good.al`](page-no-local-procedures.good.al).

## Anti Pattern

A page procedure that implements business validation or calculations instead of delegating
them to the owning application logic.

See sample: [`page-no-local-procedures.bad.al`](page-no-local-procedures.bad.al).
