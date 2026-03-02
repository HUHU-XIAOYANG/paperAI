/**
 * Work History Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkHistoryServiceImpl } from './workHistoryService';
import type { Agent, AgentConfig } from '../types/agent';
import { useAgentStore } from '../stores/agentStore';

// Mock the agent store
vi.mock('../stores/agentStore', () => ({
  useAgentStore: {
    getState: vi.fn(),
  },
}));

describe('WorkHistoryService', () => {
  let service: WorkHistoryServiceImpl;
  let mockAgent: Agent;
  let mockGetAgent: ReturnType<typeof vi.fn>;
  let mockUpdateAgent: ReturnType<typeof vi.fn>;
  let mockGetAllAgents: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    service = new WorkHistoryServiceImpl();

    // Create mock agent
    const mockConfig: AgentConfig = {
      id: 'agent-1',
      name: 'Test Writer',
      role: 'writer',
      promptTemplate: 'test-prompt',
      aiService: 'test-service',
      capabilities: {
        canInternetAccess: false,
        canStreamOutput: true,
        canInteractWithPeers: true,
      },
    };

    mockAgent = {
      id: 'agent-1',
      config: mockConfig,
      state: {
        status: 'idle',
        revisionCount: 0,
        lastActivity: new Date(),
      },
      workHistory: [],
      interactionHistory: [],
    };

    // Setup mocks
    mockGetAgent = vi.fn().mockReturnValue(mockAgent);
    mockUpdateAgent = vi.fn();
    mockGetAllAgents = vi.fn().mockReturnValue([mockAgent]);

    (useAgentStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
      getAgent: mockGetAgent,
      updateAgent: mockUpdateAgent,
      getAllAgents: mockGetAllAgents,
    });
  });

  describe('startWork', () => {
    it('should create a new work record', () => {
      const record = service.startWork('agent-1', 'task-1', 'Write introduction');

      expect(record).toBeDefined();
      expect(record.taskId).toBe('task-1');
      expect(record.status).toBe('in_progress');
      expect(record.output).toBe('');
      expect(record.feedbackReceived).toEqual([]);
      expect(record.startTime).toBeInstanceOf(Date);
      expect(record.endTime).toBeUndefined();
    });

    it('should add work record to agent history', () => {
      service.startWork('agent-1', 'task-1', 'Write introduction');

      expect(mockAgent.workHistory).toHaveLength(1);
      expect(mockUpdateAgent).toHaveBeenCalledWith('agent-1', {
        workHistory: mockAgent.workHistory,
      });
    });

    it('should throw error if agent not found', () => {
      mockGetAgent.mockReturnValue(undefined);

      expect(() => {
        service.startWork('invalid-agent', 'task-1', 'Test task');
      }).toThrow('Agent not found: invalid-agent');
    });
  });

  describe('completeWork', () => {
    beforeEach(() => {
      service.startWork('agent-1', 'task-1', 'Write introduction');
    });

    it('should mark work as completed', () => {
      const output = 'Introduction content here...';
      service.completeWork('agent-1', 'task-1', output);

      const record = service.getWorkRecord('agent-1', 'task-1');
      expect(record?.status).toBe('completed');
      expect(record?.output).toBe(output);
      expect(record?.endTime).toBeInstanceOf(Date);
    });

    it('should throw error if work record not found', () => {
      expect(() => {
        service.completeWork('agent-1', 'invalid-task', 'output');
      }).toThrow('Work record not found');
    });
  });

  describe('rejectWork', () => {
    beforeEach(() => {
      service.startWork('agent-1', 'task-1', 'Write introduction');
    });

    it('should mark work as rejected and add feedback', () => {
      const feedback = 'Needs more detail';
      service.rejectWork('agent-1', 'task-1', feedback);

      const record = service.getWorkRecord('agent-1', 'task-1');
      expect(record?.status).toBe('rejected');
      expect(record?.feedbackReceived).toContain(feedback);
    });

    it('should allow multiple rejections with different feedback', () => {
      service.rejectWork('agent-1', 'task-1', 'First feedback');
      service.rejectWork('agent-1', 'task-1', 'Second feedback');

      const record = service.getWorkRecord('agent-1', 'task-1');
      expect(record?.feedbackReceived).toHaveLength(2);
    });
  });

  describe('reviseWork', () => {
    beforeEach(() => {
      service.startWork('agent-1', 'task-1', 'Write introduction');
      service.rejectWork('agent-1', 'task-1', 'Needs revision');
    });

    it('should mark work as revised with new output', () => {
      const revisedOutput = 'Revised introduction content...';
      service.reviseWork('agent-1', 'task-1', revisedOutput);

      const record = service.getWorkRecord('agent-1', 'task-1');
      expect(record?.status).toBe('revised');
      expect(record?.output).toBe(revisedOutput);
      expect(record?.endTime).toBeInstanceOf(Date);
    });
  });

  describe('addFeedback', () => {
    beforeEach(() => {
      service.startWork('agent-1', 'task-1', 'Write introduction');
    });

    it('should add feedback to work record', () => {
      service.addFeedback('agent-1', 'task-1', 'Good start');
      service.addFeedback('agent-1', 'task-1', 'Add more examples');

      const record = service.getWorkRecord('agent-1', 'task-1');
      expect(record?.feedbackReceived).toHaveLength(2);
      expect(record?.feedbackReceived).toContain('Good start');
      expect(record?.feedbackReceived).toContain('Add more examples');
    });
  });

  describe('getWorkHistory', () => {
    it('should return all work records for an agent', () => {
      service.startWork('agent-1', 'task-1', 'Task 1');
      service.startWork('agent-1', 'task-2', 'Task 2');

      const history = service.getWorkHistory('agent-1');
      expect(history).toHaveLength(2);
    });

    it('should return empty array if agent not found', () => {
      mockGetAgent.mockReturnValue(undefined);

      const history = service.getWorkHistory('invalid-agent');
      expect(history).toEqual([]);
    });
  });

  describe('getAllWorkHistory', () => {
    it('should return work history from all agents', () => {
      const mockAgent2: Agent = {
        ...mockAgent,
        id: 'agent-2',
        config: { ...mockAgent.config, id: 'agent-2', name: 'Test Reviewer' },
        workHistory: [],
      };

      mockGetAllAgents.mockReturnValue([mockAgent, mockAgent2]);

      service.startWork('agent-1', 'task-1', 'Task 1');
      
      // Manually add to second agent for testing
      mockAgent2.workHistory.push({
        taskId: 'task-2',
        startTime: new Date(),
        output: '',
        status: 'in_progress',
        feedbackReceived: [],
      });

      const allHistory = service.getAllWorkHistory();
      expect(allHistory.length).toBeGreaterThan(0);
      expect(allHistory[0]).toHaveProperty('agentId');
      expect(allHistory[0]).toHaveProperty('agentName');
    });

    it('should sort by start time (most recent first)', () => {
      const now = new Date();
      const earlier = new Date(now.getTime() - 1000);

      mockAgent.workHistory = [
        {
          taskId: 'task-1',
          startTime: earlier,
          output: '',
          status: 'completed',
          feedbackReceived: [],
        },
        {
          taskId: 'task-2',
          startTime: now,
          output: '',
          status: 'in_progress',
          feedbackReceived: [],
        },
      ];

      const allHistory = service.getAllWorkHistory();
      expect(allHistory[0].taskId).toBe('task-2');
      expect(allHistory[1].taskId).toBe('task-1');
    });
  });

  describe('exportWorkHistory', () => {
    it('should export work history as JSON string', () => {
      service.startWork('agent-1', 'task-1', 'Task 1');
      service.completeWork('agent-1', 'task-1', 'Output 1');

      const json = service.exportWorkHistory();
      expect(json).toBeTruthy();
      
      const parsed = JSON.parse(json);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle multiple tasks for same agent', () => {
      service.startWork('agent-1', 'task-1', 'Task 1');
      service.startWork('agent-1', 'task-2', 'Task 2');
      service.startWork('agent-1', 'task-3', 'Task 3');

      const history = service.getWorkHistory('agent-1');
      expect(history).toHaveLength(3);
    });

    it('should handle work lifecycle: start -> reject -> revise -> complete', () => {
      service.startWork('agent-1', 'task-1', 'Write section');
      
      let record = service.getWorkRecord('agent-1', 'task-1');
      expect(record?.status).toBe('in_progress');

      service.rejectWork('agent-1', 'task-1', 'Needs improvement');
      record = service.getWorkRecord('agent-1', 'task-1');
      expect(record?.status).toBe('rejected');

      service.reviseWork('agent-1', 'task-1', 'Revised content');
      record = service.getWorkRecord('agent-1', 'task-1');
      expect(record?.status).toBe('revised');
    });
  });
});
