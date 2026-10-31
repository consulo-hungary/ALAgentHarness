import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const result = spawnSync(process.execPath, [fileURLToPath(new URL('../hooks/session-start.mjs', import.meta.url))], {
  encoding: 'utf8',
});
if (result.status === 0) {
  console.log(JSON.stringify({ additionalContext: result.stdout.trim() }));
}
