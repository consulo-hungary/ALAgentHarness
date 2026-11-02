---
title: Business Central AL-only harness with automated smoke tests
status: implemented
depends-on: []
source: developer request, 2026-11-02
---

# Business Central AL-only harness with automated smoke tests

## Context

The harness targets Business Central AL development with GitHub Copilot in VS Code. The
non-AL route added by spec 3 (web, Python, custom projects) and stale duplicate skills
dilute it. Every plugin change must also prove that all commands and agents still work.

## Decisions

- D1 - Remove `project-sdd`, `project-reviewer`, the `project-profiles` skill, the generic
  spec template, the general `web` tool of the brainstormer and the stale `al-brainstorm` and
  `al-refactor` skill duplicates (they collided with the commands of the same name).
- D2 - Keep the runtime Opus resolution (`references/opus-selection.md`,
  `scripts/opus-model.mjs`) because it works; no pinned model version anywhere else.
- D3 - Discover commands, agents and skills from disk in the smoke test, so new ones are
  covered without editing it. Run it from a git pre-commit hook and a GitHub workflow.

## Acceptance criteria

- AC1 - No file in `plugin/` (outside tests) references web, Python, generic or custom
  project routing, `project-sdd`, `project-reviewer` or `project-profiles`.
- AC2 - Every command has valid frontmatter, links that resolve and dispatches to an
  existing agent or skill.
- AC3 - Every agent has a canonical file and a Copilot adapter that agree, is not
  user-invocable, pins no model, uses only built-in tools or known MCP servers, and is
  referenced from somewhere.
- AC4 - Hooks and helper scripts run, and the Opus resolver blocks instead of falling back.
- AC5 - The suite runs automatically on every plugin change.

## Tests

| Test | Covers | Given / When / Then |
|------|--------|---------------------|
| smoke: plugin stays Business Central AL only | AC1 | Scan plugin md/json for out-of-scope content. |
| smoke command `<name>` | AC2 | One test per command found on disk. |
| smoke agent `<name>` | AC3 | Two tests per agent found on disk. |
| smoke: hooks, scripts, opus resolver | AC4 | Execute them with sample input. |
| `.githooks/pre-commit`, `plugin-tests.yml` | AC5 | Run `node --test plugin/tests/*.test.mjs` when plugin files change. |

## Execution evidence

`node --test plugin/tests/*.test.mjs` passes. The smoke test does not prove live Copilot
dispatch or Opus availability for the account.
