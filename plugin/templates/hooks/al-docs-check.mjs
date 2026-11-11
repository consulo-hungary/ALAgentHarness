#!/usr/bin/env node
// Git pre-commit check, deployed by /AL-init as .github/hooks/al-docs-check.mjs.
// A commit that changes AL code, app.json or a spec must also stage the technical documentation
// (docs/knowledge/technical-overview.md). Blocks with exit code 1 and says what to do.
// Emergency skip for the developer: AL_DOCS_SKIP=1 git commit ...
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
      `Commit blocked: AL code, app.json or a spec changed but ${DOC} is not staged.\n` +
        `Update it (what changed per object, new fields, new specs; dated entry), then 'git add ${DOC}'.\n` +
        `Ask the agent: "update the technical docs for this commit". Developer override: AL_DOCS_SKIP=1.`
    );
    process.exit(1);
  }
}
