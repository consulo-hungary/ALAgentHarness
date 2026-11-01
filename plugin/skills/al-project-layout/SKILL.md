---
name: al-project-layout
description: "Internal read-only resolution of consuming AL roots and one active numbered spec/index root; no migration."
user-invocable: false
---

# Resolve once, pass paths

The ACTIVE WORKSPACE/session working directory is the default target. A tagged plugin
command/skill is a resource path, NOT a target override. Never migrate this plugin/sample
repository. Explicit developer target wins; conflicting instructions require main.

Default new consuming layout is app/, test/, docs/, docs/specs/, docs/generated/,
docs/knowledge/. Knowledge holds user-provided references, not generated reports.
Respect existing root/custom AL projects; discovery is shallow. Prefer docs/specs/ for
new specs, respect legacy specs/ until safe AL-start migration. If both roots exist, main
selects ONE once; never split writers/indexes. Only brainstorm creates a numbered spec.

Use [resolver](scripts/resolve-layout.mjs) with an absolute project root and explicit
project-relative overrides. `--refactor-baseline` permits root app.json and missing test
manifest READ-ONLY; it does not request layout conversion. Normal strict mode checks both
manifests. It returns no source text/secrets, only name/application/runtime/dependencies.
An empty test directory is valid before feature tests; never fabricate app.json GUIDs.
For arbitrary shallow custom roots supply app/test overrides discovered from manifests.
Pass absolute projectRoot/appRoot/testRoot/specRoot/specPath/specIndex/knowledgeRoot to every actual
agent; no nested re-selection. No files are created by this skill/resolver.
