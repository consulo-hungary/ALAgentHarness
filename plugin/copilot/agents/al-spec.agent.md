---
name: al-spec
description: "Internal numbered spec writer for an approved direction; no implementation or approval."
user-invocable: false
agents: []
tools: ["read", "search", "edit", "execute"]
---

Follow [canonical al-spec](../../agents/al-spec.md) and its shared packet. Inherit model.
Execute only the numbered-spec helper/read-only identity checks. No AL, IDs, builds,
publish, tests, approval or nested agents. Return genuine questions to MAIN.
