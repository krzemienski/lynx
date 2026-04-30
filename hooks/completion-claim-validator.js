#!/usr/bin/env node
// PostToolUse hook: Catch completion claims that lack validation evidence.
// Matches: Bash (after commands that might indicate "done")
//
// Enforcement:
//   default → exit(2) + stderr when completion claimed without evidence
//   LYNX_SKIP_HOOKS=completion-claim-validator → exit 0 silently
//   DISABLE_OMC=1 → exit 0 silently

const fs = require('fs');
const path = require('path');

const EVIDENCE_SUBDIR = 'e2e-evidence';

// Review finding L3: resolve EVIDENCE_DIR only from trusted roots.
// data.cwd is attacker-influenceable, so excluded.
// Priority: CLAUDE_PROJECT_ROOT → process.cwd()
function resolveEvidenceDir() {
  const candidates = [
    process.env.CLAUDE_PROJECT_ROOT,
    process.cwd(),
  ].filter(Boolean);
  for (const root of candidates) {
    try {
      if (fs.existsSync(root)) return path.join(root, EVIDENCE_SUBDIR);
    } catch (_) { /* unreadable → try next */ }
  }
  return path.join(process.cwd(), EVIDENCE_SUBDIR);
}

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
    if (skipList.includes('completion-claim-validator')) process.exit(0);

    const COMPLETION_PATTERNS = [
      /all.*pass/i,
      /tests.*pass/i,
      /successfully deployed/i,
      /implementation complete/i,
    ];

    const data = JSON.parse(input);
    const result = data.tool_result || {};
    const rawOutput = typeof result === 'string' ? result : (result.stdout || '');
    // H3: cap stdout scan to 200KB from tail — completion markers at end
    const MAX_SCAN_BYTES = 200 * 1024;
    const output = rawOutput.length > MAX_SCAN_BYTES
      ? rawOutput.slice(-MAX_SCAN_BYTES)
      : rawOutput;

    const isCompletionClaim = COMPLETION_PATTERNS.some(p => p.test(output));

    if (isCompletionClaim) {
      const evidenceDir = resolveEvidenceDir();

      // H4: cap top-level scan at 200 entries
      // H5: descend into subdirs (100-entry cap) for directory entries
      let hasFreshEvidence = false;
      if (fs.existsSync(evidenceDir)) {
        const entries = fs.readdirSync(evidenceDir, { withFileTypes: true }).slice(0, 200);
        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        hasFreshEvidence = entries.some(ent => {
          try {
            const entPath = path.join(evidenceDir, ent.name);
            if (ent.isFile()) {
              const s = fs.statSync(entPath);
              return s.mtimeMs > cutoff && s.size > 0;
            }
            if (ent.isDirectory()) {
              const inner = fs.readdirSync(entPath, { withFileTypes: true }).slice(0, 100);
              return inner.some(child => {
                if (!child.isFile()) return false;
                try {
                  const s = fs.statSync(path.join(entPath, child.name));
                  return s.mtimeMs > cutoff && s.size > 0;
                } catch { return false; }
              });
            }
            return false;
          } catch { return false; }
        });
      }

      if (!hasFreshEvidence) {
        process.stderr.write(
          '[lynx] completion-claim-validator: Completion claimed but no validation evidence found in e2e-evidence/.\n' +
          'lynx requires real evidence before any completion claim.\n' +
          'Run /validate to capture proper evidence through real system interaction.\n'
        );
        process.exit(2);
      }
    }

    process.exit(0);
  } catch (e) {
    process.stderr.write(`[lynx] completion-claim-validator hook error: ${e.message}\n`);
    process.exit(0);
  }
});
