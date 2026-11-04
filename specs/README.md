# specs/

One lean spec per feature, primarily for human developers. Use the current budget workflow
in [plugin/README.md](../plugin/README.md); older indexed harness specs are historical contracts.

## Default Flow

MAIN brainstorms, asks one batch of questions (at most two rounds), agrees direction and
writes an at-most-80-line spec. After approval, STOP for developers. No status frontmatter,
approval hashes, reserved-ID table or automatic implementation is required. Optional
`/AL-implement <spec>` writes code with one build; `--full` is expensive opt-in only.

## Rules

- File name: ascending number plus kebab-case, `specs/2-preferred-carrier.md`. Start from
  `TEMPLATE.md`.
- Next number is one above the highest positive numeric prefix, not the number of files.
  Order the index numerically, never renumber completed specs or reuse a deleted number.
  Legacy unnumbered files stay readable; new feature specs are numbered.
- Objects are named by type and name. New IDs say `assign at implementation`; Ninja
  reservations happen only when writing AL, with evidence kept in session.
- Mention meaningful dependencies inline in Decisions or Business Rules, no metadata ledger.
- At most 10 acceptance checks, verifiable by hand. Tests are optional, never one per check.
- Material open questions must be resolved before implementation.
- Write a new feature spec through `/AL-brainstorm`. The workflow adds it to the index.
  Setup, code-only refactoring and commit grouping do not require feature specs.
- `/AL-brainstorm` uses the lean template, with no Sandbox workflow, build or translation.

## Index

Historical rows below retain their original status metadata. New specs need only one link
line in this README, no approval/status bookkeeping or changes to old rows.

| Spec | Title | Status | Depends on |
|------|-------|--------|------------|
| [1-al-workflow-commands.md](1-al-workflow-commands.md) | Historical AL workflow contract (superseded) | draft | none |
| [2-focused-commands.md](2-focused-commands.md) | Four focused plugin commands | approved | none |
| [3-project-aware-sdd.md](3-project-aware-sdd.md) | Project-aware test-first SDD (superseded) | implemented | none |
| [4-al-only-harness.md](4-al-only-harness.md) | Business Central AL-only harness with automated smoke tests | implemented | none |
| [5-mcp-failure-policy.md](5-mcp-failure-policy.md) | MCP failure policy: three tries, then ask the user | implemented | none |
