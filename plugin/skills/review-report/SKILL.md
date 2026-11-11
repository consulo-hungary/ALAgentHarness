---
name: review-report
description: "Scope a code review to the whole app or a topic and write a dated report under docs/generated/reviews."
user-invocable: false
---

# Review Report

Used by `/AL-review`. A review reads and reports; it never edits AL, never builds, never launches agents.

## Scope

- No argument: whole codebase. Start from the object index, then read in risk order: new/changed objects, event
  subscribers, posting and release logic, then the rest. Skip generated and obsolete folders.
- With text, review only that part. Map the text to a mode:
  - ID/structure words ("object IDs", "fields", "ranges", "names"): run [al-object-index](../al-object-index/SKILL.md)
    with `-Report` and build the report from the index (objects, names, IDs, fields, gaps, issues). No code reading needed.
  - Topic or object name ("pricing", `Codeunit 50100`): grep for the object/topic and review just those files.
- If the scope would exceed about 40 files, say so first and ask whether to narrow or continue.

## Method

Apply [company-rules](../company-rules/SKILL.md) and the relevant BCQuality guidance. Every finding needs a file and
line evidence you actually read; no evidence, no finding. Mark anything unverified as such.

## Report

Write to `docs/generated/reviews/<yyyy-MM-dd>-<slug>.md` (append `-2` rather than overwrite). Contents:

1. Scope and date, what was read (counts, not file dumps).
2. For ID/structure reviews: table of objects (Type, ID, Name, extends, fields), free ID blocks per type, app.json
   range use.
3. Findings table: severity, rule, `file:line`, one-line issue, suggested change.
4. Suggested gaps and changes: missing affixes, ID gaps worth closing or reserving, extension candidates, duplicated
   logic, missing docs. Suggestions only; the developer decides.
5. "Checked manually next": what the tool could not verify.

Chat answer: path of the report plus the top 3 findings. Do not paste the report.
