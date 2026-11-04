import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function within(root, relative, allowRoot = false) {
  if (!relative || path.isAbsolute(relative)) throw new Error('Use a project-relative layout path');
  const result = path.resolve(root, relative);
  const suffix = path.relative(root, result);
  if ((!suffix && !allowRoot) || suffix === '..' || suffix.startsWith(`..${path.sep}`) || path.isAbsolute(suffix)) {
    throw new Error('Layout path must stay inside the selected project');
  }
  // Reject a symlink that escapes the project, including through an existing ancestor.
  let ancestor = result;
  while (!fs.existsSync(ancestor)) ancestor = path.dirname(ancestor);
  const realSuffix = path.relative(fs.realpathSync(root), fs.realpathSync(ancestor));
  if (realSuffix === '..' || realSuffix.startsWith(`..${path.sep}`) || path.isAbsolute(realSuffix)) {
    throw new Error('Layout symlink escapes the selected project');
  }
  return result;
}

function manifest(directory) {
  const file = path.join(directory, 'app.json');
  if (!fs.existsSync(file)) throw new Error(`Missing AL manifest: ${file}`);
  const { name, application, runtime, dependencies = [] } = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  return { name, application, runtime, dependencies };
}

export function resolveLayout(projectRoot, options = {}) {
  if (!projectRoot || !path.isAbsolute(projectRoot)) throw new Error('Pin an absolute project root');
  const root = fs.realpathSync(projectRoot);
  const legacy = fs.existsSync(path.join(root, 'specs'));
  const modern = fs.existsSync(path.join(root, 'docs', 'specs'));
  if (!options.specRoot && legacy && modern) {
    throw new Error('BLOCKED: both specs/ and docs/specs/ exist; main developer must select one');
  }
  const specRelative = options.specRoot ?? (legacy ? 'specs' : path.join('docs', 'specs'));
  const appRelative = options.appRoot ?? (
    options.refactorBaseline && !fs.existsSync(path.join(root, 'app', 'app.json')) &&
    fs.existsSync(path.join(root, 'app.json')) ? '.' : 'app'
  );
  const appRoot = within(root, appRelative, true);
  const testRoot = within(root, options.testRoot ?? 'test');
  const specRoot = within(root, specRelative);
  const testMissing = options.refactorBaseline && !fs.existsSync(path.join(testRoot, 'app.json'));
  const planning = options.refactorBaseline ? {
    planningGaps: testMissing ? [`Missing test AL manifest: ${path.join(testRoot, 'app.json')}`] : [],
  } : {};
  return {
    projectRoot: root, appRoot, testRoot, specRoot,
    specIndex: path.join(specRoot, 'README.md'),
    generatedRoot: within(root, path.join('docs', 'generated')),
    knowledgeRoot: within(root, path.join('docs', 'knowledge')),
    manifests: { app: manifest(appRoot), test: testMissing ? null : manifest(testRoot) },
    ...planning,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const args = process.argv.slice(2);
    const accepted = new Set(['--project-root', '--spec-root', '--app-root', '--test-root']);
    const values = {};
    for (let i = 0; i < args.length;) {
      if (args[i] === '--refactor-baseline') {
        if (values[args[i]]) throw new Error(`Duplicate option: ${args[i]}`);
        values[args[i]] = true;
        i += 1;
        continue;
      }
      if (!accepted.has(args[i]) || !args[i + 1] || args[i + 1].startsWith('--')) {
        throw new Error('Expected --project-root <absolute> [--spec-root <relative>] [--app-root <relative>] [--test-root <relative>] [--refactor-baseline]');
      }
      if (values[args[i]]) throw new Error(`Duplicate option: ${args[i]}`);
      values[args[i]] = args[i + 1];
      i += 2;
    }
    console.log(JSON.stringify(resolveLayout(values['--project-root'], {
      specRoot: values['--spec-root'], appRoot: values['--app-root'], testRoot: values['--test-root'],
      refactorBaseline: values['--refactor-baseline'],
    }), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
