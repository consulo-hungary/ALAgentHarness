---
name: al-refactor
description: "Code-first evidence-backed review and behavior-preserving fixes in existing own AL files."
---

# AL refactor

ONE continuous targeted local inspection and implementation, not a duplicate initial scan.
Follow [bc-workflow](../skills/bc-workflow/SKILL.md) cost/read limits; no automatic specialists.
Invocation permits safe fixes without direction/final-spec gates. Follow
[refactor scope](../skills/existing-code-review/SKILL.md). No layout normalization, folder setup,
numbered spec, brainstorm pipeline, functional upgrade, SDD, commits or implicit publish.

1. Read project rules and targeted existing OWN AL scope, manifests/dependencies and nearby
   callers. Existing root/custom layout is valid. Preserve dirty/index changes.
   Do not ask the developer to restate objects inferable locally.
   Read relevant `docs/knowledge/` text using
   [bc-workflow](../skills/bc-workflow/SKILL.md); preserve originals and
   surface conflicts rather than treating external specs as permission for behavior changes.
   Baseline/regression execution is opt-in, after estimate/consent, not a default requirement.
2. Load [company rules](../skills/company-rules/SKILL.md) and
   [knowledge](../skills/al-knowledge/SKILL.md). Apply BCQuality and company rules (company
   wins). Use BC Observatory FIRST for facts; source/call behavior needs Atlas at the
   correct application version (resolve/warm explicitly), Learn for official guidance.
   Missing version/source evidence means defer, never assume a nearby version equivalent.
3. List EVERY evidence-backed finding: file, line, severity, evidence/rule, why, proposed
   change, safe/deferred. Opinion is explicitly labeled, not a claimed defect.
4. Fix safe behavior-preserving inconsistencies in EXISTING files only. Preserve IDs,
   object names, public API/schema/runtime/dependencies, captions/labels and transaction,
   permission, event timing and error semantics. No new object/file/folder without main
   explicit scope permission. A verified subscriber may move into a better EXISTING
   codeunit, preserving attributes, call paths and test behavior. Never blindly unify
   table triggers and subscribers: prove RunTrigger/timing/permissions/transactions first.
5. ONE post-change owning-app build after estimate/consent; report compiler errors to the
   human. Existing regression tests run only on explicit request. No implicit sandbox permission; if execution
   needs publish/auth, return `QUESTION` to main. A green build alone does not prove
   equivalence. Compare API/schema/identity and source delta; absent baseline means
   preservation unproven. Do not invent coverage or retrofit a baseline claim.
6. Defer uncertain semantic changes and unrelated pre-existing failures. No automatic
   fix/rebuild or [al-build-fixer](al-build-fixer.md); that specialist is full-mode only.
7. Independent [al-reviewer](al-reviewer.md) is an explicit expensive opt-in, never a
   required finish gate. Estimate and ask before launch. No review on zero changes or
   repeated full-code scan. Missing baseline/tests means preservation is unproven, not
   permission to expand the workflow. No forced spec/layout/SDD/DoD or translations.

Report findings, applied/deferred changes, PASS/FAIL per company rule, build/regression
evidence and honest unrun tests. No claim of complete preservation without sufficient proof.

MCP server missing or failing (3 attempts in total): stop, return `QUESTION: MCP <server> failed 3x: <tool>: <error>` to MAIN and wait. Never compensate by downloading, unzipping or browsing base-app source or symbol packages on disk. See [MCP failure policy](../references/mcp-failure-policy.md).
