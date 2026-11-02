import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Copilot adapter: only shell tools are inspected; the policy lives in hooks/no-base-app-digging.mjs.
let input = '';
for await (const chunk of process.stdin) input += chunk;
try {
  const event = JSON.parse(input);
  const args = typeof event.toolArgs === 'string' ? JSON.parse(event.toolArgs) : event.toolArgs ?? {};
  if (['bash', 'powershell', 'run_in_terminal'].includes(event.toolName ?? '')) {
    const result = spawnSync(process.execPath, [fileURLToPath(new URL('../hooks/no-base-app-digging.mjs', import.meta.url))], {
      input: JSON.stringify({ tool_name: 'Bash', tool_input: args, cwd: event.cwd }), encoding: 'utf8',
    });
    if (result.status === 2) {
      console.log(JSON.stringify({ permissionDecision: 'deny', permissionDecisionReason: result.stderr.trim() }));
    }
  }
} catch {
  // Unrecognized payload: leave normal host permission handling unchanged.
}
