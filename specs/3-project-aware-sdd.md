---
title: Project-aware test-first SDD (superseded by 4-al-only-harness.md)
status: implemented
depends-on: []
source: developer request, 2026-10-31
---

# Project-aware test-first SDD

> Superseded: the non-AL route (web, Python, custom projects), `project-sdd`,
> `project-reviewer` and the project-profile resolver were removed by
> [4-al-only-harness.md](4-al-only-harness.md). Kept for history.

## Context

The four-command harness is AL-focused, but the same approved spec -> test-first
implementation -> validation -> independent review pattern should also support web,
Python and custom repositories. AL-specific constraints (Ninja IDs, Business Central
sources, Sandbox publishing and AL DoD) must remain confined to the AL route.

## Decisions

- D1 - Retain exactly four public commands; reuse `/AL-brainstorm` for compatibility and
  make its feature workflow detect the active project profile.
- D2 - Keep the existing `al-sdd` as the strict AL coordinator; add a separate internal
  non-AL SDD coordinator and isolated read-only reviewer.
- D3 - Prefer project-defined commands, instructions and templates. If a custom project
  has no credible test contract, agree on one before implementation instead of guessing.
- D4 - Require actual final-spec approval and explicit permission for stateful/external
  side effects; never simulate specialist isolation or test results.

## Acceptance criteria

- AC1 - Exactly four public chat command files remain, and `/AL-brainstorm` routes active
  AL projects to the AL pipeline and non-AL projects to the generic pipeline.
- AC2 - Project type and validation commands are derived from active workspace evidence;
  conflicting/multi-project ambiguity blocks for MAIN resolution.
- AC3 - Non-AL SDD requires final-spec approval, test-only work before logic, a real
  assertion RED, logic implementation after RED, actual GREEN, and clear handling of
  mutation/review evidence.
- AC4 - The generic workflow does not use AL object IDs, BC tools, Sandbox assumptions or
  AL build/test procedures.
- AC5 - Final non-AL review is an actual isolated, writer-distinct, read-only review that
  requires fresh validation evidence.
- AC6 - Project validation and side effects use exact repository-grounded commands and
  explicit permissions; setup failures never count as test evidence.

## Tests

| Test | Covers | Given / When / Then |
|------|--------|---------------------|
| four command packaging regression | AC1 | Verify exactly four public command files. |
| profile routing regression | AC2 | Verify AL/non-AL profile routing and evidence-based ambiguity handling. |
| project SDD contract test | AC3 | Verify final approval, test-first RED/GREEN, mutation evidence and side-effect gates. |
| AL isolation regression | AC4 | Verify the generic coordinator routes AL to the strict AL workflow. |
| reviewer adapter test | AC5 | Verify generic reviewer is independent, read-only, and has only read/search tools. |
| validation command contract test | AC6 | Verify commands are project-grounded and failures cannot masquerade as test evidence. |

## Execution evidence

Implemented in plugin version 2.2.0. The complete plugin suite passes 37/37 tests;
`git diff --check` passes. These checks do not assert live Copilot dispatch or Opus
availability.
