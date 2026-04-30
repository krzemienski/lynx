#!/usr/bin/env node
// PostToolUse hook: Remind that compilation success is NOT validation.
// Matches: Bash (after build/compile commands)
//
// Enforcement:
//   default → exit(2) + stderr when build succeeds (hard block reminder)
//   LYNX_SKIP_HOOKS=validation-not-compilation → exit 0 silently
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
    if (skipList.includes('validation-not-compilation')) process.exit(0);

    const BUILD_PATTERNS = [
      /build succeeded/i,
      /compiled successfully/i,
      /compilation succeeded/i,
      /webpack.*compiled/i,
      /next.*build/i,
      /tsc.*--noEmit/i,
      /cargo build/i,
      /go build/i,
      /xcodebuild.*succeeded/i,
    ];

    const data = JSON.parse(input);
    const result = data.tool_result || {};
    const rawOutput = typeof result === 'string' ? result : (result.stdout || '');
    // H3: cap stdout scan to 200KB from tail — build success markers live at end
    const MAX_SCAN_BYTES = 200 * 1024;
    const output = rawOutput.length > MAX_SCAN_BYTES
      ? rawOutput.slice(-MAX_SCAN_BYTES)
      : rawOutput;

    const isBuildSuccess = BUILD_PATTERNS.some(p => p.test(output));

    if (isBuildSuccess) {
      process.stderr.write(
        '[lynx] validation-not-compilation: Build succeeded, but compilation is NOT validation.\n' +
        'Run /validate to verify through real user interfaces.\n' +
        'A successful build only proves syntax is correct, not that features work.\n'
      );
      process.exit(2);
    }

    process.exit(0);
  } catch (e) {
    process.stderr.write(`[lynx] validation-not-compilation hook error: ${e.message}\n`);
    process.exit(0);
  }
});
