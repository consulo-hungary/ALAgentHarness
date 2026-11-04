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
const harnessServers = ['al', 'al-object-id-ninja', 'bc-observatory', 'bc-code-atlas', 'microsoft-learn'];
const toolServers = new Set([...mcpServers, ...harnessServers]);
const builtinTools = new Set(['read', 'search', 'edit', 'execute']);

test('smoke: the plugin ships commands and agents to test', () => {
  assert.equal(commands.length, 5, 'five public commands including optional implementation');
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

test('smoke: hooks resolve to real scripts and run cleanly', () => {
  const registrations = [
    ['copilot/hooks.json', /\$\{PLUGIN_ROOT\}\/([^"]+)/],
    ['hooks/hooks.json', /\$\{CLAUDE_PLUGIN_ROOT\}\/([^"]+)/],
  ];
  let count = 0;
  for (const [config, pattern] of registrations) {
    const scripts = [...JSON.stringify(JSON.parse(read(config))).matchAll(new RegExp(pattern, 'g'))]
      .map((match) => match[1].replace(/\\$/, ''));
    assert.ok(scripts.length >= 2, `${config}: expected session-start and guardrail hooks`);
    for (const script of new Set(scripts)) {
      assert.ok(exists(script), `${config}: missing ${script}`);
      const result = spawnSync(process.execPath, [path.join(root, script)], {
        input: '{}', encoding: 'utf8', env: { ...process.env, PLUGIN_ROOT: root, CLAUDE_PLUGIN_ROOT: root },
      });
      assert.equal(result.status, 0, `${script} failed: ${result.stderr}`);
      count += 1;
    }
  }
  assert.ok(count >= 4);
});

test('smoke: the session-start rules name every public command', () => {
  const result = spawnSync(process.execPath, [path.join(root, 'hooks', 'session-start.mjs')], { encoding: 'utf8' });
  assert.equal(result.status, 0);
  for (const file of commands) assert.ok(result.stdout.includes(path.basename(file, '.md')), file);
});

test('smoke: every helper script parses', () => {
  const scripts = ['scripts', 'hooks', 'copilot', 'skills'].flatMap((directory) => walk(path.join(root, directory)))
    .filter((file) => file.endsWith('.mjs'));
  assert.ok(scripts.length >= 8);
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

// MCP failure policy: three tries, then ask the user; never dig through the file system.
test('smoke: MCP failure policy exists and states the 3-attempt dialog rule', () => {
  const policy = read('references/mcp-failure-policy.md').replace(/\s+/g, ' ');
  assert.match(policy, /at most \*\*3 attempts in total\*\*/);
  assert.match(policy, /ask the user through the host's question dialog/);
  assert.match(policy, /Retry.*Continue without.*Stop here/);
  assert.match(policy, /QUESTION: MCP <server> failed 3x/);
  for (const server of harnessServers) assert.ok(policy.includes(`\`${server}\``), `policy misses ${server}`);
});

for (const name of agents) {
  test(`smoke agent ${name}: MCP users must reference the failure policy`, () => {
    const canonical = read(`agents/${name}.md`);
    const tools = frontmatter(read(`copilot/agents/${name}.agent.md`), name).tools ?? [];
    const usesMcp = tools.some((tool) => tool.includes('/')) || /mcp__/.test(canonical);
    if (usesMcp) assert.match(canonical, /mcp-failure-policy\.md/, `${name} uses MCP but ignores the policy`);
  });
}

test('smoke: skills and the session rules point at the MCP failure policy', () => {
  for (const relative of ['skills/al-knowledge/SKILL.md', 'skills/al-build-validation/SKILL.md',
    'skills/al-object-id-assignment/SKILL.md', 'skills/bc-workflow/SKILL.md']) {
    assert.match(read(relative), /mcp-failure-policy\.md/, relative);
  }
  const session = spawnSync(process.execPath, [path.join(root, 'hooks', 'session-start.mjs')], { encoding: 'utf8' });
  assert.match(session.stdout, /3 attempts/);
  assert.match(session.stdout, /Retry \/ Continue without <server> \/ Stop/);
  assert.match(session.stdout, /Never compensate on the file system/);
});

test('smoke: guardrail blocks base-app digging, allows normal work, honours the user override', () => {
  const run = (command, cwd = root, relative = 'hooks/no-base-app-digging.mjs', copilot = false) => spawnSync(
    process.execPath, [path.join(root, relative)], {
      input: JSON.stringify(copilot ? { toolName: 'powershell', toolArgs: { command }, cwd }
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
    const result = run(command);
    assert.equal(result.status, 2, `should block: ${command}`);
    assert.match(result.stderr, /3 attempts/);
    assert.match(result.stderr, /ask the user/);
    const copilot = run(command, root, 'copilot/no-base-app-digging.mjs', true);
    assert.equal(copilot.status, 0);
    assert.equal(JSON.parse(copilot.stdout).permissionDecision, 'deny', `copilot should deny: ${command}`);
  }
  for (const command of ['git status', 'node --test plugin/tests', 'Get-ChildItem app\\src',
    'al compile /project:app /packagecachepath:app/.alpackages /out:app/output.app',
    'Expand-Archive notes.txt', 'curl https://example.com/api']) {
    assert.equal(run(command).status, 0, `should allow: ${command}`);
    assert.equal(run(command, root, 'copilot/no-base-app-digging.mjs', true).stdout, '', `copilot allow: ${command}`);
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
test('smoke: no pinned model versions in workflows', () => {
  const pinned = /claude[ -]opus[ -]\d|opus \d\.\d|\bgpt-\d|\bsonnet \d|\bhaiku \d/i;
  const files = ['agents', 'commands', 'skills', 'copilot', 'templates', 'README.md']
    .flatMap((entry) => (fs.statSync(path.join(root, entry)).isDirectory() ? walk(path.join(root, entry))
      : [path.join(root, entry)]))
    .map((file) => path.relative(root, file).replaceAll('\\', '/'))
    .filter((relative) => relative.endsWith('.md'));
  for (const relative of files) assert.doesNotMatch(read(relative), pinned, `${relative} pins a model`);
});
