import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { workspaceRoot, inside } from './workspace-paths.mjs';

const directories = ['app', 'test', 'docs', path.join('docs', 'specs'),
  path.join('docs', 'generated'), path.join('docs', 'knowledge')];
const emptySourceDirectories = ['PageExtensions', 'TableExtension'];
const digest = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');

function guard(root) {
  for (const relative of [path.join('plugin', 'plugin.json'), path.join('plugin', '.claude-plugin', 'plugin.json'),
    'plugin.json', path.join('.claude-plugin', 'plugin.json')]) {
    const file = path.join(root, relative);
    if (fs.existsSync(file) && JSON.parse(fs.readFileSync(file, 'utf8')).name === 'al-agent-harness') {
      throw new Error('BLOCKED: never migrate the harness plugin repository');
    }
  }
}

function inventory(root, relative) {
  const file = inside(root, relative);
  const stat = fs.lstatSync(file);
  if (stat.isDirectory()) {
    return fs.readdirSync(file).sort().flatMap((name) => inventory(root, path.join(relative, name)));
  }
  if (!stat.isFile()) throw new Error('Only regular files/directories can move');
  return [{ file: relative, hash: digest(file) }];
}

function validate(root, moves) {
  guard(root);
  const occupied = new Set();
  for (const directory of directories) {
    const target = inside(root, directory);
    if (fs.existsSync(target) && !fs.statSync(target).isDirectory()) throw new Error(`Directory conflict: ${directory}`);
  }
  for (const move of moves) {
    const from = inside(root, move.from);
    const to = inside(root, move.to);
    const destination = path.relative(root, to).split(path.sep);
    if (!['app', 'test', 'docs'].includes(destination[0]) ||
        destination.length < 2 && move.to !== 'docs') throw new Error('Move destination must be app/test/docs content');
    if (from === to || to.startsWith(`${from}${path.sep}`)) throw new Error('Overlapping move');
    if (!fs.existsSync(from) || fs.existsSync(to)) throw new Error(`Move missing source or overwrite conflict: ${move.from}`);
    for (const previous of occupied) {
      if ([from, to].some((value) => value === previous || value.startsWith(`${previous}${path.sep}`) ||
          previous.startsWith(`${value}${path.sep}`))) throw new Error('Overlapping move entries');
    }
    occupied.add(from); occupied.add(to);
    const files = inventory(root, move.from);
    if (move.files && JSON.stringify(move.files) !== JSON.stringify(files)) throw new Error('Source changed since plan');
  }
}

function validateEmptySourceDirectories(root, candidates) {
  for (const relative of candidates) {
    if (!emptySourceDirectories.includes(relative)) throw new Error(`Unexpected empty source directory: ${relative}`);
    const directory = inside(root, relative);
    if (!fs.existsSync(directory) || !fs.lstatSync(directory).isDirectory() ||
        fs.readdirSync(directory).length !== 0) {
      throw new Error(`Empty source directory changed since plan: ${relative}`);
    }
  }
}

export function planStart(projectRoot, options = {}) {
  const root = workspaceRoot(projectRoot);
  guard(root);
  const rootApp = fs.existsSync(path.join(root, 'app.json'));
  const candidates = fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'test' &&
      fs.existsSync(path.join(root, entry.name, 'app.json'))).map((entry) => entry.name);
  if (!options.moves && (rootApp && candidates.length || candidates.length > 1 ||
      candidates.length === 1 && candidates[0] !== 'app')) {
    throw new Error('BLOCKED: ambiguous/custom AL projects require explicit move selection');
  }
  if (fs.existsSync(path.join(root, 'specs')) && fs.existsSync(path.join(root, 'docs', 'specs'))) {
    throw new Error('BLOCKED: both spec roots exist');
  }
  const moves = options.moves ? options.moves.map(({ from, to }) => ({ from, to })) : [];
  if (!options.moves) {
    if (rootApp) {
      moves.push({ from: 'app.json', to: path.join('app', 'app.json') });
      for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
        if (entry.isFile() && entry.name.endsWith('.al')) moves.push({ from: entry.name, to: path.join('app', entry.name) });
      }
    }
    if (fs.existsSync(path.join(root, 'specs'))) moves.push({ from: 'specs', to: path.join('docs', 'specs') });
  }
  validate(root, moves);
  const removeEmptyDirectories = emptySourceDirectories.filter((relative) => {
    const directory = inside(root, relative);
    return fs.existsSync(directory) && fs.lstatSync(directory).isDirectory() &&
      fs.readdirSync(directory).length === 0;
  });
  return { root, directories: directories.filter((relative) => !fs.existsSync(inside(root, relative))),
    removeEmptyDirectories, moves: moves.map((move) => ({ ...move, files: inventory(root, move.from) })) };
}

export function applyStart(plan) {
  const root = workspaceRoot(plan.root);
  if (root !== plan.root) throw new Error('Workspace root changed since plan');
  if (!Array.isArray(plan.directories) || plan.directories.some((item) => !directories.includes(item))) {
    throw new Error('Unexpected setup directory');
  }
  if (!Array.isArray(plan.moves) || plan.moves.some((move) => !Array.isArray(move.files))) {
    throw new Error('Expected hashed move plan');
  }
  if (!Array.isArray(plan.removeEmptyDirectories)) throw new Error('Expected empty-directory cleanup plan');
  validateEmptySourceDirectories(root, plan.removeEmptyDirectories);
  validate(root, plan.moves);
  const journal = [];
  const removedDirectories = [];
  try {
    for (const move of plan.moves) {
      const destination = inside(root, move.to);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      if (fs.existsSync(destination)) throw new Error('Destination appeared since preflight');
      fs.renameSync(inside(root, move.from), destination);
      journal.push({ from: move.from, to: move.to });
      for (const entry of move.files) {
        const suffix = path.relative(move.from, entry.file);
        const relocated = suffix ? path.join(move.to, suffix) : move.to;
        if (digest(inside(root, relocated)) !== entry.hash) throw new Error('Moved byte hash mismatch');
      }
    }
    for (const directory of plan.directories) fs.mkdirSync(inside(root, directory), { recursive: true });
    for (const directory of plan.removeEmptyDirectories) {
      const target = inside(root, directory);
      if (!fs.lstatSync(target).isDirectory() || fs.readdirSync(target).length !== 0) {
        throw new Error(`Directory is no longer empty: ${directory}`);
      }
      fs.rmdirSync(target);
      removedDirectories.push(directory);
    }
    return { journal, removedDirectories, hashesVerified: plan.moves.flatMap((move) => move.files).length };
  } catch (error) {
    error.journal = journal;
    error.removedDirectories = removedDirectories;
    throw error;
  }
}
