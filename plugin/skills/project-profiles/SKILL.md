---
name: project-profiles
description: "Resolve project type, repository-specific rules, test/build commands, and safe validation boundaries for AL, web, Python, or custom work."
user-invocable: false
---

# Project profile resolution

Use before drafting or implementing a new feature in the active workspace. The installed
plugin path is never the target. Resolve once and pass the result to every specialist.

## Detect from repository evidence

Read only the active root's instructions and relevant manifests/configuration:

- Business Central AL: `app.json`, AL files and AL-specific instructions.
- Web/JavaScript/TypeScript: `package.json`, lockfile, workspace config and framework files.
- Python: `pyproject.toml`, `setup.cfg`, `tox.ini`, requirements/lock files and project docs.
- Other or custom project: its actual build/test configuration and root instructions.

These are clues, not authority. If evidence conflicts, the workspace is multi-project, or
it is unclear which project owns the requested feature, ask MAIN to resolve it. Never
select a profile from the command name, file extension alone, or installed plugin. For a
mixed stack, identify the affected project(s) and their separate validation contracts.

## Record a bounded profile

Pass these facts in the specialist packet:

1. Active root and owning project root(s), manifests, and profile evidence.
2. Applicable `AGENTS.md`, `CLAUDE.md`, Copilot instructions, local rules and relevant docs.
3. Package manager/environment and existing dependency state, without exposing secrets.
4. Existing focused test, build, lint, type-check and runtime commands, including selectors.
5. Exact task file allowlist, baseline and dirty changes; intended local/nonproduction
   target and external side effects.
6. Gaps or ambiguities, including unavailable tooling and any proposed custom checks.

Prefer commands explicitly defined in the repository. For JavaScript/TypeScript, inspect
the package scripts and use the project's package manager; for Python, inspect the
configured environment and test/lint tools before invoking them. Do not invent a
conventional command when the project defines a different one. Before a Python terminal
command, follow the applicable environment-selection workflow. Do not install/update
dependencies, run migrations, deploy, access production, or use external services without
the necessary explicit authorization.

For custom projects with no existing check, derive a specific candidate validation
contract from the available configuration and ask MAIN to obtain approval before coding.
If there is no credible automated assertion, agree on a concrete alternative verification
method. A manual baseline can be recorded only as MANUAL RED/GREEN with observable
evidence; never label a tool/setup failure or speculative check as either.

## Routing

- AL project: use `al-spec`, then after final approval use `al-sdd` and its stricter BC
  profile. Observatory/Atlas, Ninja, Sandbox, company rules, and AL DoD apply only there.
- Non-AL project: use the generic numbered spec template when the project has no approved
  template, then use `project-sdd`. Preserve a project-owned template and spec root when
  they already exist.

Project type does not weaken the approval boundary: the actual final spec, target,
validation commands and side effects need explicit approval before SDD writes.
