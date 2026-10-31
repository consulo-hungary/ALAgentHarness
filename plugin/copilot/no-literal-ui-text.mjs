import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

let input = '';
for await (const chunk of process.stdin) input += chunk;
try {
  const event = JSON.parse(input);
  const args = typeof event.toolArgs === 'string' ? JSON.parse(event.toolArgs) : event.toolArgs ?? {};
  const toolName = event.toolName ?? '';
  const normalized = [];
  if (['bash', 'powershell', 'run_in_terminal'].includes(toolName)) {
    normalized.push({ tool_name: 'Bash', tool_input: args });
  } else if (['edit', 'create', 'replace_string_in_file'].includes(toolName)) {
    normalized.push({
      tool_name: 'Edit',
      tool_input: {
        file_path: args.path ?? args.filePath ?? args.file_path,
        content: args.file_text ?? args.content,
        new_string: args.new_str ?? args.newString ?? args.new_string,
        edits: args.edits,
      },
    });
  } else if (toolName === 'apply_patch') {
    const patch = args.input ?? args.patch ?? '';
    for (const chunk of String(patch).split(/(?=^\*\*\* (?:Add|Update) File: )/m)) {
      const match = chunk.match(/^\*\*\* (?:Add|Update) File: (.+)$/m);
      if (match) normalized.push({
        tool_name: 'Edit',
        tool_input: {
          file_path: match[1].trim(),
          content: chunk.split(/\r?\n/).filter((line) => line.startsWith('+')).map((line) => line.slice(1)).join('\n'),
        },
      });
    }
  }
  for (const payload of normalized) {
    const result = spawnSync(process.execPath, [fileURLToPath(new URL('../hooks/no-literal-ui-text.mjs', import.meta.url))], {
      input: JSON.stringify(payload), encoding: 'utf8',
    });
    if (result.status === 2) {
      console.log(JSON.stringify({
        permissionDecision: 'deny', permissionDecisionReason: result.stderr.trim(),
      }));
      break;
    }
  }
} catch {
  // Unrecognized payload: leave normal host permission handling unchanged.
}
