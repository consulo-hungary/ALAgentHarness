#!/usr/bin/env node
// Deterministic part of /AL-init: scan a workspace and apply the scaffolding. No AI, no network.
//   node al-init.mjs plan  <workspaceRoot>
//   node al-init.mjs apply <workspaceRoot> [--move-specs]
// Both print one JSON document. The agent writes the project description and technical overview
// content afterwards; this script only creates folders, skeleton files, instructions and guardrails.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { workspaceRoot, inside } from './workspace-paths.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const TEMPLATES = path.join(HERE, '..', 'templates');
const DIRS = ['docs/specs', 'docs/knowledge', 'docs/generated'];
const SKIP = new Set(['node_modules', '.git', '.alpackages', '.snapshots', '.alcache', 'docs', 'rules']);
const START = '<!-- al-harness:start';
const END = '<!-- al-harness:end -->';

const read = (p) => fs.readFileSync(p, 'utf8');
const today = () => new Date().toISOString().slice(0, 10);

function findApps(root, dir = root, depth = 0, apps = []) {
  if (depth > 3) return apps;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isFile() && entry.name === 'app.json') {
      try {
        const json = JSON.parse(read(full).replace(/^\uFEFF/, ''));
        apps.push({ path: path.relative(root, dir).replace(/\\/g, '/') || '.', name: json.name ?? '', publisher: json.publisher ?? '' });
      } catch {
        apps.push({ path: path.relative(root, dir).replace(/\\/g, '/') || '.', name: '', publisher: '' });
      }
    } else if (entry.isDirectory() && !SKIP.has(entry.name) && !entry.isSymbolicLink()) {
      findApps(root, full, depth + 1, apps);
    }
  }
  return apps;
}

function specCandidates(root) {
  const found = [];
  const specsDir = path.join(root, 'specs');
  if (fs.existsSync(specsDir) && fs.statSync(specsDir).isDirectory()) {
    for (const f of fs.readdirSync(specsDir)) {
      if (/\.md$/i.test(f)) found.push(`specs/${f}`);
    }
  }
  for (const f of fs.readdirSync(root)) {
    if (/spec/i.test(f) && /\.md$/i.test(f) && fs.statSync(path.join(root, f)).isFile()) found.push(f);
  }
  const docsDir = path.join(root, 'docs');
  if (fs.existsSync(docsDir)) {
    for (const f of fs.readdirSync(docsDir)) {
      if (/spec/i.test(f) && /\.md$/i.test(f) && fs.statSync(path.join(docsDir, f)).isFile()) found.push(`docs/${f}`);
    }
  }
  return found;
}

function knowledgeCandidates(root) {
  return fs.readdirSync(root).filter((f) => /\.(docx?|pdf|xlsx?|pptx?)$/i.test(f) && fs.statSync(path.join(root, f)).isFile());
}

export function planInit(rootArg) {
  const root = workspaceRoot(rootArg);
  const apps = findApps(root);
  return {
    root,
    git: fs.existsSync(path.join(root, '.git')),
    apps,
    appName: apps[0]?.name || path.basename(root),
    missingDirs: DIRS.filter((d) => !fs.existsSync(path.join(root, d))),
    specCandidates: specCandidates(root),
    knowledgeCandidates: knowledgeCandidates(root),
    has: {
      agents: fs.existsSync(path.join(root, 'AGENTS.md')),
      claude: fs.existsSync(path.join(root, 'CLAUDE.md')),
      copilotInstructions: fs.existsSync(path.join(root, '.github', 'copilot-instructions.md')),
      guardrails: fs.existsSync(path.join(root, '.github', 'hooks', 'al-guardrails.mjs')),
      projectOverview: fs.existsSync(path.join(root, 'docs', 'knowledge', 'project-overview.md')),
      technicalOverview: fs.existsSync(path.join(root, 'docs', 'knowledge', 'technical-overview.md')),
      objectIndex: fs.existsSync(path.join(root, 'docs', 'knowledge', 'object-index.json')),
    },
  };
}

export function mergeBlock(existing, block) {
  const clean = block.trim();
  if (!existing || !existing.trim()) return `${clean}\n`;
  const from = existing.indexOf(START);
  const to = existing.indexOf(END);
  if (from !== -1 && to > from) {
    return `${existing.slice(0, from)}${clean}${existing.slice(to + END.length)}`.replace(/\s*$/, '\n');
  }
  return `${existing.replace(/\s*$/, '')}\n\n${clean}\n`;
}

function ensureDir(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
}

export function applyInit(rootArg, { moveSpecs = false } = {}) {
  const plan = planInit(rootArg);
  const { root } = plan;
  const actions = [];
  const log = (kind, file, note = '') => actions.push({ kind, file, note });
  const put = (rel, content, { overwrite = false, mode } = {}) => {
    const file = inside(root, rel);
    const existed = fs.existsSync(file);
    if (existed && !overwrite) return log('kept', rel);
    if (existed && read(file) === content) return log('kept', rel);
    ensureDir(file);
    fs.writeFileSync(file, content, mode ? { mode } : undefined);
    log(existed ? 'updated' : 'created', rel);
  };
  const merge = (rel, templateName) => {
    const file = inside(root, rel);
    const before = fs.existsSync(file) ? read(file) : '';
    const after = mergeBlock(before, read(path.join(TEMPLATES, templateName)));
    if (before === after) return log('kept', rel);
    ensureDir(file);
    fs.writeFileSync(file, after);
    log(before ? 'updated' : 'created', rel, before ? 'harness block merged' : '');
  };

  for (const dir of DIRS) {
    const abs = inside(root, dir);
    if (!fs.existsSync(abs)) {
      fs.mkdirSync(abs, { recursive: true });
      log('created', `${dir}/`);
    }
  }

  if (moveSpecs) {
    for (const rel of plan.specCandidates) {
      const name = path.basename(rel);
      const target = inside(root, `docs/specs/${name}`);
      if (fs.existsSync(target)) {
        log('skipped', rel, 'target exists in docs/specs');
        continue;
      }
      fs.renameSync(inside(root, rel), target);
      log('moved', rel, `-> docs/specs/${name}`);
    }
  }

  put('docs/specs/TEMPLATE.md', read(path.join(TEMPLATES, 'spec-TEMPLATE.md')));
  const fill = (text) => text.replace(/\{\{DATE\}\}/g, today()).replace(/\{\{APP_NAME\}\}/g, plan.appName);
  put('docs/knowledge/project-overview.md', fill(read(path.join(TEMPLATES, 'project-overview.md'))));
  put('docs/knowledge/technical-overview.md', fill(read(path.join(TEMPLATES, 'technical-overview.md'))));

  merge('AGENTS.md', 'AGENTS.md');
  merge('.github/copilot-instructions.md', 'copilot-instructions.md');
  const claudeFile = inside(root, 'CLAUDE.md');
  if (!fs.existsSync(claudeFile)) put('CLAUDE.md', '@AGENTS.md\n');
  else if (!/@AGENTS\.md/.test(read(claudeFile))) {
    fs.appendFileSync(claudeFile, '\n@AGENTS.md\n');
    log('updated', 'CLAUDE.md', 'import of AGENTS.md added');
  } else log('kept', 'CLAUDE.md');

  put('.github/hooks/al-guardrails.mjs', read(path.join(TEMPLATES, 'hooks', 'al-guardrails.mjs')), { overwrite: true });
  put('.github/hooks/al-guardrails.json', read(path.join(TEMPLATES, 'hooks', 'al-guardrails.json')), { overwrite: true });
  put('.github/hooks/al-docs-check.mjs', read(path.join(TEMPLATES, 'hooks', 'al-docs-check.mjs')), { overwrite: true });

  const claudeSettings = inside(root, '.claude/settings.json');
  if (!fs.existsSync(claudeSettings)) {
    const settings = {
      hooks: {
        PreToolUse: [{ matcher: '*', hooks: [{ type: 'command', command: 'node .github/hooks/al-guardrails.mjs' }] }],
      },
    };
    put('.claude/settings.json', `${JSON.stringify(settings, null, 2)}\n`);
  } else {
    log('manual', '.claude/settings.json', 'exists: add a PreToolUse hook running `node .github/hooks/al-guardrails.mjs` yourself');
  }

  const gitDir = path.join(root, '.git');
  if (fs.existsSync(gitDir) && fs.statSync(gitDir).isDirectory()) {
    const hook = path.join(gitDir, 'hooks', 'pre-commit');
    const template = read(path.join(TEMPLATES, 'git', 'pre-commit'));
    ensureDir(hook);
    if (!fs.existsSync(hook)) {
      fs.writeFileSync(hook, template, { mode: 0o755 });
      log('created', '.git/hooks/pre-commit');
    } else if (!/al-docs-check/.test(read(hook))) {
      log('manual', '.git/hooks/pre-commit', 'exists: add the line `node .github/hooks/al-docs-check.mjs || exit 1` yourself');
    } else log('kept', '.git/hooks/pre-commit');
  } else {
    log('manual', '.git/hooks/pre-commit', 'no .git directory: run git init, then /AL-init again');
  }

  return { ...plan, actions };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [mode, target, ...flags] = process.argv.slice(2);
  try {
    const root = path.resolve(target ?? process.cwd());
    const result = mode === 'apply' ? applyInit(root, { moveSpecs: flags.includes('--move-specs') }) : planInit(root);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`al-init failed: ${error.message}`);
    process.exit(1);
  }
}
