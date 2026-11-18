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

test('model policy: Sonnet hard, Haiku easy, Opus only after a dialog Yes, never pinned', () => {
  for (const text of [read('skills/bc-workflow/SKILL.md'), read('README.md'), read('templates/AGENTS.md'),
    readRepo('AGENTS.md')]) {
    assert.match(text, /Sonnet/);
    assert.match(text, /Haiku/);
    assert.match(text, /Opus/);
    assert.match(text, /GPT/);
    assert.match(text, /latest/i);
    assert.match(text, /dialog/i);
  }
  for (const text of [read('skills/bc-workflow/SKILL.md'), read('templates/AGENTS.md'), readRepo('AGENTS.md')]) {
    assert.match(text, /vscode_askQuestions/);
    assert.match(text, /code review/);
  }
});

test('coding guidance favors direct reuse over defensive frameworks', () => {
  const text = read('skills/al-coding-principles/SKILL.md');
  assert.match(text, /Same behavior, simpler implementation/);
  assert.match(text, /Never silently reduce requirements/);
  assert.match(text, /Reuse checks already performed/);
  assert.match(text, /Keep lookups read-only/);
  assert.match(text, /spec's Implementation Log/);
  assert.match(text, /permission bypasses or data-integrity defects/);
  const rule = readRepo('rules/meth-codeunit-single-public-procedure.md');
  assert.match(rule, /No mandatory Meth codeunit/);
  assert.match(rule, /samples are retired/);
  assert.doesNotMatch(rule, /has \*\*exactly one\*\*/);
});

test('implementation and refactoring use bounded independent review, not default full SDD', () => {
  for (const text of [read('skills/bc-workflow/SKILL.md'), read('templates/AGENTS.md')]) {
    assert.match(text, /al-coder/);
    assert.match(text, /al-reviewer/);
    assert.match(text, /at most one.*correction/);
    assert.match(text, /refactor/i);
    assert.match(text, /isolated agents.*unavailable|cannot run isolated agents/);
    assert.match(text, /Do not fall back to main-chat writing\/review|report the blocker and stop/i);
  }
  assert.match(read('agents/al-coder.md'), /Default mode does not require tests, assertion RED/);
  assert.match(read('agents/al-reviewer.md'), /Default review does not require DoD/);
  assert.match(read('commands/AL-init.md'), /root `AGENTS.md`/);
});

test('implementation delegates to editable subagents on Sonnet/Haiku without main-chat fallback', () => {
  const command = read('commands/AL-implement.md');
  const workflow = read('skills/bc-workflow/SKILL.md');
  const coder = read('agents/al-coder.md');
  assert.match(command, /registered `al-coder` subagent/);
  assert.match(command, /registered `al-reviewer` subagent/);
  assert.match(command, /Sonnet.*Haiku/);
  assert.match(command, /workspace `edit` tool/);
  assert.match(command, /do not switch.*into MAIN/i);
  assert.match(workflow, /real subagent/);
  assert.match(workflow, /Do not fall back to main-chat writing\/review/);
  assert.match(coder, /tools: \["read", "search", "edit"/);
  assert.match(coder, /model: sonnet/);
  assert.match(coder, /BLOCKED: no edit tool/);
});

test('documentation guidance never blocks agent-assisted Git operations', () => {
  for (const text of [read('skills/project-docs/SKILL.md'), read('commands/AL-commit.md'),
    read('agents/al-commit.md'), read('templates/AGENTS.md')]) {
    assert.match(text, /never block|never a blocked/i);
    assert.doesNotMatch(text, /pre-commit hook blocks|MUST include the updated/);
  }
});
