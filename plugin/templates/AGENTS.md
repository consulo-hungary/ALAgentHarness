<!-- al-harness:start (managed by /AL-init; edit outside this block) -->
## AL Agent Harness (always on)

This repo uses the AL Agent Harness plugin and Microsoft BCQuality. Use the harness commands and skills
(`/AL-brainstorm`, `/AL-implement`, `/AL-review`, `/AL-commit`) and be precise: say what you verified and
what you did not. Humans look up and edit code where they can; do not burn tokens on what a developer can do.

### Look it up first

1. `docs/knowledge/project-overview.md` (why this extension exists), then `docs/knowledge/technical-overview.md`
   (what each object is for), then the matching spec in `docs/specs/`, then the code.
2. Object, field and enum-value IDs come from `docs/knowledge/object-index.json` and the app's `idRanges`.
   Never guess an ID. Next free ID: run the harness script `Get-ALObjectIndex.ps1 -NextId <type>`.
3. Base application first: before adding a table, field, event or codeunit, search the base app (BC Observatory,
   BC Code Atlas, symbols) for an existing field, event or setup. Extend only if none exists.
   If you cannot verify, say so; do not dig through packages on disk.

### Effort rule

If a simple feature needs a lot of new code (new tables, setup pages, codeunits), STOP and ask:
"full feature with about X lines, or about 80% of it with about 0.1X?" Wait for the answer. Prefer the small version.

### How we write AL

- Extend, never modify: `tableextension`, `pageextension`, event subscribers. Follow BCQuality and `rules/` if present.
- Business logic in codeunits, not page triggers. One object per file. Every new object name carries the affix
  from `mandatoryAffixes` in `AppSourceCop.json`.
- Text for `Error`, `Message` and `Confirm` is a `Label`, never a literal (a hook blocks literals).
- Identify AL objects as `Type ID "Name"`: `Table 18 "Customer"`.

### Docs are part of the change

- Specs live in `docs/specs/` (up to 100 lines, `status` + `date` frontmatter). After implementation, append a dated
  entry to the spec's Implementation Log: what changed, why, features gained or lost.
- At every commit that touches AL, `app.json` or a spec, update `docs/knowledge/technical-overview.md`
  (object purposes, new fields, new specs) and add a dated line to the matching feature in
  `docs/knowledge/project-overview.md`. A pre-commit hook enforces the technical overview.
- Generated reports, exports and scratch files go ONLY under `docs/generated/`.

### When tools fail

After about 5 failing MCP requests without improvement, halt. Give a short progress statement, list what must be
checked manually, and ask whether the feature is really wanted. Do not retry endlessly or work around on disk.

### Never

- Never invent an object, field or enum-value ID. Never modify the base application.
- Never claim a green build without a build. Default implementation: one build, no automatic repair loop.
- Never rewrite git history; never push or open a PR without being asked.
- Tests, mutation checks, independent review, translation and full SDD only on explicit request (token cost).
<!-- al-harness:end -->
