/**
 * Rejection Mechanism服务单元测试
 * Rejection Mechanism Service Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  RejectionMechanism,
  createRejectionMechanism,
  type RejectionAnalysis,
  type ProcessFixResult,
  type ProcessRestartResult,
} from './rejectionMechanism';
import type { AIClient } from '../types/ai-client';
import type { SupervisorAI } from './supervisorAI';
import type { DecisionAI } from './decisionAI';
import type { AgentManager } from './agentManager';
import type { AgentMessage } from '../types/message';

// ============================================================================
// Mock Setup
// ============================================================================

const createMockAIClient = (): AIClient => ({
  sendRequest: vi.fn(),
  validateConnection: vi.fn(),
  performWebSearch: vi.fn(),
});

const createMockSupervisorAI = (): SupervisorAI => ({
  validateOutputFormat: vi.fn(),
  requestRework: vi.fn(),
  detectShortage: vi.fn(),
  detectShortageAndNotify: vi.fn(),
  generateQualityReport: vi.fn().mockResolvedValue({
    timestamp: new Date(),
    activeAgentsCount: 3,
    totalMessages: 10,
    totalRevisions: 5,
    reworkRecords: [],
    overallStatus: 'warning',
    bottlenecks: [],
    recommendations: [],
  }),
  getReworkRecords: vi.fn().mockReturnValue([]),
  clearReworkRecords: vi.fn(),
} as any);

const createMockDecisionAI = (): DecisionAI => ({
  analyzeTopicAndAssessWorkload: vi.fn(),
  buildTeamAndAllocateTasks: vi.fn(),
  decideDynamicRoleAddition: vi.fn().mockResolvedValue({
    shouldAdd: true,
    roleType: 'writer',
    roleName: '格式专家',
    tasks: ['修复格式问题'],
    estimatedDays: 1,
  }),
} as any);

const createMockAgentManager = (): AgentManager => ({
  createAgent: vi.fn(),
  destroyAgent: vi.fn(),
  getActiveAgents: vi.fn().mockReturnValue([]),
  addDynamicAgent: vi.fn(),
  getAgent: vi.fn(),
  updateAgent: vi.fn(),
} as any);


// ============================================================================
// Tests
// ============================================================================

describe('RejectionMechanism', () => {
  let rejectionMechanism: RejectionMechanism;
  let mockAIClient: AIClient;
  let mockSupervisorAI: SupervisorAI;
  let mockDecisionAI: DecisionAI;
  let mockAgentManager: AgentManager;

  beforeEach(() => {
    mockAIClient = createMockAIClient();
    mockSupervisorAI = createMockSupervisorAI();
    mockDecisionAI = createMockDecisionAI();
    mockAgentManager = createMockAgentManager();

    rejectionMechanism = createRejectionMechanism(
      mockAIClient,
      mockSupervisorAI,
      mockDecisionAI,
      mockAgentManager
    );
  });

  describe('shouldTrigger', () => {
    it('应该在退稿次数达到3次时触发', () => {
      expect(rejectionMechanism.shouldTrigger(3)).toBe(true);
    });

    it('应该在退稿次数超过3次时触发', () => {
      expect(rejectionMechanism.shouldTrigger(5)).toBe(true);
    });

    it('应该在退稿次数小于3次时不触发', () => {
      expect(rejectionMechanism.shouldTrigger(2)).toBe(false);
      expect(rejectionMechanism.shouldTrigger(1)).toBe(false);
      expect(rejectionMechanism.shouldTrigger(0)).toBe(false);
    });
  });

  describe('analyzeRejection', () => {
    it('应该分析退稿原因并识别瓶颈', async () => {
      // 设置mock返回值
      vi.mocked(mockSupervisorAI.getReworkRecords).mockReturnValue([
        {
          agentId: 'writer_1',
          count: 4,
          reasons: ['格式不符合Output_Format规范'],
          lastReworkTime: new Date(),
        },
      ]);

      const rejectionMessages: AgentMessage[] = [
        {
          id: 'msg_1',
          type: 'rejection',
          sender: 'supervisor_ai',
          receiver: 'writer_1',
          content: '格式问题',
          metadata: {
            timestamp: new Date().toISOString(),
            requiresResponse: true,
            priority: 'high',
          },
          timestamp: new Date(),
        },
      ];

      const analysis = await rejectionMechanism.analyzeRejection(3, rejectionMessages);

      expect(analysis.rejectionCount).toBe(3);
      expect(analysis.reasons.length).toBeGreaterThan(0);
      expect(analysis.bottlenecks.length).toBeGreaterThan(0);
      expect(analysis.suggestedActions.length).toBeGreaterThan(0);
      expect(analysis.timestamp).toBeInstanceOf(Date);
    });

    it('应该识别格式问题', async () => {
      vi.mocked(mockSupervisorAI.getReworkRecords).mockReturnValue([
        {
          agentId: 'writer_1',
          count: 3,
          reasons: ['格式不符合Output_Format规范', '缺少必需字段'],
          lastReworkTime: new Date(),
        },
      ]);

      const analysis = await rejectionMechanism.analyzeRejection(3, []);

      const formatReason = analysis.reasons.find((r) => r.category === 'format');
      expect(formatReason).toBeDefined();
      expect(formatReason?.affectedSections).toContain('writer_1');
    });

    it('应该识别人手不足瓶颈', async () => {
      vi.mocked(mockSupervisorAI.getReworkRecords).mockReturnValue([
        {
          agentId: 'writer_1',
          count: 5,
          reasons: ['工作量过大'],
          lastReworkTime: new Date(),
        },
      ]);

      const analysis = await rejectionMechanism.analyzeRejection(3, []);

      const personnelBottleneck = analysis.bottlenecks.find(
        (b) => b.type === 'insufficient_personnel'
      );
      expect(personnelBottleneck).toBeDefined();
      expect(personnelBottleneck?.affectedAgents).toContain('writer_1');
    });
  });

  describe('fixProcess', () => {
    it('应该执行修复动作并增加新角色', async () => {
      const analysis: RejectionAnalysis = {
        rejectionCount: 3,
        reasons: [
          {
            category: 'format',
            description: '格式问题',
            affectedSections: ['writer_1'],
            severity: 'critical',
          },
        ],
        bottlenecks: [
          {
            type: 'insufficient_personnel',
            description: '人手不足',
            affectedAgents: ['writer_1'],
            suggestedRoleType: 'writer',
          },
        ],
        suggestedActions: [
          {
            type: 'add_agent',
            description: '增加格式专家',
            priority: 10,
            newRoleType: 'writer',
          },
        ],
        timestamp: new Date(),
      };

      const result = await rejectionMechanism.fixProcess(analysis);

      expect(result.success).toBe(true);
      expect(result.actionsExecuted.length).toBeGreaterThan(0);
      expect(result.newAgentsAdded.length).toBeGreaterThan(0);
      expect(mockDecisionAI.decideDynamicRoleAddition).toHaveBeenCalled();
    });

    it('应该处理修复失败的情况', async () => {
      vi.mocked(mockDecisionAI.decideDynamicRoleAddition).mockResolvedValue({
        shouldAdd: false,
        reason: '当前团队配置充足',
      });

      const analysis: RejectionAnalysis = {
        rejectionCount: 3,
        reasons: [],
        bottlenecks: [
          {
            type: 'insufficient_personnel',
            description: '人手不足',
            affectedAgents: ['writer_1'],
          },
        ],
        suggestedActions: [
          {
            type: 'add_agent',
            description: '增加角色',
            priority: 10,
          },
        ],
        timestamp: new Date(),
      };

      const result = await rejectionMechanism.fixProcess(analysis);

      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('restartProcess', () => {
    it('应该重启流程并保留历史记录', async () => {
      const mockAgent = {
        id: 'writer_1',
        config: {
          id: 'writer_1',
          name: '写作AI 1',
          role: 'writer' as const,
          promptTemplate: 'prompts/writer.yaml',
          aiService: 'default',
          capabilities: {
            canInternetAccess: true,
            canStreamOutput: true,
            canInteractWithPeers: true,
          },
        },
        state: {
          status: 'writing' as const,
          currentTask: {
            id: 'task_1',
            description: '撰写引言',
            assignedBy: 'decision_ai',
            priority: 'high' as const,
          },
          revisionCount: 3,
          lastActivity: new Date(),
        },
        workHistory: [],
        interactionHistory: [],
      };

      vi.mocked(mockAgentManager.getActiveAgents).mockReturnValue([mockAgent]);

      const result = await rejectionMechanism.restartProcess(true, true);

      expect(result.success).toBe(true);
      expect(result.preservedHistory).toBe(true);
      expect(result.preservedRevisions).toBe(true);
      expect(result.newProcessId).toBeTruthy();
      expect(mockAgentManager.updateAgent).toHaveBeenCalled();
    });

    it('应该重启流程并清除修订信息', async () => {
      const mockAgent = {
        id: 'writer_1',
        config: {
          id: 'writer_1',
          name: '写作AI 1',
          role: 'writer' as const,
          promptTemplate: 'prompts/writer.yaml',
          aiService: 'default',
          capabilities: {
            canInternetAccess: true,
            canStreamOutput: true,
            canInteractWithPeers: true,
          },
        },
        state: {
          status: 'writing' as const,
          currentTask: undefined,
          revisionCount: 3,
          lastActivity: new Date(),
        },
        workHistory: [],
        interactionHistory: [],
      };

      vi.mocked(mockAgentManager.getActiveAgents).mockReturnValue([mockAgent]);

      const result = await rejectionMechanism.restartProcess(false, false);

      expect(result.success).toBe(true);
      expect(result.preservedHistory).toBe(false);
      expect(result.preservedRevisions).toBe(false);
      expect(mockSupervisorAI.clearReworkRecords).toHaveBeenCalled();
    });

    it('应该处理重启失败的情况', async () => {
      vi.mocked(mockAgentManager.getActiveAgents).mockImplementation(() => {
        throw new Error('获取Agent失败');
      });

      const result = await rejectionMechanism.restartProcess();

      expect(result.success).toBe(false);
      expect(result.message).toContain('失败');
    });
  });

  describe('getRejectionHistory', () => {
    it('应该返回退稿历史记录', async () => {
      vi.mocked(mockSupervisorAI.getReworkRecords).mockReturnValue([]);

      await rejectionMechanism.analyzeRejection(3, []);
      await rejectionMechanism.analyzeRejection(4, []);

      const history = rejectionMechanism.getRejectionHistory();

      expect(history.length).toBe(2);
      expect(history[0].rejectionCount).toBe(3);
      expect(history[1].rejectionCount).toBe(4);
    });
  });

  describe('clearRejectionHistory', () => {
    it('应该清除退稿历史记录', async () => {
      vi.mocked(mockSupervisorAI.getReworkRecords).mockReturnValue([]);

      await rejectionMechanism.analyzeRejection(3, []);
      
      rejectionMechanism.clearRejectionHistory();
      
      const history = rejectionMechanism.getRejectionHistory();
      expect(history.length).toBe(0);
    });
  });

  describe('边缘情况测试', () => {
    it('应该处理空的退稿消息列表', async () => {
      vi.mocked(mockSupervisorAI.getReworkRecords).mockReturnValue([]);

      const analysis = await rejectionMechanism.analyzeRejection(3, []);

      expect(analysis.reasons.length).toBeGreaterThan(0);
      expect(analysis.suggestedActions.length).toBeGreaterThan(0);
    });

    it('应该处理空的返工记录', async () => {
      vi.mocked(mockSupervisorAI.getReworkRecords).mockReturnValue([]);

      const analysis = await rejectionMechanism.analyzeRejection(3, []);

      expect(analysis).toBeDefined();
      expect(analysis.bottlenecks).toBeDefined();
    });

    it('应该处理没有活跃Agent的情况', async () => {
      vi.mocked(mockAgentManager.getActiveAgents).mockReturnValue([]);

      const result = await rejectionMechanism.restartProcess();

      expect(result.success).toBe(true);
    });
  });

  describe('createRejectionMechanism工厂函数', () => {
    it('应该创建RejectionMechanism实例', () => {
      const instance = createRejectionMechanism(
        mockAIClient,
        mockSupervisorAI,
        mockDecisionAI,
        mockAgentManager
      );

      expect(instance).toBeInstanceOf(RejectionMechanism);
    });
  });
});
