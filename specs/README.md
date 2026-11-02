# specs/

One spec per feature. The spec is the contract between the person who wants the feature and
the agent that builds it, and it travels with the PR.

## Lifecycle

| status | Set by | Means |
|--------|--------|-------|
| `draft` | the brainstorming workflow | written, not yet agreed |
| `approved` | the developer (never an agent on its own) | agreed: this is what gets built |
| `implemented` | the SDD workflow, after validation | code matches the spec; internal DoD checks it |

## Rules

- File name: ascending number plus kebab-case, `specs/2-preferred-carrier.md`. Start from
  `TEMPLATE.md`.
- Next number is one above the highest positive numeric prefix, not the number of files.
  Order the index numerically, never renumber completed specs or reuse a deleted number.
  Legacy unnumbered files stay readable; new feature specs are numbered.
- Objects are named by type and name. IDs are `<Ninja>` until the implementing agent fills
  `## Reserved IDs`.
- `depends-on:` lists the specs that must be implemented first. Specs without a dependency
  between them can be built in parallel, each on its own branch.
- Acceptance criteria and tests map one-to-one: one test per criterion, one criterion per
  test.
- A spec with open questions stays `draft`.
- Write a new feature spec through `/AL-brainstorm`. The workflow adds it to the index.
  Setup, code-only refactoring and commit grouping do not require feature specs.
- `/AL-brainstorm` writes AL feature specs and uses the AL template and Sandbox workflow.

## Index

Every spec in this folder, one row each. Kept in sync by the feature workflow; the status here
follows the spec's frontmatter.

| Spec | Title | Status | Depends on |
|------|-------|--------|------------|
| [1-al-workflow-commands.md](1-al-workflow-commands.md) | Historical AL workflow contract (superseded) | draft | none |
| [2-focused-commands.md](2-focused-commands.md) | Four focused plugin commands | approved | none |
| [3-project-aware-sdd.md](3-project-aware-sdd.md) | Project-aware test-first SDD (superseded) | implemented | none |
| [4-al-only-harness.md](4-al-only-harness.md) | Business Central AL-only harness with automated smoke tests | implemented | none |
