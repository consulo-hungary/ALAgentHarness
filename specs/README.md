# specs/

One lean spec per feature, primarily for human developers. Use the current budget workflow
in [plugin/README.md](../plugin/README.md); older indexed harness specs are historical contracts.

## Default Flow

MAIN brainstorms, asks one batch of questions (at most two rounds), agrees direction and
writes an at-most-100-line spec. After approval, STOP for developers. Mandatory frontmatter:
`status: draft | approved | implemented` and `date: YYYY-MM-DD` (last updated).
No approval hashes, reserved-ID table or automatic implementation is required. Optional
`/AL-implement <spec>` writes code with one build; `--full` is expensive opt-in only.

## Rules

- File name: ascending number plus kebab-case, `specs/2-preferred-carrier.md`. Start from
  `TEMPLATE.md`.
- Next number is one above the highest positive numeric prefix, not the number of files.
  Order the index numerically, never renumber completed specs or reuse a deleted number.
  Legacy unnumbered files stay readable; new feature specs are numbered.
- Objects are named by type and name. New IDs say `from the object index at implementation`; they come from
  the local `Get-ALObjectIndex.ps1` script only when writing AL.
- After implementation the spec may grow without limit through its Implementation Log: dated entries with what
  changed, why (git has the code), features gained or lost, and later re-reviews.
- Mention meaningful dependencies inline in Decisions or Business Rules, no metadata ledger.
- At most 10 acceptance checks, verifiable by hand. Tests are optional, never one per check.
- Material open questions must be resolved before implementation.
- Start as `draft`; only explicit developer approval sets `approved`. Set `implemented`
  only on developer-confirmed completion or completed requested AI scope with a green build
  (and any explicitly requested full-mode gates). Refresh date on edits/status changes.
- Substantive changes to approved behavior reset status to `draft`. Dates are last-updated
  dates, not inferred original creation or historical approval dates.
- Write a new feature spec through `/AL-brainstorm`. The workflow adds it to the index.
  Initialization, review and commit grouping do not require feature specs.
- `/AL-brainstorm` uses the lean template, with no Sandbox workflow, build or translation.

## Index

Historical rows below retain their original status metadata. New specs need only one link
line in this README; status/date live in the spec, without a separate approval ledger.

| Spec | Title | Status | Depends on |
|------|-------|--------|------------|
| [1-al-workflow-commands.md](1-al-workflow-commands.md) | Historical AL workflow contract (superseded) | draft | none |
| [2-focused-commands.md](2-focused-commands.md) | Four focused plugin commands | approved | none |
| [3-project-aware-sdd.md](3-project-aware-sdd.md) | Project-aware test-first SDD (superseded) | implemented | none |
| [4-al-only-harness.md](4-al-only-harness.md) | Business Central AL-only harness with automated smoke tests | implemented | none |
| [5-mcp-failure-policy.md](5-mcp-failure-policy.md) | MCP failure policy: three tries, then ask the user | implemented | none |
