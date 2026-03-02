/**
 * Bug Condition Exploration Test for React Error #185 - Object Rendering
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3**
 * 
 * CRITICAL NOTE: This test documents the React error #185 bug that occurs when
 * Task objects are rendered instead of description strings.
 * 
 * Bug: React error #185 "Objects are not valid as a React child" when rendering agents
 * Root Cause: Task objects (with id, description, assignedBy, priority) are passed to
 *             React components instead of just the description string
 * 
 * Expected behavior:
 * - UNFIXED code: Throws React error #185 when Task objects are rendered
 * - FIXED code: Renders description strings successfully
 * 
 * This test will FAIL on unfixed code and PASS after the fix is implemented.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { useAgentStore } from './agentStore';
import { WorkDisplayPanel } from '../components/WorkDisplayPanel';
import type { Agent, Task } from '../types/agent';

// ============================================================================
// Mock Setup
// ============================================================================

/**
 * Create a test agent with a Task object in currentTask
 */
function createAgentWithTask(
  id: string,
  name: string,
  role: Agent['config']['role'],
  taskDescription: string
): Agent {
  const task: Task = {
    id: `task-${id}`,
    description: taskDescription,
    assignedBy: 'decision-ai',
    priority: 'high',
  };

  return {
    id,
    config: {
      id,
      name,
      role,
      promptTemplate: `prompts/${role}.yaml`,
      aiService: 'test-service',
      capabilities: {
        canInternetAccess: true,
        canStreamOutput: true,
        canInteractWithPeers: true,
      },
    },
    state: {
      status: 'writing',
      currentTask: task,
      revisionCount: 0,
      lastActivity: new Date(),
    },
    workHistory: [],
    interactionHistory: [],
  };
}

// ============================================================================
// Bug Condition Exploration Tests
// ============================================================================

describe('AgentStore - Bug Condition Exploration (React Error #185)', () => {
  beforeEach(() => {
    // Clear agent store before each test
    useAgentStore.getState().clearAgents();
    
    // Suppress console errors during test (we expect React errors)
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property 1: Fault Condition - Task Object Rendering Error
   * 
   * **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
   * 
   * This test verifies that getActiveAgents() returns description strings (not Task objects)
   * and that these strings can be rendered in React components without error #185.
   * 
   * On UNFIXED code:
   * - getActiveAgents() may return Task objects in currentTask field
   * - Attempting to render these objects causes React error #185
   * - Test FAILS, documenting the bug
   * 
   * On FIXED code:
   * - getActiveAgents() returns only description strings
   * - Strings render successfully in React components
   * - Test PASSES, confirming the fix
   */
  it('should return description strings (not Task objects) from getActiveAgents', () => {
    // Arrange: Create agents with Task objects
    const agents = [
      createAgentWithTask('writer-1', '写作AI', 'writer', '撰写论文引言部分'),
      createAgentWithTask('writer-2', '写作AI 2', 'writer', '撰写论文方法论部分'),
      createAgentWithTask('reviewer-1', '审稿专家', 'peer_reviewer', '评审论文质量'),
    ];

    // Add agents to store
    agents.forEach(agent => {
      useAgentStore.getState().addAgent(agent);
    });

    // Act: Get active agents
    const activeAgents = useAgentStore.getState().getActiveAgents();

    // Assert: currentTask should be a string (description), not a Task object
    activeAgents.forEach((agentInfo, index) => {
      // Check that currentTask exists
      expect(agentInfo.currentTask).toBeDefined();
      
      // CRITICAL: currentTask must be a string, not an object
      expect(typeof agentInfo.currentTask).toBe('string');
      
      // Verify it's the description string, not the Task object
      expect(agentInfo.currentTask).toBe(agents[index].state.currentTask?.description);
      
      // Verify it's NOT the Task object
      expect(agentInfo.currentTask).not.toEqual(agents[index].state.currentTask);
    });

    console.log('✓ getActiveAgents() returns description strings');
    console.log('  Expected: currentTask is a string (description)');
    console.log('  Actual:', activeAgents.map(a => ({ id: a.id, currentTask: a.currentTask })));
  });

  /**
   * Property 1: Fault Condition - React Component Rendering
   * 
   * This test verifies that AgentInfo objects can be rendered in WorkDisplayPanel
   * without causing React error #185.
   * 
   * On UNFIXED code:
   * - If currentTask contains a Task object, React throws error #185
   * - Test FAILS with "Objects are not valid as a React child"
   * 
   * On FIXED code:
   * - currentTask contains only description string
   * - Component renders successfully
   * - Test PASSES
   */
  it('should render AgentInfo in WorkDisplayPanel without React error #185', () => {
    // Arrange: Create agent with Task object
    const agent = createAgentWithTask(
      'writer-1',
      '写作AI',
      'writer',
      '撰写论文引言部分'
    );

    useAgentStore.getState().addAgent(agent);

    // Act: Get active agent info
    const activeAgents = useAgentStore.getState().getActiveAgents();
    const agentInfo = activeAgents[0];

    // Assert: AgentInfo should have string currentTask
    expect(typeof agentInfo.currentTask).toBe('string');

    // Act: Render in WorkDisplayPanel
    // This will throw React error #185 if currentTask is an object
    const { container } = render(
      <WorkDisplayPanel
        agent={agentInfo}
        status="writing"
        currentTask={agentInfo.currentTask}
      />
    );

    // Assert: Component should render successfully
    expect(container).toBeTruthy();
    
    // Verify the description string is in the DOM
    expect(container.textContent).toContain('撰写论文引言部分');

    console.log('✓ WorkDisplayPanel rendered successfully with description string');
  });

  /**
   * Property 1: Fault Condition - Multiple Agents with Tasks
   * 
   * Tests that multiple agents with Task objects all return description strings.
   */
  it('should handle multiple agents with Task objects', () => {
    // Arrange: Create multiple agents with different tasks
    const agents = [
      createAgentWithTask('writer-1', '写作AI 1', 'writer', '撰写引言'),
      createAgentWithTask('writer-2', '写作AI 2', 'writer', '撰写方法论'),
      createAgentWithTask('writer-3', '写作AI 3', 'writer', '撰写结论'),
      createAgentWithTask('supervisor-1', '监管AI', 'supervisor', '监控整体进度'),
      createAgentWithTask('reviewer-1', '审稿专家', 'peer_reviewer', '评审论文'),
    ];

    agents.forEach(agent => {
      useAgentStore.getState().addAgent(agent);
    });

    // Act: Get active agents
    const activeAgents = useAgentStore.getState().getActiveAgents();

    // Assert: All should have string currentTask
    expect(activeAgents).toHaveLength(5);
    
    activeAgents.forEach((agentInfo, index) => {
      expect(typeof agentInfo.currentTask).toBe('string');
      expect(agentInfo.currentTask).toBe(agents[index].state.currentTask?.description);
    });

    console.log('✓ All agents return description strings');
  });

  /**
   * Property 1: Fault Condition - Task with All Properties
   * 
   * Tests that even when Task has all optional properties (deadline, dependencies),
   * only the description string is returned.
   */
  it('should extract description from Task with all properties', () => {
    // Arrange: Create agent with complex Task object
    const complexTask: Task = {
      id: 'task-complex',
      description: '撰写完整论文',
      assignedBy: 'decision-ai',
      priority: 'high',
      deadline: new Date('2024-12-31'),
      dependencies: ['task-1', 'task-2', 'task-3'],
    };

    const agent: Agent = {
      id: 'writer-complex',
      config: {
        id: 'writer-complex',
        name: '高级写作AI',
        role: 'writer',
        promptTemplate: 'prompts/writer.yaml',
        aiService: 'test-service',
        capabilities: {
          canInternetAccess: true,
          canStreamOutput: true,
          canInteractWithPeers: true,
        },
      },
      state: {
        status: 'writing',
        currentTask: complexTask,
        revisionCount: 0,
        lastActivity: new Date(),
      },
      workHistory: [],
      interactionHistory: [],
    };

    useAgentStore.getState().addAgent(agent);

    // Act: Get active agents
    const activeAgents = useAgentStore.getState().getActiveAgents();
    const agentInfo = activeAgents[0];

    // Assert: Should return only description string, not the entire Task object
    expect(typeof agentInfo.currentTask).toBe('string');
    expect(agentInfo.currentTask).toBe('撰写完整论文');
    
    // Verify it's NOT the Task object with all properties
    expect(agentInfo.currentTask).not.toHaveProperty('id');
    expect(agentInfo.currentTask).not.toHaveProperty('assignedBy');
    expect(agentInfo.currentTask).not.toHaveProperty('priority');
    expect(agentInfo.currentTask).not.toHaveProperty('deadline');
    expect(agentInfo.currentTask).not.toHaveProperty('dependencies');

    console.log('✓ Complex Task object correctly reduced to description string');
  });

  /**
   * Property 1: Fault Condition - Direct Object Rendering Attempt
   * 
   * This test directly demonstrates what happens when a Task object is rendered.
   * 
   * On UNFIXED code: If getActiveAgents() returns Task objects, this will fail
   * On FIXED code: getActiveAgents() returns strings, this will pass
   */
  it('should not return objects that would cause React error #185', () => {
    // Arrange: Create agent with Task
    const agent = createAgentWithTask(
      'writer-1',
      '写作AI',
      'writer',
      '撰写论文'
    );

    useAgentStore.getState().addAgent(agent);

    // Act: Get active agents
    const activeAgents = useAgentStore.getState().getActiveAgents();
    const agentInfo = activeAgents[0];

    // Assert: currentTask must not be an object with properties
    if (typeof agentInfo.currentTask === 'object' && agentInfo.currentTask !== null) {
      // This would cause React error #185
      console.error('❌ BUG DETECTED: currentTask is an object, not a string!');
      console.error('   This will cause React error #185 when rendered');
      console.error('   Object:', agentInfo.currentTask);
      
      // Fail the test to document the bug
      expect(typeof agentInfo.currentTask).toBe('string');
    } else {
      // This is the expected behavior
      expect(typeof agentInfo.currentTask).toBe('string');
      console.log('✓ currentTask is a string, safe to render in React');
    }
  });
});

/**
 * COUNTEREXAMPLES DOCUMENTATION
 * 
 * When this test is run on UNFIXED code, the following counterexamples are expected:
 * 
 * 1. getActiveAgents() returns Task objects instead of description strings
 *    - Input: Agent with currentTask = {id: 'task-1', description: '撰写引言', ...}
 *    - Expected: agentInfo.currentTask = '撰写引言' (string)
 *    - Actual (unfixed): agentInfo.currentTask = {id: 'task-1', description: '撰写引言', ...} (object)
 *    - Error: React error #185 when attempting to render
 * 
 * 2. WorkDisplayPanel crashes when rendering Task objects
 *    - Input: AgentInfo with currentTask as Task object
 *    - Expected: Renders description string successfully
 *    - Actual (unfixed): Throws "Objects are not valid as a React child (found: object with keys {id, description, assignedBy, priority})"
 *    - Effect: Component crashes, UI breaks
 * 
 * 3. Multiple agents all return Task objects
 *    - Input: 5 agents with different Task objects
 *    - Expected: All return description strings
 *    - Actual (unfixed): All return Task objects
 *    - Effect: Entire UI crashes when trying to render agent list
 * 
 * 4. Complex Task objects with all properties still cause error
 *    - Input: Task with id, description, assignedBy, priority, deadline, dependencies
 *    - Expected: Only description string extracted
 *    - Actual (unfixed): Entire Task object returned
 *    - Effect: React error #185 with all property keys listed
 * 
 * ROOT CAUSE:
 * The getActiveAgents() method in agentStore.ts should extract only the description
 * string from agent.state.currentTask, but somewhere in the code path, the entire
 * Task object is being passed to React components instead of just the description.
 * 
 * EXPECTED FIX:
 * Ensure that getActiveAgents() and all UI components extract only
 * agent.state.currentTask?.description (string) instead of passing
 * agent.state.currentTask (Task object).
 */
