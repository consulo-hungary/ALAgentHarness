<!-- al-harness:start (managed by /AL-init; edit outside this block) -->
## AL Agent Harness (always on)

This repo uses the AL Agent Harness plugin and Microsoft BCQuality. Use the harness commands and skills
(`/AL-brainstorm`, `/AL-implement`, `/AL-review`, `/AL-commit`) and be precise: say what you verified and
what you did not. Humans look up and edit code where they can; do not burn tokens on what a developer can do.

### Implementation and refactoring

Brainstorming stays in MAIN and stops at the spec. For explicit AL implementation or refactoring,
MAIN coordinates one `al-coder` writer and one independent `al-reviewer` clean-code review. Estimate
the bundle (2-3 calls, one build) and obtain consent once. Allow at most one writer correction for
concrete defects or clear unnecessary complexity; MAIN checks the correction, with no second reviewer.
Optional improvements go in the existing spec's Implementation Log, or the handoff if no spec exists.
Preserve agreed behavior; no new tests, RED, deployment or DoD required in default mode.
Writers never self-review or launch nested agents. If isolated agents or writer edit access are
unavailable, report the blocker and stop; do not fall back to main-chat work. Full SDD/tests/publish
remain explicit opt-ins.

### Models (Claude family, latest enabled version, never pinned in files)

- **Sonnet** for hard tasks: design, brainstorming, writing AL, compiler repair, SDD.
- **Haiku** for easy tasks: code review, lookups, mechanical edits, commit grouping, translation.
- **Opus** only when the user grants it in a dialog box (`vscode_askQuestions`, options Yes once / No) for a
  very hard, complex reasoning task; at most one consultation, after a cost estimate. Never default, never a
  blocker: declined or unavailable means continue on Sonnet. GPT is fine for documentation.
- Subagents: pass the tier as the subagent `model` (`al-coder` Sonnet, `al-reviewer` Haiku).

### Look it up first

1. `docs/knowledge/project-overview.md` (why this extension exists), then `docs/knowledge/technical-overview.md`
   (what each object is for), then the matching spec in `docs/specs/`, then the code.
2. Object, field and enum-value IDs come from `docs/knowledge/object-index.json` and the app's `idRanges`.
   Never guess an ID. Next free ID: run the harness script `Get-ALObjectIndex.ps1 -NextId <type>`.
3. Base application first: before adding a table, field, event or codeunit, search the base app (BC Observatory,
   BC Code Atlas, symbols) for an existing field, event or setup. Extend only if none exists.
   If you cannot verify, say so; do not dig through packages on disk.
   An MCP call silent for about 30 s is retried once; if it hangs again, skip that server for the session
   and continue another way, labelling what it would have verified as "not verified".

### Effort rule

Meet the same agreed behavior with the smallest clear implementation. Before a large change,
reconsider existing APIs and unnecessary layers. If substantial complexity remains, explain why
and ask once. Never silently reduce requirements to save lines.

### How we write AL

- Extend, never modify: `tableextension`, `pageextension`, event subscribers. Follow BCQuality and `rules/` if present.
- Pages coordinate UI and call existing application APIs; extract substantial or reusable business logic
  into appropriate codeunits. No mandatory Meth layers, table wrappers, dispatchers or event scaffolding.
- Reuse checks already performed by called application routines. Add only missing feature-specific checks
  at the owning boundary; keep lookups read-only. No speculative recovery, persistence or ownership policies.
- One object per file. Use the owning app's configured
  `AppSourceCop.json` affix for new object names and tableextension fields. Never add `PTE` merely because
  the app is a per-tenant extension. If no affix is configured, inspect existing extension fields in that
  app and record a clearly evidenced prefix or suffix, scoped to the app, in the workspace root `AGENTS.md`
  outside managed blocks; preserve existing instructions. If absent or ambiguous, ask the developer rather
  than guessing. A configured affix takes precedence over an inferred convention.
- Text for `Error`, `Message` and `Confirm` is a `Label`, never a literal (a hook blocks literals).
- Identify AL objects as `Type ID "Name"`: `Table 18 "Customer"`.

### Docs are part of the change

- Specs live in `docs/specs/` (up to 100 lines, `status` + `date` frontmatter). After implementation, append a dated
  entry to the spec's Implementation Log: what changed, why, features gained or lost, and optional concerns
  with consequences for developer follow-up. Do not turn concerns into unapproved runtime restrictions.
  Known permission bypasses or data-integrity defects must be fixed within scope or reported as blockers.
- Keep `docs/knowledge/technical-overview.md` and the matching project overview current when relevant.
  Missing, unchanged or intentionally deferred technical docs only warrant a warning, never a blocked
  commit or push. Do not require a placeholder document just to satisfy Git.
- Generated reports, exports and scratch files go ONLY under `docs/generated/`.

### When tools fail

After about 5 failing MCP requests without improvement, halt. Give a short progress statement, list what must be
checked manually, and ask whether the feature is really wanted. Do not retry endlessly or work around on disk.

### Never

- Never invent an object, field or enum-value ID. Never modify the base application.
- Never claim a green build without a build. Default implementation: one build, no automatic repair loop.
- Never rewrite git history; never push or open a PR without being asked.
- Tests, mutation checks, translation and full SDD only on explicit request (token cost).
  The bounded independent clean-code review is part of explicit implementation/refactoring.
<!-- al-harness:end -->
