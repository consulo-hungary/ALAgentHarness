#!/usr/bin/env node
// Git pre-commit check, deployed by /AL-init as .github/hooks/al-docs-check.mjs.
// Warn about missing technical documentation without blocking commits or pushes.
import { execFileSync } from 'node:child_process';

const CODE = /(?:^|\/)(?:[^/]+\.al|app\.json)$|^docs\/specs\/[^/]+\.md$/i;
const DOC = 'docs/knowledge/technical-overview.md';

export function missingDocs(stagedFiles) {
  const files = stagedFiles.map((f) => f.replace(/\\/g, '/'));
  const touchesCode = files.some((f) => CODE.test(f));
  return touchesCode && !files.includes(DOC);
}

if (process.argv[1] && /al-docs-check\.mjs$/.test(process.argv[1].replace(/\\/g, '/'))) {
  if (process.env.AL_DOCS_SKIP === '1') process.exit(0);
  let staged = [];
  try {
    staged = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMRD'], { encoding: 'utf8' })
      .split(/\r?\n/)
      .filter(Boolean);
  } catch {
    process.exit(0); // not a git repo or git missing: never block
  }
  if (missingDocs(staged)) {
    console.error(
      `Documentation warning: AL code, app.json or a spec changed but ${DOC} is not staged.\n` +
        `Update it when relevant, or leave it unchanged when intentional. This warning does not block Git.`
    );
  }
}
