/**
 * Review Team单元测试
 * 
 * 测试审稿团队的核心功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ReviewTeam,
  createReviewTeam,
  REVIEW_TEAM_ROLES,
  type ReviewReport,
  type ReviewPhase,
  type ReviewDecision,
} from './reviewTeam';
import type { AgentManager } from './agentManager';
import type { IInteractionRouter } from './interactionRouter';
import type { SystemConfig } from '../types/config';
import type { Agent, AgentConfig } from '../types/agent';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock Agent Manager
const createMockAgentManager = (): AgentManager => {
  const agents = new Map<string, Agent>();

  return {
    createAgent: vi.fn(async (config: AgentConfig): Promise<Agent> => {
      const agent: Agent = {
        id: config.id,
        config,
        state: {
          status: 'idle',
          revisionCount: 0,
          lastActivity: new Date(),
        },
        workHistory: [],
        interactionHistory: [],
      };
      agents.set(config.id, agent);
      return agent;
    }),
    destroyAgent: vi.fn(async (agentId: string) => {
      agents.delete(agentId);
    }),
    getActiveAgents: vi.fn(() => Array.from(agents.values())),
    addDynamicAgent: vi.fn(),
    getAgent: vi.fn((agentId: string) => agents.get(agentId)),
    updateAgent: vi.fn((agentId: string, updates: Partial<Agent>) => {
      const agent = agents.get(agentId);
      if (agent) {
        Object.assign(agent, updates);
      }
    }),
  } as any;
};

// Mock Interaction Router
const createMockInteractionRouter = (): IInteractionRouter => {
  const teamMembers = new Map<string, Set<string>>([
    ['writing', new Set()],
    ['review', new Set()],
  ]);

  return {
    sendMessage: vi.fn(),
    subscribeToMessages: vi.fn(() => () => {}),
    broadcastToTeam: vi.fn(),
    requestFeedback: vi.fn(async () => 'Mock feedback'),
    registerTeamMember: vi.fn((teamType: string, agentId: string) => {
      teamMembers.get(teamType)?.add(agentId);
    }),
    unregisterTeamMember: vi.fn((teamType: string, agentId: string) => {
      teamMembers.get(teamType)?.delete(agentId);
    }),
    getTeamMembers: vi.fn((teamType: string) => {
      return Array.from(teamMembers.get(teamType) || []);
    }),
  } as any;
};

// Mock System Config
const createMockSystemConfig = (): SystemConfig => ({
  aiServices: [
    {
      id: 'test-service',
      name: 'Test AI Service',
      apiKey: 'test-key',
      apiUrl: 'https://test.api.com',
      model: 'test-model',
      provider: 'openai',
    },
  ],
  defaultService: 'test-service',
  promptRepositoryPath: './prompts',
  outputDirectory: './output',
  theme: 'light',
  internetAccess: {
    enabled: true,
  },
  streamingConfig: {
    chunkSize: 1024,
    updateInterval: 100,
  },
});

// ============================================================================
// Tests
// ============================================================================

describe('ReviewTeam', () => {
  let reviewTeam: ReviewTeam;
  let mockAgentManager: AgentManager;
  let mockInteractionRouter: IInteractionRouter;
  let mockSystemConfig: SystemConfig;

  beforeEach(() => {
    mockAgentManager = createMockAgentManager();
    mockInteractionRouter = createMockInteractionRouter();
    mockSystemConfig = createMockSystemConfig();

    reviewTeam = new ReviewTeam(
      mockAgentManager,
      mockInteractionRouter,
      mockSystemConfig
    );
  });

  describe('初始化', () => {
    it('应该创建4个固定角色', async () => {
      await reviewTeam.initialize();

      const members = reviewTeam.getTeamMembers();
      expect(members).toHaveLength(4);

      const roles = members.map((m) => m.config.role);
      expect(roles).toContain(REVIEW_TEAM_ROLES.EDITORIAL_OFFICE);
      expect(roles).toContain(REVIEW_TEAM_ROLES.EDITOR_IN_CHIEF);
      expect(roles).toContain(REVIEW_TEAM_ROLES.DEPUTY_EDITOR);
      expect(roles).toContain(REVIEW_TEAM_ROLES.PEER_REVIEWER);
    });

    it('应该为每个角色设置正确的名称', async () => {
      await reviewTeam.initialize();

      const members = reviewTeam.getTeamMembers();
      const names = members.map((m) => m.config.name);

      expect(names).toContain('编辑部');
      expect(names).toContain('主编');
      expect(names).toContain('副主编');
      expect(names).toContain('审稿专家');
    });

    it('应该为每个角色设置正确的提示词模板路径', async () => {
      await reviewTeam.initialize();

      const members = reviewTeam.getTeamMembers();

      members.forEach((member) => {
        expect(member.config.promptTemplate).toBe(`prompts/${member.config.role}.yaml`);
      });
    });

    it('应该将所有成员注册到review团队', async () => {
      await reviewTeam.initialize();

      const members = reviewTeam.getTeamMembers();

      members.forEach((member) => {
        expect(mockInteractionRouter.registerTeamMember).toHaveBeenCalledWith(
          'review',
          member.id
        );
      });
    });

    it('应该为所有成员启用非线性交互能力', async () => {
      await reviewTeam.initialize();

      const members = reviewTeam.getTeamMembers();

      members.forEach((member) => {
        expect(member.config.capabilities.canInteractWithPeers).toBe(true);
      });
    });
  });

  describe('开始审稿流程', () => {
    beforeEach(async () => {
      await reviewTeam.initialize();
    });

    it('应该设置初始审稿阶段为format_check', async () => {
      await reviewTeam.startReview('paper-001', 'document content');

      const state = reviewTeam.getWorkflowState();
      expect(state.currentPhase).toBe('format_check');
    });

    it('应该记录开始时间', async () => {
      const beforeStart = new Date();
      await reviewTeam.startReview('paper-001', 'document content');
      const afterStart = new Date();

      const state = reviewTeam.getWorkflowState();
      expect(state.startTime.getTime()).toBeGreaterThanOrEqual(beforeStart.getTime());
      expect(state.startTime.getTime()).toBeLessThanOrEqual(afterStart.getTime());
    });

    it('应该初始化空的审稿报告列表', async () => {
      await reviewTeam.startReview('paper-001', 'document content');

      const state = reviewTeam.getWorkflowState();
      expect(state.reports).toEqual([]);
    });

    it('应该更新Editorial Office的状态', async () => {
      await reviewTeam.startReview('paper-001', 'document content');

      expect(mockAgentManager.updateAgent).toHaveBeenCalled();
    });
  });

  describe('提交审稿报告', () => {
    beforeEach(async () => {
      await reviewTeam.initialize();
      await reviewTeam.startReview('paper-001', 'document content');
    });

    it('应该接受并存储审稿报告', async () => {
      const report: ReviewReport = {
        id: 'report-001',
        reviewer: REVIEW_TEAM_ROLES.EDITORIAL_OFFICE,
        reviewerId: 'editorial_office_123',
        phase: 'format_check',
        decision: 'accept',
        comments: '格式符合要求',
        issues: [],
        timestamp: new Date(),
      };

      await reviewTeam.submitReport(report);

      const state = reviewTeam.getWorkflowState();
      expect(state.reports).toHaveLength(1);
      expect(state.reports[0]).toEqual(report);
    });

    it('应该支持多个审稿报告', async () => {
      const report1: ReviewReport = {
        id: 'report-001',
        reviewer: REVIEW_TEAM_ROLES.EDITORIAL_OFFICE,
        reviewerId: 'editorial_office_123',
        phase: 'format_check',
        decision: 'accept',
        comments: '格式符合要求',
        issues: [],
        timestamp: new Date(),
      };

      const report2: ReviewReport = {
        id: 'report-002',
        reviewer: REVIEW_TEAM_ROLES.EDITOR_IN_CHIEF,
        reviewerId: 'editor_in_chief_456',
        phase: 'initial_review',
        decision: 'minor_revision',
        comments: '需要小修',
        issues: [],
        timestamp: new Date(),
      };

      await reviewTeam.submitReport(report1);
      await reviewTeam.submitReport(report2);

      const state = reviewTeam.getWorkflowState();
      expect(state.reports).toHaveLength(2);
    });
  });

  describe('审稿流程推进', () => {
    beforeEach(async () => {
      await reviewTeam.initialize();
      await reviewTeam.startReview('paper-001', 'document content');
    });

    it('应该能够推进到下一个阶段', async () => {
      expect(reviewTeam.getWorkflowState().currentPhase).toBe('format_check');

      await reviewTeam.advanceToNextPhase();

      expect(reviewTeam.getWorkflowState().currentPhase).toBe('initial_review');
    });

    it('应该按正确的顺序推进阶段', async () => {
      const expectedPhases: ReviewPhase[] = [
        'format_check',
        'initial_review',
        'peer_review',
        'final_decision',
        'completed',
      ];

      for (let i = 0; i < expectedPhases.length - 1; i++) {
        expect(reviewTeam.getWorkflowState().currentPhase).toBe(expectedPhases[i]);
        await reviewTeam.advanceToNextPhase();
      }

      expect(reviewTeam.getWorkflowState().currentPhase).toBe('completed');
    });

    it('应该在completed阶段设置结束时间', async () => {
      // 推进到completed阶段
      await reviewTeam.advanceToNextPhase(); // initial_review
      await reviewTeam.advanceToNextPhase(); // peer_review
      await reviewTeam.advanceToNextPhase(); // final_decision
      await reviewTeam.advanceToNextPhase(); // completed

      const state = reviewTeam.getWorkflowState();
      expect(state.endTime).toBeDefined();
      expect(state.endTime).toBeInstanceOf(Date);
    });
  });

  describe('获取审稿流程状态', () => {
    beforeEach(async () => {
      await reviewTeam.initialize();
      await reviewTeam.startReview('paper-001', 'document content');
    });

    it('应该返回当前流程状态', () => {
      const state = reviewTeam.getWorkflowState();

      expect(state).toHaveProperty('currentPhase');
      expect(state).toHaveProperty('reports');
      expect(state).toHaveProperty('startTime');
    });

    it('应该返回状态的副本而非引用', () => {
      const state1 = reviewTeam.getWorkflowState();
      const state2 = reviewTeam.getWorkflowState();

      expect(state1).not.toBe(state2);
      expect(state1).toEqual(state2);
    });
  });

  describe('获取团队成员', () => {
    it('初始化前应该返回空数组', () => {
      const members = reviewTeam.getTeamMembers();
      expect(members).toEqual([]);
    });

    it('初始化后应该返回所有成员', async () => {
      await reviewTeam.initialize();

      const members = reviewTeam.getTeamMembers();
      expect(members).toHaveLength(4);
    });

    it('应该返回完整的Agent对象', async () => {
      await reviewTeam.initialize();

      const members = reviewTeam.getTeamMembers();

      members.forEach((member) => {
        expect(member).toHaveProperty('id');
        expect(member).toHaveProperty('config');
        expect(member).toHaveProperty('state');
        expect(member).toHaveProperty('workHistory');
        expect(member).toHaveProperty('interactionHistory');
      });
    });
  });

  describe('销毁审稿团队', () => {
    beforeEach(async () => {
      await reviewTeam.initialize();
    });

    it('应该注销所有团队成员', async () => {
      const members = reviewTeam.getTeamMembers();

      await reviewTeam.destroy();

      members.forEach((member) => {
        expect(mockInteractionRouter.unregisterTeamMember).toHaveBeenCalledWith(
          'review',
          member.id
        );
      });
    });

    it('应该销毁所有Agent', async () => {
      const members = reviewTeam.getTeamMembers();

      await reviewTeam.destroy();

      members.forEach((member) => {
        expect(mockAgentManager.destroyAgent).toHaveBeenCalledWith(member.id);
      });
    });

    it('销毁后getTeamMembers应该返回空数组', async () => {
      await reviewTeam.destroy();

      const members = reviewTeam.getTeamMembers();
      expect(members).toEqual([]);
    });
  });

  describe('createReviewTeam工厂函数', () => {
    it('应该创建ReviewTeam实例', () => {
      const team = createReviewTeam(
        mockAgentManager,
        mockInteractionRouter,
        mockSystemConfig
      );

      expect(team).toBeDefined();
      expect(team).toHaveProperty('initialize');
      expect(team).toHaveProperty('startReview');
      expect(team).toHaveProperty('getWorkflowState');
      expect(team).toHaveProperty('getTeamMembers');
      expect(team).toHaveProperty('submitReport');
      expect(team).toHaveProperty('advanceToNextPhase');
      expect(team).toHaveProperty('destroy');
    });
  });

  describe('审稿决定处理', () => {
    beforeEach(async () => {
      await reviewTeam.initialize();
      await reviewTeam.startReview('paper-001', 'document content');
    });

    it('应该处理拒稿决定', async () => {
      const rejectReport: ReviewReport = {
        id: 'report-reject',
        reviewer: REVIEW_TEAM_ROLES.EDITOR_IN_CHIEF,
        reviewerId: 'editor_in_chief_123',
        phase: 'initial_review',
        decision: 'reject',
        comments: '不符合发表标准',
        issues: [],
        timestamp: new Date(),
      };

      await reviewTeam.submitReport(rejectReport);

      const state = reviewTeam.getWorkflowState();
      expect(state.reports).toContainEqual(rejectReport);
    });

    it('应该处理修订决定', async () => {
      const revisionReport: ReviewReport = {
        id: 'report-revision',
        reviewer: REVIEW_TEAM_ROLES.PEER_REVIEWER,
        reviewerId: 'peer_reviewer_123',
        phase: 'peer_review',
        decision: 'major_revision',
        comments: '需要大修',
        issues: [
          {
            type: 'methodology',
            severity: 'major',
            description: '方法论问题',
            suggestion: '改进建议',
          },
        ],
        timestamp: new Date(),
      };

      await reviewTeam.submitReport(revisionReport);

      const state = reviewTeam.getWorkflowState();
      expect(state.currentPhase).toBe('revision');
    });

    it('应该处理接受决定', async () => {
      const acceptReport: ReviewReport = {
        id: 'report-accept',
        reviewer: REVIEW_TEAM_ROLES.EDITOR_IN_CHIEF,
        reviewerId: 'editor_in_chief_123',
        phase: 'final_decision',
        decision: 'accept',
        comments: '接受发表',
        issues: [],
        timestamp: new Date(),
      };

      await reviewTeam.submitReport(acceptReport);

      const state = reviewTeam.getWorkflowState();
      expect(state.reports).toContainEqual(acceptReport);
    });
  });
});
