---
title: Four focused plugin commands
status: approved
kind: harness
depends-on: []
source: developer request, 2026-10-31
---

# Four focused plugin commands

This supersedes the historical all-in-one workflow. Approval here authorizes changes to
the plugin, not a feature implementation, deployment or commit in a consuming project.
The request is to reduce unrelated phases and model cost while preserving real evidence.

## Command contracts

| Command | Authorized task | Excluded work |
|---------|-----------------|---------------|
| AL-start | Shallow discovery; standard PTE skeleton (root instructions/workspace, .github, app configuration/cache/Features/Setup/Translations, test/Tests, docs and rules), byte-preserving moves, necessary path updates and safe missing setup files. Preserve existing source organization and legacy specs. | AL source edits, deep review, invented manifests/IDs/affixes/Sandbox settings, template seeding, CI implementation, extra hooks/tooling, feature specs, builds/tests, publishing or commits. |
| AL-refactor | Deep review of existing AL code with sourced findings and safe existing-file fixes, retaining behavior/IDs/contracts/schema/version; validate relevant existing apps/tests. | General folder setup, feature pipeline, blindly merging trigger/subscriber execution or unrelated upgrades. |
| AL-brainstorm | Real Opus brainstorming child, necessary questions and verified alternatives; numbered draft, explicit final-spec/sandbox approval, then SDD. | Model substitution, implementation before final approval or production deployment. |
| AL-commit | Small grouping agent, review current staged/unstaged/untracked changes, explicit staging and short meaningful local commits. | Code edits, secrets, blanket staging, history rewrites, push, PR or unrelated expensive review. |

## Shared constraints

- Target the active workspace, not attached plugin resources. Do not migrate this harness.
- Package exactly four command files; remove obsolete public commands and unused agents.
- Keep shared rules, Ninja, knowledge, build and internal DoD checks only where needed.
- Approved follow-up: restore internal `al-spec`, `al-coder`, `al-build-fixer` and
  `al-reviewer`, without adding public commands. The spec writer drafts only; coder
  implements approved logic after SDD proves assertion RED; build fixer is conditional
  on compilation failure; reviewer is independent and read-only after final validation.
  SDD preserves approval/test scope/evidence across real sequential handoffs. Main chat
  relays dispatch when the host cannot nest subagents; roleplay is not delegation.
- New spec names start with an ascending positive integer, followed by a kebab-case title.
  Allocate above the maximum existing number; order numerically, exclude templates/indexes,
  handle collisions explicitly and never overwrite or renumber completed specs.
- Preserve existing customizations and dirty changes. Missing infrastructure is not a
  passing validation result. Report uncertainty and deferred semantic fixes explicitly.
- Command invocation authorizes its narrow safe work, not an unrelated multi-stage flow.
  Final-spec approval still gates new-feature SDD and pins non-production sandbox operations.
- AL-start may create an empty test directory without fabricating a test manifest or GUID.
- Approved layout follow-up, 2026-11-01: create only the requested PTE skeleton and
  evidence-backed configuration. Unknown manifest/dependency/connection data remains
  absent and is reported. Existing policies/workspaces win; Setup category placeholders
  are only for apps without existing source organization. Keep legacy specs/ in place,
  and ask main to select once when both roots exist. No extra workflow artifacts.
- AL-refactor may create a new file/folder/object only when truly required with explicit
  scoped permission; different triggers/subscribers are not interchangeable by assumption.
- AL-commit includes the Copilot co-author trailer unless opted out and never changes Git
  identity settings or commits unreviewed content merely because it was already staged.
- Keep host permission prompts; do not modify global approval or security settings.

## Acceptance evidence

| Criterion | Verification |
|-----------|--------------|
| AC1 - Exactly four command entry files and only directly necessary agents/adapters remain. | Packaging tests and installed-host smoke instructions. |
| AC2 - Startup cannot edit AL content or launch deep review/SDD; moves preserve bytes and repeat safely. | Scope checks and disposable setup fixtures. |
| AC3 - Refactor reviews/fixes existing code without layout normalization or forced new spec. | Instruction regression checks; live consumer validation remains separate. |
| AC4 - Brainstorm really requests Opus and approved SDD, with no silent model fallback. | Agent/frontmatter/model routing checks and host smoke scenario. |
| AC5 - Spec numbers advance numerically above the maximum and cannot overwrite existing specs. | Numbering fixtures including gaps, double digits and collisions. |
| AC6 - Commit grouping preserves staging intent, excludes sensitive content and never pushes. | Commit-agent scope checks and disposable Git fixtures where implemented. |
| AC7 - Cross-file references and hooks remain valid after legacy removal. | Relative-reference, guardrail and Node test suite. |
| AC8 - Four internal specialists are registered without additional public commands. | Exact command/agent inventory and adapter/frontmatter checks. |
| AC9 - Specialist handoffs respect RED-before-logic, conditional build repair, final independent review and evidence invalidation after edits. | Workflow regression checks and installed-host smoke scenarios. |

## Open questions

None for the plugin scope. Consumer-specific setup collisions, uncertain event semantics,
model availability and sandbox permissions must still be handled without guessing.
