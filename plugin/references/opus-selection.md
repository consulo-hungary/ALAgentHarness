# Resolve the Opus family before launching

`opus` means the available Claude Opus family, not a portable model ID. MAIN owns selection;
only the brainstormer overrides the current model. Do not edit installed caches or global
model/approval settings to resolve a request.

1. Obtain the actual host's available, launch-selectable model IDs from its model inventory
   API/tool or session model snapshot. A launch-tool model enum is only a candidate list,
   not proof of account access. Do not treat this document, agent frontmatter, or a user's
   subscription claim as inventory.
2. For Copilot/SDK, use [resolveOpusModel](../scripts/opus-model.mjs) with that array of
   exact IDs. It returns the newest numeric Opus version, retaining the exact host spelling.
   Equal versions prefer the shorter base ID, then lexical order for deterministic ties.
   Example invocation from the plugin root in PowerShell:

   ```powershell
   node .\scripts\opus-model.mjs '["claude-sonnet-5.5","claude-opus-5.5","claude-haiku-5.5"]'
   ```

   This returns `"claude-opus-5.5"`; the example is not an availability assertion.
   Newer available Opus versions require no plugin version edit. Never pass the literal
   `opus` to a selector that only accepts exact IDs.
3. Claude Code may use its native `opus` alias only when the host supports that alias.
   Record the concrete selected model from the launch/session evidence.
4. Pass the resolved ID explicitly to the real named brainstorm launch. If the host
   cannot override a named agent's model, use its supported real isolated adapter with
   the same exact model and canonical instructions. Verify the actual selection before
   research; never accept an inherited Sonnet/Haiku model as Opus.
   If launch explicitly reports that a candidate model is unavailable/unsupported, record
   the error, remove that exact ID from the candidate list and resolve again. Try each ID
   at most once; this is Opus-only availability resolution, not a cheaper-family fallback.
   Other launch failures (auth, quota, tools, isolation) block with their actual error;
   do not misclassify them as model unavailability or retry unrelated specialists.
5. If inventory is inaccessible, ask MAIN's question facility for the exact available
   Opus ID shown in the host's model picker; verify launch evidence. Do not guess an ID.
   If no supported selector/isolation exists, report `BLOCKED: Opus selection unavailable`
   with the missing facility. An empty Opus inventory is `BLOCKED: Opus unavailable`.
   No cheaper fallback, simulated launch, or implementation while blocked.
