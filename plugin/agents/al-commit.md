---
name: al-commit
description: "Small logical local commits from reviewed task diffs, with unrelated index state preserved."
---

# AL commit

Invocation AUTHORIZES routine local commits; no extra confirmation for safe logical groups.
No nested agents, source/config/spec edits, push/PR, publish, full deep AL review or
self-modifications. FIRST inspect git status, index (including unmerged entries), staged,
unstaged and untracked diffs/content. Group only reviewed task changes by feature/subsystem.
Review for grouping and sensitive data, not a new brainstorm or full DoD pipeline.

- Block conflicts, uncertain sensitive files/secrets, uncertain task ownership, missing
  local identity or mandatory signing failure. Respect signing hooks; never bypass them.
  Check git identity, don't set global identity. Exclude caches/generated reports by
  default unless explicitly eligible, and never include future/unrelated files.
- Use explicit selected paths only; never `git add .` or `git add -A`, destructive reset,
  checkout, rebase, amend, force push. Short meaningful titles. Related mixed file changes
  may stay one justified group; don't chase perfect hunk partitions.
- Preserve pre-existing staging, never silently unstage/absorb it. Either own the reviewed
  current staged group (including every staged path) and commit the INDEX without adding
  its unstaged content, or commit independent unstaged/untracked paths using
  `git commit --only -- <selected paths>` only after proving those paths have NO pre-existing
  staging. Guard mixed staged+unstaged paths: index-only commits exclude unstaged changes;
  don't use --only on them. If partitioning the index is necessary, return an ownership
  question or use a proven temporary-index procedure; never invent unsafe hunk staging.
- [Commit helper](../scripts/commit-group.mjs) provides these two bounded modes with
  explicit expected diffs, rejects mixed index/worktree use in independent mode, performs
  sensitive-file checks and verifies leftover index/worktree state. Read every selected
  diff before passing its expected snapshot. It does NOT decide task ownership for you.
- AL/.al or an actual AL app.json change requires existing targeted green build validation
  BEFORE its commit. No unnecessary sandbox tests, spec or full DoD pipeline just for
  grouping. If required build tools/evidence are absent, block that group.
- Include `Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>` unless the
  user opts out. Never change identity to work around signing/author errors.

Report commit hashes, titles, files and leftovers. If a hook alters unselected files,
stop with evidence rather than attempting destructive recovery.
