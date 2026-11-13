import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8').replace(/\s+/g, ' ');
const readRepo = (relative) => fs.readFileSync(path.join(root, '..', relative), 'utf8').replace(/\s+/g, ' ');

test('brainstorm stops after a spec of at most 100 lines; implementation is explicit', () => {
  for (const text of [read('commands/AL-brainstorm.md'), read('skills/bc-workflow/SKILL.md'), readRepo('specs/README.md')]) {
    assert.match(text, /100[- ]line/);
  }
  assert.match(read('commands/AL-brainstorm.md'), /STOP/);
  assert.match(read('commands/AL-implement.md'), /ONE build|one build/);
});

test('brainstorm uses interactive question boxes when available', () => {
  for (const text of [read('commands/AL-brainstorm.md'), read('skills/bc-workflow/SKILL.md')]) {
    assert.match(text, /vscode_askQuestions/);
    assert.match(text, /selectable options/);
    assert.match(text, /plain text only|only fall back to plain text/i);
  }
});

test('review writes only a report under docs/generated and does not edit code', () => {
  const text = read('commands/AL-review.md');
  assert.match(text, /docs\/generated\/reviews/);
  assert.match(text, /read-only|does not edit|never edit/i);
});

test('init deploys hooks into the repo and keeps a human in the loop for existing config', () => {
  const text = read('commands/AL-init.md');
  assert.match(text, /al-init\.mjs/);
  assert.match(text, /\.github\/hooks/);
  assert.match(text, /technical-overview/);
  assert.match(text, /\.github\/agent\/AGENTS\.md/);
  assert.match(text, /Transfer the useful existing Copilot instructions/);
  assert.match(text, /keep uncertain or conflicting text/i);
});

test('model policy: Claude tiers, GPT for docs, latest enabled version, Opus only on request', () => {
  const text = read('skills/bc-workflow/SKILL.md') + read('README.md');
  assert.match(text, /Opus/);
  assert.match(text, /GPT/);
  assert.match(text, /Haiku/);
  assert.match(text, /latest/i);
});
