---
title: MCP failure policy - three tries, then ask the user
status: implemented
date: 2026-11-04
depends-on: []
source: developer request, 2026-11-02
---

# MCP failure policy - three tries, then ask the user

## Context

When BC Observatory and BC Code Atlas failed, an agent downloaded and unzipped the base
app source to compensate. That cost many credits and time for a worse answer.

## Decisions

- D1 - After 3 attempts in total (or at once if a server does not start), stop and ask the
  user in the question dialog: Retry / Continue without the server / Stop.
- D2 - Subagents return a QUESTION to MAIN; only MAIN asks.
- D3 - Block the shell forms of the workarounds with a PreToolUse hook; the user's
  explicit choice lifts it through a `.harness-allow-fallback` marker.
- D4 - Ninja stays a hard stop: "continue" never permits an invented ID.

## Acceptance criteria

- AC1 - The policy states the 3-attempt rule, the dialog choices and the QUESTION relay.
- AC2 - Every agent that uses MCP tools, and the knowledge, build, ID and feature skills,
  reference the policy; the session-start rules state it.
- AC3 - The hook blocks extracting `.app`/`.zip`, downloading base-app source and
  searching symbol packages, for both Claude and Copilot, and allows normal commands.
- AC4 - The marker file lifts the block.

## Tests

| Test | Covers | Given / When / Then |
|------|--------|---------------------|
| MCP failure policy exists | AC1 | Policy text contains the rule, choices and relay. |
| agent MCP users reference the policy; skills and session rules | AC2 | Checked for every agent found on disk. |
| guardrail blocks base-app digging | AC3, AC4 | Blocked and allowed commands, Claude and Copilot formats, marker override. |

## Execution evidence

`node --test plugin/tests/*.test.mjs` passes. A hook cannot see MCP failures, so the
3-attempt dialog itself is an instruction the agents follow; the hook only blocks the
expensive workarounds.
