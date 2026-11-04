import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('brainstorm defaults to main-chat spec and stops', () => {
  const command = read('commands/AL-brainstorm.md');
  assert.match(command, /bc-workflow/);
  assert.match(command, /no Opus, no subagents/);
  assert.match(command, /at-most-80-line/);
  assert.match(command, /STOP/);
  assert.doesNotMatch(command, /al-spec|al-sdd|opus-model|opus-selection/);
  assert.match(command, /at most ONE/);
  assert.match(command, /Never block on model availability/);
});

test('workflow budgets research, questions, consent and main-chat spec writing', () => {
  const skill = read('skills/bc-workflow/SKILL.md');
  for (const phrase of [/10 targeted/, /15 total tool calls/, /3-6 business questions/,
    /At most 2 question rounds/, /MAIN writes the spec/, /ask "write spec\?"/,
    /Never reread/, /cosmetic changes/, /150 lines of code/, /ask once/,
    /convert to a sibling/, /never re-extract/, /Spec ready for developers/]) {
    assert.match(skill, phrase);
  }
  assert.doesNotMatch(skill, /createNumberedSpec|opus-selection|specialist-handoff/);
});

test('implementation has a single-build default and explicit expensive full mode', () => {
  const command = read('commands/AL-implement.md');
  assert.match(command, /ONE build after estimate\/consent/);
  assert.match(command, /No tests, test app, mutation, DoD, subagents, publish or translation/);
  assert.match(command, /--full.*explicitly opts into expensive/);
  const skill = read('skills/bc-workflow/SKILL.md');
  assert.match(skill, /no automatic fix\/rebuild loop/);
  assert.match(skill, /including `--full`/);
});

test('template has exactly seven lean sections and deferred IDs', () => {
  const template = read('templates/spec-TEMPLATE.md');
  assert.equal(template.trimEnd(), read('../specs/TEMPLATE.md').trimEnd());
  assert.ok(template.trimEnd().split(/\r?\n/).length <= 80);
  assert.deepEqual([...template.matchAll(/^## (.+)$/gm)].map((match) => match[1]), [
    'Goal', 'Decisions', 'Business Rules', 'Objects To Change / Create',
    'Acceptance Checks', 'Out Of Scope / Known Risks', 'Open Questions',
  ]);
  assert.match(template, /assign at implementation/);
  assert.doesNotMatch(template, /SHA256|Execution contract|Approval|Reserved IDs|## Tests/);
});

test('build defaults to one attempt and fixer has one full-mode cycle', () => {
  const build = read('skills/al-build-validation/SKILL.md');
  assert.match(build, /ONE build of the touched production app/);
  assert.match(build, /no automatic repair, second build, tests, publish or symbol downloads/);
  const fixer = read('agents/al-build-fixer.md');
  assert.match(fixer, /FULL MODE ONLY after explicit cost consent/);
  assert.match(fixer, /at most one bounded/);
  assert.doesNotMatch(fixer, /two bounded/);
  const adapter = read('copilot/agents/al-build-fixer.agent.md');
  assert.match(adapter, /at most one safe fix\/rebuild cycle/);
  assert.doesNotMatch(adapter, /two safe cycles/);
});

test('startup and workspace guidance do not reintroduce costly defaults', () => {
  const startup = read('hooks/session-start.mjs');
  assert.match(startup, /no subagents/);
  assert.match(startup, /ONE build after estimate\/consent/);
  assert.match(startup, /never automatic even in --full/);
  assert.doesNotMatch(startup, /REAL Opus agent|al-spec writes|two bounded fix cycles/);
  const setup = read('scripts/start-layout.mjs');
  assert.match(setup, /at-most-80-line spec, then STOP/);
  assert.match(setup, /ONE build after estimate\/consent/);
  const docs = read('README.md');
  for (const phrase of [/Budget Workspace Setup/, /spec work needs NONE/,
    /Pylance\/Python/, /TypeScript and GitHub PR/, /NAB translation instructions/,
    /fresh chat/, /cannot be removed by this/]) assert.match(docs, phrase);
  const index = read('../specs/README.md');
  assert.match(index, /After approval, STOP for developers/);
  assert.match(index, /Tests are optional, never one per check/);
  assert.doesNotMatch(index, /Acceptance criteria and tests map one-to-one/);
});

test('skill discovery descriptions are short single lines', () => {
  const skills = new URL('../skills/', import.meta.url);
  for (const entry of fs.readdirSync(skills, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const text = read(`skills/${entry.name}/SKILL.md`);
    const description = text.match(/^description: "(.+)"\r?$/m)?.[1];
    assert.ok(description && description.length <= 125, entry.name);
  }
});