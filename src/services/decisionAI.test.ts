/**
 * Decision AI服务单元测试
 * Decision AI Service Unit Tests
 * 
 * 测试题目分析、工作量评估、团队组建和动态角色增加功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DecisionAI, type WorkloadLevel } from './decisionAI';
import type { AIClient } from '../types/ai-client';
import type { AgentManager } from './agentManager';
import type { AIResponse } from '../types/ai-client';

// ============================================================================
// Mock Setup
// ============================================================================

const mockAIClient: AIClient = {
  sendRequest: vi.fn(),
  validateConnection: vi.fn(),
  performWebSearch: vi.fn(),
  getSearchHistory: vi.fn(),
  clearSearchHistory: vi.fn(),
};

const mockAgentManager: AgentManager = {
  createAgent: vi.fn(),
  destroyAgent: vi.fn(),
  getActiveAgents: vi.fn(),
  addDynamicAgent: vi.fn(),
  getAgent: vi.fn(),
  updateAgent: vi.fn(),
};

// Mock promptLoader
vi.mock('./promptLoader', () => ({
  loadPrompt: vi.fn().mockResolvedValue({
    template: {
      version: '1.0',
      role: 'decision',
      description: 'Decision AI',
      systemPrompt: 'You are a decision AI',
      templates: {
        workload_analysis_template: 'Analyze: {{topic}}',
        task_allocation_template: 'Allocate tasks for: {{topic}}',
        dynamic_addition_template: 'Situation: {{situation}}, Bottleneck: {{bottleneck}}',
      },
      variables: [],
    },
    resolvedSystemPrompt: 'You are a decision AI',
    resolvedTemplates: {
      workload_analysis_template: 'Analyze: Test Topic',
      task_allocation_template: 'Allocate tasks for: Test Topic',
      dynamic_addition_template: 'Situation: Test, Bottleneck: Test',
    },
    variables: {},
  }),
}));

// ============================================================================
// Test Suite
// ============================================================================

describe('DecisionAI', () => {
  let decisionAI: DecisionAI;

  beforeEach(() => {
    vi.clearAllMocks();
    decisionAI = new DecisionAI(mockAIClient, mockAgentManager);
  });

  // ==========================================================================
  // Task 10.2: 题目分析和工作量评估
  // ==========================================================================

  describe('analyzeTopicAndAssessWorkload', () => {
    it('should analyze simple topic and return simple workload', async () => {
      // Mock AI response with workload assessment
      const mockResponse: AIResponse = {
        content: JSON.stringify({
          workload_level: 'simple',
          suggested_team_size: 1,
          estimated_days: 3,
          key_challenges: ['Basic research'],
          complexity: {
            research_field: 'simple',
            literature_review: 'simple',
            methodology: 'simple',
            data_analysis: 'simple',
          },
        }),
        usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
        finishReason: 'stop',
      };

      vi.mocked(mockAIClient.sendRequest).mockResolvedValue(mockResponse);

      const result = await decisionAI.analyzeTopicAndAssessWorkload('Simple Topic');

      expect(result.level).toBe('simple');
      expect(result.suggestedTeamSize).toBe(1);
      expect(result.estimatedDays).toBe(3);
      expect(mockAIClient.sendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          stream: false,
          temperature: 0.7,
        })
      );
    });

    it('should analyze complex topic and return complex workload', async () => {
      const mockResponse: AIResponse = {
        content: JSON.stringify({
          workload_level: 'complex',
          suggested_team_size: 4,
          estimated_days: 10,
          key_challenges: ['Advanced research', 'Complex methodology'],
          complexity: {
            research_field: 'complex',
            literature_review: 'complex',
            methodology: 'complex',
            data_analysis: 'complex',
          },
        }),
        usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
        finishReason: 'stop',
      };

      vi.mocked(mockAIClient.sendRequest).mockResolvedValue(mockResponse);

      const result = await decisionAI.analyzeTopicAndAssessWorkload(
        'A Comprehensive Analysis of Advanced Machine Learning Techniques in Natural Language Processing'
      );

      expect(result.level).toBe('complex');
      expect(result.suggestedTeamSize).toBe(4);
      expect(result.estimatedDays).toBe(10);
    });

    it('should use heuristic assessment when AI response parsing fails', async () => {
      const mockResponse: AIResponse = {
        content: 'Invalid JSON response',
        usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
        finishReason: 'stop',
      };

      vi.mocked(mockAIClient.sendRequest).mockResolvedValue(mockResponse);

      const result = await decisionAI.analyzeTopicAndAssessWorkload('Short');

      // Should use heuristic based on topic length
      expect(result.level).toBe('simple');
      expect(result.suggestedTeamSize).toBeGreaterThan(0);
      expect(result.estimatedDays).toBeGreaterThan(0);
    });

    it('should estimate medium workload for medium-length topics', async () => {
      const mockResponse: AIResponse = {
        content: 'Invalid response',
        usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
        finishReason: 'stop',
      };

      vi.mocked(mockAIClient.sendRequest).mockResolvedValue(mockResponse);

      const result = await decisionAI.analyzeTopicAndAssessWorkload(
        'Machine Learning Applications in Healthcare Systems and Clinical Decision Support'
      );

      // Heuristic uses word count: 9 words should be medium
      expect(result.level).toBe('medium');
      expect(result.suggestedTeamSize).toBe(2);
    });
  });

  // ==========================================================================
  // Task 10.3: 团队组建和任务分配
  // ==========================================================================

  describe('buildTeamAndAllocateTasks', () => {
    it('should build team and allocate tasks based on assessment', async () => {
      const assessment = {
        level: 'medium' as WorkloadLevel,
        suggestedTeamSize: 2,
        estimatedDays: 5,
        keyChallen: [],
        complexity: {
          researchField: 'medium' as WorkloadLevel,
          literatureReview: 'medium' as WorkloadLevel,
          methodology: 'medium' as WorkloadLevel,
          dataAnalysis: 'medium' as WorkloadLevel,
        },
      };

      const mockResponse: AIResponse = {
        content: JSON.stringify({
          messageType: 'task_assignment',
          sender: 'decision_ai',
          receiver: ['writer_1', 'writer_2'],
          content: {
            text: 'Writer 1 - Introduction\n- Write background\nWriter 2 - Methods\n- Describe methodology',
          },
          metadata: {
            timestamp: new Date().toISOString(),
            requiresResponse: true,
            priority: 'high',
          },
        }),
        usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
        finishReason: 'stop',
      };

      vi.mocked(mockAIClient.sendRequest).mockResolvedValue(mockResponse);
      vi.mocked(mockAgentManager.createAgent).mockResolvedValue({
        id: 'writer_1',
        config: {
          id: 'writer_1',
          name: '写作AI 1',
          role: 'writer',
          promptTemplate: 'prompts/writer.yaml',
          aiService: 'default',
          capabilities: {
            canInternetAccess: true,
            canStreamOutput: true,
            canInteractWithPeers: true,
          },
        },
        state: {
          status: 'idle',
          revisionCount: 0,
          lastActivity: new Date(),
        },
        workHistory: [],
        interactionHistory: [],
      });

      const result = await decisionAI.buildTeamAndAllocateTasks('Test Topic', assessment);

      expect(result.teamMembers).toHaveLength(2);
      expect(result.teamMembers[0].id).toBe('writer_1');
      expect(result.teamMembers[1].id).toBe('writer_2');
      expect(mockAgentManager.createAgent).toHaveBeenCalledTimes(2);
    });

    it('should create correct number of team members', async () => {
      const assessment = {
        level: 'complex' as WorkloadLevel,
        suggestedTeamSize: 4,
        estimatedDays: 10,
        keyChallen: [],
        complexity: {
          researchField: 'complex' as WorkloadLevel,
          literatureReview: 'complex' as WorkloadLevel,
          methodology: 'complex' as WorkloadLevel,
          dataAnalysis: 'complex' as WorkloadLevel,
        },
      };

      const mockResponse: AIResponse = {
        content: 'Invalid format',
        usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
        finishReason: 'stop',
      };

      vi.mocked(mockAIClient.sendRequest).mockResolvedValue(mockResponse);
      vi.mocked(mockAgentManager.createAgent).mockResolvedValue({
        id: 'writer_1',
        config: {
          id: 'writer_1',
          name: '写作AI 1',
          role: 'writer',
          promptTemplate: 'prompts/writer.yaml',
          aiService: 'default',
          capabilities: {
            canInternetAccess: true,
            canStreamOutput: true,
            canInteractWithPeers: true,
          },
        },
        state: {
          status: 'idle',
          revisionCount: 0,
          lastActivity: new Date(),
        },
        workHistory: [],
        interactionHistory: [],
      });

      const result = await decisionAI.buildTeamAndAllocateTasks('Test Topic', assessment);

      expect(result.teamMembers).toHaveLength(4);
      expect(mockAgentManager.createAgent).toHaveBeenCalledTimes(4);
    });

    it('should generate valid task assignment message', async () => {
      const assessment = {
        level: 'simple' as WorkloadLevel,
        suggestedTeamSize: 1,
        estimatedDays: 3,
        keyChallen: [],
        complexity: {
          researchField: 'simple' as WorkloadLevel,
          literatureReview: 'simple' as WorkloadLevel,
          methodology: 'simple' as WorkloadLevel,
          dataAnalysis: 'simple' as WorkloadLevel,
        },
      };

      const mockResponse: AIResponse = {
        content: 'Invalid format',
        usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
        finishReason: 'stop',
      };

      vi.mocked(mockAIClient.sendRequest).mockResolvedValue(mockResponse);
      vi.mocked(mockAgentManager.createAgent).mockResolvedValue({
        id: 'writer_1',
        config: {
          id: 'writer_1',
          name: '写作AI 1',
          role: 'writer',
          promptTemplate: 'prompts/writer.yaml',
          aiService: 'default',
          capabilities: {
            canInternetAccess: true,
            canStreamOutput: true,
            canInteractWithPeers: true,
          },
        },
        state: {
          status: 'idle',
          revisionCount: 0,
          lastActivity: new Date(),
        },
        workHistory: [],
        interactionHistory: [],
      });

      const result = await decisionAI.buildTeamAndAllocateTasks('Test Topic', assessment);

      expect(result.allocationMessage.type).toBe('task_assignment');
      expect(result.allocationMessage.sender).toBe('decision_ai');
      expect(result.allocationMessage.metadata.priority).toBe('high');
    });
  });

  // ==========================================================================
  // Task 10.6: 动态角色增加决策
  // ==========================================================================

  describe('decideDynamicRoleAddition', () => {
    it('should decide to add new role when bottleneck detected', async () => {
      const request = {
        situation: 'Writer 1 has been revising 3 times',
        bottleneck: 'Format issues',
        currentTeamSize: 2,
        revisionCounts: { writer_1: 3, writer_2: 1 },
      };

      const mockResponse: AIResponse = {
        content: JSON.stringify({
          messageType: 'task_assignment',
          sender: 'decision_ai',
          receiver: 'writer_3',
          content: {
            text: '角色：格式专家\n任务：\n- 审查格式规范\n- 统一引用格式\n预计完成时间：1天',
          },
          metadata: {
            timestamp: new Date().toISOString(),
            requiresResponse: true,
            priority: 'high',
          },
        }),
        usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
        finishReason: 'stop',
      };

      vi.mocked(mockAIClient.sendRequest).mockResolvedValue(mockResponse);
      vi.mocked(mockAgentManager.addDynamicAgent).mockResolvedValue({
        id: 'writer_3',
        config: {
          id: 'writer_3',
          name: '格式专家',
          role: 'writer',
          promptTemplate: 'prompts/writer.yaml',
          aiService: 'default',
          capabilities: {
            canInternetAccess: true,
            canStreamOutput: true,
            canInteractWithPeers: true,
          },
        },
        state: {
          status: 'idle',
          revisionCount: 0,
          lastActivity: new Date(),
          currentTask: {
            id: 'task_1',
            description: 'Format review',
            assignedBy: 'decision_ai',
            priority: 'high',
          },
        },
        workHistory: [],
        interactionHistory: [],
      });

      const result = await decisionAI.decideDynamicRoleAddition(request);

      expect(result.shouldAdd).toBe(true);
      expect(result.roleType).toBe('writer');
      expect(result.tasks).toBeDefined();
      expect(mockAgentManager.addDynamicAgent).toHaveBeenCalled();
    });

    it('should decide not to add role when team is sufficient', async () => {
      const request = {
        situation: 'All writers working normally',
        bottleneck: 'None',
        currentTeamSize: 3,
        revisionCounts: { writer_1: 0, writer_2: 0, writer_3: 0 },
      };

      const mockResponse: AIResponse = {
        content: '当前团队配置足够，无需增加新角色。团队成员工作正常，没有检测到瓶颈。',
        usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
        finishReason: 'stop',
      };

      vi.mocked(mockAIClient.sendRequest).mockResolvedValue(mockResponse);

      const result = await decisionAI.decideDynamicRoleAddition(request);

      // The text-based extraction will still detect "增加" is NOT present, so shouldAdd should be false
      // But our current implementation checks for keywords, and if none found, defaults to not adding
      expect(result.shouldAdd).toBe(false);
      expect(result.reason).toBeDefined();
      expect(mockAgentManager.addDynamicAgent).not.toHaveBeenCalled();
    });

    it('should create assignment message when adding new role', async () => {
      const request = {
        situation: 'Need literature expert',
        bottleneck: 'Literature review quality',
        currentTeamSize: 2,
        revisionCounts: { writer_1: 2, writer_2: 1 },
      };

      const mockResponse: AIResponse = {
        content: JSON.stringify({
          messageType: 'task_assignment',
          sender: 'decision_ai',
          receiver: 'writer_3',
          content: {
            text: '角色：文献专家\n任务：\n- 深入文献综述\n- 补充相关研究\n预计完成时间：2天',
          },
          metadata: {
            timestamp: new Date().toISOString(),
            requiresResponse: true,
            priority: 'high',
          },
        }),
        usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
        finishReason: 'stop',
      };

      vi.mocked(mockAIClient.sendRequest).mockResolvedValue(mockResponse);
      vi.mocked(mockAgentManager.addDynamicAgent).mockResolvedValue({
        id: 'writer_3',
        config: {
          id: 'writer_3',
          name: '文献专家',
          role: 'writer',
          promptTemplate: 'prompts/writer.yaml',
          aiService: 'default',
          capabilities: {
            canInternetAccess: true,
            canStreamOutput: true,
            canInteractWithPeers: true,
          },
        },
        state: {
          status: 'idle',
          revisionCount: 0,
          lastActivity: new Date(),
          currentTask: {
            id: 'task_1',
            description: 'Literature review',
            assignedBy: 'decision_ai',
            priority: 'high',
          },
        },
        workHistory: [],
        interactionHistory: [],
      });

      const result = await decisionAI.decideDynamicRoleAddition(request);

      expect(result.shouldAdd).toBe(true);
      expect(result.assignmentMessage).toBeDefined();
      expect(result.assignmentMessage?.type).toBe('task_assignment');
      expect(result.assignmentMessage?.sender).toBe('decision_ai');
    });

    it('should handle AI response parsing errors gracefully', async () => {
      const request = {
        situation: 'Test situation',
        bottleneck: 'Test bottleneck',
        currentTeamSize: 2,
        revisionCounts: {},
      };

      vi.mocked(mockAIClient.sendRequest).mockRejectedValue(new Error('AI service error'));

      await expect(decisionAI.decideDynamicRoleAddition(request)).rejects.toThrow();
    });
  });

  // ==========================================================================
  // Integration Tests
  // ==========================================================================

  describe('Integration: Full workflow', () => {
    it('should complete full workflow from topic analysis to team building', async () => {
      // Step 1: Analyze topic
      const assessmentResponse: AIResponse = {
        content: JSON.stringify({
          workload_level: 'medium',
          suggested_team_size: 2,
          estimated_days: 5,
          key_challenges: ['Research', 'Writing'],
          complexity: {
            research_field: 'medium',
            literature_review: 'medium',
            methodology: 'medium',
            data_analysis: 'medium',
          },
        }),
        usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
        finishReason: 'stop',
      };

      vi.mocked(mockAIClient.sendRequest).mockResolvedValueOnce(assessmentResponse);

      const assessment = await decisionAI.analyzeTopicAndAssessWorkload('Test Topic');

      expect(assessment.level).toBe('medium');
      expect(assessment.suggestedTeamSize).toBe(2);

      // Step 2: Build team
      const allocationResponse: AIResponse = {
        content: JSON.stringify({
          messageType: 'task_assignment',
          sender: 'decision_ai',
          receiver: ['writer_1', 'writer_2'],
          content: {
            text: 'Writer 1 - Introduction\nWriter 2 - Methods',
          },
          metadata: {
            timestamp: new Date().toISOString(),
            requiresResponse: true,
            priority: 'high',
          },
        }),
        usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
        finishReason: 'stop',
      };

      vi.mocked(mockAIClient.sendRequest).mockResolvedValueOnce(allocationResponse);
      vi.mocked(mockAgentManager.createAgent).mockResolvedValue({
        id: 'writer_1',
        config: {
          id: 'writer_1',
          name: '写作AI 1',
          role: 'writer',
          promptTemplate: 'prompts/writer.yaml',
          aiService: 'default',
          capabilities: {
            canInternetAccess: true,
            canStreamOutput: true,
            canInteractWithPeers: true,
          },
        },
        state: {
          status: 'idle',
          revisionCount: 0,
          lastActivity: new Date(),
        },
        workHistory: [],
        interactionHistory: [],
      });

      const allocation = await decisionAI.buildTeamAndAllocateTasks('Test Topic', assessment);

      expect(allocation.teamMembers).toHaveLength(2);
      expect(mockAgentManager.createAgent).toHaveBeenCalledTimes(2);
    });
  });
});
