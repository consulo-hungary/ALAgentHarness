---
name: project-docs
description: "Create and update project-overview, technical-overview and spec logs for fast AI and human lookup."
user-invocable: false
---

# Project Docs

Lookup order for humans and AI: `docs/knowledge/project-overview.md` (why) -> `technical-overview.md`
(what each object is for) -> `docs/specs/` (detail) -> code. Great detail belongs in specs, not in the overviews.
Templates: [project-overview](../../templates/project-overview.md), [technical-overview](../../templates/technical-overview.md).

## Initial content (from /AL-init)

- **Project overview**: extension goal (from `app.json`, the code and documents in `docs/knowledge/`), then one
  short section per BC topic (Sales, Purchasing, Inventory, Finance, Setup...) listing each feature in a line
  with its spec and status. Dated change history, newest first.
- **Technical overview**: app facts, one table row per object (`Type ID "Name"` | purpose | spec), own fields and
  enum values on base objects with the reason, spec list, dated change log. Purpose comes from reading the object
  (grep, line ranges); never invent. Exact IDs and fields stay in `object-index.json`; do not copy them.
- Keep each overview compact. Write facts the code shows; mark guesses as "unverified".

## Update rule (every change and every commit)

1. Refresh the index with [al-object-index](../al-object-index/SKILL.md).
2. Compare it to the technical overview: add rows for new objects and fields, drop removed ones, fix changed purposes.
3. Add a dated line to the technical-overview change log and to the affected feature in the project overview.
4. Append an Implementation Log entry to the spec (see below). Update `date` frontmatter on every doc you touch.

A git pre-commit hook blocks commits that touch `.al`, `app.json` or `docs/specs/*.md` without a staged
`docs/knowledge/technical-overview.md`. The developer can override with `AL_DOCS_SKIP=1`.

## Spec log

The planning part of a spec stays within 100 lines. After implementation the file may grow without limit through
the `## Implementation Log` section: `### YYYY-MM-DD <implemented|reviewed|changed>` with Changed / Why /
Gained-lost bullets. Record WHY (git has the code). When a spec is reviewed again, add a dated entry even if
nothing changed ("reviewed, still accurate").
