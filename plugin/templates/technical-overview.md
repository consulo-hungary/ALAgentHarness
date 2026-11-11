---
status: draft
date: {{DATE}}
---

# Technical overview: {{APP_NAME}}

Updated at EVERY commit that touches AL, app.json or a spec. Exact IDs and fields live in
`object-index.json` (generated); this file explains purpose.

## App

_Publisher, version, idRanges, application/runtime, affix, dependencies (from app.json)._

## Objects

_One row per object: `Type ID "Name"` | purpose | spec. Group by BC topic._

| Object | Purpose | Spec |
|--------|---------|------|

## New fields and enum values

_Own fields added to base tables, with the reason._

| Table / enum | Field or value | Purpose |
|--------------|----------------|---------|

## Specs

_One line per file in docs/specs/: number, title, status._

## Change log

_Dated, newest first: `YYYY-MM-DD commit/feature - objects added, changed, removed`._

- {{DATE}} Overview created by /AL-init.
