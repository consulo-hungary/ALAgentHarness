#!/usr/bin/env node
// PreToolUse hook (Bash): refuses the expensive workarounds an agent reaches for when an MCP
// server (BC Observatory, BC Code Atlas, ...) fails: downloading or unzipping the base app,
// extracting .app/.zip packages, or recursively searching symbol packages. The rule is in
// references/mcp-failure-policy.md: three tries, then ask the user. Exit code 2 blocks the call.
// The user can lift the block by choosing a local fallback; the agent then creates
// `.harness-allow-fallback` in the workspace root. No dependencies.
import fs from 'node:fs';
import path from 'node:path';

const archive = /\.(?:app|zip|nupkg)\b/i;
const extract = /\b(?:Expand-Archive|unzip|7z[a]?\s+[xe]|bsdtar|tar\s+-?[a-z]*x)\b|ExtractToDirectory|ZipFile\]::Open/i;
const download = /\b(?:Invoke-WebRequest|Invoke-RestMethod|iwr|irm|curl|wget|Start-BitsTransfer)\b/i;
const baseAppSource = /microsoft\/(?:BCApps|ALAppExtensions)|MSDyn365BC|BaseApp|Base[ _]?Application|System[ _]?Application|\/symbols\b|packages\.nav|api\.nuget\.org/i;
const gitSource = /\b(?:git\s+clone|gh\s+repo\s+(?:clone|download)|gh\s+release\s+download)\b[^\n]*(?:BCApps|ALAppExtensions|MSDyn365BC)/i;
const browse = /\b(?:Get-ChildItem|gci|dir|ls|find|rg|grep|Select-String|sls|findstr)\b[^\n]*(?:\.alpackages|\.snapshots|Microsoft_Base|Base[ _]?Application|System[ _]?Application)/i;

function blockedReason(command) {
  const text = String(command ?? '');
  let why = null;
  if (extract.test(text) && archive.test(text)) why = 'extracting a .app/.zip package';
  else if (download.test(text) && (archive.test(text) || baseAppSource.test(text))) why = 'downloading base-app source or packages';
  else if (gitSource.test(text)) why = 'cloning or downloading base-app source';
  else if (browse.test(text)) why = 'searching symbol packages / base-app folders on disk';
  if (!why) return null;
  return `Blocked: ${why}. If an MCP server (BC Observatory, BC Code Atlas, Learn, al, Ninja) failed, ` +
    `retry it up to 3 attempts in total, then STOP and ask the user with the question dialog ` +
    `(Retry / Continue without <server> / Stop). Do not compensate on the file system. ` +
    `See plugin/references/mcp-failure-policy.md. Only if the user explicitly chose a local ` +
    `fallback, create an empty .harness-allow-fallback file in the workspace root.`;
}

function run() {
  let input = '';
  process.stdin.on('data', (chunk) => (input += chunk));
  process.stdin.on('end', () => {
    let event;
    try {
      event = JSON.parse(input);
    } catch {
      process.exit(0); // never break the session on bad input
    }
    if (event.tool_name !== 'Bash') process.exit(0);
    const reason = blockedReason(event.tool_input?.command);
    if (!reason) process.exit(0);
    const root = event.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
    if (fs.existsSync(path.join(root, '.harness-allow-fallback'))) process.exit(0);
    console.error(reason);
    process.exit(2);
  });
}

run();
