---
title: AL brainstorm and refactor plugin workflows
status: draft
date: 2026-11-04
kind: harness
depends-on: []
source: conversation, 2026-10-30
---

# AL brainstorm and refactor plugin workflows

Historical contract, superseded by [2-focused-commands.md](2-focused-commands.md).
Its previous all-in-one refactor/setup workflow is no longer the current plugin contract.

This records the developer's requested plugin contract and clarified decisions. It is
not an approved specification for changing the sample AL app or a consuming project.
The developer requested implementation of the plugin customizations in this conversation;
the draft status does not grant approval to run a future AL implementation.

## Context

Developers should be able to start an AL idea or a behavior-preserving refactor from
Copilot in VS Code or the standalone GitHub Copilot CLI. The workflow researches the
actual project, discusses alternatives with the developer, writes a specification, and
delegates implementation and verification only after explicit specification approval.

This repository packages the workflow. It must not be reorganized as a side effect.

## Decisions

- D1 - Add reusable plugin commands, agents and skills; do not migrate this repository.
- D2 - Expose `AL-brainstorm` and `AL-refactor` slash commands. Use the host's command
  discovery spelling, including a namespace if required. Do not promise `!` commands:
  a CLI can interpret that prefix as shell execution.
- D3 - Brainstorm in the main conversation using the developer's selected capable
  model. Ask one question at a time. Do not hardcode a model or bypass tool permissions.
- D4 - Read project files and source before recommending alternatives. Use Observatory
  for BC facts, Atlas for exact source, and Learn/BCQuality for sourced guidance.
  Check recommendations against the consuming project's BC version.
- D5 - Approval of an idea is not approval of a specification. Obtain explicit approval
  of the actual final spec before changing AL, relocating files or deploying.
- D6 - Once that spec is approved, use actual subagents for specification drafting,
  implementation, builds, tests and review. Keep clarification and approvals in the
  main chat; serialize dependent writes and sandbox operations.
- D7 - The developer permits automatic publishing and test execution on the explicitly
  selected non-production sandbox after spec approval. Never publish to production,
  silently switch targets, force schema synchronization or create a PR automatically.
- D8 - Refactoring preserves behavior, object IDs, public contracts, schema and BC
  versions by default. Functional changes and upgrades require separate approval.
- D9 - In consuming programming projects, the desired layout is `app/`, `test/`,
  `docs/`, `docs/specs/` and `docs/generated/`. Existing `specs/` remains supported
  until an explicitly approved migration; conflicting roots require clarification.
- D10 - Only requested reusable reports belong in `docs/generated/`, including Excel
  or HTML artifacts. Do not generate unsolicited reports, scratch files or secrets.
- D11 - Discover new AL feature intents through skill descriptions. Do not intercept
  ordinary questions, unrelated plugin work, reviews, translations or bug fixes.
- D12 - Reuse existing harness agents and gates where applicable. Missing capability,
  credentials, sandbox, symbols or failed validation must be reported as blocked.
- D13 - A bare refactor targets the active workspace, not attached plugin resources.
  Its default goal is establishing the development baseline: review current code and
  infer the affected objects, folder organization and reference updates. Do not ask
  the developer to repeat that goal or supply an object list. Missing test/folder
  infrastructure is a planning input, not a reason to reject planning; its creation
  and validation limits belong in the final approval contract.

## Acceptance criteria and verification

These are harness tests, not AL test codeunits. Structural checks cannot prove how an
LLM follows instructions; interactive host scenarios remain explicit smoke tests.

| Criterion | Verification |
|-----------|--------------|
| AC1 - Both command entry points are packaged for Copilot and Claude without changing existing MCP server settings. | Manifest, command discovery and adapter-target validation. |
| AC2 - New AL idea discovery routes through a shared brainstorm-first workflow. | Skill/frontmatter checks and an interactive new-idea smoke test. |
| AC3 - The workflow checks real project code and version-compatible BC evidence before choosing a design. | Instruction checks and a smoke test with an alternative requiring version verification. |
| AC4 - No consumer code changes occur before approval of the final spec. | Gate checks and a smoke test declining spec approval. |
| AC5 - Approval delegates real specification, coding, build, test and review work. | Agent-registration checks and an interactive approved-feature smoke test inspecting subagent activity. |
| AC6 - Refactoring has an approved relocation map and preserves identities and behavior. | Refactor instruction checks and a consumer fixture with baseline/post-change builds and tests. |
| AC7 - Every workflow surface uses the same selected spec root, supporting legacy projects. | Layout routing checks and fixtures for new, legacy and ambiguous roots. |
| AC8 - Sandbox operations stay on the approved target and missing execution evidence cannot produce DONE. | Safety checks and smoke tests with missing credentials, a production target and a failed test. |
| AC9 - Only requested durable reports enter the generated-document folder. | Artifact policy checks and a smoke test without a report request. |
| AC10 - Existing commands remain usable and new entry points have installation instructions. | Legacy routing checks, Markdown references and documented host smoke tests. |
| AC11 - A bare refactor uses the active workspace despite attached plugin resources and infers baseline scope. | Command/skill/workflow regression checks and interactive smoke test with an attached command. |
| AC12 - Baseline planning handles root-level sources and missing tests without writing folders or claiming success. | Resolver fixtures and CLI tests; normal missing-manifest validation stays strict. |

## Out of scope

- Refactoring or moving this repository's sample app, tests or specifications.
- Adding AL objects or choosing object/field IDs.
- Automatically raising BC versions or changing functional requirements.
- Globally enabling tool auto-approval, installing software, changing user settings,
  committing changes, pushing branches or opening a pull request.
- Guaranteeing LLM routing or host compatibility from static Markdown tests alone.

## Open questions

None for the requested plugin scope. A consuming project still needs its own design
decisions, explicit spec approval and sandbox selection before autopilot can implement.
