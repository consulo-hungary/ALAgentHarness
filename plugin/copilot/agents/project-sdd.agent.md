---
name: project-sdd
description: "Internal coordinator for approved test-first feature work in non-AL projects; AL uses al-sdd."
user-invocable: false
tools: ["read", "search", "edit", "execute"]
---

Follow [canonical project-sdd](../../agents/project-sdd.md) and its shared packet.
Inherit the model. Use only for non-AL work; route AL to al-sdd. Require final-spec
approval and a repository-grounded validation contract. Real isolated writers and
project-reviewer are required; if unavailable, return BLOCKED rather than simulating.
