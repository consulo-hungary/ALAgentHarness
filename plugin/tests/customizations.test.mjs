import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { resolveLayout } from '../skills/al-project-layout/scripts/resolve-layout.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const json = (relative) => JSON.parse(read(relative));
const specialists = ['al-spec', 'al-coder', 'al-build-fixer', 'al-reviewer'];
const names = ['al-start', 'al-refactor', 'al-brainstorm', 'al-commit', 'al-sdd', ...specialists];
function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? files(full) : [full];
  });
}
function frontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  assert.ok(match, 'Missing frontmatter');
  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([a-z][a-z-]*): (.+)$/);
    assert.ok(field, `Unsupported frontmatter line: ${line}`);
    assert.ok(!line.includes('\t'));
    const value = field[2];
    if (value.startsWith('"') || value.startsWith('[')) assert.doesNotThrow(() => JSON.parse(value));
    fields[field[1]] = value.replace(/^["']|["']$/g, '');
  }
  assert.ok(fields.description?.length > 20);
  return fields;
}
function fixture(callback) {
  const directory = path.join(root, 'tests', `fixture-${process.pid}-${randomUUID()}`);
  fs.mkdirSync(directory);
  const put = (relative, content = '') => {
    const file = path.join(directory, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  };
  try { callback(directory, put); } finally { fs.rmSync(directory, { recursive: true, force: true }); }
}
const manifest = JSON.stringify({ name: 'Fixture', application: '28.0.0.0', runtime: '17.0',
  dependencies: [], secret: 'must-not-leak', id: 'must-not-leak' });

test('both manifests discover EXACT four command files and coherent version 2.1.0', () => {
  const copilot = json('plugin.json');
  const claude = json('.claude-plugin/plugin.json');
  assert.equal(copilot.$schema, undefined);
  assert.equal(copilot.version, '2.1.0');
  assert.equal(claude.version, copilot.version);
  assert.deepEqual(claude.dependencies, ['bc-observatory@bc-observatory']);
  const marketplace = JSON.parse(fs.readFileSync(path.join(root, '..', '.claude-plugin', 'marketplace.json'), 'utf8'));
  assert.equal(marketplace.plugins.find((entry) => entry.name === copilot.name).version, copilot.version);
  for (const key of ['agents', 'skills', 'commands', 'mcpServers', 'hooks']) {
    assert.ok(fs.existsSync(path.join(root, copilot[key])));
  }
  assert.equal(copilot.commands, 'commands/');
  // Claude's convention and Copilot's explicit registration resolve the SAME directory.
  assert.deepEqual(fs.readdirSync(path.join(root, copilot.commands)).sort(),
    ['AL-brainstorm.md', 'AL-commit.md', 'AL-refactor.md', 'AL-start.md']);
  for (const file of fs.readdirSync(path.join(root, copilot.commands))) {
    assert.ok(frontmatter(read(`commands/${file}`)).description);
    assert.match(read(`commands/${file}`), /!AL-.*shell execution.*NOT/s);
  }
});

test('exact nine thin canonical adapters, Opus override ONLY brainstorm', () => {
  assert.deepEqual(fs.readdirSync(path.join(root, 'agents')).sort(), names.map((name) => `${name}.md`).sort());
  assert.deepEqual(fs.readdirSync(path.join(root, 'copilot', 'agents')).sort(),
    names.map((name) => `${name}.agent.md`).sort());
  for (const name of names) {
    const text = read(`copilot/agents/${name}.agent.md`);
    const meta = frontmatter(text);
    const canonical = frontmatter(read(`agents/${name}.md`));
    assert.equal(meta.name, name);
    assert.equal(canonical.name, name);
    assert.equal(meta['user-invocable'], 'false');
    assert.ok(text.includes(`../../agents/${name}.md`));
    assert.ok(text.length < 850, 'Adapter duplicates workflow');
    if (name === 'al-brainstorm') {
      assert.equal(canonical.model, 'opus');
      assert.equal(meta.model, 'Claude Opus 4.6 (copilot)');
      assert.match(text, /otherwise block|otherwise.*block|otherwise/s);
      assert.match(text, /Never silently fall back/);
    } else {
      assert.equal(meta.model, undefined);
      assert.equal(canonical.model, undefined);
    }
  }
});

test('all reusable skills are internal, obsolete public pipeline absent, relative markdown links valid', () => {
  const customizationFiles = ['agents', 'commands', 'skills', 'copilot', 'templates']
    .flatMap((directory) => files(path.join(root, directory)));
  customizationFiles.push(path.join(root, 'README.md'));
  for (const file of customizationFiles.filter((file) => file.endsWith('.md'))) {
    const text = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(text, /\bal-(?:workflow|spec-drafter|test-runner|lookup)\b/);
    assert.doesNotMatch(text, /(?:`|\s)\/(?:spec|sdd|done|pr)(?:\s|`|<|$)/);
    for (const match of text.matchAll(/\]\((\.\.?\/[^)\s]+)\)/g)) {
      const target = path.resolve(path.dirname(file), match[1].split('#')[0]);
      assert.ok(!path.relative(root, target).startsWith('..'), `Link escapes plugin: ${file}`);
      assert.ok(fs.existsSync(target), `Broken reference ${match[1]} in ${file}`);
    }
    if (path.basename(file) === 'SKILL.md') {
      const meta = frontmatter(text);
      assert.equal(meta.name, path.basename(path.dirname(file)));
      assert.equal(meta['user-invocable'], 'false');
    }
  }
});

test('four commands have independent scopes and real dispatch contracts', () => {
  for (const name of ['start', 'refactor', 'commit']) {
    assert.match(read(`commands/AL-${name}.md`), new RegExp(`actual \`al-${name}\``));
    assert.match(read(`commands/AL-${name}.md`), /active workspace|ACTIVE WORKSPACE/i);
  }
  const start = read('agents/al-start.md');
  assert.match(start, /byte|bytes/);
  assert.match(start, /PageExtensions.*TableExtension/s);
  assert.match(start, /must not remain as[\s\S]*orphan root source folder/);
  assert.match(start, /Never copy production objects into both projects/);
  assert.match(start, /If these known root-level legacy category folders are\s+empty, remove/);
  assert.match(start, /never leave AL source outside either project/);
  assert.match(start, /No nested agents/);
  assert.match(start, /Test may remain\s+empty/);
  assert.match(start, /hook: inherited/);
  assert.match(start, /never migrate|Hard-stop/i);
  const refactor = read('agents/al-refactor.md');
  assert.match(refactor, /Invocation permits safe fixes/);
  assert.match(refactor, /EXISTING files only/);
  assert.match(refactor, /No layout normalization/);
  assert.match(refactor, /TWO diagnose/);
  assert.match(refactor, /RunTrigger/);
  const commit = read('agents/al-commit.md');
  assert.match(commit, /FIRST inspect/);
  assert.match(commit, /preserv|Preserv/);
  assert.match(commit, /AUTHORIZES/);
  const brainstorm = read('skills/al-brainstorm/SKILL.md');
  assert.match(brainstorm, /REAL named/);
  assert.match(brainstorm, /SAME retained agent/);
  assert.match(brainstorm, /ACTUAL final artifact/);
  assert.match(brainstorm, /Direction != final-spec approval/);
  assert.match(brainstorm, /Automatically launch REAL `al-sdd`/);
  const sdd = read('agents/al-sdd.md');
  assert.match(sdd, /assertion failure/);
  assert.match(sdd, /Mutation -> RED/);
  assert.match(sdd, /Revert -> GREEN/);
  assert.match(sdd, /session-bound/);
  assert.match(sdd, /SPECIALIST REQUEST\/full packet/);
});

test('direction authorizes one actual numbered drafter, MAIN alone approves the final artifact', () => {
  const brainstorm = read('skills/al-brainstorm/SKILL.md');
  const spec = read('agents/al-spec.md');
  assert.match(brainstorm, /ONLY after agreed direction, launch ONE actual \[al-spec\]/);
  assert.match(brainstorm, /No draft before direction/);
  assert.match(brainstorm, /MAIN does not write the draft itself/);
  assert.match(brainstorm, /normally one invocation, no mandatory separate spec review\s+or build/);
  assert.ok(brainstorm.indexOf('Agree DIRECTION') < brainstorm.indexOf('[al-spec]'));
  assert.ok(brainstorm.indexOf('[al-spec]') < brainstorm.indexOf('Get explicit FINAL-SPEC approval'));
  assert.match(spec, /createNumberedSpec/);
  assert.match(spec, /max existing positive numeric prefix \+ 1/);
  assert.match(spec, /project-relative specRoot/);
  assert.match(spec, /duplicate prefixes/i);
  assert.match(spec, /final-spec approval pending/);
  assert.match(spec, /MAIN.*owns explicit final approval/s);
  assert.match(spec, /Write ONLY.*draft.*index row/s);
  assert.match(spec, /No interactive questions, approval, AL, IDs, builds, tests, publish or nested agents/);
  assert.match(spec, /Genuine gaps -> return numbered questions to MAIN/);
});

test('SDD owns a genuine sequential assertion RED to specialist logic to final GREEN review loop', () => {
  const sdd = read('agents/al-sdd.md');
  const phases = ['**Spec -> tests/stubs:**', '**RED:**', '**Logic -> GREEN:**',
    '**Mutation -> RED:**', '**Revert -> GREEN:**', 'After final GREEN AND current DoD',
    '[al-reviewer]'];
  const indices = phases.map((phase) => sdd.indexOf(phase));
  assert.ok(indices.every((index) => index >= 0));
  assert.deepEqual(indices, [...indices].sort((a, b) => a - b));
  assert.match(sdd, /ONLY after proven assertion RED, launch actual\s+\[al-coder\]/);
  assert.match(sdd, /SDD owns tests, stubs and initial Ninja\s+reservations/);
  assert.match(sdd, /Tests\/stubs are written only before assertion RED/);
  assert.match(sdd, /Build\/runner\/auth\/environment failure is NEVER RED/);
  assert.match(sdd, /No concurrent writers/);
  assert.match(sdd, /SDD builds\/publishes\/runs identical scope/);
  assert.match(sdd, /Always restore mutations on\s+failure/);
  assert.doesNotMatch(sdd, /no nested agents|Review own task delta|no redundant review agent/i);
});

test('coder preserves assertions and has no independent feature or testing pipeline', () => {
  const coder = read('agents/al-coder.md');
  assert.match(coder, /No valid assertion RED -> BLOCKED/);
  assert.match(coder, /Build\/runner\/auth failures do not authorize logic/);
  assert.match(coder, /allowed business-source files only/);
  assert.match(coder, /Ninja.*BEFORE writing/s);
  assert.match(coder, /User-facing Error\/Message\/Confirm text uses Labels/);
  assert.match(coder, /company rules/);
  assert.match(coder, /BCQuality/);
  assert.match(coder, /Do not edit tests\/stubs' contract, weaken assertions, change test scope/);
  assert.match(coder, /build\/publish\/run tests, review, commit or launch nested agents/);
  assert.match(coder, /retained\s+SDD coordinator/);
});

test('compilation fixer is conditional, bounded and never supplies test evidence', () => {
  const fixer = read('agents/al-build-fixer.md');
  for (const relative of ['agents/al-sdd.md', 'agents/al-refactor.md', 'skills/al-build-validation/SKILL.md']) {
    const text = read(relative);
    assert.match(text, /\[al-build-fixer\]\(/);
    assert.match(text, /compilation failure|compilation repair|compile failure/);
    assert.match(text, /successful builds|Successful builds/);
  }
  assert.match(fixer, /Require actual compiler diagnostics/);
  assert.match(fixer, /at most two bounded/);
  assert.match(fixer, /behavior-preserving/);
  assert.match(fixer, /No new objects\/fields\/IDs/);
  assert.match(fixer, /No publish, tests, mutation, independent review or nested agents/);
  assert.match(fixer, /Tests: not run/);
  assert.match(fixer, /GREEN only after a real zero-error build/);
});

test('independent reviewer is read-only with evidence-first findings and restrictive adapters', () => {
  const reviewer = read('agents/al-reviewer.md');
  const adapter = frontmatter(read('copilot/agents/al-reviewer.agent.md'));
  const tools = JSON.parse(adapter.tools);
  assert.ok(tools.includes('read') && tools.includes('search'));
  assert.ok(tools.some((tool) => tool.startsWith('bc-observatory/')));
  assert.ok(tools.some((tool) => tool.startsWith('bc-code-atlas/')));
  assert.ok(!tools.some((tool) => /edit|execute|agent|al\/|request_version|publish|run_tests/.test(tool)));
  const canonicalTools = frontmatter(reviewer).tools;
  assert.doesNotMatch(canonicalTools, /\b(?:Write|Edit|Bash|Task)\b|request_version|al_build|al_publish|run_tests/);
  for (const name of specialists) {
    assert.equal(frontmatter(read(`copilot/agents/${name}.agent.md`)).agents, '[]');
  }
  const specTools = JSON.parse(frontmatter(read('copilot/agents/al-spec.agent.md')).tools);
  for (const tool of ['read', 'search', 'edit']) assert.ok(specTools.includes(tool));
  const coderTools = JSON.parse(frontmatter(read('copilot/agents/al-coder.agent.md')).tools);
  assert.ok(coderTools.includes('edit') && coderTools.includes('al-object-id-ninja/*'));
  assert.ok(!coderTools.includes('execute'));
  assert.match(reviewer, /REAL isolated child context distinct from every writer/);
  assert.match(reviewer, /No edits, shell execution, builds, publish, test commands/);
  assert.match(reviewer, /priority, exact file:line, rule\/source, rationale, confidence/);
  assert.match(reviewer, /source\/package revision, spec\/DoD identity/);
  assert.match(reviewer, /Missing\/stale required evidence -> NOT DONE\/BLOCKED/);
});

test('source edits stale evidence; logic and test changes require the right revalidation', () => {
  const packet = read('references/specialist-handoff.md');
  const sdd = read('agents/al-sdd.md');
  assert.match(packet, /Any source edit invalidates prior build\/package\/GREEN\/DoD\/review evidence/);
  assert.match(packet, /Logic edits also rerun affected mutation RED -> restore ->\s+GREEN/);
  assert.match(packet, /test contract\/scope change needs MAIN approval/);
  assert.match(packet, /Substantive spec\/scope\/test\/target changes invalidate approval/);
  assert.match(packet, /at most two bounded fix cycles/i);
  assert.match(sdd, /ANY source edits invalidate\s+old GREEN\/package\/DoD\/review evidence/);
  assert.match(sdd, /DoD and launch independent review again/);
  assert.match(sdd, /Logic changes also\s+rerun affected reversible mutation/);
  assert.match(sdd, /Test\/scope changes require MAIN approval and tests\/stubs -> new assertion RED -> coder/);
  assert.match(read('skills/definition-of-done/SKILL.md'), /ANY source edits stale prior package\/GREEN\/DoD\/review/);
});

test('host relay retains coordinator state and full packets, no fake independent review', () => {
  const packet = read('references/specialist-handoff.md');
  assert.match(packet, /SPECIALIST REQUEST.*full packet/s);
  assert.match(packet, /MAIN launches the actual child.*SAME retained coordinator/s);
  assert.match(packet, /No supported isolated facility -> `BLOCKED`/);
  assert.match(packet, /Reading markdown or roleplaying.*NOT independent review/s);
  for (const value of ['projectRoot', 'appRoot', 'testRoot', 'specRoot', 'specPath', 'specIndex',
    'baseline', 'allowlist', 'application/runtime', 'FINAL-SPEC approval', 'Sandbox tenant',
    'codeunit IDs/methods', 'package hashes', 'mutation-to-test']) assert.ok(packet.includes(value), value);
  for (const relative of ['agents/al-sdd.md', 'agents/al-refactor.md', 'skills/al-brainstorm/SKILL.md']) {
    assert.match(read(relative), /MAIN.*actual isolated|MAIN.*actual.*launch/s);
    assert.match(read(relative), /retained|retain|Retain/);
  }
});

test('refactor reviews only verified changed delta; setup and commit do not expand pipelines', () => {
  const refactor = read('agents/al-refactor.md');
  assert.match(refactor, /ONE continuous deep local inspection/);
  assert.match(refactor, /For an actual changed delta, AFTER post-change verification/);
  assert.match(refactor, /No review on zero changes/);
  assert.match(refactor, /no forced\s+spec\/layout\/SDD\/DoD pipeline/);
  assert.match(refactor, /after ANY source edits rerun\s+affected validation and independent review/);
  for (const role of ['start', 'commit']) {
    for (const relative of [`agents/al-${role}.md`, `commands/AL-${role}.md`,
      `copilot/agents/al-${role}.agent.md`]) {
      assert.doesNotMatch(read(relative), /\bal-(?:spec|coder|build-fixer|reviewer)\b/);
    }
  }
});

test('layout strict mode, BOM, custom roots and no manifest/source secrets in output', () => fixture((directory, put) => {
  put(path.join('extension', 'app.json'), `\uFEFF${manifest}`);
  put(path.join('test', 'app.json'), manifest);
  const layout = resolveLayout(directory, { appRoot: 'extension' });
  assert.equal(layout.manifests.app.runtime, '17.0');
  assert.doesNotMatch(JSON.stringify(layout), /must-not-leak|secret/);
  assert.throws(() => resolveLayout(directory), /Missing AL manifest/);
  const result = spawnSync(process.execPath, [path.join(root, 'skills', 'al-project-layout', 'scripts', 'resolve-layout.mjs'),
    '--project-root', directory, '--app-root', 'extension'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), layout);
}));

test('layout baseline is read-only, accepts root app and missing tests without target normalization', () => fixture((directory, put) => {
  put('app.json', manifest);
  const before = fs.readdirSync(directory);
  const layout = resolveLayout(directory, { refactorBaseline: true });
  assert.equal(layout.appRoot, directory);
  assert.equal(layout.manifests.test, null);
  assert.equal(layout.targetLayout, undefined);
  assert.deepEqual(fs.readdirSync(directory), before);
  assert.throws(() => resolveLayout(directory), /Missing AL manifest/);
}));

test('layout both roots block, explicit selection works, missing/malformed errors are normal CLI blockers', () => fixture((directory, put) => {
  put(path.join('app', 'app.json'), manifest);
  put(path.join('test', 'app.json'), manifest);
  put(path.join('specs', 'README.md'));
  put(path.join('docs', 'specs', 'README.md'));
  assert.throws(() => resolveLayout(directory), /BLOCKED: both/);
  assert.equal(resolveLayout(directory, { specRoot: 'specs' }).specRoot, path.join(directory, 'specs'));
  assert.throws(() => resolveLayout('relative'), /absolute/);
  assert.throws(() => resolveLayout(directory, { specRoot: '..' }), /inside/);
  assert.throws(() => resolveLayout(directory, { specRoot: directory }), /project-relative/);
  put(path.join('app', 'app.json'), '{ malformed');
  const result = spawnSync(process.execPath, [path.join(root, 'skills', 'al-project-layout', 'scripts', 'resolve-layout.mjs'),
    '--project-root', directory, '--spec-root', 'specs'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /JSON|property|position/i);
}));

test('layout resolver blocks escaped symlink ancestor', () => fixture((directory, put) => {
  put(path.join('app', 'app.json'), manifest);
  put(path.join('test', 'app.json'), manifest);
  fixture((outside) => {
    fs.symlinkSync(outside, path.join(directory, 'linked'), process.platform === 'win32' ? 'junction' : 'dir');
    assert.throws(() => resolveLayout(directory, { specRoot: path.join('linked', 'specs') }), /symlink escapes/);
  });
}));

function hook(relative, event) {
  return spawnSync(process.execPath, [path.join(root, relative)], {
    input: typeof event === 'string' ? event : JSON.stringify(event), encoding: 'utf8',
    env: { ...process.env, PLUGIN_ROOT: root, CLAUDE_PLUGIN_ROOT: root },
  });
}
test('Copilot hook registration and session protocol preserve inherited guardrails and new scopes', () => {
  const config = json('copilot/hooks.json');
  assert.equal(config.version, 1);
  assert.deepEqual(Object.keys(config.hooks).sort(), ['preToolUse', 'sessionStart']);
  for (const entries of Object.values(config.hooks)) {
    for (const entry of entries) {
      assert.equal(entry.type, 'command');
      assert.equal(entry.bash, entry.powershell);
      const relative = entry.bash.match(/\$\{PLUGIN_ROOT\}\/([^"]+)/)[1];
      assert.ok(fs.existsSync(path.join(root, relative)));
    }
  }
  const result = hook('copilot/session-start.mjs', {});
  assert.equal(result.status, 0);
  const { additionalContext } = JSON.parse(result.stdout);
  for (const name of ['AL-start', 'AL-refactor', 'AL-brainstorm', 'AL-commit']) assert.ok(additionalContext.includes(name));
  assert.match(additionalContext, /direction approval != final-spec approval/);
  assert.match(additionalContext, /al-project-layout/);
  assert.doesNotMatch(additionalContext, /al-workflow|\/done/);
  const legacy = hook('hooks/session-start.mjs', {});
  assert.equal(legacy.status, 0);
  assert.match(legacy.stdout, /^AL agent harness/);
});

test('Copilot guardrail denies literal UI writes and patch writes without granting permissions', () => {
  for (const event of [
    { toolName: 'create', toolArgs: { path: 'app\\Example.al', file_text: "Error('literal');" } },
    { toolName: 'edit', toolArgs: JSON.stringify({ path: 'app\\Example.al', new_str: "Message(StrSubstNo('literal'));" }) },
    { toolName: 'apply_patch', toolArgs: { input: "*** Begin Patch\n*** Update File: app\\Example.al\n+Confirm('literal');\n*** End Patch" } },
    { toolName: 'powershell', toolArgs: { command: "echo \"Error('literal');\" > app\\Example.al" } },
  ]) {
    const result = hook('copilot/no-literal-ui-text.mjs', event);
    assert.equal(result.status, 0);
    assert.equal(JSON.parse(result.stdout).permissionDecision, 'deny');
    assert.match(JSON.parse(result.stdout).permissionDecisionReason, /Declare a Label/);
  }
  for (const event of [
    { toolName: 'create', toolArgs: { path: 'app\\Example.al', file_text: 'Error(MyErr);' } },
    { toolName: 'create', toolArgs: { path: 'rules\\Example.bad.al', file_text: "Error('literal');" } },
    { toolName: 'read', toolArgs: { path: 'app\\Example.al' } }, '{ malformed',
  ]) {
    const result = hook('copilot/no-literal-ui-text.mjs', event);
    assert.equal(result.status, 0);
    assert.equal(result.stdout, '');
  }
});

test('legacy Claude guardrail remains independent of Copilot protocol', () => {
  const result = hook('hooks/no-literal-ui-text.mjs',
    { tool_name: 'Write', tool_input: { file_path: 'app/Example.al', content: "Error('literal');" } });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Label/);
  const safe = hook('hooks/no-literal-ui-text.mjs',
    { tool_name: 'Write', tool_input: { file_path: 'app/Example.al', content: 'Error(MyErr);' } });
  assert.equal(safe.status, 0);
  assert.equal(safe.stdout, '');
});
