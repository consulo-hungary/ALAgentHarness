import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { planDocsStart, planStart, applyStart } from '../scripts/start-layout.mjs';
import { inspectGroup, commitGroup } from '../scripts/commit-group.mjs';

const testsRoot = fileURLToPath(new URL('./', import.meta.url));
const specRoot = path.join('docs', 'specs');
function fixture(callback) {
  const root = path.join(testsRoot, `fixture-${process.pid}-${randomUUID()}`);
  fs.mkdirSync(root);
  const put = (relative, content = '') => {
    fs.mkdirSync(path.dirname(path.join(root, relative)), { recursive: true });
    fs.writeFileSync(path.join(root, relative), content);
  };
  try { callback(root, put); } finally { fs.rmSync(root, { recursive: true, force: true }); }
}
const sha = (data) => createHash('sha256').update(data).digest('hex');

test('docs-only start creates routing and all three doc folders without app scaffolding', () => fixture((root) => {
  const plan = planDocsStart(root);
  assert.deepEqual(fs.readdirSync(root), []);
  const result = applyStart(plan);
  assert.deepEqual(fs.readdirSync(root).sort(), ['.github', 'AGENTS.md', 'docs']);
  assert.deepEqual(fs.readdirSync(path.join(root, 'docs')).sort(), ['generated', 'knowledge', 'specs']);
  assert.equal(result.createdFiles.length, 2);
  const instructions = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
  assert.match(instructions, /without requiring a slash command/);
  assert.match(instructions, /bc-workflow skill/);
  assert.match(instructions, /go ONLY in docs\/generated\//);
  assert.match(instructions, /status: draft \| approved \| implemented and date:/);
  assert.deepEqual(planDocsStart(root).files, []);
  assert.deepEqual(planDocsStart(root).directories, []);
}));

test('docs-only start preserves sources, configuration, knowledge and existing instructions', () => fixture((root, put) => {
  const existing = { 'app.json': 'not parsed in docs-only mode', 'Existing.al': 'AL bytes',
    'AGENTS.md': 'Existing policy', 'custom.code-workspace': '{}',
    [path.join('.github', 'copilot-instructions.md')]: 'Existing routing',
    [path.join('docs', 'knowledge', 'input.docx')]: 'user input' };
  for (const [file, content] of Object.entries(existing)) put(file, content);
  const plan = planDocsStart(root);
  assert.equal(plan.existingInstructions.length, 2);
  assert.deepEqual(plan.moves, []);
  applyStart(plan);
  for (const [file, content] of Object.entries(existing)) {
    assert.equal(fs.readFileSync(path.join(root, file), 'utf8'), content);
  }
  assert.ok(!fs.existsSync(path.join(root, 'app')));
  assert.ok(!fs.existsSync(path.join(root, 'test')));
}));

test('docs-only start honors legacy specs and rejects conflicts or widened plans', () => fixture((root, put) => {
  put(path.join('specs', '1-existing.md'), 'keep');
  const plan = planDocsStart(root);
  assert.equal(plan.specRoot, 'specs');
  assert.throws(() => applyStart({ ...plan, directories: [...plan.directories, 'app'] }), /docs-only/);
  put(path.join('docs', 'generated'), 'conflict');
  assert.throws(() => applyStart(plan), /Directory conflict/);
  assert.ok(!fs.existsSync(path.join(root, 'AGENTS.md')));
  assert.equal(fs.readFileSync(path.join(root, 'specs', '1-existing.md'), 'utf8'), 'keep');
}));

test('write helpers reject symlink/junction ancestors even within workspace', () => fixture((root, put) => {
  put(path.join('real', 'keep.txt'), 'keep');
  fs.symlinkSync(path.join(root, 'real'), path.join(root, 'linked'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => planStart(root, { moves: [{ from: path.join('linked', 'keep.txt'), to: path.join('app', 'keep.txt') }] }), /Symlink/);
}));

test('AL-start plans read-only, moves AL/manifest and preserves legacy specs byte-for-byte, stays idempotent', () => fixture((root, put) => {
  const al = Buffer.from('\uFEFFcodeunit 50000 Existing\r\n{\r\n}\r\n');
  const manifest = '{ "id": "existing-guid", "version": "1.2.3.4" }\r\n';
  put('app.json', manifest);
  put('Existing.al', al);
  put(path.join('specs', '10-old.md'), 'old spec');
  fs.mkdirSync(path.join(root, 'PageExtensions'));
  fs.mkdirSync(path.join(root, 'TableExtension'));
  put(path.join('.tools', 'keep.txt'), 'hidden');
  put('unrelated.txt', 'keep');
  const before = fs.readdirSync(root).sort();
  const plan = planStart(root);
  assert.deepEqual(fs.readdirSync(root).sort(), before);
  const result = applyStart(plan);
  assert.equal(result.hashesVerified, 2);
  assert.deepEqual(fs.readFileSync(path.join(root, 'app', 'Existing.al')), al);
  assert.equal(sha(fs.readFileSync(path.join(root, 'app', 'app.json'))), sha(manifest));
  assert.equal(fs.readFileSync(path.join(root, 'specs', '10-old.md'), 'utf8'), 'old spec');
  assert.ok(!fs.existsSync(path.join(root, 'docs', 'specs')));
  assert.equal(fs.readFileSync(path.join(root, '.tools', 'keep.txt'), 'utf8'), 'hidden');
  assert.equal(fs.readFileSync(path.join(root, 'unrelated.txt'), 'utf8'), 'keep');
  assert.deepEqual(result.removedDirectories.sort(), ['PageExtensions', 'TableExtension']);
  assert.ok(!fs.existsSync(path.join(root, 'PageExtensions')));
  assert.ok(!fs.existsSync(path.join(root, 'TableExtension')));
  for (const project of ['app', 'test']) {
    for (const category of ['PageExtensions', 'TableExtension']) {
      assert.ok(!fs.existsSync(path.join(root, project, category)), 'Empty category folders are not replicated');
    }
  }
  assert.ok(fs.existsSync(path.join(root, 'test')));
  for (const directory of ['generated', 'knowledge']) {
    assert.ok(fs.statSync(path.join(root, 'docs', directory)).isDirectory());
  }
  assert.ok(!fs.existsSync(path.join(root, 'test', 'app.json')));
  const second = planStart(root);
  assert.deepEqual(second.moves, []);
  assert.deepEqual(second.directories, []);
  assert.deepEqual(second.removeEmptyDirectories, []);
  assert.deepEqual(second.files, []);
  assert.equal(applyStart(second).hashesVerified, 0);
}));
test('AL-start creates exactly the new PTE skeleton and safe setup files, without invented configuration', () => fixture((root) => {
  const plan = planStart(root);
  assert.deepEqual(fs.readdirSync(root), []);
  const result = applyStart(plan);
  const workspace = `${path.basename(root)}.code-workspace`;
  assert.deepEqual(fs.readdirSync(root).sort(),
    ['.github', 'AGENTS.md', 'app', 'docs', 'rules', 'test', workspace].sort());
  assert.deepEqual(fs.readdirSync(path.join(root, 'app')).sort(),
    ['.alpackages', '.vscode', 'Features', 'Translations']);
  assert.deepEqual(fs.readdirSync(path.join(root, 'app', 'Features')), ['Setup']);
  assert.deepEqual(fs.readdirSync(path.join(root, 'app', 'Features', 'Setup')),
    ['Codeunits', 'Pages', 'Tables']);
  assert.deepEqual(fs.readdirSync(path.join(root, '.github')).sort(), ['copilot-instructions.md', 'workflows']);
  assert.deepEqual(fs.readdirSync(path.join(root, 'test')), ['Tests']);
  assert.deepEqual(fs.readdirSync(path.join(root, 'docs')).sort(), ['generated', 'knowledge', 'specs']);
  assert.deepEqual(fs.readdirSync(path.join(root, 'rules')), []);
  for (const relative of [path.join('.github', 'workflows'), path.join('docs', 'specs'),
    path.join('docs', 'knowledge'), path.join('docs', 'generated'), path.join('test', 'Tests')]) {
    assert.deepEqual(fs.readdirSync(path.join(root, relative)), []);
  }
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, workspace), 'utf8')),
    { folders: [{ path: 'app' }, { path: 'test' }] });
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, 'app', '.vscode', 'settings.json'), 'utf8')), {});
  assert.match(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), /not configured/);
  for (const relative of [path.join('app', 'app.json'), path.join('test', 'app.json'),
    path.join('app', 'AppSourceCop.json'), path.join('app', '.vscode', 'launch.json'), 'DEFINITION-OF-DONE.md']) {
    assert.ok(!fs.existsSync(path.join(root, relative)));
  }
  assert.equal(result.createdFiles.length, 4);
  assert.deepEqual(planStart(root).files, []);
  assert.deepEqual(planStart(root).directories, []);
}));
test('AL-start preserves existing policies, workspace, settings and source organization', () => fixture((root, put) => {
  const existing = {
    'AGENTS.md': Buffer.from('\uFEFFExisting policy\r\n'),
    'custom.code-workspace': '{"folders":[{"path":"app"}]}',
    [path.join('.github', 'copilot-instructions.md')]: 'Existing instructions',
    [path.join('app', '.vscode', 'settings.json')]: '{"existing":true}',
    [path.join('app', 'src', 'Existing.al')]: 'Existing AL bytes',
    [path.join('app', 'app.json')]: '{"application":"27.0.0.0","runtime":"16.0"}',
  };
  for (const [file, content] of Object.entries(existing)) put(file, content);
  const plan = planStart(root);
  assert.deepEqual(plan.files, []);
  applyStart(plan);
  for (const [file, content] of Object.entries(existing)) {
    assert.deepEqual(fs.readFileSync(path.join(root, file)), Buffer.from(content));
  }
  assert.ok(!fs.existsSync(path.join(root, 'app', 'Features')));
  assert.ok(!fs.existsSync(path.join(root, `${path.basename(root)}.code-workspace`)));
}));
test('AL-start maps actual version and affix into missing project instructions', () => fixture((root, put) => {
  put('app.json', '\uFEFF{"application":"28.0.0.0","runtime":"17.0","id":"not-to-copy"}');
  put('AppSourceCop.json', '\uFEFF{"mandatoryAffixes":["CPA"]}');
  const plan = planStart(root, { moves: [
    { from: 'app.json', to: path.join('app', 'app.json') },
    { from: 'AppSourceCop.json', to: path.join('app', 'AppSourceCop.json') },
  ] });
  applyStart(plan);
  const agents = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
  assert.match(agents, /CPA/);
  assert.match(agents, /28\.0\.0\.0/);
  assert.match(agents, /17\.0/);
  assert.doesNotMatch(agents, /not-to-copy/);
}));
test('AL-start honors main-selected spec root without merging existing roots', () => fixture((root, put) => {
  put(path.join('specs', 'legacy.md'), 'legacy');
  put(path.join(specRoot, 'new.md'), 'new');
  const plan = planStart(root, { specRoot: 'specs' });
  applyStart(plan);
  assert.equal(fs.readFileSync(path.join(root, 'specs', 'legacy.md'), 'utf8'), 'legacy');
  assert.equal(fs.readFileSync(path.join(root, specRoot, 'new.md'), 'utf8'), 'new');
  assert.match(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), /specs\/\./);
  assert.deepEqual(planStart(root, { specRoot: 'specs' }).files, []);
}));
test('AL-start detects new setup file conflicts and malformed evidence before writes', () => fixture((root, put) => {
  const plan = planStart(root);
  put('AGENTS.md', 'arrived after planning');
  assert.throws(() => applyStart(plan), /Setup file overwrite conflict/);
  assert.equal(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), 'arrived after planning');
  assert.ok(!fs.existsSync(path.join(root, 'app')));
  put('app.json', 'invalid JSON');
  assert.throws(() => planStart(root), SyntaxError);
  assert.ok(!fs.existsSync(path.join(root, 'app')));
}));
test('AL-start detects changed configuration ancestors before moving any AL bytes', () => fixture((root, put) => {
  put('app.json', '{}');
  fs.mkdirSync(path.join(root, '.github'));
  const plan = planStart(root);
  fs.rmdirSync(path.join(root, '.github'));
  put('.github', 'conflicting file');
  assert.throws(() => applyStart(plan), /Directory conflict/);
  assert.ok(fs.existsSync(path.join(root, 'app.json')));
  assert.ok(!fs.existsSync(path.join(root, 'app')));
}));
test('AL-start never removes non-empty object folders and moves their source under the owning app', () => fixture((root, put) => {
  const source = Buffer.from('pageextension 50100 "Example" extends "Customer List" {}');
  put(path.join('app', 'app.json'), '{ "id": "existing-app" }');
  put(path.join('PageExtensions', 'Example.PageExt.al'), source);
  const plan = planStart(root);
  assert.deepEqual(plan.removeEmptyDirectories, []);
  const result = applyStart(planStart(root, {
    moves: [{
      from: path.join('PageExtensions', 'Example.PageExt.al'),
      to: path.join('app', 'Features', 'Pages', 'Example.PageExt.al'),
    }],
  }));
  assert.deepEqual(result.removedDirectories, []);
  assert.deepEqual(fs.readFileSync(path.join(root, 'app', 'Features', 'Pages', 'Example.PageExt.al')), source);
  assert.ok(!fs.existsSync(path.join(root, 'PageExtensions', 'Example.PageExt.al')));
  assert.equal(fs.readFileSync(path.join(root, 'app', 'app.json'), 'utf8'), '{ "id": "existing-app" }');
}));
test('AL-start rechecks empty source folders before cleanup and preserves new content', () => fixture((root, put) => {
  fs.mkdirSync(path.join(root, 'PageExtensions'));
  const plan = planStart(root);
  put(path.join('PageExtensions', 'arrived-after-plan.txt'), 'preserve');
  assert.throws(() => applyStart(plan), /changed since plan/);
  assert.equal(fs.readFileSync(path.join(root, 'PageExtensions', 'arrived-after-plan.txt'), 'utf8'), 'preserve');
}));
test('AL-start supports exact nested resources without glob-moving unrelated files', () => fixture((root, put) => {
  put(path.join('src', 'Existing.al'), 'AL bytes');
  put(path.join('src', 'unrelated.txt'), 'keep');
  put(path.join('resources', 'logo.bin'), Buffer.from([0, 255, 128]));
  const moves = [{ from: path.join('src', 'Existing.al'), to: path.join('app', 'src', 'Existing.al') },
    { from: path.join('resources', 'logo.bin'), to: path.join('app', 'resources', 'logo.bin') }];
  assert.equal(applyStart(planStart(root, { moves })).hashesVerified, 2);
  assert.equal(fs.readFileSync(path.join(root, 'src', 'unrelated.txt'), 'utf8'), 'keep');
  assert.deepEqual(fs.readFileSync(path.join(root, 'app', 'resources', 'logo.bin')), Buffer.from([0, 255, 128]));
}));
test('AL-start blocks plugin repository, ambiguous manifests, both roots, overwrite and overlapping maps', () => fixture((root, put) => {
  put(path.join('plugin', 'plugin.json'), '{"name":"al-agent-harness"}');
  assert.throws(() => planStart(root), /never migrate/);
  fs.rmSync(path.join(root, 'plugin'), { recursive: true });
  put('app.json', '{}');
  put(path.join('other', 'app.json'), '{}');
  assert.throws(() => planStart(root), /ambiguous/);
  fs.rmSync(path.join(root, 'other'), { recursive: true });
  put(path.join('app', 'app.json'), 'keep');
  assert.throws(() => planStart(root, { moves: [{ from: 'app.json', to: path.join('app', 'app.json') }] }), /overwrite/);
  fs.rmSync(path.join(root, 'app'), { recursive: true });
  put(path.join('specs', 'old.md'));
  put(path.join(specRoot, 'new.md'));
  assert.throws(() => planStart(root), /both spec roots/);
  fs.rmSync(path.join(root, 'docs'), { recursive: true });
  assert.throws(() => planStart(root, { moves: [{ from: 'specs', to: specRoot },
    { from: path.join('specs', 'old.md'), to: path.join('docs', 'old.md') }] }), /Overlapping/);
}));
test('AL-start changed source hash/escape/tampered plan is rejected before writes', () => fixture((root, put) => {
  put('app.json', '{}');
  const plan = planStart(root);
  put('app.json', '{"changed":true}');
  assert.throws(() => applyStart(plan), /Source changed/);
  assert.ok(!fs.existsSync(path.join(root, 'app')));
  assert.throws(() => planStart(root, { moves: [{ from: 'app.json', to: '..\\escape' }] }), /safe workspace-relative/);
  assert.throws(() => applyStart({ ...plan, directories: ['outside'] }), /Unexpected/);
}));

test('AL-start preserves user knowledge bytes and does not seed or duplicate documents', () => fixture((root, put) => {
  const relative = path.join('docs', 'knowledge', 'meetings', 'requirements.txt');
  const bytes = Buffer.from('\uFEFFUser-provided requirements\r\nDo not rewrite.\r\n');
  put(relative, bytes);
  const plan = planStart(root);
  assert.ok(!plan.directories.includes(path.join('docs', 'knowledge')));
  assert.deepEqual(plan.moves, []);
  applyStart(plan);
  assert.deepEqual(fs.readFileSync(path.join(root, relative)), bytes);
  assert.deepEqual(fs.readdirSync(path.join(root, 'docs', 'knowledge')), ['meetings']);
  assert.deepEqual(fs.readdirSync(path.join(root, 'docs', 'generated')), []);
  assert.deepEqual(planStart(root).directories, []);
}));

test('AL-start knowledge path conflicts block before moving source', () => fixture((root, put) => {
  put('app.json', '{}');
  put(path.join('docs', 'knowledge'), 'not a directory');
  assert.throws(() => planStart(root), /Directory conflict/);
  assert.ok(fs.existsSync(path.join(root, 'app.json')));
  assert.ok(!fs.existsSync(path.join(root, 'app')));
}));

function git(root, args) {
  const result = spawnSync('git', ['--no-pager', ...args], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}
function gitFixture(callback) {
  fixture((root, put) => {
    git(root, ['init', '--quiet']);
    git(root, ['config', 'user.name', 'Fixture Author']);
    git(root, ['config', 'user.email', 'fixture@example.invalid']);
    git(root, ['config', 'commit.gpgsign', 'false']);
    git(root, ['config', 'core.autocrlf', 'false']);
    for (const name of ['feature.txt', 'unrelated.txt']) put(name, 'baseline\n');
    git(root, ['add', '--', 'feature.txt', 'unrelated.txt']);
    git(root, ['commit', '--quiet', '-m', 'Fixture baseline']);
    callback(root, put);
  });
}
test('independent logical commit preserves unrelated staged changes and coauthor trailer', () => gitFixture((root, put) => {
  put('unrelated.txt', 'unrelated staged\n');
  git(root, ['add', '--', 'unrelated.txt']);
  const staged = git(root, ['diff', '--cached', '--binary']);
  put('feature.txt', 'feature worktree\n');
  const review = inspectGroup(root, ['feature.txt'], 'independent');
  const result = commitGroup(root, ['feature.txt'], { mode: 'independent',
    expectedSnapshot: review.snapshot, title: 'Improve feature' });
  assert.match(result.commit, /^[a-f0-9]{40}$/);
  assert.equal(git(root, ['diff', '--cached', '--binary']), staged);
  assert.equal(git(root, ['show', 'HEAD:unrelated.txt']), 'baseline\n');
  assert.equal(git(root, ['show', 'HEAD:feature.txt']), 'feature worktree\n');
  assert.match(git(root, ['log', '-1', '--format=%B']), /Co-authored-by: Copilot/);
}));
test('index-only commit excludes unreviewed mixed-file unstaged bytes', () => gitFixture((root, put) => {
  put('feature.txt', 'reviewed staged\n');
  git(root, ['add', '--', 'feature.txt']);
  put('feature.txt', 'unreviewed unstaged\n');
  assert.throws(() => inspectGroup(root, ['feature.txt'], 'independent'), /pre-existing staging/);
  const review = inspectGroup(root, ['feature.txt'], 'staged');
  commitGroup(root, ['feature.txt'], { mode: 'staged', expectedSnapshot: review.snapshot,
    title: 'Commit reviewed stage', trailer: false });
  assert.equal(git(root, ['show', 'HEAD:feature.txt']), 'reviewed staged\n');
  assert.equal(fs.readFileSync(path.join(root, 'feature.txt'), 'utf8'), 'unreviewed unstaged\n');
  assert.doesNotMatch(git(root, ['log', '-1', '--format=%B']), /Co-authored-by/);
  assert.match(git(root, ['diff']), /unreviewed unstaged/);
}));
test('staged partial ownership and stale review block without absorbing or unstaging files', () => gitFixture((root, put) => {
  put('feature.txt', 'feature\n'); put('unrelated.txt', 'unrelated\n');
  git(root, ['add', '--', 'feature.txt', 'unrelated.txt']);
  assert.throws(() => inspectGroup(root, ['feature.txt'], 'staged'), /own every/);
  const before = git(root, ['diff', '--cached', '--binary']);
  const review = inspectGroup(root, ['feature.txt', 'unrelated.txt'], 'staged');
  put('feature.txt', 'changed since review\n');
  assert.throws(() => commitGroup(root, review.paths, { mode: 'staged', expectedSnapshot: review.snapshot,
    title: 'Do not commit' }), /changed since review/);
  assert.equal(git(root, ['diff', '--cached', '--binary']), before);
  assert.equal(git(root, ['log', '-1', '--format=%s']).trim(), 'Fixture baseline');
}));
test('explicit untracked commit excludes future files and preserves unrelated staging', () => gitFixture((root, put) => {
  put('unrelated.txt', 'staged unrelated\n');
  git(root, ['add', '--', 'unrelated.txt']);
  put('new.txt', 'reviewed\n'); put('future.txt', 'not selected\n');
  const before = git(root, ['diff', '--cached', '--binary']);
  const review = inspectGroup(root, ['new.txt'], 'independent');
  commitGroup(root, ['new.txt'], { mode: 'independent', expectedSnapshot: review.snapshot, title: 'Add reviewed file' });
  assert.equal(git(root, ['diff', '--cached', '--binary']), before);
  assert.equal(git(root, ['show', 'HEAD:new.txt']), 'reviewed\n');
  assert.match(git(root, ['status', '--short']), /\?\? future\.txt/);
}));
test('possible secrets and missing AL build evidence block local commits', () => gitFixture((root, put) => {
  put('feature.txt', 'api_key = "abcdefghijklmnop"\n');
  const review = inspectGroup(root, ['feature.txt'], 'independent');
  assert.throws(() => commitGroup(root, review.paths, { mode: 'independent',
    expectedSnapshot: review.snapshot, title: 'Do not commit' }), /sensitive content/);
  put('Example.al', 'codeunit 50000 Existing {}');
  const alReview = inspectGroup(root, ['Example.al'], 'independent');
  assert.throws(() => commitGroup(root, alReview.paths, { mode: 'independent',
    expectedSnapshot: alReview.snapshot, title: 'Do not commit' }), /green AL build/);
  assert.equal(git(root, ['log', '-1', '--format=%s']).trim(), 'Fixture baseline');
}));
test('failed commit hook removes only owned intent-to-add and preserves unrelated index', () => gitFixture((root, put) => {
  put('unrelated.txt', 'unrelated staged\n');
  git(root, ['add', '--', 'unrelated.txt']);
  const before = git(root, ['ls-files', '--stage']);
  put('new.txt', 'selected new file\n');
  put(path.join('.git', 'hooks', 'pre-commit'), '#!/bin/sh\nexit 1\n');
  fs.chmodSync(path.join(root, '.git', 'hooks', 'pre-commit'), 0o755);
  const review = inspectGroup(root, ['new.txt'], 'independent');
  assert.throws(() => commitGroup(root, ['new.txt'], { mode: 'independent',
    expectedSnapshot: review.snapshot, title: 'Rejected by fixture hook' }), /git commit failed/);
  assert.equal(git(root, ['ls-files', '--stage']), before);
  assert.match(git(root, ['status', '--short']), /\?\? new\.txt/);
  assert.equal(fs.readFileSync(path.join(root, 'new.txt'), 'utf8'), 'selected new file\n');
}));
