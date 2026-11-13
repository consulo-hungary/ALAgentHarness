import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { planInit, applyInit, mergeBlock } from '../scripts/al-init.mjs';
import { missingDocs } from '../templates/hooks/al-docs-check.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

function workspace(callback) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'al-init-'));
  const put = (relative, content = '') => {
    const file = path.join(directory, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  };
  try { callback(fs.realpathSync(directory), put); } finally { fs.rmSync(directory, { recursive: true, force: true }); }
}
const read = (directory, relative) => fs.readFileSync(path.join(directory, relative), 'utf8');
const app = JSON.stringify({ name: 'Fixture App', publisher: 'P', idRanges: [{ from: 50100, to: 50109 }] });

test('al-init plan is read-only and reports specs, apps and missing folders', () => workspace((dir, put) => {
  put('app/app.json', app);
  put('specs/1-a.md', '# a');
  put('Requirements.docx', 'x');
  const plan = planInit(dir);
  assert.equal(plan.appName, 'Fixture App');
  assert.deepEqual(plan.missingDirs, ['docs/specs', 'docs/knowledge', 'docs/generated']);
  assert.deepEqual(plan.specCandidates, ['specs/1-a.md']);
  assert.deepEqual(plan.knowledgeCandidates, ['Requirements.docx']);
  assert.ok(!fs.existsSync(path.join(dir, 'docs')));
}));

test('al-init apply creates folders, overviews, instructions and guardrails; never touches user text', () => workspace((dir, put) => {
  put('app/app.json', app);
  put('AGENTS.md', '# My rules\n\nKeep this.\n');
  put('.github/agent/AGENTS.md', '# Shared rules\n\nKeep these.\n');
  put('.github/copilot-instructions.md', '# Existing instructions\n\nKeep this too.\n');
  const result = applyInit(dir);
  for (const relative of ['docs/specs/TEMPLATE.md', 'docs/knowledge/project-overview.md',
    'docs/knowledge/technical-overview.md', '.github/agent/AGENTS.md', '.github/copilot-instructions.md',
    '.github/hooks/al-guardrails.mjs', '.github/hooks/al-guardrails.json', '.github/hooks/al-docs-check.mjs',
  ]) assert.ok(fs.existsSync(path.join(dir, relative)), relative);
  assert.ok(!fs.existsSync(path.join(dir, 'CLAUDE.md')));
  assert.ok(!fs.existsSync(path.join(dir, '.claude')));
  assert.ok(fs.statSync(path.join(dir, 'docs/generated')).isDirectory());
  assert.equal(read(dir, 'AGENTS.md'), '# My rules\n\nKeep this.\n');
  const agents = read(dir, '.github/agent/AGENTS.md');
  assert.match(agents, /^# Shared rules\n\nKeep these\./);
  assert.match(read(dir, '.github/copilot-instructions.md'), /^# Existing instructions\n\nKeep this too\./);
  assert.match(read(dir, '.github/copilot-instructions.md'), /\.github\/agent\/AGENTS\.md/);
  assert.match(agents, /AL Agent Harness/);
  assert.match(agents, /80% of it with about 0\.1X/);
  assert.match(agents, /base application first|Base application first/i);
  assert.match(agents, /BCQuality/);
  assert.match(agents, /about 5 failing/);
  assert.match(agents, /Never add `PTE` merely because/);
  assert.match(agents, /AppSourceCop\.json/);
  assert.match(agents, /inspect existing extension fields/);
  assert.match(agents, /workspace root `AGENTS\.md`/);
  assert.match(agents, /absent or ambiguous, ask/);
  assert.match(agents, /configured affix takes precedence/);
    assert.match(read(dir, 'docs/knowledge/project-overview.md'), /Fixture App/);
    assert.match(read(dir, 'docs/knowledge/technical-overview.md'), /^---\r?\nstatus: draft\r?\ndate: \d{4}-\d{2}-\d{2}\r?\n---/);
  assert.equal(JSON.parse(read(dir, '.github/hooks/al-guardrails.json')).hooks.preToolUse[0].powershell,
    'node .github/hooks/al-guardrails.mjs');
  assert.ok(result.actions.some((action) => action.kind === 'manual' && action.file === '.git/hooks/pre-commit'));
}));

test('al-init is idempotent, keeps existing files and refreshes only its own block', () => workspace((dir, put) => {
  put('app/app.json', app);
  applyInit(dir);
  fs.writeFileSync(path.join(dir, 'docs/knowledge/project-overview.md'), 'my edits\n');
  const before = read(dir, '.github/agent/AGENTS.md');
  const second = applyInit(dir);
  assert.equal(read(dir, '.github/agent/AGENTS.md'), before);
  assert.equal(read(dir, 'docs/knowledge/project-overview.md'), 'my edits\n');
  assert.ok(second.actions.every((action) => ['kept', 'manual'].includes(action.kind)),
    JSON.stringify(second.actions.filter((action) => !['kept', 'manual'].includes(action.kind))));
  assert.equal(mergeBlock('a\n<!-- al-harness:start x -->\nold\n<!-- al-harness:end -->\nz\n',
    '<!-- al-harness:start x -->\nnew\n<!-- al-harness:end -->'), 'a\n<!-- al-harness:start x -->\nnew\n<!-- al-harness:end -->\nz\n');
}));

test('al-init moves specs only on request, never overwrites, and installs the git hook', () => workspace((dir, put) => {
  put('app/app.json', app);
  put('specs/1-a.md', '# a');
  spawnSync('git', ['init', '--quiet'], { cwd: dir });
  const plain = applyInit(dir);
  assert.ok(fs.existsSync(path.join(dir, 'specs/1-a.md')));
  assert.ok(plain.actions.some((action) => action.kind === 'created' && action.file === '.git/hooks/pre-commit'));
  assert.match(read(dir, '.git/hooks/pre-commit'), /al-docs-check/);
  const moved = applyInit(dir, { moveSpecs: true });
  assert.ok(!fs.existsSync(path.join(dir, 'specs/1-a.md')));
  assert.equal(read(dir, 'docs/specs/1-a.md'), '# a');
  assert.ok(moved.actions.some((action) => action.kind === 'moved'));
}));

test('al-init leaves existing Claude files untouched and preserves git hooks', () => workspace((dir, put) => {
  put('app/app.json', app);
  put('CLAUDE.md', 'Keep my Claude instructions.\n');
  put('.claude/settings.json', '{"permissions":{}}');
  spawnSync('git', ['init', '--quiet'], { cwd: dir });
  put('.git/hooks/pre-commit', '#!/bin/sh\necho mine\n');
  const result = applyInit(dir);
  assert.equal(read(dir, 'CLAUDE.md'), 'Keep my Claude instructions.\n');
  assert.equal(read(dir, '.claude/settings.json'), '{"permissions":{}}');
  assert.equal(read(dir, '.git/hooks/pre-commit'), '#!/bin/sh\necho mine\n');
  assert.equal(result.actions.filter((action) => action.kind === 'manual').length, 1);
}));

test('docs check requires the technical overview for AL, app.json and spec changes', () => {
  assert.equal(missingDocs(['app/src/A.Codeunit.al']), true);
  assert.equal(missingDocs(['app/app.json']), true);
  assert.equal(missingDocs(['docs/specs/3-x.md']), true);
  assert.equal(missingDocs(['app/src/A.Codeunit.al', 'docs/knowledge/technical-overview.md']), false);
  assert.equal(missingDocs(['README.md', 'docs/generated/x.md']), false);
  assert.equal(missingDocs(['app\\src\\A.al']), true);
});

const powershell = ['pwsh', 'powershell'].find((name) => spawnSync(name, ['-NoProfile', '-Command', '$PSVersionTable.PSVersion.Major'],
  { encoding: 'utf8' }).status === 0);
const script = path.join(root, 'scripts', 'Get-ALObjectIndex.ps1');
const runIndex = (dir, ...args) => spawnSync(powershell, ['-NoProfile', '-File', script, '-WorkspaceRoot', dir, ...args], { encoding: 'utf8' });

test('object index parses objects, fields, values, ranges and detects problems', { skip: !powershell }, () => workspace((dir, put) => {
  put('app/app.json', JSON.stringify({ id: '11111111-1111-1111-1111-111111111111', name: 'Fix', publisher: 'P',
    version: '1.0.0.0', application: '28.0.0.0', runtime: '17.0', idRanges: [{ from: 50100, to: 50109 }] }));
  put('app/AppSourceCop.json', '{"mandatoryAffixes":["ABC"]}');
  put('app/src/a.al', [
    '// table 50999 "Commented"',
    'tableextension 50100 "ABC Cust Ext" extends Customer',
    '{',
    '    fields',
    '    {',
    "        field(50100; \"ABC Carrier\"; Code[20]) { Caption = 'It''s // not a comment'; }",
    '        field(50101; "Other"; Text[30]) { }',
    '        field(50101; "ABC Dup"; Integer) { }',
    '        field(50200; "ABC Out"; Integer) { }',
    '    }',
    '}',
    '/* codeunit 50001 "Block" */',
    'codeunit 50100 "ABC Mgt"',
    '{',
    "    procedure X() var Msg: Label 'table 50101 \"NotAnObject\"'; begin end;",
    '}',
    'enumextension 50100 "ABC Status Ext" extends "Sales Status" { value(50100; "ABC Special") { } }',
    'table 50100 "ABC Own" { fields { field(1; "Code"; Code[10]) { } } }',
  ].join('\n'));
  const run = runIndex(dir);
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /Index: docs\/knowledge\/object-index\.json - 1 app\(s\), 4 object\(s\), 2 error\(s\), 2 warning\(s\)/);
  const index = JSON.parse(read(dir, 'docs/knowledge/object-index.json'));
  assert.deepEqual(index.apps[0].idRanges, [{ from: 50100, to: 50109 }]);
  assert.deepEqual(index.apps[0].affixes, ['ABC']);
  assert.deepEqual(index.apps[0].dependencies, []);
  const names = index.objects.map((object) => `${object.type} ${object.id} ${object.name}`).sort();
  assert.deepEqual(names, ['codeunit 50100 ABC Mgt', 'enumextension 50100 ABC Status Ext', 'table 50100 ABC Own',
    'tableextension 50100 ABC Cust Ext']);
  assert.equal(index.objects.find((object) => object.name === 'ABC Own').fields[0].name, 'Code');
  assert.equal(index.objects.find((object) => object.name === 'ABC Status Ext').values[0].id, 50100);
  const codes = index.issues.map((issue) => issue.code).sort();
  assert.deepEqual(codes, ['duplicate-member-id', 'member-out-of-range', 'missing-affix', 'multi-object-file']);
}));

test('object index returns next free object and member IDs without reserving them', { skip: !powershell }, () => workspace((dir, put) => {
  put('app/app.json', JSON.stringify({ name: 'Fix', idRanges: [{ from: 50100, to: 50109 }] }));
  put('app/src/a.al', [
    'codeunit 50100 "ABC Mgt" { }',
    'tableextension 50100 "ABC Cust Ext" extends Customer { fields { field(50100; "ABC A"; Integer) { } field(50101; "ABC B"; Integer) { } } }',
    'table 50100 "ABC Own" { fields { field(1; "Code"; Code[10]) { } } }',
    'enumextension 50100 "ABC E" extends "Sales Status" { value(50100; "ABC V") { } }',
  ].join('\n'));
  const lines = (result) => result.stdout.trim().split(/\r?\n/).filter(Boolean);
  assert.deepEqual(lines(runIndex(dir, '-NextId', 'codeunit', '-Count', '2')), ['50101', '50102']);
  assert.deepEqual(lines(runIndex(dir, '-NextId', 'page')), ['50100']);
  assert.deepEqual(lines(runIndex(dir, '-NextMemberId', 'Customer')), ['50102']);
  assert.deepEqual(lines(runIndex(dir, '-NextMemberId', 'ABC Own')), ['2']);
  assert.deepEqual(lines(runIndex(dir, '-NextMemberId', 'Sales Status', '-MemberKind', 'value')), ['50101']);
  assert.deepEqual(lines(runIndex(dir, '-NextId', 'codeunit')), ['50101']);
}));

test('object index -Report writes a dated report under docs/generated/reviews', { skip: !powershell }, () => workspace((dir, put) => {
  put('app/app.json', JSON.stringify({ name: 'Fix', idRanges: [{ from: 50100, to: 50149 }] }));
  put('app/src/a.al', 'codeunit 50100 "ABC Mgt" { }');
  const run = runIndex(dir, '-Report');
  assert.equal(run.status, 0, run.stderr);
  const reports = fs.readdirSync(path.join(dir, 'docs/generated/reviews'));
  assert.equal(reports.length, 1);
  assert.match(reports[0], /^\d{4}-\d{2}-\d{2}-object-ids\.md$/);
  assert.match(read(dir, `docs/generated/reviews/${reports[0]}`), /\| codeunit \| 50100 \| ABC Mgt/);
}));
