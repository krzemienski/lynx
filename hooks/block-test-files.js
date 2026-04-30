#!/usr/bin/env node
// PreToolUse hook: Block creation of test files, mock files, and stub files.
// Enforces the lynx Iron Rule — no test frameworks, no mocks.
//
// Matches: Write, Edit, MultiEdit
// Blocks if file_path matches test/mock/stub patterns.
//
// Enforcement:
//   default → deny (permissionDecision: "deny")
//   LYNX_SKIP_HOOKS=block-test-files → exit 0 silently
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
    if (skipList.includes('block-test-files')) process.exit(0);

    const TEST_PATTERNS = [
      /\.test\.[jt]sx?$/i,
      /\.spec\.[jt]sx?$/i,
      /_test\.go$/i,
      /test_.*\.py$/i,
      /Tests\.swift$/i,
      /\/__tests__\//i,
      /\/test\//i,
      /\.mock\.[jt]sx?$/i,
      /\.stub\.[jt]sx?$/i,
      /\/mocks\//i,
      /\/stubs\//i,
      /\/fixtures\//i,
      /\/test-utils\//i,
      /\.stories\.[jt]sx?$/i,
    ];

    const ALLOWLIST = [
      /\/e2e-evidence\//i,
      /\/validation-evidence\//i,
      /\/\.claude\//i,
      /\/lynx\//i,
    ];

    const data = JSON.parse(input);
    const toolInput = data.tool_input || {};
    const filePath = toolInput.file_path || toolInput.filePath || '';

    if (!filePath) process.exit(0);

    // Allowlist short-circuit
    if (ALLOWLIST.some(re => re.test(filePath))) process.exit(0);

    const matched = TEST_PATTERNS.find(re => re.test(filePath));
    if (matched) {
      const output = {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason:
            `BLOCKED [lynx]: "${filePath}" matches a test/mock/stub file pattern.\n` +
            `lynx Iron Rule: Never create test files, mock files, or stub files.\n` +
            `Instead: Build and run the real system. Validate through actual user interfaces.\n` +
            `Run /validate to start the correct validation workflow.`
        }
      };
      process.stdout.write(JSON.stringify(output));
      process.exit(0);
    }

    // No match → silent pass-through.
    process.exit(0);
  } catch (e) {
    process.stderr.write(`[lynx] block-test-files hook error: ${e.message}\n`);
    process.exit(0);
  }
});
