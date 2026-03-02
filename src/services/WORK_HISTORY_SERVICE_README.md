# Work History Service

## Overview

The Work History Service tracks all agent work activities in the Agent Swarm Writing System. It records task start/end times, outputs, feedback, and status changes for every piece of work performed by agents.

## Features

- **Work Tracking**: Record when agents start and complete tasks
- **Status Management**: Track work status (in_progress, completed, rejected, revised)
- **Feedback Collection**: Store all feedback received for each work item
- **History Queries**: Retrieve work history by agent or across all agents
- **Export**: Export work history to JSON format

## Requirements

- 需求 13.5: 记录每个AI的工作过程
- 记录任务开始和结束时间
- 记录输出和反馈

## API Reference

### WorkHistoryService Interface

```typescript
interface WorkHistoryService {
  // Start tracking a new work record
  startWork(agentId: string, taskId: string, taskDescription: string): WorkRecord;
  
  // Complete a work record
  completeWork(agentId: string, taskId: string, output: string): void;
  
  // Mark work as rejected
  rejectWork(agentId: string, taskId: string, feedback: string): void;
  
  // Mark work as revised
  reviseWork(agentId: string, taskId: string, output: string): void;
  
  // Add feedback to a work record
  addFeedback(agentId: string, taskId: string, feedback: string): void;
  
  // Get work history for an agent
  getWorkHistory(agentId: string): WorkRecord[];
  
  // Get all work history across all agents
  getAllWorkHistory(): Array<WorkRecord & { agentId: string; agentName: string }>;
  
  // Get work record by task ID
  getWorkRecord(agentId: string, taskId: string): WorkRecord | undefined;
  
  // Export work history to JSON
  exportWorkHistory(): string;
}
```

### WorkRecord Data Structure

```typescript
interface WorkRecord {
  taskId: string;              // Task identifier
  startTime: Date;             // When work started
  endTime?: Date;              // When work ended (optional)
  output: string;              // Work output/result
  status: 'in_progress' | 'completed' | 'rejected' | 'revised';
  feedbackReceived: string[];  // All feedback received
}
```

## Usage Examples

### Basic Work Tracking

```typescript
import { workHistoryService } from './workHistoryService';

// Start tracking work
const record = workHistoryService.startWork(
  'writer-1',
  'task-intro',
  'Write introduction section'
);

// Complete the work
workHistoryService.completeWork(
  'writer-1',
  'task-intro',
  'Introduction: This paper explores...'
);
```

### Work with Feedback and Revision

```typescript
// Start work
workHistoryService.startWork('writer-2', 'task-methods', 'Write methods');

// Add feedback during work
workHistoryService.addFeedback(
  'writer-2',
  'task-methods',
  'Consider adding more detail'
);

// Work gets rejected
workHistoryService.rejectWork(
  'writer-2',
  'task-methods',
  'Methods section lacks detail'
);

// Revise the work
workHistoryService.reviseWork(
  'writer-2',
  'task-methods',
  'Methods: Detailed description...'
);
```

### Querying Work History

```typescript
// Get work history for specific agent
const agentHistory = workHistoryService.getWorkHistory('writer-1');
console.log(`Agent has ${agentHistory.length} work records`);

// Get all work history
const allHistory = workHistoryService.getAllWorkHistory();
allHistory.forEach((record) => {
  console.log(`${record.agentName}: ${record.taskId} (${record.status})`);
});

// Get specific work record
const record = workHistoryService.getWorkRecord('writer-1', 'task-intro');
if (record) {
  console.log(`Status: ${record.status}`);
  console.log(`Feedback: ${record.feedbackReceived.join(', ')}`);
}
```

### Exporting Work History

```typescript
// Export all work history to JSON
const json = workHistoryService.exportWorkHistory();

// Save to file or send to API
await saveToFile('work-history.json', json);
```

## Work Status Lifecycle

```
in_progress → completed
            ↓
         rejected → revised
```

1. **in_progress**: Work has started but not yet completed
2. **completed**: Work finished successfully
3. **rejected**: Work was rejected and needs revision
4. **revised**: Work was revised after rejection

## Integration with Agent System

The Work History Service integrates with the Agent Store to:

1. Access agent information (name, role, etc.)
2. Store work records in agent's work history
3. Update agent state when work status changes

```typescript
// Work records are stored in each agent
interface Agent {
  id: string;
  config: AgentConfig;
  state: AgentState;
  workHistory: WorkRecord[];  // ← Managed by WorkHistoryService
  interactionHistory: string[];
}
```

## Best Practices

### 1. Always Start Work Before Completing

```typescript
// ✓ Correct
workHistoryService.startWork('agent-1', 'task-1', 'Description');
workHistoryService.completeWork('agent-1', 'task-1', 'Output');

// ✗ Incorrect - will throw error
workHistoryService.completeWork('agent-1', 'task-1', 'Output');
```

### 2. Use Descriptive Task IDs

```typescript
// ✓ Good - descriptive and unique
workHistoryService.startWork('writer-1', 'intro-section-v1', 'Write intro');

// ✗ Poor - generic and may conflict
workHistoryService.startWork('writer-1', 'task1', 'Write');
```

### 3. Add Feedback Incrementally

```typescript
// Add feedback as it comes in
workHistoryService.addFeedback('agent-1', 'task-1', 'Good start');
workHistoryService.addFeedback('agent-1', 'task-1', 'Add more examples');
workHistoryService.addFeedback('agent-1', 'task-1', 'Fix formatting');
```

### 4. Handle Errors Gracefully

```typescript
try {
  workHistoryService.completeWork('agent-1', 'task-1', 'Output');
} catch (error) {
  console.error('Failed to complete work:', error);
  // Handle error appropriately
}
```

## Performance Considerations

- Work records are stored in memory (agent store)
- For large systems, consider periodic cleanup of old records
- Export functionality can be used for archival
- Queries are optimized for recent records (sorted by time)

## Testing

The service includes comprehensive unit tests covering:

- Basic work tracking operations
- Status transitions
- Feedback management
- Multi-agent scenarios
- Error handling
- Edge cases

Run tests:
```bash
npm test workHistoryService.test.ts
```

## Related Services

- **AgentManager**: Creates and manages agents
- **SupervisorAI**: Uses work history to track revision counts
- **DocumentExporter**: Includes work history in exported documents
- **RevisionHistoryService**: Tracks document-level revisions

## Future Enhancements

- [ ] Add work duration analytics
- [ ] Support work history filtering by date range
- [ ] Add work history visualization
- [ ] Support work history persistence to database
- [ ] Add work history comparison between agents
