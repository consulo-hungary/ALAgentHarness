import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { numberedSpecs, createNumberedSpec } from '../scripts/numbered-specs.mjs';
import { planStart, applyStart } from '../scripts/start-layout.mjs';
import { inspectGroup, commitGroup } from '../scripts/commit-group.mjs';
import { resolveOpusModel } from '../scripts/opus-model.mjs';

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

test('Opus family resolves newest available SDK or picker ID without changing its spelling', () => {
  const sdk = ['claude-sonnet-5.5', 'claude-haiku-5.5', 'claude-opus-4.8', 'claude-opus-5.5'];
  assert.equal(resolveOpusModel(sdk), 'claude-opus-5.5');
  assert.equal(resolveOpusModel(['Claude Opus 4.6 (copilot)', 'Claude Opus 5.5 (copilot)']),
    'Claude Opus 5.5 (copilot)');
  assert.equal(resolveOpusModel(['claude-opus-5.9', 'claude-opus-5.10', 'claude-opus-6']),
    'claude-opus-6');
  assert.equal(resolveOpusModel(['claude-opus-5.9', 'claude-opus-5.10']), 'claude-opus-5.10');
  assert.equal(resolveOpusModel(['claude-opus-5.5', 'claude-opus-5.6']), 'claude-opus-5.6');
  assert.deepEqual(sdk, ['claude-sonnet-5.5', 'claude-haiku-5.5', 'claude-opus-4.8', 'claude-opus-5.5']);
});

test('Opus ties are inventory-order independent and only exact family IDs qualify', () => {
  const ids = ['claude-opus-5.5-long', 'claude-opus-5.5-b', 'claude-opus-5.5-a'];
  assert.equal(resolveOpusModel(ids), 'claude-opus-5.5-a');
  assert.equal(resolveOpusModel([...ids].reverse()), 'claude-opus-5.5-a');
  assert.equal(resolveOpusModel([...ids, 'claude-opus-5.5']), 'claude-opus-5.5');
  for (const inventory of [[], ['opus'], ['claude-sonnet-5.5', 'claude-haiku-5.5'],
    ['not-claude-opus-5.5', 'claude-opus-5.5fake']]) {
    assert.throws(() => resolveOpusModel(inventory), /BLOCKED: Opus unavailable/);
  }
  for (const inventory of [null, {}, 'opus', [''], [42]]) {
    assert.throws(() => resolveOpusModel(inventory), /Model inventory must/);
  }
  assert.throws(() => resolveOpusModel(['claude-opus-9007199254740992']), /Invalid Opus version/);
});

test('Opus CLI returns exact ID and fails explicitly when unavailable', () => {
  const script = fileURLToPath(new URL('../scripts/opus-model.mjs', import.meta.url));
  const success = spawnSync(process.execPath, [script, JSON.stringify(['claude-opus-5.5'])], { encoding: 'utf8' });
  assert.equal(success.status, 0, success.stderr);
  assert.equal(JSON.parse(success.stdout), 'claude-opus-5.5');
  const failure = spawnSync(process.execPath, [script, '["claude-haiku-5.5"]'], { encoding: 'utf8' });
  assert.notEqual(failure.status, 0);
  assert.match(failure.stderr, /BLOCKED: Opus unavailable/);
  assert.equal(failure.stdout, '');
});

test('numbered specs sort 1,2,10 numerically, preserve mixed names and choose max+1 across gaps', () => fixture((root, put) => {
  for (const name of ['README.md', 'TEMPLATE.md', 'legacy.md', '1-one.md', '2-two.md', '10-ten.md', '0-ignored.md']) {
    put(path.join(specRoot, name), name);
  }
  const before = fs.readdirSync(path.join(root, specRoot));
  assert.deepEqual(numberedSpecs(root, specRoot).rows.map((row) => row.number), [1, 2, 10]);
  const created = createNumberedSpec(root, specRoot, 'carrier-validation', 'draft bytes');
  assert.equal(created.name, '11-carrier-validation.md');
  assert.equal(fs.readFileSync(created.file, 'utf8'), 'draft bytes');
  for (const name of before) assert.equal(fs.readFileSync(path.join(root, specRoot, name), 'utf8'), name);
}));
test('numbered specs start at 1, exclusive locking blocks races/collisions and leaves no owned lock', () => fixture((root, put) => {
  assert.equal(createNumberedSpec(root, specRoot, 'project-create', 'first').number, 1);
  put(path.join(specRoot, '.numbered-spec.lock'), 'other writer');
  assert.throws(() => createNumberedSpec(root, specRoot, 'next', 'second'), /EEXIST/);
  assert.equal(fs.readFileSync(path.join(root, specRoot, '.numbered-spec.lock'), 'utf8'), 'other writer');
  assert.equal(fs.readdirSync(path.join(root, specRoot)).filter((name) => name.endsWith('.md')).length, 1);
}));
test('duplicate numeric prefixes including leading zeros explicitly block; no overwrite', () => fixture((root, put) => {
  put(path.join(specRoot, '1-one.md'), 'one');
  put(path.join(specRoot, '01-other.md'), 'other');
  assert.throws(() => createNumberedSpec(root, specRoot, 'next', 'bad'), /Duplicate spec prefix: 1/);
  assert.ok(!fs.existsSync(path.join(root, specRoot, '.numbered-spec.lock')));
  assert.equal(fs.readdirSync(path.join(root, specRoot)).length, 2);
}));
test('numbering rejects escape, unsafe slug and unsafe integer without escaping root', () => fixture((root, put) => {
  assert.throws(() => createNumberedSpec(root, '..', 'safe', 'bad'), /safe workspace-relative/);
  assert.throws(() => createNumberedSpec(root, specRoot, '../escape', 'bad'), /safe lowercase/);
  assert.throws(() => createNumberedSpec(root, 'D:outside', 'safe', 'bad'), /safe workspace-relative/);
  put(path.join(specRoot, '9007199254740992-overflow.md'));
  assert.throws(() => numberedSpecs(root, specRoot), /safe integer/);
}));
test('write helpers reject symlink/junction ancestors even within workspace', () => fixture((root, put) => {
  put(path.join('real', 'keep.txt'), 'keep');
  fs.symlinkSync(path.join(root, 'real'), path.join(root, 'linked'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => createNumberedSpec(root, path.join('linked', 'specs'), 'safe', 'bad'), /Symlink/);
  assert.throws(() => planStart(root, { moves: [{ from: path.join('linked', 'keep.txt'), to: path.join('app', 'keep.txt') }] }), /Symlink/);
}));

test('AL-start plans read-only, moves AL/manifest/legacy docs byte-for-byte, stays idempotent', () => fixture((root, put) => {
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
  assert.equal(result.hashesVerified, 3);
  assert.deepEqual(fs.readFileSync(path.join(root, 'app', 'Existing.al')), al);
  assert.equal(sha(fs.readFileSync(path.join(root, 'app', 'app.json'))), sha(manifest));
  assert.equal(fs.readFileSync(path.join(root, 'docs', 'specs', '10-old.md'), 'utf8'), 'old spec');
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
  for (const directory of ['generated', 'specs', 'knowledge']) {
    assert.ok(fs.statSync(path.join(root, 'docs', directory)).isDirectory());
  }
  assert.ok(!fs.existsSync(path.join(root, 'test', 'app.json')));
  const second = planStart(root);
  assert.deepEqual(second.moves, []);
  assert.deepEqual(second.directories, []);
  assert.deepEqual(second.removeEmptyDirectories, []);
  assert.equal(applyStart(second).hashesVerified, 0);
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
