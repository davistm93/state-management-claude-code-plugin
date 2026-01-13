#!/bin/bash

# Quick test script for State Manager plugin
# Run this to verify the plugin works before installing

set -e  # Exit on error

echo "TEST: State Manager Plugin - Quick Test"
echo "===================================="
echo ""

# Check we're in the right directory
if [ ! -f ".claude-plugin/plugin.json" ]; then
  echo "[FAIL] Error: Must be run from plugin root directory"
  exit 1
fi

# Check build exists
if [ ! -d "dist" ]; then
  echo "BUILD: Building plugin..."
  npm run build
fi

echo "[PASS] Plugin built successfully"
echo ""

# Test 1: Configuration
echo "Test 1: Configuration"
echo "---------------------"
if [ -f ".claude-plugin/config.json" ]; then
  echo "[PASS] Config file exists"
  cat .claude-plugin/config.json | head -5
else
  echo "[FAIL] Config file missing"
  exit 1
fi
echo ""

# Test 2: Run state-status
echo "Test 2: state-status command"
echo "----------------------------"
if node dist/commands/state-status.js 2>&1 | grep -i "State Status"; then
  echo "[PASS] state-status executes"
else
  echo "[FAIL] state-status failed"
  exit 1
fi
echo ""

# Test 3: Run state-plan
echo "Test 3: state-plan command"
echo "--------------------------"
OUTPUT=$(node dist/commands/state-plan.js 2>&1)
if echo "$OUTPUT" | grep -q "State Plan"; then
  echo "[PASS] state-plan executes"
  echo ""
  echo "Output preview:"
  echo "$OUTPUT" | head -10
else
  echo "[FAIL] state-plan failed"
  echo "$OUTPUT"
  exit 1
fi
echo ""

# Test 4: Run state-apply
echo "Test 4: state-apply command"
echo "---------------------------"
if node dist/commands/state-apply.js 2>&1 | grep -q "state-apply"; then
  echo "[PASS] state-apply executes"
else
  echo "[FAIL] state-apply failed"
  exit 1
fi
echo ""

# Test 5: Run all tests
echo "Test 5: Unit and integration tests"
echo "----------------------------------"
if npm test 2>&1 | grep -q "Tests:.*passed"; then
  echo "[PASS] All tests pass"
else
  echo "[FAIL] Some tests failed"
  exit 1
fi
echo ""

# Test 6: Check state file
echo "Test 6: State file integrity"
echo "----------------------------"
if [ -f ".claude/project_state.md" ]; then
  echo "[PASS] State file exists"

  # Check for metadata
  if grep -q "STATE_METADATA" .claude/project_state.md; then
    echo "[PASS] State file has metadata"

    # Extract commit SHA
    COMMIT_SHA=$(grep "STATE_METADATA" .claude/project_state.md | grep -o '"commit_sha":"[^"]*"' | cut -d'"' -f4)
    echo "  Current state SHA: $COMMIT_SHA"
  else
    echo "[WARN] State file missing metadata"
  fi
else
  echo "[INFO] No state file yet (normal for first use)"
fi
echo ""

echo "===================================="
echo "[DONE] All tests passed!"
echo ""
echo "Next steps:"
echo "1. Install: ln -s $(pwd) ~/.claude/plugins/state-manager"
echo "2. Test in another project:"
echo "   cd ~/your-project"
echo "   node ~/.claude/plugins/state-manager/dist/commands/state-plan.js"
echo "3. Or use with Claude Code: /state-plan"
echo ""
echo "See docs/TESTING.md for detailed testing instructions"
