import fs from 'node:fs';
import path from 'node:path';
import { workspaceRoot, inside } from './workspace-paths.mjs';

export function numberedSpecs(projectRoot, specRelative) {
  const root = workspaceRoot(projectRoot);
  const directory = inside(root, specRelative);
  const rows = [];
  const used = new Set();
  if (fs.existsSync(directory)) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
      const match = entry.name.match(/^(\d+)-.+\.md$/);
      if (!match) continue;
      const number = Number(match[1]);
      if (!Number.isSafeInteger(number)) throw new Error('Spec prefix exceeds safe integer range');
      if (number <= 0) continue;
      if (used.has(number)) throw new Error(`Duplicate spec prefix: ${number}`);
      used.add(number);
      rows.push({ number, name: entry.name });
    }
  }
  rows.sort((a, b) => a.number - b.number);
  const next = (rows.at(-1)?.number ?? 0) + 1;
  if (!Number.isSafeInteger(next)) throw new Error('Spec numbering exhausted');
  return { directory, rows, next };
}

export function createNumberedSpec(projectRoot, specRelative, slug, content) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Use a safe lowercase spec slug');
  if (typeof content !== 'string') throw new Error('Spec content must be text');
  const root = workspaceRoot(projectRoot);
  const directory = inside(root, specRelative);
  fs.mkdirSync(directory, { recursive: true });
  const lock = path.join(directory, '.numbered-spec.lock');
  // Exclusive lock serializes max+1 selection; stale locks block rather than steal.
  const fd = fs.openSync(lock, 'wx');
  try {
    const { next } = numberedSpecs(root, specRelative);
    const name = `${next}-${slug}.md`;
    const file = inside(root, path.join(specRelative, name));
    fs.writeFileSync(file, content, { flag: 'wx' });
    return { number: next, name, file };
  } finally {
    fs.closeSync(fd);
    fs.unlinkSync(lock);
  }
}
