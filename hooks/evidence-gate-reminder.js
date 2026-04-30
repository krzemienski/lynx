#!/usr/bin/env node
// PreToolUse hook: Inject evidence checklist when marking a task/todo complete.
//
// Supports two payload shapes:
//   TodoWrite:  { tool_input: { todos: [{ id, status, ... }, ...] } }
//   TaskUpdate: { tool_input: { status: "completed", ... } }
//
// Enforcement:
//   default → inject evidence checklist (advisory, exit 0)
//   LYNX_SKIP_HOOKS=evidence-gate-reminder → exit 0 silently
//   DISABLE_OMC=1 → exit 0 silently

// H10: cap stdin to 2MB. Fail-safe exit 0 on oversize input.
const MAX_INPUT_BYTES = 2 * 1024 * 1024;
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  if (input.length + chunk.length > MAX_INPUT_BYTES) process.exit(0);
  input += chunk;
});
process.stdin.on('end', () => {
  try {
    // Env overrides — highest precedence
    if (process.env.DISABLE_OMC === '1') process.exit(0);
    const skipList = (process.env.LYNX_SKIP_HOOKS || '').split(',').map(s => s.trim());
    if (skipList.includes('evidence-gate-reminder')) process.exit(0);

    const data = JSON.parse(input);
    const toolInput = data.tool_input || {};

    // Detect "completing a task" across both payload shapes.
    const singleStatus = toolInput.status || '';
    const todos = Array.isArray(toolInput.todos) ? toolInput.todos : [];
    const isCompleting =
      singleStatus === 'completed' ||
      todos.some((t) => t && t.status === 'completed');

    if (!isCompleting) {
      process.exit(0);
    }

    const message =
      'lynx Evidence Gate:\n' +
      '[ ] Did you PERSONALLY examine the evidence (not just receive a report)?\n' +
      '[ ] Did you VIEW screenshots and confirm their CONTENT (not just existence)?\n' +
      '[ ] Did you EXAMINE command output (not just exit codes)?\n' +
      '[ ] Can you CITE specific evidence for each validation criterion?\n' +
      '[ ] Would a skeptical reviewer agree this is complete?\n\n' +
      'If ANY checkbox is unchecked, run /validate --fix first.';

    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        additionalContext: message
      }
    }));
  } catch (e) {
    process.stderr.write(`[lynx] evidence-gate-reminder hook error: ${e.message}\n`);
    process.exit(0);
  }
});
