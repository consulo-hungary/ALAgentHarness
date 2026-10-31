import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { workspaceRoot, inside } from './workspace-paths.mjs';

const trailer = 'Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>';
const hash = (data) => createHash('sha256').update(data).digest('hex');
function git(root, args) {
  const result = spawnSync('git', ['--no-pager', ...args], { cwd: root, encoding: 'utf8',
    env: { ...process.env, GIT_LITERAL_PATHSPECS: '1' } });
  if (result.status !== 0) throw new Error(`git ${args[0]} failed: ${result.stderr.trim()}`);
  return result.stdout;
}
const list = (text) => text.split('\0').filter(Boolean);
function index(root) {
  return list(git(root, ['ls-files', '--stage', '-z']));
}
function worktree(root, selected) {
  return selected.map((relative) => {
    const file = inside(root, relative);
    return [relative, fs.existsSync(file) ? hash(fs.readFileSync(file)) : null];
  });
}

export function inspectGroup(projectRoot, selected, mode) {
  const root = workspaceRoot(projectRoot);
  if (!['staged', 'independent'].includes(mode) || !Array.isArray(selected) || !selected.length ||
      new Set(selected).size !== selected.length) throw new Error('Select explicit unique files and a commit mode');
  for (const file of selected) inside(root, file);
  const paths = selected.slice().sort();
  if (git(root, ['ls-files', '--unmerged', '-z'])) throw new Error('BLOCKED: unmerged index');
  if (path.resolve(git(root, ['rev-parse', '--show-toplevel']).trim()) !== root) {
    throw new Error('Use the actual git workspace root');
  }
  const staged = list(git(root, ['diff', '--cached', '--name-only', '-z'])).sort();
  if (mode === 'staged' && JSON.stringify(staged) !== JSON.stringify(paths)) {
    throw new Error('Staged mode must own every currently staged path');
  }
  if (mode === 'independent' && paths.some((file) => staged.includes(file))) {
    throw new Error('BLOCKED: selected path has pre-existing staging; review/commit index only');
  }
  const trackedChanges = list(git(root, ['diff', '--name-only', '-z', '--', ...paths]));
  const untracked = list(git(root, ['ls-files', '--others', '--exclude-standard', '-z', '--', ...paths]));
  if (mode === 'independent' && paths.some((file) => !trackedChanges.includes(file) && !untracked.includes(file))) {
    throw new Error('Selected independent file has no eligible reviewed change');
  }
  const stagedDiff = git(root, ['diff', '--cached', '--binary', '--no-ext-diff', '--no-textconv']);
  const selectedDiff = git(root, ['diff', '--binary', '--no-ext-diff', '--no-textconv', '--', ...paths]);
  const state = { root, paths, mode, stagedDiff, selectedDiff, index: index(root), worktree: worktree(root, paths) };
  return { ...state, snapshot: hash(JSON.stringify(state)) };
}

function sensitive(root, group) {
  for (const file of group.paths) {
    if (/(^|[\\/])(?:\.env(?:\..*)?|\.alpackages|node_modules|output|generated)(?:[\\/]|$)|\.(?:pem|pfx|key|app)$/i.test(file)) {
      throw new Error(`BLOCKED: sensitive/cache/generated path requires manual eligibility review: ${file}`);
    }
    let text = '';
    if (group.mode === 'staged') {
      const entry = group.index.find((row) => row.split('\t')[1] === file);
      if (entry) text = git(root, ['show', `:${file}`]);
    } else if (fs.existsSync(inside(root, file))) text = fs.readFileSync(inside(root, file), 'utf8');
    if (/-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----|(?:password|client_secret|api[_-]?key|access[_-]?token)\s*[:=]\s*["'][^"'\s]{8,}["']|gh[pousr]_[A-Za-z0-9]{20,}/i.test(text)) {
      throw new Error(`BLOCKED: possible sensitive content: ${file}`);
    }
  }
}

export function commitGroup(projectRoot, selected, options) {
  const group = inspectGroup(projectRoot, selected, options.mode);
  if (group.snapshot !== options.expectedSnapshot) throw new Error('Diff/index changed since review');
  if (typeof options.title !== 'string' || !options.title.trim() || /[\r\n\0]/.test(options.title)) {
    throw new Error('Use one meaningful commit title');
  }
  sensitive(group.root, group);
  if (group.paths.some((file) => file.endsWith('.al') || path.basename(file).toLowerCase() === 'app.json') &&
      (!options.buildEvidence?.green || options.buildEvidence.snapshot !== group.snapshot ||
       !options.buildEvidence.command)) throw new Error('BLOCKED: matching existing green AL build evidence required');
  git(group.root, ['var', 'GIT_AUTHOR_IDENT']);
  git(group.root, ['var', 'GIT_COMMITTER_IDENT']);
  const message = options.title.trim() + (options.trailer === false ? '' : `\n\n${trailer}`);
  if (group.mode === 'independent') {
    // Intent-to-add makes reviewed untracked files eligible for --only without staging bytes.
    const newFiles = list(git(group.root, ['ls-files', '--others', '--exclude-standard', '-z', '--', ...group.paths]));
    if (newFiles.length) git(group.root, ['add', '--intent-to-add', '--', ...newFiles]);
    try {
      git(group.root, ['commit', '--only', '-m', message, '--', ...group.paths]);
    } catch (error) {
      // These paths had no index entries before; remove only our intent-to-add entries.
      if (newFiles.length) git(group.root, ['reset', '--', ...newFiles]);
      throw error;
    }
  } else {
    git(group.root, ['commit', '-m', message]);
  }
  const current = index(group.root);
  const unrelated = (rows) => rows.filter((row) => !group.paths.includes(row.split('\t')[1]));
  if (JSON.stringify(unrelated(current)) !== JSON.stringify(unrelated(group.index)) ||
      JSON.stringify(worktree(group.root, group.paths)) !== JSON.stringify(group.worktree)) {
    throw new Error('Commit created, but index/worktree preservation failed; inspect hooks before continuing');
  }
  return { commit: git(group.root, ['rev-parse', 'HEAD']).trim(), title: options.title.trim(),
    files: group.paths, leftovers: git(group.root, ['status', '--short']) };
}
