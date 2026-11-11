#!/usr/bin/env node
// AL guardrails (pre-tool-use hook), deployed into a repo by /AL-init as .github/hooks/al-guardrails.mjs.
// Self-contained: no dependencies, no link to the plugin. Works with VS Code Copilot / Copilot CLI
// (toolName + toolArgs) and Claude Code (tool_name + tool_input).
//   1. Blocks .al content that passes a literal string to Error(, Message( or Confirm(.
//   2. Blocks the expensive workarounds an agent reaches for when an MCP server fails: downloading or
//      unzipping the base app, extracting .app/.zip packages, browsing symbol packages.
// A block = JSON permissionDecision "deny" on stdout + the reason on stderr + exit code 2.
// The user can lift guardrail 2 by creating an empty `.harness-allow-fallback` file in the repo root.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const LITERAL = /\b(Error|Message|Confirm)\s*\(\s*(StrSubstNo\s*\(\s*)?'/i;
const ARCHIVE = /\.(?:app|zip|nupkg)\b/i;
const EXTRACT = /\b(?:Expand-Archive|unzip|7z[a]?\s+[xe]|bsdtar|tar\s+-?[a-z]*x)\b|ExtractToDirectory|ZipFile\]::Open/i;
const DOWNLOAD = /\b(?:Invoke-WebRequest|Invoke-RestMethod|iwr|irm|curl|wget|Start-BitsTransfer)\b/i;
const BASE_APP = /microsoft\/(?:BCApps|ALAppExtensions)|MSDyn365BC|BaseApp|Base[ _]?Application|System[ _]?Application|\/symbols\b|packages\.nav|api\.nuget\.org/i;
const GIT_SOURCE = /\b(?:git\s+clone|gh\s+repo\s+(?:clone|download)|gh\s+release\s+download)\b[^\n]*(?:BCApps|ALAppExtensions|MSDyn365BC)/i;
const BROWSE = /\b(?:Get-ChildItem|gci|dir|ls|find|rg|grep|Select-String|sls|findstr)\b[^\n]*(?:\.alpackages|\.snapshots|Microsoft_Base|Base[ _]?Application|System[ _]?Application)/i;
const SHELL_WRITES_AL = /(>>?|\btee\b(\s+-a)?|Set-Content|Add-Content|Out-File)\s*(-\w+\s+)*["']?[^\s"'|;&]*(?<!\.bad)\.al\b/i;

export function literalTextReason(texts) {
  for (const text of texts) {
    if (typeof text !== 'string') continue;
    const line = text.split(/\r?\n/).find((l) => LITERAL.test(l) && !l.trim().startsWith('//'));
    if (line) {
      return (
        `Blocked: literal text in Error/Message/Confirm ("${line.trim()}"). ` +
        `Declare a Label (e.g. NoPreferredCarrierErr: Label '...') and pass that. See AGENTS.md > Never.`
      );
    }
  }
  return null;
}

export function baseAppDiggingReason(command) {
  const text = String(command ?? '');
  let why = null;
  if (EXTRACT.test(text) && ARCHIVE.test(text)) why = 'extracting a .app/.zip package';
  else if (DOWNLOAD.test(text) && (ARCHIVE.test(text) || BASE_APP.test(text))) why = 'downloading base-app source or packages';
  else if (GIT_SOURCE.test(text)) why = 'cloning or downloading base-app source';
  else if (BROWSE.test(text)) why = 'searching symbol packages / base-app folders on disk';
  if (!why) return null;
  return (
    `Blocked: ${why}. If an MCP server (BC Observatory, BC Code Atlas, Learn, al) failed, ` +
    `retry it, and after about 5 failed requests without progress STOP: give a short progress statement, ` +
    `list what the developer must check manually, and ask whether the feature is really wanted. ` +
    `Do not compensate on the file system. Only if the user explicitly chose a local fallback, ` +
    `create an empty .harness-allow-fallback file in the repo root.`
  );
}

function strings(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => strings(v, out));
  return out;
}

export function decide(event, cwd = process.cwd()) {
  let args = event.tool_input ?? event.toolArgs ?? event.tool_args ?? {};
  if (typeof args === 'string') {
    try {
      args = JSON.parse(args);
    } catch {
      args = { command: args };
    }
  }
  const filePath = String(args.file_path ?? args.filePath ?? args.path ?? '').toLowerCase();
  const command = typeof args.command === 'string' ? args.command : '';

  if (filePath) {
    // .bad.al samples in rules/ show the anti-pattern on purpose.
    if (filePath.endsWith('.al') && !filePath.endsWith('.bad.al')) return literalTextReason(strings(args));
    return null;
  }
  if (!command) return null;
  if (SHELL_WRITES_AL.test(command)) {
    const reason = literalTextReason([command]);
    if (reason) return reason;
  }
  const digging = baseAppDiggingReason(command);
  if (!digging) return null;
  const root = event.cwd || process.env.CLAUDE_PROJECT_DIR || cwd;
  return fs.existsSync(path.join(root, '.harness-allow-fallback')) ? null : digging;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let input = '';
  process.stdin.on('data', (chunk) => (input += chunk));
  process.stdin.on('end', () => {
    let event;
    try {
      event = JSON.parse(input);
    } catch {
      process.exit(0); // never break the session on bad input
    }
    const reason = decide(event ?? {});
    if (!reason) process.exit(0);
    console.log(JSON.stringify({ permissionDecision: 'deny', permissionDecisionReason: reason }));
    console.error(reason);
    process.exit(2);
  });
}
