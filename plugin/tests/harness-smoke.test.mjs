import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

// Harness smoke test. Runs on every plugin change (pre-commit hook + CI) and checks EVERY
// command and agent found on disk, so a new or edited one is covered without editing this file.
// It is a static + executable check: it cannot prove live host dispatch or model availability.
const root = fileURLToPath(new URL('../', import.meta.url));
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const list = (relative, suffix) => fs.readdirSync(path.join(root, relative))
  .filter((name) => name.endsWith(suffix)).sort();

function frontmatter(text, label) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  assert.ok(match, `${label}: missing frontmatter`);
  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([a-z][a-z-]*): (.+)$/);
    assert.ok(field, `${label}: unsupported frontmatter line "${line}"`);
    fields[field[1]] = field[2].startsWith('"') || field[2].startsWith('[')
      ? JSON.parse(field[2]) : field[2];
  }
  assert.ok(String(fields.description ?? '').length > 20, `${label}: description too short`);
  return fields;
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    if (entry.name === 'node_modules') return [];
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function assertLinksResolve(relative) {
  const file = path.join(root, relative);
  for (const match of read(relative).matchAll(/\]\((\.\.?\/[^)\s]+)\)/g)) {
    const target = path.resolve(path.dirname(file), match[1].split('#')[0]);
    assert.ok(fs.existsSync(target), `${relative}: broken link ${match[1]}`);
  }
}

const commands = list('commands', '.md');
const agents = list('agents', '.md').map((file) => path.basename(file, '.md'));
const skills = fs.readdirSync(path.join(root, 'skills'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
const mcpServers = Object.keys(JSON.parse(read('.mcp.json')).mcpServers);
// Optional knowledge tools remain valid when the user disables their local servers.
const harnessServers = ['al', 'bc-observatory', 'bc-code-atlas', 'microsoft-learn'];
const toolServers = new Set([...mcpServers, ...harnessServers]);
const builtinTools = new Set(['read', 'search', 'edit', 'execute']);

test('smoke: the plugin ships commands and agents to test', () => {
  assert.equal(commands.length, 5, 'five public commands: init, brainstorm, implement, review, commit');
  assert.ok(agents.length > 0);
  assert.ok(skills.length > 0);
});

for (const file of commands) {
  const name = path.basename(file, '.md');
  test(`smoke command ${name}: valid, dispatches to an existing agent or skill, links resolve`, () => {
    const relative = `commands/${file}`;
    const text = read(relative);
    frontmatter(text, relative);
    assert.match(text, new RegExp(`!${name}.*shell execution.*NOT`, 's'), 'must warn that ! is not a command');
    assertLinksResolve(relative);

    const known = new Set([...agents, ...skills]);
    const mentioned = [...text.matchAll(/`((?:al|project)-[a-z][a-z-]*)`/g)].map((match) => match[1]);
    const linkedSkills = [...text.matchAll(/skills\/([a-z-]+)\/SKILL\.md/g)].map((match) => match[1]);
    for (const token of mentioned) assert.ok(known.has(token), `${relative}: unknown agent/skill \`${token}\``);
    assert.ok([...mentioned, ...linkedSkills].some((token) => known.has(token)),
      `${relative}: dispatches to no agent or skill`);
    for (const skill of linkedSkills) assert.ok(skills.includes(skill), `${relative}: unknown skill ${skill}`);
  });
}

for (const name of agents) {
  test(`smoke agent ${name}: canonical + Copilot adapter are coherent and its tools are valid`, () => {
    assert.ok(exists(`copilot/agents/${name}.agent.md`), `missing Copilot adapter for ${name}`);
    const canonicalPath = `agents/${name}.md`;
    const adapterPath = `copilot/agents/${name}.agent.md`;
    const canonical = frontmatter(read(canonicalPath), canonicalPath);
    const adapterText = read(adapterPath);
    const adapter = frontmatter(adapterText, adapterPath);

    assert.equal(canonical.name, name);
    assert.equal(adapter.name, name);
    assert.equal(adapter['user-invocable'], 'false', 'internal agents are not user-invocable');
    assert.ok(adapterText.includes(`../../agents/${name}.md`), 'adapter must point at its canonical agent');
    assert.equal(adapter.model, undefined, 'no pinned model in adapter frontmatter');
    assert.equal(canonical.model, undefined, 'no pinned model in canonical frontmatter');
    assertLinksResolve(canonicalPath);
    assertLinksResolve(adapterPath);

    for (const tool of adapter.tools ?? []) {
      if (builtinTools.has(tool)) continue;
      const [server, ...rest] = tool.split('/');
      assert.ok(rest.length === 1 && toolServers.has(server),
        `${adapterPath}: unknown tool "${tool}" (allowed servers: ${[...toolServers].join(', ')})`);
    }
  });

  test(`smoke agent ${name}: is reachable from a command, skill or another agent`, () => {
    const own = new Set([`agents/${name}.md`, `copilot/agents/${name}.agent.md`]);
    const sources = ['commands', 'skills', 'agents', 'references']
      .flatMap((directory) => walk(path.join(root, directory)))
      .map((file) => path.relative(root, file).replaceAll('\\', '/'))
      .filter((relative) => relative.endsWith('.md') && !own.has(relative));
    const link = new RegExp(`\\b${name}\\b`);
    assert.ok(sources.some((relative) => link.test(read(relative))), `${name} is never referenced`);
  });
}

test('smoke: every Copilot adapter has a canonical agent', () => {
  const adapters = list('copilot/agents', '.agent.md').map((file) => file.replace('.agent.md', ''));
  assert.deepEqual(adapters, agents);
});

for (const skill of skills) {
  test(`smoke skill ${skill}: valid and internal`, () => {
    const relative = `skills/${skill}/SKILL.md`;
    const meta = frontmatter(read(relative), relative);
    assert.equal(meta.name, skill);
    assert.equal(meta['user-invocable'], 'false');
    assertLinksResolve(relative);
    assert.ok(!commands.some((file) => path.basename(file, '.md').toLowerCase() === skill.toLowerCase()),
      `skill ${skill} collides with a command name`);
  });
}

test('smoke: every helper script parses', () => {
  const scripts = ['scripts', 'templates'].flatMap((directory) => walk(path.join(root, directory)))
    .filter((file) => file.endsWith('.mjs'));
  assert.ok(scripts.length >= 5);
  for (const script of scripts) {
    const result = spawnSync(process.execPath, ['--check', script], { encoding: 'utf8' });
    assert.equal(result.status, 0, `${script}: ${result.stderr}`);
  }
});

test('smoke: plugin stays Business Central AL only (no web/Python/generic-project features)', () => {
  const outOfScope = [
    /\bpython\b/i, /\bpytest\b/i, /\bdjango\b/i, /\bflask\b/i, /\bpylance\b/i,
    /project-(?:sdd|reviewer|profiles)\b/, /\bnon-AL\b/i, /web\/javascript/i,
    /\bgeneric project\b/i, /\bcustom projects\b/i, /\bweb,\s*python\b/i,
  ];
  const files = walk(root).map((file) => path.relative(root, file).replaceAll('\\', '/'))
    .filter((relative) => /\.(md|json)$/.test(relative) && !relative.startsWith('tests/') && relative !== 'README.md');
  for (const relative of files) {
    const text = read(relative);
    for (const pattern of outOfScope) assert.doesNotMatch(text, pattern, `${relative} contains out-of-scope ${pattern}`);
  }
  for (const name of agents) {
    const tools = frontmatter(read(`copilot/agents/${name}.agent.md`), name).tools ?? [];
    assert.ok(!tools.includes('web'), `${name}: general web tool is out of scope`);
  }
});


// MCP failure policy: about five failures, then halt with a progress statement and ask the user.
test('smoke: MCP failure policy states the halt-after-five rule with progress statement', () => {
  const policy = read('references/mcp-failure-policy.md').replace(/\s+/g, ' ');
  assert.match(policy, /about \*\*5 failing requests without improvement\*\*/);
  assert.match(policy, /short progress statement/);
  assert.match(policy, /Check manually/);
  assert.match(policy, /Retry.*Continue without.*Stop here/);
  assert.match(policy, /QUESTION: MCP <server> failed ~5x/);
  assert.doesNotMatch(policy, /ninja/i);
  for (const server of harnessServers) assert.ok(policy.includes(`\`${server}\``), `policy misses ${server}`);
  assert.doesNotMatch(JSON.stringify(Object.keys(JSON.parse(read('.mcp.json')).mcpServers)), /ninja/i);
});

for (const name of agents) {
  test(`smoke agent ${name}: MCP users must reference the failure policy`, () => {
    const canonical = read(`agents/${name}.md`);
    const tools = frontmatter(read(`copilot/agents/${name}.agent.md`), name).tools ?? [];
    const usesMcp = tools.some((tool) => tool.includes('/')) || /mcp__/.test(canonical);
    if (usesMcp) assert.match(canonical, /mcp-failure-policy\.md/, `${name} uses MCP but ignores the policy`);
  });
}

test('smoke: skills point at the MCP failure policy and no skill mentions Ninja as a tool', () => {
  for (const relative of ['skills/al-knowledge/SKILL.md', 'skills/al-build-validation/SKILL.md',
    'skills/al-coding-principles/SKILL.md', 'skills/bc-workflow/SKILL.md']) {
    assert.match(read(relative), /mcp-failure-policy\.md/, relative);
  }
  for (const file of walk(path.join(root, 'skills')).filter((entry) => entry.endsWith('.md'))) {
    const text = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(text.replace(/no AL Object ID Ninja/g, ''), /ninja/i, file);
  }
});

test('smoke: the plugin registers no hooks; /AL-init deploys them from templates', () => {
  for (const relative of ['hooks', 'copilot/hooks.json', 'hooks/hooks.json']) assert.ok(!exists(relative), relative);
  assert.equal(JSON.parse(read('plugin.json')).hooks, undefined);
  for (const relative of ['templates/hooks/al-guardrails.mjs', 'templates/hooks/al-guardrails.json',
    'templates/hooks/al-docs-check.mjs', 'templates/git/pre-commit', 'templates/AGENTS.md',
    'templates/copilot-instructions.md', 'templates/project-overview.md', 'templates/technical-overview.md',
    'scripts/Get-ALObjectIndex.ps1', 'scripts/al-init.mjs']) {
    assert.ok(exists(relative), `missing ${relative}`);
  }
});

test('smoke: deployed guardrail blocks base-app digging, allows normal work, honours the user override', () => {
  const script = path.join(root, 'templates', 'hooks', 'al-guardrails.mjs');
  const run = (command, cwd = root, copilot = false) => spawnSync(process.execPath, [script], {
    input: JSON.stringify(copilot ? { toolName: 'powershell', toolArgs: JSON.stringify({ command }), cwd }
      : { tool_name: 'Bash', tool_input: { command }, cwd }),
    encoding: 'utf8',
  });
  const blocked = [
    'Expand-Archive -Path .\\.alpackages\\Microsoft_Base Application.app -DestinationPath C:\\tmp\\base',
    'unzip Base.app -d base',
    'Invoke-WebRequest https://github.com/microsoft/BCApps/archive/refs/heads/main.zip -OutFile b.zip',
    'git clone https://github.com/microsoft/BCApps',
    'Get-ChildItem -Recurse app\\.alpackages | Select-String "OnBeforePost"',
    'rg -n "OnAfterPost" C:\\tmp\\BaseApplication',
  ];
  for (const command of blocked) {
    for (const copilot of [false, true]) {
      const result = run(command, root, copilot);
      assert.equal(result.status, 2, `should block: ${command}`);
      assert.match(result.stderr, /about 5 failed requests/);
      assert.match(result.stderr, /progress statement/);
      assert.equal(JSON.parse(result.stdout).permissionDecision, 'deny');
    }
  }
  for (const command of ['git status', 'node --test plugin/tests', 'Get-ChildItem app\\src',
    'al compile /project:app /packagecachepath:app/.alpackages /out:app/output.app',
    'Expand-Archive notes.txt', 'curl https://example.com/api']) {
    const result = run(command);
    assert.equal(result.status, 0, `should allow: ${command}`);
    assert.equal(result.stdout, '');
  }
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-fallback-'));
  try {
    assert.equal(run('unzip Base.app -d base', workspace).status, 2);
    fs.writeFileSync(path.join(workspace, '.harness-allow-fallback'), '');
    assert.equal(run('unzip Base.app -d base', workspace).status, 0, 'user-approved fallback lifts the block');
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test('smoke: deployed guardrail blocks literal UI text in .al writes only', () => {
  const script = path.join(root, 'templates', 'hooks', 'al-guardrails.mjs');
  const run = (event) => spawnSync(process.execPath, [script], { input: JSON.stringify(event), encoding: 'utf8' });
  const bad = "if X then Error('Something failed');";
  const write = (filePath, content, key = 'content') => ({ tool_name: 'Write', tool_input: { file_path: filePath, [key]: content } });
  for (const event of [
    write('app/src/A.Codeunit.al', bad),
    write('app/src/A.Codeunit.al', bad, 'new_string'),
    { toolName: 'create_file', toolArgs: JSON.stringify({ filePath: 'app/a.al', content: "Message(StrSubstNo('x %1', Y));" }) },
    { tool_name: 'Bash', tool_input: { command: `cat > app/a.al <<'EOF'\n${bad}\nEOF` } },
  ]) {
    const result = run(event);
    assert.equal(result.status, 2, JSON.stringify(event));
    assert.match(result.stderr, /Declare a Label/);
  }
  for (const event of [
    write('app/src/A.Codeunit.al', 'Error(NoCarrierErr);'),
    write('rules/x.bad.al', bad),
    write('notes.md', bad),
    write('app/src/A.Codeunit.al', `// ${bad}`),
  ]) assert.equal(run(event).status, 0, JSON.stringify(event));
  assert.equal(spawnSync(process.execPath, [script], { input: 'not json', encoding: 'utf8' }).status, 0);
});

test('smoke: no pinned model versions in workflows', () => {
  const pinned = /claude[ -]opus[ -]\d|opus \d\.\d|\bgpt-\d|\bsonnet \d|\bhaiku \d/i;
  const files = ['agents', 'commands', 'skills', 'copilot', 'templates', 'README.md']
    .flatMap((entry) => (fs.statSync(path.join(root, entry)).isDirectory() ? walk(path.join(root, entry))
      : [path.join(root, entry)]))
    .map((file) => path.relative(root, file).replaceAll('\\', '/'))
    .filter((relative) => relative.endsWith('.md'));
  for (const relative of files) assert.doesNotMatch(read(relative), pinned, `${relative} pins a model`);
});
