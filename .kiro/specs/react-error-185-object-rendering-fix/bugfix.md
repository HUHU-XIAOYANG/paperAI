# Bugfix Requirements Document

## Introduction

React error #185 ("Objects are not valid as a React child") occurs when clicking "开始写作" (Start Writing) after filling in all information. The error is caused by attempting to render a `Task` object directly in the UI instead of rendering its string properties. The `Task` type contains multiple fields (id, description, assignedBy, deadline, priority, dependencies), but React can only render primitive values like strings and numbers.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN user clicks "开始写作" button after filling in all information AND an agent's `currentTask` is a Task object THEN the system crashes with React error #185 "Objects are not valid as a React child"

1.2 WHEN `agent.state.currentTask` is passed to a component that attempts to render it directly THEN the system throws a runtime error preventing the UI from displaying

1.3 WHEN the AgentInfo interface includes `currentTask` as a string but the actual value is a Task object THEN type inconsistency causes rendering failures

### Expected Behavior (Correct)

2.1 WHEN user clicks "开始写作" button after filling in all information AND an agent has a currentTask THEN the system SHALL extract `currentTask.description` string and render it without errors

2.2 WHEN `agent.state.currentTask` exists THEN the system SHALL pass only `currentTask.description` (string) to UI components for rendering

2.3 WHEN creating AgentInfo objects from Agent data THEN the system SHALL ensure `currentTask` field contains only the description string, not the entire Task object

### Unchanged Behavior (Regression Prevention)

3.1 WHEN an agent has no currentTask (undefined) THEN the system SHALL CONTINUE TO handle the undefined case gracefully without errors

3.2 WHEN displaying agent information in WorkDisplayPanel THEN the system SHALL CONTINUE TO show all other agent properties (name, role, status) correctly

3.3 WHEN displaying agent information in DynamicTeamVisualizer THEN the system SHALL CONTINUE TO render agent nodes and connections correctly

3.4 WHEN filtering and mapping agents in MainWorkspaceView THEN the system SHALL CONTINUE TO display the correct list of agents

3.5 WHEN messages are filtered for specific agents THEN the system SHALL CONTINUE TO show the correct interaction messages


## Bug Condition Derivation

### Bug Condition Function

The bug occurs when a Task object (instead of a string) is passed to React for rendering:

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type Agent
  OUTPUT: boolean
  
  // Returns true when currentTask is a Task object that will be rendered
  RETURN X.state.currentTask !== undefined 
         AND typeof X.state.currentTask === 'object'
         AND X.state.currentTask has property 'description'
END FUNCTION
```

### Property Specification - Fix Checking

For all agents with a currentTask object, the system must extract and render only the description string:

```pascal
// Property: Fix Checking - Task Object Rendering
FOR ALL agent WHERE isBugCondition(agent) DO
  agentInfo ← createAgentInfo(agent)
  ASSERT typeof agentInfo.currentTask === 'string' 
         OR agentInfo.currentTask === undefined
  ASSERT agentInfo.currentTask === agent.state.currentTask.description
         OR agentInfo.currentTask === undefined
  ASSERT no_react_error_185_thrown()
END FOR
```

### Property Specification - Preservation Checking

For all agents without a currentTask or with already-correct string values, behavior must remain unchanged:

```pascal
// Property: Preservation Checking
FOR ALL agent WHERE NOT isBugCondition(agent) DO
  agentInfo_before ← getActiveAgents_original(agent)
  agentInfo_after ← getActiveAgents_fixed(agent)
  ASSERT agentInfo_before === agentInfo_after
  ASSERT all_other_agent_properties_unchanged(agent)
END FOR
```

### Key Definitions

- **F**: `getActiveAgents()` in agentStore.ts (original implementation that returns Task object)
- **F'**: `getActiveAgents()` in agentStore.ts (fixed implementation that returns description string)
- **C(X)**: Agent has `state.currentTask` as a Task object
- **P(result)**: AgentInfo.currentTask is a string (description) or undefined, no React error #185

### Counterexample

A concrete example demonstrating the bug:

```typescript
// Buggy input
const agent: Agent = {
  id: 'writer-1',
  config: { name: '写作AI', role: 'writer', ... },
  state: {
    status: 'writing',
    currentTask: {
      id: 'task-1',
      description: '撰写论文引言部分',
      assignedBy: 'decision-ai',
      priority: 'high'
    },
    ...
  },
  ...
};

// Current behavior (crashes)
const agentInfo = getActiveAgents()[0];
// agentInfo.currentTask = { id: 'task-1', description: '撰写论文引言部分', ... }
// React tries to render this object → Error #185

// Expected behavior (works)
const agentInfo = getActiveAgents()[0];
// agentInfo.currentTask = '撰写论文引言部分'
// React renders the string successfully
```
