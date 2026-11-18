import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));
const repo = path.join(root, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const readRepo = (relative) => fs.readFileSync(path.join(repo, relative), 'utf8');
const json = (relative) => JSON.parse(read(relative));
const flat = (text) => text.replace(/\s+/g, ' ');
const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(full) : [full];
});

test('manifests agree on version 3.0.0 and the command set; no hooks or Ninja', () => {
  const copilot = json('plugin.json');
  const claude = json('.claude-plugin/plugin.json');
  const marketplace = JSON.parse(readRepo('.claude-plugin/marketplace.json'));
  assert.equal(copilot.version, '3.0.0');
  assert.equal(claude.version, copilot.version);
  assert.equal(marketplace.plugins.find((entry) => entry.name === copilot.name).version, copilot.version);
  assert.equal(copilot.hooks, undefined);
  assert.deepEqual(fs.readdirSync(path.join(root, 'commands')).sort(),
    ['AL-brainstorm.md', 'AL-commit.md', 'AL-implement.md', 'AL-init.md', 'AL-review.md']);
  assert.doesNotMatch(read('.mcp.json'), /ninja/i);
});

test('removed resources stay removed', () => {
  for (const relative of ['commands/AL-start.md', 'commands/AL-refactor.md', 'agents/al-start.md',
    'agents/al-refactor.md', 'scripts/start-layout.mjs', 'skills/al-object-id-assignment',
    'skills/existing-code-review', 'hooks', 'copilot/hooks.json', 'copilot/session-start.mjs']) {
    assert.ok(!fs.existsSync(path.join(root, relative)), relative);
  }
});

test('skill descriptions are short, double-quoted and the new skills exist', () => {
  for (const name of ['al-object-index', 'al-coding-principles', 'project-docs', 'review-report']) {
    assert.ok(fs.existsSync(path.join(root, 'skills', name, 'SKILL.md')), name);
  }
  for (const file of walk(path.join(root, 'skills')).filter((entry) => entry.endsWith('SKILL.md'))) {
    const line = fs.readFileSync(file, 'utf8').split(/\r?\n/).find((entry) => entry.startsWith('description:'));
    assert.match(line, /^description: ".+"$/, file);
    assert.ok(line.length - 'description: ""'.length <= 125, `${file}: description over 125 characters`);
  }
});

test('specialists are single files, cannot spawn agents, and write-capable agents list the edit tool', () => {
  for (const file of fs.readdirSync(path.join(root, 'agents'))) {
    const text = read(`agents/${file}`);
    assert.doesNotMatch(text.split('---')[1], /^agents:/m, `${file}: no agents field`);
  }
  for (const name of ['al-coder', 'al-build-fixer']) assert.match(read(`agents/${name}.md`), /"edit".*"Write"/);
  assert.doesNotMatch(read('agents/al-reviewer.md').split('---')[1], /"edit"|"Write"|"Edit"/);
});

test('the AGENTS.md block carries the harness, precision, BCQuality, base-app-first and effort rules', () => {
  const text = flat(read('templates/AGENTS.md'));
  assert.match(text, /\/AL-brainstorm/);
  assert.match(text, /\/AL-implement/);
  assert.match(text, /\/AL-review/);
  assert.match(text, /\/AL-commit/);
  assert.match(text, /BCQuality/);
  assert.match(text, /base application first/i);
  assert.match(text, /same agreed behavior with the smallest clear implementation/);
  assert.match(text, /Never silently reduce requirements/);
  assert.match(text, /Reuse checks already performed/);
  assert.match(text, /No mandatory Meth layers/);
  assert.match(text, /about 5 failing/);
  assert.match(flat(read('agents/al-coder.md')), /80%|effort/i);
});

test('implementation and specialist entry points reject layers and log optional concerns', () => {
  for (const file of ['commands/AL-implement.md', 'skills/bc-workflow/SKILL.md',
    'agents/al-coder.md', 'agents/al-build-fixer.md', 'agents/al-reviewer.md', 'agents/al-sdd.md']) {
    const text = flat(read(file));
    assert.match(text, /optional concerns/i, file);
    assert.match(text, /spec.*Log|spec log/i, file);
    assert.match(text, /Meth|wrapper layers/i, file);
  }
});

test('tableextension naming follows the owning app rather than a hard-coded PTE suffix', () => {
  const rule = flat(readRepo('rules/tableextension-field-affix.md'));
  assert.match(rule, /AppSourceCop\.json/);
  assert.match(rule, /Do not add `PTE` merely/);
  assert.match(rule, /existing extension fields/);
  assert.match(rule, /workspace root `AGENTS\.md`/);
  assert.match(rule, /absent or ambiguous, ask/);
  assert.match(rule, /Procedures do not require an extra suffix/);
  assert.match(flat(read('commands/AL-init.md')), /for each app with no configured `AppSourceCop\.json` affix/);
  assert.ok(!fs.existsSync(path.join(repo, 'rules', 'tableextension-pte-suffix.md')));
});

test('object IDs come from the local index script, never Ninja', () => {
  const skill = flat(read('skills/al-object-index/SKILL.md'));
  assert.match(skill, /Get-ALObjectIndex\.ps1/);
  assert.match(skill, /-NextId/);
  assert.match(skill, /docs\/knowledge/);
  assert.match(flat(readRepo('AGENTS.md')), /Get-ALObjectIndex\.ps1/);
});

test('spec template is mirrored, dated and carries the implementation log', () => {
  assert.equal(read('templates/spec-TEMPLATE.md'), readRepo('specs/TEMPLATE.md'));
  const template = read('templates/spec-TEMPLATE.md');
  assert.match(template, /^---\r?\nstatus: draft\r?\ndate: <YYYY-MM-DD>/);
  assert.match(template, /Implementation Log|Change log/i);
  for (const file of fs.readdirSync(path.join(repo, 'specs')).filter((name) => /^\d+-.*\.md$/.test(name))) {
    const text = readRepo(`specs/${file}`);
    assert.match(text, /^---\r?\n(?:[a-z-]+: .*\r?\n)*?status: (draft|approved|implemented)\r?\n(?:[a-z-]+: .*\r?\n)*?date: \d{4}-\d{2}-\d{2}\r?\n/, file);
  }
});
