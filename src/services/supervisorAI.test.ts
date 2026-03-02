/**
 * Supervisor AI服务单元测试
 * Supervisor AI Service Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupervisorAI, createSupervisorAI } from './supervisorAI';
import type { AIClient } from '../types/ai-client';
import type { AgentManager } from './agentManager';
import type { DecisionAI } from './decisionAI';
import type { Agent } from '../types/agent';

// ============================================================================
// Mock Setup
// ============================================================================

const createMockAIClient = (): AIClient => ({
  sendRequest: vi.fn().mockResolvedValue({
    content: JSON.stringify({
      messageType: 'revision_request',
      sender: 'supervisor_ai',
      receiver: 'writer_1',
      content: {
        text: '需要返工',
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requiresResponse: true,
        priority: 'high',
      },
    }),
    usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
    finishReason: 'stop',
  }),
  validateConnection: vi.fn().mockResolvedValue(true),
  performWebSearch: vi.fn().mockResolvedValue([]),
});

const createMockAgent = (id: string, revisionCount: number = 0): Agent => ({
  id,
  config: {
    id,
    name: `Agent ${id}`,
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
    revisionCount,
    lastActivity: new Date(),
  },
  workHistory: [],
  interactionHistory: [],
});

const createMockAgentManager = (): AgentManager => {
  const agents = new Map<string, Agent>();
  agents.set('writer_1', createMockAgent('writer_1', 0));
  agents.set('writer_2', createMockAgent('writer_2', 3));

  return {
    createAgent: vi.fn(),
    destroyAgent: vi.fn(),
    getActiveAgents: vi.fn().mockReturnValue(Array.from(agents.values())),
    addDynamicAgent: vi.fn(),
    getAgent: vi.fn((id: string) => agents.get(id)),
    updateAgent: vi.fn((id: string, updates: Partial<Agent>) => {
      const agent = agents.get(id);
      if (agent) {
        Object.assign(agent, updates);
      }
    }),
  };
};

const createMockDecisionAI = (): DecisionAI => ({
  analyzeTopicAndAssessWorkload: vi.fn(),
  buildTeamAndAllocateTasks: vi.fn(),
  decideDynamicRoleAddition: vi.fn().mockResolvedValue({
    shouldAdd: true,
    roleType: 'writer',
    roleName: '格式专家',
    tasks: ['审查格式规范'],
    estimatedDays: 1,
    reason: '需要格式专家协助',
  }),
} as any);

// ============================================================================
// Tests
// ============================================================================

describe('SupervisorAI', () => {
  let supervisorAI: SupervisorAI;
  let mockAIClient: AIClient;
  let mockAgentManager: AgentManager;
  let mockDecisionAI: DecisionAI;

  beforeEach(() => {
    mockAIClient = createMockAIClient();
    mockAgentManager = createMockAgentManager();
    mockDecisionAI = createMockDecisionAI();
    supervisorAI = createSupervisorAI(
      mockAIClient,
      mockAgentManager,
      mockDecisionAI
    );
  });

  describe('validateOutputFormat', () => {
    it('应该验证有效的输出格式', async () => {
      const validOutput = JSON.stringify({
        messageType: 'work_submission',
        sender: 'writer_1',
        receiver: 'supervisor_ai',
        content: {
          text: '我已完成引言部分',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requiresResponse: true,
          priority: 'high',
        },
      });

      const result = await supervisorAI.validateOutputFormat(
        validOutput,
        'writer_1'
      );

      expect(result.isValid).toBe(true);
      expect(result.shouldRework).toBe(false);
      expect(result.errors).toHaveLength(0);
    });

    it('应该检测无效的输出格式', async () => {
      const invalidOutput = JSON.stringify({
        messageType: 'work_submission',
        sender: 'writer_1',
        // 缺少 receiver 字段
        content: {
          text: '我已完成引言部分',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requiresResponse: true,
          priority: 'high',
        },
      });

      const result = await supervisorAI.validateOutputFormat(
        invalidOutput,
        'writer_1'
      );

      expect(result.isValid).toBe(false);
      expect(result.shouldRework).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('receiver');
    });

    it('应该检测非JSON格式的输出', async () => {
      const invalidOutput = 'This is not JSON';

      const result = await supervisorAI.validateOutputFormat(
        invalidOutput,
        'writer_1'
      );

      expect(result.isValid).toBe(false);
      expect(result.shouldRework).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('应该检测缺少必需字段的输出', async () => {
      const invalidOutput = JSON.stringify({
        messageType: 'work_submission',
        sender: 'writer_1',
        receiver: 'supervisor_ai',
        content: {
          text: '我已完成引言部分',
        },
        // 缺少 metadata 字段
      });

      const result = await supervisorAI.validateOutputFormat(
        invalidOutput,
        'writer_1'
      );

      expect(result.isValid).toBe(false);
      expect(result.shouldRework).toBe(true);
      expect(result.errors.some((e) => e.includes('metadata'))).toBe(true);
    });
  });

  describe('requestRework', () => {
    it('应该记录返工次数', async () => {
      await supervisorAI.requestRework('writer_1', '格式不符合规范');

      const records = supervisorAI.getReworkRecords('writer_1');
      expect(records).toHaveLength(1);
      expect(records[0].count).toBe(1);
      expect(records[0].reasons).toContain('格式不符合规范');
    });

    it('应该累计返工次数', async () => {
      await supervisorAI.requestRework('writer_1', '格式错误1');
      await supervisorAI.requestRework('writer_1', '格式错误2');
      await supervisorAI.requestRework('writer_1', '格式错误3');

      const records = supervisorAI.getReworkRecords('writer_1');
      expect(records).toHaveLength(1);
      expect(records[0].count).toBe(3);
      expect(records[0].reasons).toHaveLength(3);
    });

    it('应该更新Agent的返工次数', async () => {
      await supervisorAI.requestRework('writer_1', '格式不符合规范');

      expect(mockAgentManager.updateAgent).toHaveBeenCalledWith(
        'writer_1',
        expect.objectContaining({
          state: expect.objectContaining({
            revisionCount: 1,
          }),
        })
      );
    });

    it('应该返回返工通知消息', async () => {
      const message = await supervisorAI.requestRework(
        'writer_1',
        '格式不符合规范'
      );

      expect(message.type).toBe('revision_request');
      expect(message.sender).toBe('supervisor_ai');
      expect(message.receiver).toBe('writer_1');
      expect(message.content).toContain('返工');
      expect(message.metadata.priority).toBe('high');
    });

    it('应该在返工次数超过阈值时触发人手不足检测', async () => {
      const detectSpy = vi.spyOn(supervisorAI, 'detectShortageAndNotify');

      // 第1次返工 - 不触发
      await supervisorAI.requestRework('writer_1', '错误1');
      expect(detectSpy).not.toHaveBeenCalled();

      // 第2次返工 - 不触发
      await supervisorAI.requestRework('writer_1', '错误2');
      expect(detectSpy).not.toHaveBeenCalled();

      // 第3次返工 - 触发
      await supervisorAI.requestRework('writer_1', '错误3');
      expect(detectSpy).toHaveBeenCalled();
    });
  });

  describe('detectShortage', () => {
    it('应该检测单个AI返工次数过多', async () => {
      // 模拟返工3次
      await supervisorAI.requestRework('writer_1', '错误1');
      await supervisorAI.requestRework('writer_1', '错误2');
      await supervisorAI.requestRework('writer_1', '错误3');

      const result = await supervisorAI.detectShortage();

      expect(result.hasShortage).toBe(true);
      expect(result.affectedAgents).toContain('writer_1');
      expect(result.reason).toContain('返工次数过多');
      expect(result.priority).toBe('high');
    });

    it('应该在没有人手不足时返回正常状态', async () => {
      // 只返工1次，不超过阈值
      await supervisorAI.requestRework('writer_1', '错误1');

      const result = await supervisorAI.detectShortage();

      expect(result.hasShortage).toBe(false);
      expect(result.affectedAgents).toHaveLength(0);
      expect(result.priority).toBe('low');
    });

    it('应该建议合适的角色类型', async () => {
      // 模拟格式相关的返工
      await supervisorAI.requestRework('writer_1', '格式不符合Output_Format');
      await supervisorAI.requestRework('writer_1', '格式错误');
      await supervisorAI.requestRework('writer_1', '格式问题');

      const result = await supervisorAI.detectShortage();

      expect(result.hasShortage).toBe(true);
      expect(result.suggestedRoleType).toBeDefined();
      expect(result.suggestedRoleName).toBeDefined();
    });
  });

  describe('detectShortageAndNotify', () => {
    it('应该在检测到人手不足时通知Decision AI', async () => {
      // 模拟返工3次
      await supervisorAI.requestRework('writer_1', '错误1');
      await supervisorAI.requestRework('writer_1', '错误2');
      await supervisorAI.requestRework('writer_1', '错误3');

      const result = await supervisorAI.detectShortageAndNotify();

      expect(result).toBe(true);
      expect(mockDecisionAI.decideDynamicRoleAddition).toHaveBeenCalled();
    });

    it('应该在没有人手不足时不通知Decision AI', async () => {
      // 只返工1次
      await supervisorAI.requestRework('writer_1', '错误1');

      const result = await supervisorAI.detectShortageAndNotify();

      expect(result).toBe(false);
      expect(mockDecisionAI.decideDynamicRoleAddition).not.toHaveBeenCalled();
    });
  });

  describe('generateQualityReport', () => {
    it('应该生成包含所有必需信息的质量报告', async () => {
      // 模拟一些返工
      await supervisorAI.requestRework('writer_1', '错误1');
      await supervisorAI.requestRework('writer_2', '错误2');

      const report = await supervisorAI.generateQualityReport();

      expect(report.timestamp).toBeInstanceOf(Date);
      expect(report.activeAgentsCount).toBeGreaterThan(0);
      expect(report.totalRevisions).toBe(2);
      expect(report.reworkRecords).toHaveLength(2);
      expect(report.overallStatus).toBeDefined();
      expect(report.bottlenecks).toBeDefined();
      expect(report.recommendations).toBeDefined();
    });

    it('应该在没有问题时报告良好状态', async () => {
      const report = await supervisorAI.generateQualityReport();

      expect(report.overallStatus).toBe('good');
      expect(report.bottlenecks).toHaveLength(0);
      expect(report.recommendations.some(r => r.includes('团队运作良好'))).toBe(true);
    });

    it('应该在返工次数过多时报告警告状态', async () => {
      // 模拟返工3次
      await supervisorAI.requestRework('writer_1', '错误1');
      await supervisorAI.requestRework('writer_1', '错误2');
      await supervisorAI.requestRework('writer_1', '错误3');

      const report = await supervisorAI.generateQualityReport();

      // 3次返工会触发critical状态（因为达到退稿阈值）
      expect(report.overallStatus).toBe('critical');
      expect(report.bottlenecks.length).toBeGreaterThan(0);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('应该在接近退稿阈值时报告严重状态', async () => {
      // 模拟返工3次（达到退稿阈值）
      await supervisorAI.requestRework('writer_1', '错误1');
      await supervisorAI.requestRework('writer_1', '错误2');
      await supervisorAI.requestRework('writer_1', '错误3');

      const report = await supervisorAI.generateQualityReport();

      expect(report.overallStatus).toBe('critical');
      expect(report.bottlenecks.some((b) => b.includes('退稿'))).toBe(true);
      expect(report.recommendations.some((r) => r.includes('紧急'))).toBe(true);
    });

    it('应该包含人手不足检测结果', async () => {
      // 模拟返工3次触发人手不足
      await supervisorAI.requestRework('writer_1', '错误1');
      await supervisorAI.requestRework('writer_1', '错误2');
      await supervisorAI.requestRework('writer_1', '错误3');

      const report = await supervisorAI.generateQualityReport();

      expect(report.shortageDetection).toBeDefined();
      expect(report.shortageDetection?.hasShortage).toBe(true);
    });
  });

  describe('getReworkRecords', () => {
    it('应该返回指定Agent的返工记录', async () => {
      await supervisorAI.requestRework('writer_1', '错误1');
      await supervisorAI.requestRework('writer_2', '错误2');

      const records = supervisorAI.getReworkRecords('writer_1');

      expect(records).toHaveLength(1);
      expect(records[0].agentId).toBe('writer_1');
    });

    it('应该返回所有Agent的返工记录', async () => {
      await supervisorAI.requestRework('writer_1', '错误1');
      await supervisorAI.requestRework('writer_2', '错误2');

      const records = supervisorAI.getReworkRecords();

      expect(records).toHaveLength(2);
    });

    it('应该在没有记录时返回空数组', () => {
      const records = supervisorAI.getReworkRecords('writer_3');

      expect(records).toHaveLength(0);
    });
  });

  describe('clearReworkRecords', () => {
    it('应该清除指定Agent的返工记录', async () => {
      await supervisorAI.requestRework('writer_1', '错误1');
      await supervisorAI.requestRework('writer_2', '错误2');

      supervisorAI.clearReworkRecords('writer_1');

      const records1 = supervisorAI.getReworkRecords('writer_1');
      const records2 = supervisorAI.getReworkRecords('writer_2');

      expect(records1).toHaveLength(0);
      expect(records2).toHaveLength(1);
    });

    it('应该清除所有返工记录', async () => {
      await supervisorAI.requestRework('writer_1', '错误1');
      await supervisorAI.requestRework('writer_2', '错误2');

      supervisorAI.clearReworkRecords();

      const records = supervisorAI.getReworkRecords();

      expect(records).toHaveLength(0);
    });
  });

  describe('createSupervisorAI', () => {
    it('应该创建SupervisorAI实例', () => {
      const instance = createSupervisorAI(
        mockAIClient,
        mockAgentManager,
        mockDecisionAI
      );

      expect(instance).toBeInstanceOf(SupervisorAI);
    });
  });
});
