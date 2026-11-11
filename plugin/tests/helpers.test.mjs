import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { inspectGroup, commitGroup } from '../scripts/commit-group.mjs';

const testsRoot = fileURLToPath(new URL('./', import.meta.url));
function fixture(callback) {
  const root = path.join(testsRoot, `fixture-${process.pid}-${randomUUID()}`);
  fs.mkdirSync(root);
  const put = (relative, content = '') => {
    fs.mkdirSync(path.dirname(path.join(root, relative)), { recursive: true });
    fs.writeFileSync(path.join(root, relative), content);
  };
  try { callback(root, put); } finally { fs.rmSync(root, { recursive: true, force: true }); }
}


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
