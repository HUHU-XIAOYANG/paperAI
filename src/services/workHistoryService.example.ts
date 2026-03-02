/**
 * Work History Service Examples
 * 
 * Demonstrates how to use the WorkHistoryService to track agent work activities
 */

import { createWorkHistoryService } from './workHistoryService';
import type { WorkHistoryService } from './workHistoryService';

// ============================================================================
// Example 1: Basic Work Tracking
// ============================================================================

export function example1_BasicWorkTracking() {
  console.log('=== Example 1: Basic Work Tracking ===\n');

  const workHistory: WorkHistoryService = createWorkHistoryService();

  // Start tracking work
  const record = workHistory.startWork(
    'writer-1',
    'task-intro',
    'Write introduction section'
  );

  console.log('Work started:', {
    taskId: record.taskId,
    status: record.status,
    startTime: record.startTime,
  });

  // Complete the work
  workHistory.completeWork(
    'writer-1',
    'task-intro',
    'Introduction: This paper explores...'
  );

  console.log('Work completed\n');
}

// ============================================================================
// Example 2: Work with Feedback and Revision
// ============================================================================

export function example2_WorkWithRevision() {
  console.log('=== Example 2: Work with Feedback and Revision ===\n');

  const workHistory: WorkHistoryService = createWorkHistoryService();

  // Start work
  workHistory.startWork('writer-2', 'task-methods', 'Write methods section');

  // Add feedback during work
  workHistory.addFeedback(
    'writer-2',
    'task-methods',
    'Consider adding more detail about data collection'
  );

  // Work gets rejected
  workHistory.rejectWork(
    'writer-2',
    'task-methods',
    'Methods section lacks sufficient detail'
  );

  console.log('Work rejected with feedback');

  // Revise the work
  workHistory.reviseWork(
    'writer-2',
    'task-methods',
    'Methods: We collected data using... [detailed description]'
  );

  console.log('Work revised and resubmitted\n');
}

// ============================================================================
// Example 3: Tracking Multiple Agents
// ============================================================================

export function example3_MultipleAgents() {
  console.log('=== Example 3: Tracking Multiple Agents ===\n');

  const workHistory: WorkHistoryService = createWorkHistoryService();

  // Writer 1 works on introduction
  workHistory.startWork('writer-1', 'task-intro', 'Write introduction');
  workHistory.completeWork('writer-1', 'task-intro', 'Introduction content...');

  // Writer 2 works on methods
  workHistory.startWork('writer-2', 'task-methods', 'Write methods');
  workHistory.completeWork('writer-2', 'task-methods', 'Methods content...');

  // Writer 3 works on results
  workHistory.startWork('writer-3', 'task-results', 'Write results');
  workHistory.completeWork('writer-3', 'task-results', 'Results content...');

  // Get all work history
  const allHistory = workHistory.getAllWorkHistory();
  console.log(`Total work records: ${allHistory.length}`);
  
  allHistory.forEach((record) => {
    console.log(`- ${record.agentName}: ${record.taskId} (${record.status})`);
  });

  console.log();
}

// ============================================================================
// Example 4: Querying Work History
// ============================================================================

export function example4_QueryingHistory() {
  console.log('=== Example 4: Querying Work History ===\n');

  const workHistory: WorkHistoryService = createWorkHistoryService();

  // Create some work records
  workHistory.startWork('writer-1', 'task-1', 'Task 1');
  workHistory.completeWork('writer-1', 'task-1', 'Output 1');

  workHistory.startWork('writer-1', 'task-2', 'Task 2');
  workHistory.rejectWork('writer-1', 'task-2', 'Needs improvement');
  workHistory.reviseWork('writer-1', 'task-2', 'Revised output 2');

  // Get work history for specific agent
  const agentHistory = workHistory.getWorkHistory('writer-1');
  console.log(`Writer 1 has ${agentHistory.length} work records`);

  // Get specific work record
  const record = workHistory.getWorkRecord('writer-1', 'task-2');
  if (record) {
    console.log('\nTask 2 details:');
    console.log(`- Status: ${record.status}`);
    console.log(`- Feedback count: ${record.feedbackReceived.length}`);
    console.log(`- Duration: ${record.endTime && record.startTime ? 
      (record.endTime.getTime() - record.startTime.getTime()) / 1000 : 'N/A'} seconds`);
  }

  console.log();
}

// ============================================================================
// Example 5: Exporting Work History
// ============================================================================

export function example5_ExportingHistory() {
  console.log('=== Example 5: Exporting Work History ===\n');

  const workHistory: WorkHistoryService = createWorkHistoryService();

  // Create some work records
  workHistory.startWork('writer-1', 'task-1', 'Write section A');
  workHistory.completeWork('writer-1', 'task-1', 'Section A content');

  workHistory.startWork('writer-2', 'task-2', 'Write section B');
  workHistory.completeWork('writer-2', 'task-2', 'Section B content');

  // Export to JSON
  const json = workHistory.exportWorkHistory();
  console.log('Exported work history:');
  console.log(json);
  console.log();
}

// ============================================================================
// Example 6: Real-world Workflow
// ============================================================================

export function example6_RealWorldWorkflow() {
  console.log('=== Example 6: Real-world Workflow ===\n');

  const workHistory: WorkHistoryService = createWorkHistoryService();

  // Simulate a complete writing workflow
  console.log('1. Writer starts working on introduction');
  workHistory.startWork('writer-1', 'intro-v1', 'Write introduction');

  console.log('2. Supervisor provides feedback');
  workHistory.addFeedback(
    'writer-1',
    'intro-v1',
    'Good start, but needs more context'
  );

  console.log('3. Writer submits first draft');
  workHistory.completeWork(
    'writer-1',
    'intro-v1',
    'Introduction draft 1...'
  );

  console.log('4. Reviewer rejects with detailed feedback');
  workHistory.rejectWork(
    'writer-1',
    'intro-v1',
    'Missing key background information and literature review'
  );

  console.log('5. Writer revises based on feedback');
  workHistory.reviseWork(
    'writer-1',
    'intro-v1',
    'Introduction draft 2 with background and literature review...'
  );

  // Check final status
  const record = workHistory.getWorkRecord('writer-1', 'intro-v1');
  console.log('\nFinal status:');
  console.log(`- Status: ${record?.status}`);
  console.log(`- Total feedback: ${record?.feedbackReceived.length}`);
  console.log(`- Feedback: ${record?.feedbackReceived.join('; ')}`);
  console.log();
}

// ============================================================================
// Run all examples
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  example1_BasicWorkTracking();
  example2_WorkWithRevision();
  example3_MultipleAgents();
  example4_QueryingHistory();
  example5_ExportingHistory();
  example6_RealWorldWorkflow();
}
