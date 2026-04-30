#!/usr/bin/env node
// PreToolUse hook: Detect mock/stub patterns in code being written.
// Matches: Write, Edit, MultiEdit
//
// Enforcement:
//   default → exit(2) + stderr (hard block)
//   LYNX_SKIP_HOOKS=mock-detection → exit 0 silently
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
    if (skipList.includes('mock-detection')) process.exit(0);

    const MOCK_PATTERNS = [
      /jest\.mock\s*\(/i,
      /jest\.spyOn\s*\(/i,
      /jest\.fn\s*\(/i,
      /sinon\.stub\s*\(/i,
      /sinon\.spy\s*\(/i,
      /sinon\.fake\s*\(/i,
      /unittest\.mock/i,
      /mockImplementation\s*\(/i,
      /\.mockReturnValue\s*\(/i,
      /\.mockResolvedValue\s*\(/i,
      /\.mockRejectedValue\s*\(/i,
      /vi\.mock\s*\(/i,
      /vi\.spyOn\s*\(/i,
      /vi\.fn\s*\(/i,
      /cy\.intercept\s*\(/i,
      /cy\.stub\s*\(/i,
      /nock\s*\(/i,
      /httptest\.NewRecorder/i,
      /gomock\.NewController/i,
      /XCTestCase/i,
      /@testable\s+import/i,
      /class\s+\w+Tests\s*:\s*XCTestCase/i,
      /func\s+test\w+\s*\(\s*\)/i,
      /describe\s*\(\s*['"`]/i,
      /it\s*\(\s*['"`]/i,
      /expect\s*\(.+\)\s*\.\s*(to|not)\b/i,
      /assert\.\w+\s*\(/i,
    ];

    const data = JSON.parse(input);
    const toolInput = data.tool_input || {};
    const rawContent = toolInput.content || toolInput.new_string || '';

    if (!rawContent) process.exit(0);

    // H3: cap to 200KB from head (written source content, not build output)
    const MAX_SCAN_BYTES = 200 * 1024;
    const content = rawContent.length > MAX_SCAN_BYTES
      ? rawContent.slice(0, MAX_SCAN_BYTES)
      : rawContent;

    const hasMatch = MOCK_PATTERNS.some(p => p.test(content));

    if (hasMatch) {
      process.stderr.write(
        '[lynx] mock-detection: Mock/test pattern detected in code being written.\n' +
        'lynx Iron Rule: Never create mocks, stubs, or test harnesses.\n' +
        'Fix the real system instead. Run /validate for proper validation.\n'
      );
      process.exit(2);
    }

    process.exit(0);
  } catch (e) {
    process.stderr.write(`[lynx] mock-detection hook error: ${e.message}\n`);
    process.exit(0);
  }
});
