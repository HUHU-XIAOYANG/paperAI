/**
 * Agent数据模型单元测试
 * 
 * 验证Agent相关类型定义的正确性和完整性
 */

import { describe, it, expect } from 'vitest';
import type {
  AgentRole,
  AgentStatus,
  AgentCapabilities,
  AgentConfig,
  Task,
  AgentState,
  WorkRecord,
  Agent,
  AgentInfo
} from './agent';

describe('Agent数据模型', () => {
  describe('AgentRole类型', () => {
    it('应该包含所有定义的角色类型', () => {
      const roles: AgentRole[] = [
        'decision',
        'supervisor',
        'writer',
        'editorial_office',
        'editor_in_chief',
        'deputy_editor',
        'peer_reviewer'
      ];
      
      // 验证类型定义正确（编译时检查）
      roles.forEach(role => {
        expect(typeof role).toBe('string');
      });
    });
  });

  describe('AgentStatus类型', () => {
    it('应该包含所有定义的状态类型', () => {
      const statuses: AgentStatus[] = [
        'idle',
        'thinking',
        'writing',
        'waiting_feedback',
        'revising',
        'completed'
      ];
      
      statuses.forEach(status => {
        expect(typeof status).toBe('string');
      });
    });
  });

  describe('AgentCapabilities接口', () => {
    it('应该创建有效的能力配置对象', () => {
      const capabilities: AgentCapabilities = {
        canInternetAccess: true,
        canStreamOutput: true,
        canInteractWithPeers: true
      };
      
      expect(capabilities.canInternetAccess).toBe(true);
      expect(capabilities.canStreamOutput).toBe(true);
      expect(capabilities.canInteractWithPeers).toBe(true);
    });

    it('应该支持部分禁用的能力', () => {
      const capabilities: AgentCapabilities = {
        canInternetAccess: false,
        canStreamOutput: true,
        canInteractWithPeers: false
      };
      
      expect(capabilities.canInternetAccess).toBe(false);
      expect(capabilities.canStreamOutput).toBe(true);
      expect(capabilities.canInteractWithPeers).toBe(false);
    });
  });

  describe('AgentConfig接口', () => {
    it('应该创建有效的Agent配置对象', () => {
      const config: AgentConfig = {
        id: 'agent-001',
        name: 'Decision AI',
        role: 'decision',
        promptTemplate: 'prompts/decision_ai.yaml',
        aiService: 'openai-gpt4',
        capabilities: {
          canInternetAccess: true,
          canStreamOutput: true,
          canInteractWithPeers: true
        }
      };
      
      expect(config.id).toBe('agent-001');
      expect(config.name).toBe('Decision AI');
      expect(config.role).toBe('decision');
      expect(config.promptTemplate).toBe('prompts/decision_ai.yaml');
      expect(config.aiService).toBe('openai-gpt4');
      expect(config.capabilities).toBeDefined();
    });
  });

  describe('Task接口', () => {
    it('应该创建有效的任务对象', () => {
      const task: Task = {
        id: 'task-001',
        description: '撰写论文引言部分',
        assignedBy: 'decision-ai',
        priority: 'high'
      };
      
      expect(task.id).toBe('task-001');
      expect(task.description).toBe('撰写论文引言部分');
      expect(task.assignedBy).toBe('decision-ai');
      expect(task.priority).toBe('high');
    });

    it('应该支持可选的截止时间和依赖', () => {
      const deadline = new Date('2024-12-31');
      const task: Task = {
        id: 'task-002',
        description: '撰写方法部分',
        assignedBy: 'decision-ai',
        deadline,
        priority: 'medium',
        dependencies: ['task-001']
      };
      
      expect(task.deadline).toBe(deadline);
      expect(task.dependencies).toEqual(['task-001']);
    });
  });

  describe('AgentState接口', () => {
    it('应该创建有效的Agent状态对象', () => {
      const now = new Date();
      const state: AgentState = {
        status: 'idle',
        revisionCount: 0,
        lastActivity: now
      };
      
      expect(state.status).toBe('idle');
      expect(state.revisionCount).toBe(0);
      expect(state.lastActivity).toBe(now);
    });

    it('应该支持包含当前任务的状态', () => {
      const task: Task = {
        id: 'task-001',
        description: '撰写引言',
        assignedBy: 'decision-ai',
        priority: 'high'
      };
      
      const state: AgentState = {
        status: 'writing',
        currentTask: task,
        revisionCount: 1,
        lastActivity: new Date()
      };
      
      expect(state.currentTask).toBe(task);
      expect(state.revisionCount).toBe(1);
    });
  });

  describe('WorkRecord接口', () => {
    it('应该创建有效的工作记录对象', () => {
      const startTime = new Date();
      const record: WorkRecord = {
        taskId: 'task-001',
        startTime,
        output: '引言初稿内容...',
        status: 'in_progress',
        feedbackReceived: []
      };
      
      expect(record.taskId).toBe('task-001');
      expect(record.startTime).toBe(startTime);
      expect(record.output).toBe('引言初稿内容...');
      expect(record.status).toBe('in_progress');
      expect(record.feedbackReceived).toEqual([]);
    });

    it('应该支持已完成的工作记录', () => {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 3600000); // 1小时后
      
      const record: WorkRecord = {
        taskId: 'task-001',
        startTime,
        endTime,
        output: '引言最终版本...',
        status: 'completed',
        feedbackReceived: ['需要补充背景信息', '格式符合要求']
      };
      
      expect(record.endTime).toBe(endTime);
      expect(record.status).toBe('completed');
      expect(record.feedbackReceived).toHaveLength(2);
    });
  });

  describe('Agent接口', () => {
    it('应该创建完整的Agent实例对象', () => {
      const agent: Agent = {
        id: 'agent-001',
        config: {
          id: 'agent-001',
          name: 'Writer AI 1',
          role: 'writer',
          promptTemplate: 'prompts/writer.yaml',
          aiService: 'openai-gpt4',
          capabilities: {
            canInternetAccess: true,
            canStreamOutput: true,
            canInteractWithPeers: true
          }
        },
        state: {
          status: 'writing',
          revisionCount: 0,
          lastActivity: new Date()
        },
        workHistory: [],
        interactionHistory: []
      };
      
      expect(agent.id).toBe('agent-001');
      expect(agent.config.role).toBe('writer');
      expect(agent.state.status).toBe('writing');
      expect(agent.workHistory).toEqual([]);
      expect(agent.interactionHistory).toEqual([]);
    });

    it('应该支持包含历史记录的Agent', () => {
      const workRecord: WorkRecord = {
        taskId: 'task-001',
        startTime: new Date(),
        output: '工作输出',
        status: 'completed',
        feedbackReceived: []
      };
      
      const agent: Agent = {
        id: 'agent-002',
        config: {
          id: 'agent-002',
          name: 'Supervisor AI',
          role: 'supervisor',
          promptTemplate: 'prompts/supervisor.yaml',
          aiService: 'openai-gpt4',
          capabilities: {
            canInternetAccess: false,
            canStreamOutput: true,
            canInteractWithPeers: true
          }
        },
        state: {
          status: 'idle',
          revisionCount: 0,
          lastActivity: new Date()
        },
        workHistory: [workRecord],
        interactionHistory: ['msg-001', 'msg-002']
      };
      
      expect(agent.workHistory).toHaveLength(1);
      expect(agent.interactionHistory).toHaveLength(2);
    });
  });

  describe('AgentInfo接口', () => {
    it('应该创建基本的Agent信息对象', () => {
      const info: AgentInfo = {
        id: 'agent-001',
        name: 'Decision AI',
        role: 'decision'
      };
      
      expect(info.id).toBe('agent-001');
      expect(info.name).toBe('Decision AI');
      expect(info.role).toBe('decision');
    });

    it('应该支持可选的头像和当前任务', () => {
      const info: AgentInfo = {
        id: 'agent-002',
        name: 'Writer AI 1',
        role: 'writer',
        avatar: 'https://example.com/avatar.png',
        currentTask: '撰写论文引言部分'
      };
      
      expect(info.avatar).toBe('https://example.com/avatar.png');
      expect(info.currentTask).toBe('撰写论文引言部分');
    });
  });

  describe('类型组合测试', () => {
    it('应该支持创建不同角色的Agent配置', () => {
      const roles: AgentRole[] = [
        'decision',
        'supervisor',
        'writer',
        'editorial_office',
        'editor_in_chief',
        'deputy_editor',
        'peer_reviewer'
      ];
      
      roles.forEach((role, index) => {
        const config: AgentConfig = {
          id: `agent-${index}`,
          name: `${role} AI`,
          role,
          promptTemplate: `prompts/${role}.yaml`,
          aiService: 'openai-gpt4',
          capabilities: {
            canInternetAccess: true,
            canStreamOutput: true,
            canInteractWithPeers: true
          }
        };
        
        expect(config.role).toBe(role);
      });
    });

    it('应该支持任务优先级的所有值', () => {
      const priorities: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
      
      priorities.forEach(priority => {
        const task: Task = {
          id: `task-${priority}`,
          description: `${priority}优先级任务`,
          assignedBy: 'decision-ai',
          priority
        };
        
        expect(task.priority).toBe(priority);
      });
    });

    it('应该支持工作记录的所有状态', () => {
      const statuses: Array<'in_progress' | 'completed' | 'rejected' | 'revised'> = [
        'in_progress',
        'completed',
        'rejected',
        'revised'
      ];
      
      statuses.forEach(status => {
        const record: WorkRecord = {
          taskId: 'task-001',
          startTime: new Date(),
          output: '输出内容',
          status,
          feedbackReceived: []
        };
        
        expect(record.status).toBe(status);
      });
    });
  });
});
