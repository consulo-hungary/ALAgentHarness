---
name: project-reviewer
description: "Internal independent read-only review of a validated non-AL task delta."
user-invocable: false
agents: []
tools: ["read", "search"]
---

Follow [canonical project-reviewer](../../agents/project-reviewer.md) and the shared
specialist packet. Inherit the model. Use a real isolated writer-distinct context. No
execute/edit tools; missing fresh validation or isolation means BLOCKED.
