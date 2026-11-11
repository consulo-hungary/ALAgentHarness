---
name: al-build-validation
description: "Validate changed AL with one build; repair is an explicit full-mode opt-in."
user-invocable: false
---

# AL Build Validation

Default: ONE build of the touched production app, compile errors only, after cost estimate
and consent under [bc-workflow](../bc-workflow/SKILL.md). Return remaining compiler errors
to the human; no automatic repair, second build, tests, publish or symbol downloads.
Never claim completion without a real zero-error build. Full mode may explicitly authorize
one compilation fix/rebuild cycle; successful builds never launch a fixer.

## What this does not prove

This skill does **not run tests**. A green build proves the code compiles and the analyzers
are satisfied; it does not prove the code does what it should. Never report "tested" or
"works" on the strength of a green build. Running the tests is a separate step that needs a
sandbox.

## When to use

- After writing or changing AL code, `app.json` or a dependency.
- Follow the caller's single-build or explicitly authorized full-mode validation scope.
- Diagnostics-only callers build/collect without fixes. The isolated al-reviewer NEVER
  executes this skill; it reads supplied fresh build/diagnostic evidence.

## Procedure

### 1. Find the build tool

Use supplied owning-app paths or shallow manifest discovery; no resolver in default mode.
The remaining dependency-order/repair guidance is FULL MODE ONLY. Only explicit full-mode
consent may dispatch [al-build-fixer](../../agents/al-build-fixer.md) after actual compiler
errors, with relevant paths and diagnostics. At most one authorized fix/rebuild cycle,
including prior attempts, then return remaining errors to the human. No nested agents.

Use what the session exposes; list your tools, do not assume.

| Host | Build | Diagnostics |
|------|-------|-------------|
| Claude Code (`.mcp.json` server `al`, from `al launchmcpserver`) | `al_build` | `al_getdiagnostics` |
| GitHub Copilot in VS Code (AL extension tools) | `al_build` | `al_getdiagnostics` |
| No MCP tool (fallback) | `al compile` CLI, see below, only after the user approved it | the compiler output |

If the `al` MCP server does not start, report the build unverified; do not retry the build
in single-build mode. If full-mode calls keep failing (about 5 without improvement), apply the
[MCP failure policy](../../references/mcp-failure-policy.md): ask the user (Retry / Continue
without it / Stop). The CLI fallback is for the build only and never counts as test evidence.

No tool and no `al` CLI? Report unverified, below. Register the selected existing app with
`al_addproject` BEFORE building if required. A failed first build is the single-build result,
not permission to retry. Never invent a test manifest or load unrelated projects.

### 2. Build in dependency order (full mode only)

`app/` first, then `test/` (the test app depends on the app): after a green `app/` build, copy
the `.app` it produced in `app/` into `test/.alpackages/`, or `test/` compiles against an old
version of the app. Pass `projectPath` as the
absolute path of the folder that holds `app.json`, with code analysis on. Unresolved symbols
(`Cannot find type`, missing package): download symbols for that project first
only with explicit consent. Default mode reports missing symbols to the human, no download
or rebuild. Never assume a missing symbol is your code's fault, or that it is not.

CLI fallback, per project, from the repo root:

```bash
al compile /project:app /packagecachepath:app/.alpackages /out:app/output.app
al compile /project:test /packagecachepath:test/.alpackages /out:test/output.app
```

(copy the app's `.app` into `test/.alpackages/` before building `test/`).

### 3. Collect diagnostics

`al_getdiagnostics` with `projectPath`, severities error and warning.

- **Errors** - return exact file/line/code/message. Default mode fixes nothing after build.
- **Warnings** - no cleanup; default mode is compile errors only. Full mode may report them.
- **Info** - ignore unless it is about code you wrote in this task.

### 4. Repair (explicit full mode only)

Read the file around the reported line, fix the cause (not the symptom), rebuild, re-read the
diagnostics. At most one authorized fix/rebuild cycle; unresolved failures go to the human.
Validation-only callers never fix. A new file/object also needs explicit scope permission;
a fix that adds a new object or field goes through
`al-object-index` first.

### 5. Stop after one fix cycle

One unsuccessful authorized fix cycle: stop, report what you tried and why it fails. Do not delete code,
suppress analyzers or `#pragma` your way to green.

Errors that name **this app twice** (AL0275, AL0197: the same object in "Directions Demo" and
"Directions Demo") come from the build server, not from the code: the project is loaded twice
or a generated `.app` sits in the project folder. In default mode report this diagnosis to
the human; full-mode repair needs scoped consent. Never delete or recreate source files.

### 6. Report

```
Build status: GREEN | RED
  app/   errors 0  warnings 1  (1 accepted: AA0xxx - <reason>)
  test/  errors 0  warnings 0
Errors fixed this run: 3
Tool: al_build (MCP) | al compile (CLI)
Tests: not run (this skill does not run tests)
```

## Hard stop

> No build tool and no `al` CLI: **STOP** and report that the build could not run. Never
> report "done", "should compile" or "compiles in theory". Unblock with:
> `dotnet tool install --global microsoft.dynamics.businesscentral.development.tools --prerelease`

## Never

- Never report done on a red build, or on a build you did not run.
- Never silence a diagnostic to get green (no `#pragma warning disable`, no ruleset edits)
  unless the user asks for it.

## Related

- Return actual diagnostics; a build is never behavioral test evidence. Full-mode source
  edits require fresh affected validation, within the consented budget, or human handoff.
- `al-object-index` - before writing any new object or field.
- `definition-of-done` - expensive explicit full-mode check only.