# Bugfix Requirements Document

## Introduction

The DynamicTeamVisualizer component crashes with a "Maximum update depth exceeded" error when the user clicks the "开始写作" (Start Writing) button. This occurs due to an infinite re-render loop caused by improper useEffect dependency management. The `calculatePositions` function is included in the useEffect dependency array, but it gets recreated on every render despite being memoized with useCallback, because its own dependencies (`layout`, `maxAgents`) cause it to be recreated. This creates a cycle where the effect runs, updates state, triggers a re-render, recreates the function, and runs the effect again infinitely.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the component renders and the useEffect at lines 173-182 executes THEN the system enters an infinite loop where `calculatePositions` is recreated on every render, triggering the effect repeatedly

1.2 WHEN the infinite loop occurs THEN the system throws "Maximum update depth exceeded" error and crashes the application

1.3 WHEN `calculatePositions` is included in the useEffect dependency array THEN the system treats it as a changing dependency even though it's memoized with useCallback

### Expected Behavior (Correct)

2.1 WHEN the component renders and agents change THEN the system SHALL calculate agent positions exactly once without entering an infinite loop

2.2 WHEN the useEffect executes THEN the system SHALL not crash and SHALL render the component successfully

2.3 WHEN `calculatePositions` dependencies (`layout`, `maxAgents`) change THEN the system SHALL recalculate positions only when agents also change, not on every render

### Unchanged Behavior (Regression Prevention)

3.1 WHEN agents array changes (new agents added, removed, or modified) THEN the system SHALL CONTINUE TO recalculate and update agent node positions

3.2 WHEN the container is resized THEN the system SHALL CONTINUE TO recalculate positions based on the new dimensions

3.3 WHEN agents remain unchanged THEN the system SHALL CONTINUE TO preserve the existing agent node positions without unnecessary recalculation

3.4 WHEN the component unmounts or containerRef is not available THEN the system SHALL CONTINUE TO skip position calculation safely
