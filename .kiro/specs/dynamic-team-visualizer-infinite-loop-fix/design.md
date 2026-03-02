# DynamicTeamVisualizer Infinite Loop Fix Design

## Overview

The DynamicTeamVisualizer component crashes with a "Maximum update depth exceeded" error due to an infinite re-render loop in the useEffect hook at lines 173-182. The issue stems from including the `calculatePositions` function in the useEffect dependency array. Despite being memoized with useCallback, the function is recreated on every render because its dependencies (`layout`, `maxAgents`) cause it to be recreated, which triggers the effect again, creating an infinite cycle: effect runs → state updates → re-render → function recreated → effect runs again.

The fix involves removing `calculatePositions` from the dependency array and instead directly depending on its underlying dependencies (`layout`, `maxAgents`), or restructuring the effect to avoid the circular dependency.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the infinite loop - when the useEffect at lines 173-182 includes `calculatePositions` in its dependency array, causing the effect to re-run infinitely
- **Property (P)**: The desired behavior - the component should calculate positions exactly once per agents change without entering an infinite loop
- **Preservation**: Existing position calculation logic, agent rendering, and responsive behavior that must remain unchanged by the fix
- **calculatePositions**: The memoized function (lines 107-165) that calculates agent node positions based on layout algorithm
- **useEffect (lines 173-182)**: The effect hook that updates agent positions when dependencies change
- **agentNodes**: State variable holding the calculated positions for all agent nodes
- **layout**: Prop determining the layout algorithm ('circular', 'hierarchical', or 'force')
- **maxAgents**: Prop limiting the maximum number of agents to display

## Bug Details

### Fault Condition

The bug manifests when the component renders and the useEffect at lines 173-182 executes. The `calculatePositions` function is included in the dependency array, but because it's recreated on every render (due to its own dependencies `layout` and `maxAgents` changing or being unstable), the effect runs infinitely.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { effectDependencies: any[], calculatePositionsRef: Function }
  OUTPUT: boolean
  
  RETURN 'calculatePositions' IN input.effectDependencies
         AND calculatePositionsIsRecreatedOnEveryRender(input.calculatePositionsRef)
         AND effectUpdatesStateThatTriggersRerender()
END FUNCTION
```

### Examples

- **Example 1**: User clicks "开始写作" button → agents are added to store → component renders → useEffect runs → `calculatePositions` is called → `setAgentNodes` updates state → component re-renders → `calculatePositions` is recreated (because `layout` or `maxAgents` are new references) → useEffect runs again → infinite loop → "Maximum update depth exceeded" error
- **Example 2**: Component mounts with initial agents → useEffect runs → positions calculated → state updated → re-render → `calculatePositions` recreated → useEffect runs again → infinite loop → crash
- **Example 3**: User changes layout prop → `calculatePositions` recreated → useEffect runs → state updated → re-render → `calculatePositions` recreated again → infinite loop → crash
- **Edge Case**: Component with no agents → useEffect runs → early return (no crash) → but if agents are added later, the infinite loop begins

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Position calculation logic for all three layout algorithms (circular, hierarchical, force) must continue to work exactly as before
- Agent nodes must continue to be positioned correctly based on the selected layout
- New agent detection (isNew flag) must continue to work for animation purposes
- Container resize handling must continue to recalculate positions appropriately
- Agent rendering, selection, hover states, and visual appearance must remain unchanged
- Canvas drawing for connections must remain unchanged
- Zoom, pan, and interaction controls must remain unchanged

**Scope:**
All functionality that does NOT involve the useEffect dependency management should be completely unaffected by this fix. This includes:
- The `calculatePositions` function implementation itself
- Agent node rendering and styling
- Connection drawing on canvas
- User interactions (click, hover, zoom, pan)
- Agent state visualization (status icons, role colors)

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is:

1. **Unstable Function Reference in Dependencies**: The `calculatePositions` function is included in the useEffect dependency array (line 182), but despite being memoized with useCallback, it gets recreated whenever its dependencies (`layout`, `maxAgents`) change or are treated as new references by React.

2. **Circular Dependency Chain**: The effect depends on `calculatePositions` → effect runs and calls `setAgentNodes` → state update triggers re-render → `calculatePositions` is recreated (even if `layout` and `maxAgents` haven't actually changed, they might be new references) → effect sees new function reference → effect runs again → infinite loop.

3. **Unnecessary Function in Dependencies**: The useEffect doesn't actually need to depend on the `calculatePositions` function itself. It should depend on the underlying data that determines when positions need recalculation: `agents`, `layout`, and `maxAgents`. The function is just the mechanism for calculation, not a dependency.

4. **Missing Dependency Array Optimization**: React's exhaustive-deps ESLint rule suggests including `calculatePositions`, but this creates the infinite loop. The correct solution is to either:
   - Remove `calculatePositions` from dependencies and add its underlying dependencies directly
   - Move the calculation logic inline into the effect
   - Use a ref to store the function to avoid recreation

## Correctness Properties

Property 1: Fault Condition - No Infinite Loop on Render

_For any_ component render where agents change or the component mounts, the fixed useEffect SHALL calculate agent positions exactly once without entering an infinite re-render loop, and SHALL not throw "Maximum update depth exceeded" error.

**Validates: Requirements 2.1, 2.2**

Property 2: Fault Condition - Recalculation on Dependency Change

_For any_ change to the underlying dependencies (`agents`, `layout`, `maxAgents`), the fixed useEffect SHALL recalculate positions exactly once and update the agentNodes state without causing infinite loops.

**Validates: Requirements 2.3**

Property 3: Preservation - Position Calculation Logic

_For any_ layout algorithm (circular, hierarchical, force) and agent configuration, the fixed code SHALL produce exactly the same agent node positions as the original `calculatePositions` function, preserving all layout calculation logic.

**Validates: Requirements 3.1**

Property 4: Preservation - Responsive Behavior

_For any_ container resize event, the fixed code SHALL continue to recalculate positions based on new dimensions exactly as the original code did, preserving responsive behavior.

**Validates: Requirements 3.2**

Property 5: Preservation - Optimization for Unchanged Agents

_For any_ render where the agents array reference hasn't changed, the fixed code SHALL preserve existing agent node positions without unnecessary recalculation, maintaining the same optimization behavior as the original.

**Validates: Requirements 3.3**

## Fix Implementation

### Changes Required

**File**: `src/components/DynamicTeamVisualizer.tsx`

**Function**: useEffect hook at lines 173-182

**Specific Changes**:

1. **Remove `calculatePositions` from dependency array**: Remove the function reference from the useEffect dependencies to break the circular dependency chain.

2. **Add underlying dependencies directly**: Replace `calculatePositions` with its actual dependencies: `layout` and `maxAgents`. These are props that won't cause infinite loops because they only change when the parent component passes new values.

3. **Keep `agents` dependency**: The `agents` dependency should remain because positions need to recalculate when agents change.

4. **Verify useCallback dependencies**: Ensure the `calculatePositions` useCallback has the correct dependencies (`layout`, `maxAgents`) so it's recreated only when these actually change.

**Before (lines 173-182)**:
```typescript
useEffect(() => {
  if (!containerRef.current) return;

  const rect = containerRef.current.getBoundingClientRect();
  const nodes = calculatePositions(agents, rect.width, rect.height);
  setAgentNodes(nodes);

  // Update previous IDs for next render
  previousAgentIdsRef.current = new Set(agents.map(a => a.id));
}, [agents, calculatePositions]);
```

**After**:
```typescript
useEffect(() => {
  if (!containerRef.current) return;

  const rect = containerRef.current.getBoundingClientRect();
  const nodes = calculatePositions(agents, rect.width, rect.height);
  setAgentNodes(nodes);

  // Update previous IDs for next render
  previousAgentIdsRef.current = new Set(agents.map(a => a.id));
}, [agents, layout, maxAgents, calculatePositions]);
```

**Alternative Solution (if the above still causes issues)**:
Move the calculation logic inline or use a different pattern:

```typescript
useEffect(() => {
  if (!containerRef.current) return;

  const rect = containerRef.current.getBoundingClientRect();
  // Call calculatePositions directly - it will use the latest values
  const nodes = calculatePositions(agents, rect.width, rect.height);
  setAgentNodes(nodes);

  // Update previous IDs for next render
  previousAgentIdsRef.current = new Set(agents.map(a => a.id));
}, [agents, layout, maxAgents]); // Remove calculatePositions entirely
```

The second approach is preferred because it removes the function from dependencies entirely, relying only on the data dependencies.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the infinite loop bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Fault Condition Checking

**Goal**: Surface counterexamples that demonstrate the infinite loop BEFORE implementing the fix. Confirm the root cause analysis by observing the "Maximum update depth exceeded" error.

**Test Plan**: Write tests that render the DynamicTeamVisualizer component with agents and observe the infinite loop behavior. Use React Testing Library with error boundary to catch the error. Run these tests on the UNFIXED code to confirm the bug.

**Test Cases**:
1. **Initial Render with Agents**: Render component with 5 agents → observe infinite loop and crash (will fail on unfixed code)
2. **Adding Agents Dynamically**: Render with 0 agents, then add agents → observe infinite loop when agents are added (will fail on unfixed code)
3. **Layout Change**: Render with agents, change layout prop → observe infinite loop on layout change (will fail on unfixed code)
4. **MaxAgents Change**: Render with agents, change maxAgents prop → observe infinite loop on prop change (will fail on unfixed code)

**Expected Counterexamples**:
- Console error: "Maximum update depth exceeded"
- Component crashes and doesn't render
- useEffect runs hundreds of times in rapid succession
- Root cause confirmed: `calculatePositions` in dependency array causes infinite loop

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds (component renders with agents), the fixed function produces the expected behavior (no infinite loop).

**Pseudocode:**
```
FOR ALL componentState WHERE hasAgents(componentState) DO
  result := renderDynamicTeamVisualizer_fixed(componentState)
  ASSERT NOT infiniteLoopOccurred(result)
  ASSERT NOT maxUpdateDepthExceeded(result)
  ASSERT componentRendersSuccessfully(result)
END FOR
```

**Test Cases**:
1. **Initial Render**: Render with agents → verify no infinite loop, component renders successfully
2. **Dynamic Agent Addition**: Add agents after mount → verify positions recalculate once, no infinite loop
3. **Layout Changes**: Change layout prop → verify positions recalculate once, no infinite loop
4. **Multiple Prop Changes**: Change layout and maxAgents together → verify single recalculation, no infinite loop

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold (position calculation logic, rendering behavior), the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL agentConfiguration WHERE validConfiguration(agentConfiguration) DO
  originalPositions := calculatePositions_original(agentConfiguration)
  fixedPositions := calculatePositions_fixed(agentConfiguration)
  ASSERT originalPositions = fixedPositions
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across different agent configurations
- It catches edge cases in layout algorithms that manual tests might miss
- It provides strong guarantees that position calculation logic is unchanged

**Test Plan**: Observe position calculation behavior on UNFIXED code (before the infinite loop crashes), capture expected positions, then verify the fixed code produces identical positions.

**Test Cases**:
1. **Circular Layout Preservation**: Generate various agent counts (1-50) → verify positions match original circular layout algorithm
2. **Hierarchical Layout Preservation**: Generate agents with different roles → verify hierarchical positioning matches original
3. **Force Layout Preservation**: Generate grid-based layouts → verify force layout positions match original
4. **New Agent Detection**: Add new agents to existing set → verify isNew flag is set correctly as before
5. **Container Dimensions**: Test with various container sizes → verify positions scale correctly as before
6. **Edge Cases**: Test with 0 agents, 1 agent, maxAgents limit → verify behavior matches original

### Unit Tests

- Test that useEffect runs exactly once when agents change
- Test that useEffect runs exactly once when layout changes
- Test that useEffect runs exactly once when maxAgents changes
- Test that useEffect doesn't run when unrelated props change
- Test that calculatePositions is called with correct parameters
- Test that agentNodes state is updated correctly
- Test error boundary catches any unexpected errors

### Property-Based Tests

- Generate random agent configurations (varying counts, roles, IDs) and verify no infinite loops occur
- Generate random layout and maxAgents combinations and verify single recalculation
- Generate random container dimensions and verify positions are calculated correctly
- Test that for any valid input, the component renders without crashing

### Integration Tests

- Test full component lifecycle: mount → add agents → change layout → unmount
- Test interaction with agent store: agents added to store trigger position recalculation
- Test that visual rendering matches calculated positions
- Test that user interactions (click, hover) work correctly after fix
- Test that canvas connections are drawn correctly after position updates
