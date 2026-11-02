import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { workspaceRoot, inside } from './workspace-paths.mjs';

const directories = ['app', 'test', '.github', path.join('.github', 'workflows'),
  path.join('app', '.vscode'), path.join('app', '.alpackages'), path.join('app', 'Translations'),
  path.join('test', 'Tests'), 'docs', path.join('docs', 'specs'), 'specs',
  path.join('docs', 'generated'), path.join('docs', 'knowledge'), 'rules'];
const setupDirectories = ['Codeunits', 'Pages', 'Tables']
  .map((name) => path.join('app', 'Features', 'Setup', name));
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

function validateParents(root, relative) {
  let parent = path.dirname(inside(root, relative));
  while (parent !== root) {
    if (fs.existsSync(parent) && !fs.statSync(parent).isDirectory()) {
      throw new Error(`Directory conflict: ${path.relative(root, parent)}`);
    }
    parent = path.dirname(parent);
  }
}

function validate(root, moves, requiredDirectories) {
  guard(root);
  const occupied = new Set();
  for (const directory of requiredDirectories) {
    const target = inside(root, directory);
    validateParents(root, directory);
    if (fs.existsSync(target) && !fs.statSync(target).isDirectory()) throw new Error(`Directory conflict: ${directory}`);
  }
  for (const move of moves) {
    const from = inside(root, move.from);
    const to = inside(root, move.to);
    validateParents(root, move.to);
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

function setupFiles(root, moves, specRoot) {
  const readMovedJson = (relative) => {
    const move = moves.find((entry) => entry.to === relative);
    const file = inside(root, move ? move.from : relative);
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')) : {};
  };
  const manifest = readMovedJson(path.join('app', 'app.json'));
  const cop = readMovedJson(path.join('app', 'AppSourceCop.json'));
  const affixes = Array.isArray(cop.mandatoryAffixes) ? cop.mandatoryAffixes : [];
  const agents = `# Project map

- Application: app/; tests: test/; approved numbered specs: ${specRoot.split(path.sep).join('/')}/.
- User references: docs/knowledge/; requested agent output: docs/generated/; company rules: rules/.
- Affix: ${affixes.length ? JSON.stringify(affixes) : 'not configured; confirm before creating objects'} (app/AppSourceCop.json).
- BC application: ${JSON.stringify(manifest.application ?? 'not configured')}; runtime: ${JSON.stringify(manifest.runtime ?? 'not configured')} (app/app.json).

## Safety

- Extend the base app; never modify it. Business logic belongs in codeunits, not page triggers.
- Error, Message and Confirm use Label variables, never literal user-facing text.
- Reserve object, field and enum-value IDs through al-object-id-assignment (Ninja); never invent IDs.
- Identify objects as Type ID "Name".
- Never report AL implementation done without a green build and internal definition-of-done evidence.
- Never publish without explicit nonproduction Sandbox authorization; no destructive sync or global autoApprove changes.
- Exactly four public chat commands: AL-start, AL-refactor, AL-brainstorm, AL-commit. ! syntax is shell execution.
`;
  const files = [
    { file: 'AGENTS.md', content: agents },
    { file: path.join('.github', 'copilot-instructions.md'),
      content: '# Project instructions\n\nFollow the root AGENTS.md for the project map, AL rules and safety boundaries.\n' },
    { file: path.join('app', '.vscode', 'settings.json'), content: '{}\n' },
  ];
  if (!fs.readdirSync(root).some((name) => name.endsWith('.code-workspace'))) {
    files.push({ file: `${path.basename(root)}.code-workspace`,
      content: `${JSON.stringify({ folders: [{ path: 'app' }, { path: 'test' }] }, null, 2)}\n` });
  }
  return files.filter(({ file }) => !fs.existsSync(inside(root, file)) &&
    !moves.some((move) => file === move.to || file.startsWith(`${move.to}${path.sep}`)));
}

function validateFiles(root, files, moves) {
  const allowed = ['AGENTS.md', path.join('.github', 'copilot-instructions.md'),
    path.join('app', '.vscode', 'settings.json'), `${path.basename(root)}.code-workspace`];
  const seen = new Set();
  for (const { file, content } of files) {
    if (!allowed.includes(file) || typeof content !== 'string' || seen.has(file)) {
      throw new Error('Unexpected setup file');
    }
    seen.add(file);
    validateParents(root, file);
    if (fs.existsSync(inside(root, file)) || moves.some((move) =>
      file === move.to || file.startsWith(`${move.to}${path.sep}`))) {
      throw new Error(`Setup file overwrite conflict: ${file}`);
    }
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
  const legacySpecs = fs.existsSync(path.join(root, 'specs'));
  const modernSpecs = fs.existsSync(path.join(root, 'docs', 'specs'));
  if (legacySpecs && modernSpecs && !options.specRoot) {
    throw new Error('BLOCKED: both spec roots exist');
  }
  const specRoot = options.specRoot ?? (legacySpecs ? 'specs' : path.join('docs', 'specs'));
  if (!['specs', path.join('docs', 'specs')].includes(specRoot)) throw new Error('Unexpected spec root');
  const moves = options.moves ? options.moves.map(({ from, to }) => ({ from, to })) : [];
  if (!options.moves) {
    if (rootApp) {
      moves.push({ from: 'app.json', to: path.join('app', 'app.json') });
      for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
        if (entry.isFile() && entry.name.endsWith('.al')) moves.push({ from: entry.name, to: path.join('app', entry.name) });
      }
    }
  }
  const requiredDirectories = directories.filter((directory) =>
    !['specs', path.join('docs', 'specs')].includes(directory) || directory === specRoot);
  const organized = ['Features', 'src'].some((name) => fs.existsSync(path.join(root, 'app', name))) ||
    moves.some((move) => move.to.startsWith(`${path.join('app', 'Features')}${path.sep}`) ||
      move.to.startsWith(`${path.join('app', 'src')}${path.sep}`));
  if (!organized) requiredDirectories.push(path.join('app', 'Features'),
    path.join('app', 'Features', 'Setup'), ...setupDirectories);
  validate(root, moves, requiredDirectories);
  const files = setupFiles(root, moves, specRoot);
  validateFiles(root, files, moves);
  const removeEmptyDirectories = emptySourceDirectories.filter((relative) => {
    const directory = inside(root, relative);
    return fs.existsSync(directory) && fs.lstatSync(directory).isDirectory() &&
      fs.readdirSync(directory).length === 0;
  });
  return { root, specRoot, files,
    directories: requiredDirectories.filter((relative) => !fs.existsSync(inside(root, relative))),
    removeEmptyDirectories, moves: moves.map((move) => ({ ...move, files: inventory(root, move.from) })) };
}

export function applyStart(plan) {
  const root = workspaceRoot(plan.root);
  if (root !== plan.root) throw new Error('Workspace root changed since plan');
  const allowedDirectories = [...directories, path.join('app', 'Features'),
    path.join('app', 'Features', 'Setup'), ...setupDirectories];
  if (!Array.isArray(plan.directories) || plan.directories.some((item) => !allowedDirectories.includes(item))) {
    throw new Error('Unexpected setup directory');
  }
  if (!Array.isArray(plan.moves) || plan.moves.some((move) => !Array.isArray(move.files))) {
    throw new Error('Expected hashed move plan');
  }
  if (!Array.isArray(plan.removeEmptyDirectories)) throw new Error('Expected empty-directory cleanup plan');
  validateEmptySourceDirectories(root, plan.removeEmptyDirectories);
  validate(root, plan.moves, plan.directories);
  if (!Array.isArray(plan.files)) throw new Error('Expected setup file plan');
  validateFiles(root, plan.files, plan.moves);
  const journal = [];
  const removedDirectories = [];
  const createdFiles = [];
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
    for (const { file, content } of plan.files) {
      fs.writeFileSync(inside(root, file), content, { encoding: 'utf8', flag: 'wx' });
      createdFiles.push(file);
    }
    for (const directory of plan.removeEmptyDirectories) {
      const target = inside(root, directory);
      if (!fs.lstatSync(target).isDirectory() || fs.readdirSync(target).length !== 0) {
        throw new Error(`Directory is no longer empty: ${directory}`);
      }
      fs.rmdirSync(target);
      removedDirectories.push(directory);
    }
    return { journal, createdFiles, removedDirectories,
      hashesVerified: plan.moves.flatMap((move) => move.files).length };
  } catch (error) {
    error.journal = journal;
    error.removedDirectories = removedDirectories;
    error.createdFiles = createdFiles;
    throw error;
  }
}
