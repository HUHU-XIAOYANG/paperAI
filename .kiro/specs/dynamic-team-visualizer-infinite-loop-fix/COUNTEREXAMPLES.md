# Bug Condition Exploration - Counterexamples Found

## Summary

The bug condition exploration test successfully confirmed the infinite loop bug in the DynamicTeamVisualizer component. All 5 test cases FAILED with "Maximum update depth exceeded" error, proving the bug exists on unfixed code.

## Bug Location

**File**: `src/components/DynamicTeamVisualizer.tsx`
**Lines**: 173-182
**Problematic Code**:
```typescript
useEffect(() => {
  if (!containerRef.current) return;

  const rect = containerRef.current.getBoundingClientRect();
  const nodes = calculatePositions(agents, rect.width, rect.height);
  setAgentNodes(nodes);

  // Update previous IDs for next render
  previousAgentIdsRef.current = new Set(agents.map(a => a.id));
}, [agents, calculatePositions]); // ← BUG: calculatePositions in dependency array
```

## Root Cause

1. `calculatePositions` is memoized with `useCallback([layout, maxAgents])` (line 165)
2. useEffect depends on `[agents, calculatePositions]` (line 182)
3. Effect runs → calls `setAgentNodes` → triggers re-render
4. Re-render → `calculatePositions` recreated (new reference)
5. New `calculatePositions` reference → triggers useEffect again
6. **Infinite loop** → "Maximum update depth exceeded" error

## Counterexamples Documented

### 1. Initial Render with 5 Agents
**Test**: `should render with agents without infinite loop (documents bug for browser)`
**Result**: ❌ FAILED with "Maximum update depth exceeded"
**Scenario**: Component renders with 5 agents (Writer 1, Writer 2, Supervisor, Editor, Reviewer)
**Error**: Infinite loop detected immediately on initial render

### 2. Initial Render with 2 Agents
**Test**: `should handle initial render with agents`
**Result**: ❌ FAILED with "Maximum update depth exceeded"
**Scenario**: Component renders with 2 agents (Writer, Supervisor)
**Error**: Infinite loop detected on initial render

### 3. Layout Prop Change
**Test**: `should handle layout prop changes`
**Result**: ❌ FAILED with "Maximum update depth exceeded"
**Scenario**: Component renders with circular layout, then changes to hierarchical layout
**Error**: Infinite loop triggered when layout prop changes

### 4. MaxAgents Prop Change
**Test**: `should handle maxAgents prop changes`
**Result**: ❌ FAILED with "Maximum update depth exceeded"
**Scenario**: Component renders with maxAgents=50, then changes to maxAgents=30
**Error**: Infinite loop triggered when maxAgents prop changes

### 5. Dynamic Agent Addition
**Test**: `should handle dynamic agent addition`
**Result**: ❌ FAILED with "Maximum update depth exceeded"
**Scenario**: Component starts with no agents, then agents are added dynamically
**Error**: Infinite loop triggered when agents are added to the store

## Error Message

All tests failed with the same error:
```
Error: Maximum update depth exceeded. This can happen when a component 
repeatedly calls setState inside componentWillUpdate or componentDidUpdate. 
React limits the number of nested updates to prevent infinite loops.
```

## Validation

✅ **Bug Confirmed**: All 5 test cases failed as expected on unfixed code
✅ **Root Cause Validated**: The circular dependency between useEffect and calculatePositions causes infinite re-renders
✅ **Counterexamples Documented**: Multiple scenarios trigger the bug (initial render, prop changes, dynamic updates)

## Next Steps

1. ✅ Task 1 Complete: Bug condition exploration test written and run
2. ⏭️ Task 2: Write preservation property tests (before implementing fix)
3. ⏭️ Task 3: Implement the fix by removing calculatePositions from dependency array
4. ⏭️ Task 3.2: Verify bug condition exploration test passes after fix
5. ⏭️ Task 3.3: Verify preservation tests still pass after fix

## Expected Behavior After Fix

When the fix is implemented (removing `calculatePositions` from the dependency array and keeping only `agents`, `layout`, `maxAgents`), all 5 tests should PASS, confirming:
- No infinite loop occurs
- Component renders successfully with agents
- Layout and maxAgents changes work correctly
- Dynamic agent addition works correctly
