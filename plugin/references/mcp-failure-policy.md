# MCP failure policy: three tries, then ask the user

The harness relies on MCP servers for facts: `bc-observatory`, `bc-code-atlas`,
`microsoft-learn`, `al` and `al-object-id-ninja`. When one is broken, working around it
by digging through the file system (downloading or unzipping the base app, searching
symbol packages, reading `.alpackages` and similar) burns time and model credits for a
worse answer. This policy stops that.

## What counts as a failure

- The server does not start, or its tools are not exposed to this session. This is
  already a failure: ask at once, no retries.
- A call errors, times out or is refused (connection, auth, server error).
- NOT a failure: a valid answer of "no results" or "not found". Report it as such.

## The rule

1. Retry the same call at most **3 attempts in total** per server, with no workaround
   attempts in between. Do not switch tool or source to dodge the failure.
2. After the third failed attempt (or at once for a server that did not start), **stop**
   and ask the user through the host's question dialog (VS Code: `ask_user` / ask
   questions tool; Claude Code: AskUserQuestion), never as plain chat text. Name the
   server, the tool, the last error, and offer exactly these choices:
   - `Retry` (a fresh set of 3 attempts after the user fixed the server)
   - `Continue without <server>` (answers stay labelled "not verified by <server>")
   - `Stop here`
3. While waiting, do nothing else that costs: no searching, no downloads, no reading
   of other sources to compensate.
4. Honour the answer. `Continue` applies to that server for the rest of the task. Ask
   again only for a different server. Never silently continue.

Subagents cannot ask the user. They return `QUESTION: MCP <server> failed 3x: <tool>:
<error>` to MAIN, which asks the dialog and sends the answer back to the same agent.

## Forbidden compensation (also when the user chose "Continue")

Without the user's explicit choice to use a local fallback, never:

- download, clone or unzip base-app / system-app source or symbol packages;
- extract `.app` or `.zip` archives, or recursively search `.alpackages`, `.snapshots`
  or extracted base-app folders;
- fetch base-app source from GitHub or the web instead of Observatory / Atlas;
- answer from memory as if it were sourced.

The shell guardrail (`hooks/no-base-app-digging.mjs`) blocks the shell forms of these.
If the user explicitly picks a local fallback in the dialog, create an empty file
`.harness-allow-fallback` in the workspace root to lift that guardrail, and delete it
when the task is done. Never create it on your own.

## Per server

| Server | Failing means | If the user says continue |
|--------|---------------|---------------------------|
| `bc-observatory` | facts (IDs, fields, events, versions) unverified | label "not verified by BC Observatory"; no ID or signature from memory |
| `bc-code-atlas` | base-app bodies/signatures unverified | label "base-app body not checked" |
| `microsoft-learn` | official docs unverified | label "not checked against Learn" |
| `al` | no build, diagnostics or tests | the `al compile` CLI may be used for the build only, never as test evidence |
| `al-object-id-ninja` | no ID can be reserved | still a hard stop: never invent an ID, see `al-object-id-assignment` |
