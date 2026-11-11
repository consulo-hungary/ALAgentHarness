---
name: al-object-index
description: "Local PowerShell index of all AL objects, fields, IDs and the app.json ID range; next free IDs without a subscription."
user-invocable: false
---

# AL Object Index

`scripts/Get-ALObjectIndex.ps1` (Windows PowerShell 5.1 or `pwsh`) parses every `.al` file and each `app.json`
into `docs/knowledge/object-index.json`. No network, no subscription, no AL Object ID Ninja. Never pick IDs by
guessing; never read `idRanges` yourself when the script can answer.

Run it from the plugin folder (the folder above this skill's `skills/` directory), pointing at the workspace:

```powershell
# refresh the index (fast; run before and after code changes)
powershell -NoProfile -File "<plugin>/scripts/Get-ALObjectIndex.ps1" -WorkspaceRoot "<workspace>"
# also write docs/generated/reviews/<date>-object-ids.md
... -Report
# next free IDs inside the app's idRanges (unioned over all apps of that type)
... -NextId codeunit -Count 2
# next field/value IDs for a base object or own table/enum (all extensions considered)
... -NextMemberId "Sales Header" [-MemberKind field|value] [-App app]
```

Output: the last line is `Index: <path> - N app(s), N object(s), N error(s), N warning(s)`; `-NextId` and
`-NextMemberId` print only the IDs, one per line.

## Reading the index

JSON, one record per line, so grep works: `apps` (idRanges, affixes, dependencies, application, runtime),
`idUsage` (per app and type: used ranges, nextFree, freeBlocks), `issues`, `objects` (type, id, name, file, line,
extends, fields, values). Prefer `grep` on the file over reading it whole.

## Issues detected

`duplicate-id`, `duplicate-member-id`, `out-of-range`, `member-out-of-range`, `missing-affix`,
`multi-object-file`, and broken `app.json`. IDs are not reserved: two branches can pick the same number, so
the duplicate check on merge is the safety net. Report issues; do not auto-fix them.

If the script cannot run (no PowerShell), say so and ask the developer for the next free ID; never invent one.
