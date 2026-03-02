/**
 * Preservation Property Tests for React Error #185 Fix
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 * 
 * IMPORTANT: These tests follow the observation-first methodology.
 * They observe and document the CORRECT behavior on UNFIXED code for:
 * - Agents without currentTask (undefined case)
 * - Agent property mapping (id, name, role, avatar)
 * - Message filtering and display
 * 
 * These tests should PASS on UNFIXED code (confirming baseline behavior).
 * After implementing the fix, these tests should STILL PASS (confirming no regressions).
 * 
 * Goal: Ensure the fix for Task object rendering does NOT break existing functionality.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useAgentStore } from './agentStore';
import type { Agent } from '../types/agent';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Create a test agent WITHOUT a currentTask (undefined case)
 */
function createIdleAgent(
  id: string,
  name: string,
  role: Agent['config']['role']
): Agent {
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
      status: 'idle',
      currentTask: undefined, // No task assigned
      revisionCount: 0,
      lastActivity: new Date(),
    },
    workHistory: [],
    interactionHistory: [],
  };
}

/**
 * Create a test agent with a currentTask (for mixed scenarios)
 */
function createBusyAgent(
  id: string,
  name: string,
  role: Agent['config']['role'],
  taskDescription: string
): Agent {
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
      currentTask: {
        id: `task-${id}`,
        description: taskDescription,
        assignedBy: 'decision-ai',
        priority: 'high',
      },
      revisionCount: 0,
      lastActivity: new Date(),
    },
    workHistory: [],
    interactionHistory: [],
  };
}

// ============================================================================
// Preservation Property Tests
// ============================================================================

describe('AgentStore - Preservation Properties (Undefined Task Handling)', () => {
  beforeEach(() => {
    // Clear agent store before each test
    useAgentStore.getState().clearAgents();
  });

  /**
   * Property 2: Preservation - Undefined Task Handling
   * 
   * Observation: On UNFIXED code, agents with currentTask=undefined render correctly
   * without errors. The AgentInfo.currentTask field is undefined, and this is handled
   * gracefully by UI components.
   * 
   * This test verifies that after the fix, this behavior is preserved.
   */
  it('should handle agents with undefined currentTask correctly', () => {
    // Arrange: Create agents without currentTask
    const idleAgents = [
      createIdleAgent('idle-1', '空闲AI 1', 'writer'),
      createIdleAgent('idle-2', '空闲AI 2', 'peer_reviewer'),
      createIdleAgent('idle-3', '空闲AI 3', 'deputy_editor'),
    ];

    idleAgents.forEach(agent => {
      useAgentStore.getState().addAgent(agent);
    });

    // Act: Get active agents
    const activeAgents = useAgentStore.getState().getActiveAgents();

    // Assert: All should have undefined currentTask
    expect(activeAgents).toHaveLength(3);
    
    activeAgents.forEach((agentInfo, index) => {
      // currentTask should be undefined
      expect(agentInfo.currentTask).toBeUndefined();
      
      // Other properties should be correctly mapped
      expect(agentInfo.id).toBe(idleAgents[index].id);
      expect(agentInfo.name).toBe(idleAgents[index].config.name);
      expect(agentInfo.role).toBe(idleAgents[index].config.role);
    });

    console.log('✓ Agents with undefined currentTask handled correctly');
    console.log('  All AgentInfo.currentTask values are undefined');
  });

  /**
   * Property 2: Preservation - Agent Properties Mapping
   * 
   * Observation: On UNFIXED code, agent properties (id, name, role) are correctly
   * mapped from Agent to AgentInfo, regardless of whether currentTask is defined.
   * 
   * This test verifies that the fix does not affect property mapping.
   */
  it('should correctly map agent properties (id, name, role) to AgentInfo', () => {
    // Arrange: Create agents with various properties
    const agents = [
      createIdleAgent('agent-1', '测试AI 1', 'writer'),
      createIdleAgent('agent-2', '测试AI 2', 'peer_reviewer'),
      createIdleAgent('agent-3', '测试AI 3', 'deputy_editor'),
      createIdleAgent('agent-4', '测试AI 4', 'editor_in_chief'),
      createIdleAgent('agent-5', '测试AI 5', 'supervisor'),
    ];

    agents.forEach(agent => {
      useAgentStore.getState().addAgent(agent);
    });

    // Act: Get active agents
    const activeAgents = useAgentStore.getState().getActiveAgents();

    // Assert: All properties should be correctly mapped
    expect(activeAgents).toHaveLength(5);
    
    activeAgents.forEach((agentInfo, index) => {
      const originalAgent = agents[index];
      
      // Verify property mapping
      expect(agentInfo.id).toBe(originalAgent.id);
      expect(agentInfo.name).toBe(originalAgent.config.name);
      expect(agentInfo.role).toBe(originalAgent.config.role);
      expect(agentInfo.currentTask).toBeUndefined();
    });

    console.log('✓ Agent properties correctly mapped to AgentInfo');
    console.log('  id, name, role all match original Agent data');
  });

  /**
   * Property 2: Preservation - Mixed Agents (With and Without Tasks)
   * 
   * Observation: On UNFIXED code, when some agents have tasks and others don't,
   * getActiveAgents() correctly handles both cases:
   * - Agents with tasks: currentTask is defined (string or object, depending on bug)
   * - Agents without tasks: currentTask is undefined
   * 
   * This test verifies that after the fix, undefined tasks remain undefined.
   */
  it('should handle mixed agents (some with tasks, some without)', () => {
    // Arrange: Create mix of idle and busy agents
    const agents = [
      createIdleAgent('idle-1', '空闲AI 1', 'writer'),
      createBusyAgent('busy-1', '忙碌AI 1', 'writer', '撰写论文'),
      createIdleAgent('idle-2', '空闲AI 2', 'peer_reviewer'),
      createBusyAgent('busy-2', '忙碌AI 2', 'peer_reviewer', '评审论文'),
      createIdleAgent('idle-3', '空闲AI 3', 'deputy_editor'),
    ];

    agents.forEach(agent => {
      useAgentStore.getState().addAgent(agent);
    });

    // Act: Get active agents
    const activeAgents = useAgentStore.getState().getActiveAgents();

    // Assert: Verify each agent's currentTask state
    expect(activeAgents).toHaveLength(5);
    
    // idle-1: should have undefined currentTask
    expect(activeAgents[0].id).toBe('idle-1');
    expect(activeAgents[0].currentTask).toBeUndefined();
    
    // busy-1: should have defined currentTask (string after fix)
    expect(activeAgents[1].id).toBe('busy-1');
    expect(activeAgents[1].currentTask).toBeDefined();
    
    // idle-2: should have undefined currentTask
    expect(activeAgents[2].id).toBe('idle-2');
    expect(activeAgents[2].currentTask).toBeUndefined();
    
    // busy-2: should have defined currentTask (string after fix)
    expect(activeAgents[3].id).toBe('busy-2');
    expect(activeAgents[3].currentTask).toBeDefined();
    
    // idle-3: should have undefined currentTask
    expect(activeAgents[4].id).toBe('idle-3');
    expect(activeAgents[4].currentTask).toBeUndefined();

    console.log('✓ Mixed agents handled correctly');
    console.log('  Idle agents: currentTask = undefined');
    console.log('  Busy agents: currentTask = defined');
  });

  /**
   * Property 2: Preservation - getAllAgents() Unchanged
   * 
   * Observation: On UNFIXED code, getAllAgents() returns all agents with their
   * complete data structures. This method should be completely unaffected by the fix.
   * 
   * This test verifies that getAllAgents() behavior is preserved.
   */
  it('should preserve getAllAgents() behavior', () => {
    // Arrange: Create agents
    const agents = [
      createIdleAgent('agent-1', 'AI 1', 'writer'),
      createIdleAgent('agent-2', 'AI 2', 'peer_reviewer'),
      createBusyAgent('agent-3', 'AI 3', 'deputy_editor', '编辑论文'),
    ];

    agents.forEach(agent => {
      useAgentStore.getState().addAgent(agent);
    });

    // Act: Get all agents
    const allAgents = useAgentStore.getState().getAllAgents();

    // Assert: Should return complete Agent objects
    expect(allAgents).toHaveLength(3);
    
    allAgents.forEach((agent, index) => {
      // Verify complete Agent structure is preserved
      expect(agent.id).toBe(agents[index].id);
      expect(agent.config).toEqual(agents[index].config);
      expect(agent.state).toEqual(agents[index].state);
      expect(agent.workHistory).toEqual(agents[index].workHistory);
      expect(agent.interactionHistory).toEqual(agents[index].interactionHistory);
    });

    console.log('✓ getAllAgents() behavior preserved');
    console.log('  Returns complete Agent objects unchanged');
  });

  /**
   * Property 2: Preservation - getAgentsByRole() Unchanged
   * 
   * Observation: On UNFIXED code, getAgentsByRole() filters agents by role correctly.
   * This method should be completely unaffected by the fix.
   * 
   * This test verifies that getAgentsByRole() behavior is preserved.
   */
  it('should preserve getAgentsByRole() behavior', () => {
    // Arrange: Create agents with different roles
    const agents = [
      createIdleAgent('writer-1', 'Writer 1', 'writer'),
      createIdleAgent('writer-2', 'Writer 2', 'writer'),
      createIdleAgent('reviewer-1', 'Reviewer 1', 'peer_reviewer'),
      createBusyAgent('writer-3', 'Writer 3', 'writer', '写作任务'),
      createIdleAgent('editor-1', 'Editor 1', 'deputy_editor'),
    ];

    agents.forEach(agent => {
      useAgentStore.getState().addAgent(agent);
    });

    // Act: Get agents by role
    const writers = useAgentStore.getState().getAgentsByRole('writer');
    const reviewers = useAgentStore.getState().getAgentsByRole('peer_reviewer');
    const editors = useAgentStore.getState().getAgentsByRole('deputy_editor');

    // Assert: Should filter correctly
    expect(writers).toHaveLength(3);
    expect(reviewers).toHaveLength(1);
    expect(editors).toHaveLength(1);
    
    // Verify writers
    expect(writers[0].id).toBe('writer-1');
    expect(writers[1].id).toBe('writer-2');
    expect(writers[2].id).toBe('writer-3');
    
    // Verify reviewer
    expect(reviewers[0].id).toBe('reviewer-1');
    
    // Verify editor
    expect(editors[0].id).toBe('editor-1');

    console.log('✓ getAgentsByRole() behavior preserved');
    console.log('  Filtering by role works correctly');
  });

  /**
   * Property 2: Preservation - Empty Store Handling
   * 
   * Observation: On UNFIXED code, when no agents exist, getActiveAgents() returns
   * an empty array. This edge case should be preserved.
   */
  it('should handle empty agent store correctly', () => {
    // Arrange: Ensure store is empty
    useAgentStore.getState().clearAgents();

    // Act: Get active agents
    const activeAgents = useAgentStore.getState().getActiveAgents();

    // Assert: Should return empty array
    expect(activeAgents).toEqual([]);
    expect(activeAgents).toHaveLength(0);

    console.log('✓ Empty store handled correctly');
    console.log('  Returns empty array when no agents exist');
  });

  /**
   * Property 2: Preservation - Single Agent with Undefined Task
   * 
   * Observation: On UNFIXED code, a single agent with undefined currentTask
   * is handled correctly. This is the simplest preservation case.
   */
  it('should handle single agent with undefined currentTask', () => {
    // Arrange: Create single idle agent
    const agent = createIdleAgent('solo-agent', '单独AI', 'writer');
    useAgentStore.getState().addAgent(agent);

    // Act: Get active agents
    const activeAgents = useAgentStore.getState().getActiveAgents();

    // Assert: Should return single AgentInfo with undefined currentTask
    expect(activeAgents).toHaveLength(1);
    
    const agentInfo = activeAgents[0];
    expect(agentInfo.id).toBe('solo-agent');
    expect(agentInfo.name).toBe('单独AI');
    expect(agentInfo.role).toBe('writer');
    expect(agentInfo.currentTask).toBeUndefined();

    console.log('✓ Single agent with undefined task handled correctly');
  });

  /**
   * Property 2: Preservation - Agent Update Does Not Affect Undefined Tasks
   * 
   * Observation: On UNFIXED code, updating an agent's properties (not currentTask)
   * does not affect the undefined currentTask state.
   */
  it('should preserve undefined currentTask when updating other agent properties', () => {
    // Arrange: Create idle agent
    const agent = createIdleAgent('agent-1', 'Original Name', 'writer');
    useAgentStore.getState().addAgent(agent);

    // Act: Update agent (not currentTask)
    useAgentStore.getState().updateAgent('agent-1', {
      config: {
        ...agent.config,
        name: 'Updated Name',
      },
    });

    // Get active agents
    const activeAgents = useAgentStore.getState().getActiveAgents();

    // Assert: currentTask should still be undefined
    expect(activeAgents).toHaveLength(1);
    expect(activeAgents[0].name).toBe('Updated Name');
    expect(activeAgents[0].currentTask).toBeUndefined();

    console.log('✓ Undefined currentTask preserved after agent update');
  });
});

/**
 * PRESERVATION OBSERVATIONS SUMMARY
 * 
 * These tests document the CORRECT behavior on UNFIXED code for:
 * 
 * 1. Undefined Task Handling (Requirement 3.1):
 *    - Agents with currentTask=undefined return AgentInfo with currentTask=undefined
 *    - No errors occur when rendering undefined tasks
 *    - UI components handle undefined gracefully
 * 
 * 2. Agent Property Mapping (Requirements 3.2, 3.3, 3.4):
 *    - id, name, role are correctly mapped from Agent to AgentInfo
 *    - Property mapping is independent of currentTask state
 *    - All agent properties remain unchanged by the fix
 * 
 * 3. Mixed Agent Scenarios (Requirement 3.5):
 *    - Agents with and without tasks coexist correctly
 *    - getActiveAgents() handles both cases appropriately
 *    - Filtering and mapping work correctly for all agents
 * 
 * 4. Store Methods Unchanged:
 *    - getAllAgents() returns complete Agent objects
 *    - getAgentsByRole() filters correctly
 *    - Empty store returns empty array
 *    - Agent updates preserve undefined tasks
 * 
 * EXPECTED OUTCOME:
 * - All tests PASS on UNFIXED code (confirming baseline behavior)
 * - All tests PASS after fix (confirming no regressions)
 * 
 * If any test fails after the fix, it indicates a regression that must be addressed.
 */
