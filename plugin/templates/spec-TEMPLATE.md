---
title: <Feature name>
status: draft          # draft | approved | implemented
depends-on: []         # other specs (file names) that must be implemented first
source: <docs/TASK.md, an issue link, or "conversation">
mode: feature
---

# <Feature name>

## Context

Why this feature exists, for whom, and what it changes in their day. Two to five sentences.

## Knowledge sources

Relevant user-provided documents in `docs/knowledge/`: source path, content hash,
page/heading/line anchor and fact used. Record conflicts, unreadable documents or none.
These references inform decisions; they do not replace explicit final-spec approval.

## Decisions

What the developer decided with the Opus brainstorm agent and the sourced alternatives.
One line each, with the reason.

- D1 - <decision> (asked / decided: <reason>)

## Execution contract

Pin these before final approval; do not infer a target from launch.json.

| Item | Explicit value |
|------|----------------|
| Project root | <chosen absolute consuming project root> |
| Layout | <absolute appRoot, testRoot, specRoot, specPath, specIndex, generatedRoot, knowledgeRoot> |
| Scope / non-goals | <allowed change and excluded behavior> |
| Dependencies / BC version | <verified dependencies, application and runtime; no silent upgrade> |
| Task baseline | <commit/HEAD and dirty-file inventory, source hashes> |
| Allowed files | <app/test roots, exact numbered spec and index row> |
| Sandbox | <explicit tenant/environmentName, environmentType: Sandbox; no production> |
| Permitted operations | <build; safe Synchronize publish app then test; exact tests; host prompts remain> |
| Tests | <exact verified codeunit IDs/methods; new test IDs assigned by Ninja at implementation> |
| Generated artifacts | <only user-requested reusable Excel/HTML/etc., or none> |

## Approval

- Direction approval: <developer answer/reference; authorizes draft ONLY>.
- Final-spec approval: pending (explicit approval of this actual artifact required).
- Approved content/revision: <hash/reference recorded in session by main on approval>.
- Substantive scope/spec/project/target changes invalidate approval. Execution bookkeeping
  (Reserved IDs/status/index) alone does not authorize new scope.

## Filename and index

After MAIN agrees direction, the actual al-spec child creates
`<next-positive-integer>-<feature-slug>.md` in the ONE active spec root with
exclusive create: numeric max prefix + 1, not count/lexicographic order/hole reuse.
README/TEMPLATE excluded; duplicate prefixes block. Preserve old unnumbered specs and
update the active README index row. Setup/refactor/commit do not create forced specs.
The drafter never approves. MAIN presents the actual final artifact and obtains final-spec
approval before SDD; no mandatory separate draft review/build.

## Acceptance criteria

Numbered and testable. **One-to-one with `## Tests`**: every criterion has exactly one test,
every test covers exactly one criterion. A criterion you can not test is not finished.

- AC1 - Given <state>, when <action>, then <observable result>.

## Objects

Every new or extended object, by type and name. The ID is always `<Ninja>`: it is reserved
at implementation time, never here.

| Type | ID | Name | Purpose |
|------|----|------|---------|
| tableextension | `<Ninja>` | "<verified affix> <Name>" | extends Table <ID> "<Base table>" |

New fields:

| Table | ID | Field | Type | Notes |
|-------|----|-------|------|-------|
| Table <ID> "<Base table>" | `<Ninja>` | "<verified affix> <Field>" | Code[20] | TableRelation, captions |

## Events and extension points

Base-app events or objects this feature hooks into, as a symbol path, verified against the
symbols of the BC version in `app/app.json`.

- `Codeunit <ID> "<Name>"/<EventName>(...)` - why this event

## User-facing text

Every Error, Message and Confirm, as the Label it will become.

| Label | Text | Comment (placeholders) |
|-------|------|------------------------|
| <Context>Err | '<text with %1>' | %1 = <meaning> |

## Tests

One row per acceptance criterion, in the same order. Internal DoD checks that every test named
here exists.

| Test | Covers | Given / When / Then |
|------|--------|---------------------|
| <TestName> | AC1 | ... |

## Reserved IDs

Filled by the SDD coordinator from actual owning-app Ninja reservations before tests/stubs
and assertion RED; coder reuses the ledger. Internal DoD checks the code
against this table.

| Type | ID | Name | App |
|------|----|------|-----|

## Open questions

Anything still undecided. A spec with open questions stays `draft`.

## Execution evidence

SDD records assertion RED -> actual al-coder -> GREEN -> reversible mutation RED ->
restore GREEN, scoped method results, source/built/deployed package hashes and target.
Final GREEN plus current DoD precedes actual independent read-only al-reviewer.
Record reviewer identity/revision/findings. After source edits, refresh GREEN/DoD/review;
logic changes also refresh affected mutation evidence. Tests/scope changes need MAIN
approval and a new pre-RED phase. Keep approved substantive-content identity separate
from mutable status/ID/index bookkeeping and final file hashes.