---
name: al-build-fixer
description: "Internal conditional compilation fixer only on failed build with errors and authorized packet; bounded behavior-preserving repairs."
user-invocable: false
agents: []
tools: ["read", "search", "edit", "execute", "al/al_build", "al/al_getdiagnostics", "al/al_addproject", "al/al_downloadsymbols"]
---

Follow [canonical al-build-fixer](../../agents/al-build-fixer.md). Inherit model.
Build/diagnostics execution only; at most two safe cycles, no tests/publish, new IDs,
approval or nested agents. Return actual diagnostics/source identities, never fake GREEN.
