#!/usr/bin/env bash
# complementary-skill-detection.sh — Phase 0h sub-step.
#
# Scans the user's installed Claude Code skills + plugins for complementary
# skills that this audit can delegate to. Writes audit-evidence/complementary-skills.json
# with a detection report; later phases read it to decide whether to delegate
# (e.g., delegate contrast checks to AccessLint instead of recomputing).
#
# Discovery mechanism: filesystem scan, NOT tool_search. tool_search is
# environment-specific (Cowork has it; Claude Code doesn't expose the
# same API). Filesystem inspection works in every Claude environment.
#
# Usage:
#   bash complementary-skill-detection.sh [--out audit-evidence/complementary-skills.json]
#
# Exits 0 always — discovery is best-effort and informational; the audit
# loop runs whether or not complementary skills are present.

set -uo pipefail

OUT="audit-evidence/complementary-skills.json"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --out) OUT="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 0 ;;
  esac
done

mkdir -p "$(dirname "$OUT")"

# Search roots — every place a skill might be installed
SEARCH_ROOTS=(
  "$HOME/.claude/skills"
  "$HOME/.claude/plugins"
  "$HOME/Library/Application Support/Claude/local-agent-mode-sessions"
  ".claude/skills"
)

# Catalog: known complementary skills mapped to their delegation role.
# Format per row: discovery-pattern | catalog-name | phase-it-helps | what-to-delegate
python3 - "$OUT" "${SEARCH_ROOTS[@]}" <<'PYEOF'
import json, os, sys, glob

OUT = sys.argv[1]
ROOTS = sys.argv[2:]

CATALOG = [
    # (discovery glob/pattern fragment to look for under skills root, canonical-name, phase, role)
    ("accesslint",                "accesslint",                "phase-2",      "Delegate contrast checking — call accesslint:contrast-checker instead of computing Lc ourselves"),
    ("accesslint*",               "accesslint",                "phase-2",      "(same as above; pattern variant)"),
    ("ui-ux-pro-max*",            "ui-ux-pro-max",             "phase-2",      "99 UX guidelines + perf rules — cross-reference Phase 2 findings"),
    ("bencium*refactoring*",      "bencium-refactoring-ui",    "phase-2",      "Visual hierarchy / spacing / palette tactical review"),
    ("refactoring-ui*",           "refactoring-ui-skill",      "phase-2",      "(same as above; pattern variant)"),
    ("hig-design*",               "ios-hig-design",            "phase-2-ios",  "Apple-specific: safe areas, Dynamic Type, semantic colors. Defer iOS Phase 2 to this if installed"),
    ("apple-skills*",             "ios-hig-design",            "phase-2-ios",  "(same as above; pattern variant)"),
    ("vercel*web*",               "vercel-web-guidelines",     "phase-2",      "Cross-reference Phase 2 findings against Vercel's 100+ rule canonical list"),
    ("identify-ux*",              "identify-ux-problems",      "phase-2",      "Heuristic-evaluation-style audit — compose with Phase 2 UX heuristics step"),
    ("ux-writing",                "ux-writing",                "phase-2",      "Voice and copy tone (mechanical pass can't catch this)"),
    ("design-critique",           "design-critique",           "phase-2",      "Same domain — defer if user invoked it explicitly"),
    ("ui-experience-audit",       "ui-experience-audit",       "phase-2",      "Per-screen 5-phase protocol — primary delegate from Phase 2"),
    ("ios-validation-runner",     "ios-validation-runner",     "phase-3-ios",  "iOS evidence capture — primary delegate from Phase 3 on iOS"),
    ("functional-validation",     "functional-validation",     "phase-3",      "Iron Rule + platform-specific validation"),
    ("e2e-validate",              "e2e-validate",              "phase-6",      "Optional final-pass execution engine"),
    ("preflight",                 "preflight",                 "phase-0",      "Generic environment sanity checks"),
    ("agent-browser",             "agent-browser",             "phase-2-3-6",  "Canonical web tooling (already required by this skill)"),
    ("visual-inspection",         "visual-inspection",         "phase-2",      "Per-screenshot QA (sub-step inside Phase 2)"),
    ("gate-validation-discipline","gate-validation-discipline","phase-5-6",    "Evidence-cited completion gate (already invoked at every phase exit)"),
    ("verification-before-completion","verification-before-completion","phase-6","Pre-claim discipline for the final verdict"),
    ("no-mocking-validation-gates","no-mocking-validation-gates","phase-4",    "Anti-mocking guard"),
    ("worktree-merge-validate",   "worktree-merge-validate",   "n/a",          "Sibling skill — superset for the consolidate-then-audit case"),
    ("full-functional-audit",     "full-functional-audit",     "phase-1",      "Inventory protocol (Phase 1 EXPLORE)"),
]

def search_one(pattern):
    """Return list of skill directories matching pattern across all search roots."""
    hits = []
    for root in ROOTS:
        if not os.path.isdir(root): continue
        # Direct skills dir
        for sub in glob.glob(os.path.join(root, pattern)):
            if os.path.isdir(sub) or sub.endswith("SKILL.md"):
                hits.append(sub)
        # Plugin-bundled skills (one level deeper)
        for sub in glob.glob(os.path.join(root, "*", "skills", pattern)):
            if os.path.isdir(sub) or sub.endswith("SKILL.md"):
                hits.append(sub)
        # Marketplace-bundled (two levels deeper)
        for sub in glob.glob(os.path.join(root, "*", "*", "skills", pattern)):
            if os.path.isdir(sub) or sub.endswith("SKILL.md"):
                hits.append(sub)
    return hits

detected = {}
for pattern, name, phase, role in CATALOG:
    if name in detected: continue  # first-match wins for duplicate patterns
    hits = search_one(pattern)
    if hits:
        # Prefer the most-specific (deepest) match
        path = max(hits, key=len)
        detected[name] = {
            "found_at": path,
            "phase": phase,
            "role": role,
            "delegate": True,
        }

report = {
    "schema_version": 1,
    "generated_by": "phase-0h complementary-skill-detection.sh",
    "search_roots": [r for r in ROOTS if os.path.isdir(r)],
    "detected_count": len(detected),
    "detected": detected,
    "available_roles_by_phase": sorted({s["phase"] for s in detected.values()}),
    "notes": [
        "This report is consumed by the audit loop's lead agent at the start of each cycle.",
        "Detection is opportunistic: if a complementary skill is present, the audit MAY delegate; it is not required to.",
        "If no complementary skills are detected, the audit runs entirely on its own protocols (the case for the first 7 iterations).",
    ],
}

with open(OUT, "w") as f:
    json.dump(report, f, indent=2, sort_keys=True)

# Human-readable summary on stdout
print(f"Complementary-skill detection complete. {len(detected)} skill(s) found.")
if detected:
    width = max(len(name) for name in detected)
    for name, info in sorted(detected.items()):
        print(f"  {name:<{width}}  → {info['phase']:<14}  {info['role'][:60]}")
print(f"Report written to: {OUT}")
PYEOF
