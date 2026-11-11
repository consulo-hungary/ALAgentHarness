# MCP failure policy: about five failures, then halt and report

The harness relies on MCP servers for facts: `bc-observatory`, `bc-code-atlas`,
`microsoft-learn` and `al`. When one is broken, working around it by digging through the
file system (downloading or unzipping the base app, searching symbol packages, reading
`.alpackages` and similar) burns time and model credits for a worse answer. This policy stops that.

## What counts as a failure

- The server does not start, or its tools are not exposed to this session. This is
  already a failure: halt at once, no retries.
- A call errors, times out or is refused (connection, auth, server error), or repeated
  calls return nothing useful and the approach is not improving.
- NOT a failure: a valid answer of "no results" or "not found". Report it as such.

## The rule

1. Count failing requests per task across tools and servers. Change the approach after two
   failures; do not repeat the same call with cosmetic changes.
2. After about **5 failing requests without improvement**, **halt**. Write a short progress
   statement and ask through the host's question dialog (never plain chat text), naming the
   server/tool and last error:
   - **Done so far**: what is verified and what is not.
   - **Check manually**: the exact lookups a developer must do (object, field, event, page).
   - **Question**: "Do you still want this feature, or continue without `<server>`?"
   Offer `Retry` (after the user fixed the server), `Continue without <server>` (answers
   stay labelled "not verified by <server>") and `Stop here`.
3. While waiting, do nothing that costs: no searching, no downloads, no compensation.
4. Honour the answer. `Continue` applies to that server for the rest of the task. Never
   silently continue.

Subagents cannot ask the user. They return `QUESTION: MCP <server> failed ~5x: <tool>:
<error>. Done: ... Check manually: ...` to MAIN, which asks the dialog.

## Forbidden compensation (also when the user chose "Continue")

Without the user's explicit choice to use a local fallback, never:

- download, clone or unzip base-app / system-app source or symbol packages;
- extract `.app` or `.zip` archives, or recursively search `.alpackages`, `.snapshots`
  or extracted base-app folders;
- fetch base-app source from GitHub or the web instead of Observatory / Atlas;
- answer from memory as if it were sourced.

The guardrail hook deployed by `/AL-init` (`.github/hooks/al-guardrails.mjs`) blocks the shell
forms of these. If the user explicitly picks a local fallback in the dialog, create an empty file
`.harness-allow-fallback` in the workspace root to lift that guardrail, and delete it when the
task is done. Never create it on your own.

## Per server

| Server | Failing means | If the user says continue |
|--------|---------------|---------------------------|
| `bc-observatory` | facts (IDs, fields, events, versions) unverified | label "not verified by BC Observatory"; no signature from memory |
| `bc-code-atlas` | base-app bodies/signatures unverified | label "base-app body not checked" |
| `microsoft-learn` | official docs unverified | label "not checked against Learn" |
| `al` | no build, diagnostics or tests | the `al compile` CLI may be used for the build only, never as test evidence |

Object IDs never depend on a server: they come from the local object index
(`Get-ALObjectIndex.ps1`). If it cannot run, ask the developer for the ID.
