---
title: <Feature name>
status: draft
depends-on: []
source: <issue, request, or conversation>
profile: <verified project type and evidence>
---

# <Feature name>

## Context and outcome

<Who needs this, what problem is addressed, and what observable result is wanted?>

## Decisions

- D1 - <decision and reason>

## Scope and non-goals

- In scope: <behavior/files>
- Out of scope: <explicit exclusions>

## Project and execution contract

| Item | Approved value |
|---|---|
| Workspace/project root | <absolute path and evidence> |
| Project profile | <framework/language/tooling evidence; or developer-approved custom profile> |
| Baseline | <revision plus dirty/staged/untracked inventory> |
| Allowed files | <exact directories/files> |
| Test scope | <exact tests or checks> |
| Validation commands | <existing, verified commands and expected outcomes> |
| Environment/side effects | <local/nonproduction environment and explicit permissions; none by default> |
| Dependencies | <existing dependency state; no unapproved install or upgrade> |

## Approval

- Direction: <approved decision/reference; authorizes drafting only>
- Final spec: pending explicit approval of this content/revision
- Approved content identity: <MAIN records hash/reference after approval>
- Scope, test contract, target or side-effect changes require renewed MAIN approval.

## Acceptance criteria

Each criterion describes an observable outcome and maps to one or more named tests.

- AC1 - Given <state>, when <action>, then <observable result>.

## Tests and verification

| Test/check | Covers | Expected result |
|---|---|---|
| <name> | AC1 | <observable assertion> |

## Risks and recovery

<Relevant failure modes, data handling, compatibility, and rollback/recovery.>

## Open questions

<Any unresolved decision keeps status at draft.>

## Execution evidence

<Coordinator records assertion RED, implementation handoff, GREEN commands/results,
meaningful mutation or reason skipped, final source revision, applicable DoD, independent
review identity/findings and remaining gaps. Never treat bookkeeping as scope approval.>
