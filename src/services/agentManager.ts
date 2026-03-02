/**
 * Agent管理器实现
 * Agent Manager Implementation
 * 
 * 负责管理所有AI角色的生命周期和配置
 * 
 * 需求: 7.1 (写作团队管理)
 * 需求: 12.1 (实时工作显示)
 * 任务: 7.2 实现AgentManager核心功能
 */

import type {
  Agent,
  AgentConfig,
  AgentRole,
  AgentStatus,
} from '../types/agent';
import type { AIClient } from '../types/ai-client';
import { createAIClient } from './aiClient';
import { useAgentStore } from '../stores/agentStore';
import type { SystemConfig } from '../types/config';

// ============================================================================
// Agent Manager Interface
// ============================================================================

/**
 * Agent管理器接口
 * 管理所有AI角色的生命周期
 */
export interface AgentManager {
  /**
   * 创建AI角色
   * @param config Agent配置
   * @returns 创建的Agent实例
   */
  createAgent(config: AgentConfig): Promise<Agent>;

  /**
   * 销毁AI角色
   * @param agentId Agent唯一标识符
   */
  destroyAgent(agentId: string): Promise<void>;

  /**
   * 获取所有活跃角色
   * @returns 活跃的Agent列表
   */
  getActiveAgents(): Agent[];

  /**
   * 动态增加角色
   * @param roleType 角色类型
   * @param task 任务描述
   * @returns 创建的Agent实例
   */
  addDynamicAgent(roleType: AgentRole, task: string): Promise<Agent>;

  /**
   * 获取指定Agent
   * @param agentId Agent唯一标识符
   * @returns Agent实例或undefined
   */
  getAgent(agentId: string): Agent | undefined;

  /**
   * 更新Agent状态
   * @param agentId Agent唯一标识符
   * @param updates 要更新的字段
   */
  updateAgent(agentId: string, updates: Partial<Agent>): void;
}

// ============================================================================
// Agent Manager Implementation
// ============================================================================

/**
 * Agent管理器实现类
 */
export class AgentManagerImpl implements AgentManager {
  private systemConfig: SystemConfig;
  private aiClients: Map<string, AIClient> = new Map();

  /** 并发处理配置 */
  private concurrencyConfig = {
    maxConcurrentAgents: 25, // 支持>20个并发AI
    requestQueue: [] as Array<() => Promise<void>>,
    activeRequests: 0,
  };

  constructor(systemConfig: SystemConfig) {
    this.systemConfig = systemConfig;
  }

  /**
   * 创建AI角色
   */
  async createAgent(config: AgentConfig): Promise<Agent> {
    // 验证配置
    this.validateAgentConfig(config);

    // 创建AI客户端（如果还没有）
    if (!this.aiClients.has(config.aiService)) {
      const aiServiceConfig = this.systemConfig.aiServices.find(
        (service) => service.id === config.aiService
      );

      if (!aiServiceConfig) {
        throw new Error(`AI服务配置未找到: ${config.aiService}`);
      }

      const aiClient = createAIClient({
        config: aiServiceConfig,
        retryConfig: {
          maxRetries: 3,
          initialDelay: 1000,
          maxDelay: 10000,
          backoffMultiplier: 2,
        },
        timeout: 60000, // 60秒超时
        searchConfig: this.systemConfig.internetAccess?.enabled
          ? {
              provider: 'tavily', // 默认使用Tavily
              apiKey: '', // 需要从配置中获取
            }
          : undefined,
      });

      this.aiClients.set(config.aiService, aiClient);
    }

    // 创建Agent实例
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

    // 添加到store
    useAgentStore.getState().addAgent(agent);

    console.log(`Agent创建成功: ${config.name} (${config.role})`);

    return agent;
  }

  /**
   * 销毁AI角色
   */
  async destroyAgent(agentId: string): Promise<void> {
    const agent = this.getAgent(agentId);

    if (!agent) {
      console.warn(`尝试销毁不存在的Agent: ${agentId}`);
      return;
    }

    // 从store中移除
    useAgentStore.getState().removeAgent(agentId);

    console.log(`Agent销毁成功: ${agent.config.name} (${agent.config.role})`);
  }

  /**
   * 获取所有活跃角色
   */
  getActiveAgents(): Agent[] {
    return useAgentStore.getState().getAllAgents();
  }

  /**
   * 动态增加角色
   */
  async addDynamicAgent(roleType: AgentRole, task: string): Promise<Agent> {
    // 生成唯一ID
    const agentId = this.generateAgentId(roleType);

    // 根据角色类型创建配置
    const config: AgentConfig = {
      id: agentId,
      name: this.generateAgentName(roleType),
      role: roleType,
      promptTemplate: this.getPromptTemplateForRole(roleType),
      aiService: this.systemConfig.defaultService,
      capabilities: {
        canInternetAccess: this.systemConfig.internetAccess?.enabled ?? false,
        canStreamOutput: true,
        canInteractWithPeers: true,
      },
    };

    // 创建Agent
    const agent = await this.createAgent(config);

    // 分配任务
    agent.state.currentTask = {
      id: this.generateTaskId(),
      description: task,
      assignedBy: 'decision_ai',
      priority: 'high',
    };

    // 更新Agent状态
    this.updateAgent(agentId, { state: agent.state });

    console.log(`动态增加Agent: ${config.name}, 任务: ${task}`);

    return agent;
  }

  /**
   * 获取指定Agent
   */
  getAgent(agentId: string): Agent | undefined {
    return useAgentStore.getState().getAgent(agentId);
  }

  /**
   * 更新Agent状态
   */
  updateAgent(agentId: string, updates: Partial<Agent>): void {
    useAgentStore.getState().updateAgent(agentId, updates);
  }

  /**
   * 获取AI客户端
   */
  getAIClient(aiServiceId: string): AIClient | undefined {
    return this.aiClients.get(aiServiceId);
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * 验证Agent配置
   */
  private validateAgentConfig(config: AgentConfig): void {
    if (!config.id) {
      throw new Error('Agent配置缺少id字段');
    }

    if (!config.name) {
      throw new Error('Agent配置缺少name字段');
    }

    if (!config.role) {
      throw new Error('Agent配置缺少role字段');
    }

    if (!config.aiService) {
      throw new Error('Agent配置缺少aiService字段');
    }

    // 检查ID是否已存在
    const existingAgent = this.getAgent(config.id);
    if (existingAgent) {
      throw new Error(`Agent ID已存在: ${config.id}`);
    }
  }

  /**
   * 生成Agent ID
   */
  private generateAgentId(roleType: AgentRole): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${roleType}_${timestamp}_${random}`;
  }

  /**
   * 生成Agent名称
   */
  private generateAgentName(roleType: AgentRole): string {
    const roleNames: Record<AgentRole, string> = {
      decision: '决策AI',
      supervisor: '监管AI',
      writer: '写作AI',
      editorial_office: '编辑部',
      editor_in_chief: '主编',
      deputy_editor: '副主编',
      peer_reviewer: '审稿专家',
    };

    const baseName = roleNames[roleType];
    const count = this.getActiveAgents().filter((a) => a.config.role === roleType).length;

    return count > 0 ? `${baseName} ${count + 1}` : baseName;
  }

  /**
   * 获取角色对应的提示词模板路径
   */
  private getPromptTemplateForRole(roleType: AgentRole): string {
    return `prompts/${roleType}.yaml`;
  }

  /**
   * 生成任务ID
   */
  private generateTaskId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `task_${timestamp}_${random}`;
  }

  /**
   * 执行并发AI请求
   * 
   * 使用队列机制管理并发请求，确保不超过最大并发数。
   * 支持>20个并发AI处理。
   * 
   * @param requestFn - 要执行的异步请求函数
   * @returns Promise<T>
   */
  async executeConcurrentRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    // 如果当前并发数未达到上限，直接执行
    if (this.concurrencyConfig.activeRequests < this.concurrencyConfig.maxConcurrentAgents) {
      this.concurrencyConfig.activeRequests++;
      try {
        const result = await requestFn();
        return result;
      } finally {
        this.concurrencyConfig.activeRequests--;
        // 处理队列中的下一个请求
        this.processNextRequest();
      }
    }

    // 否则加入队列等待
    return new Promise<T>((resolve, reject) => {
      this.concurrencyConfig.requestQueue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * 处理队列中的下一个请求
   * 
   * @private
   */
  private processNextRequest(): void {
    if (
      this.concurrencyConfig.requestQueue.length > 0 &&
      this.concurrencyConfig.activeRequests < this.concurrencyConfig.maxConcurrentAgents
    ) {
      const nextRequest = this.concurrencyConfig.requestQueue.shift();
      if (nextRequest) {
        this.concurrencyConfig.activeRequests++;
        nextRequest().finally(() => {
          this.concurrencyConfig.activeRequests--;
          this.processNextRequest();
        });
      }
    }
  }

  /**
   * 配置并发参数
   * 
   * @param maxConcurrentAgents - 最大并发Agent数量
   */
  configureConcurrency(maxConcurrentAgents: number): void {
    if (maxConcurrentAgents > 0) {
      this.concurrencyConfig.maxConcurrentAgents = maxConcurrentAgents;
    }
  }

  /**
   * 获取并发状态
   * 
   * @returns 并发状态信息
   */
  getConcurrencyStatus(): {
    activeRequests: number;
    queuedRequests: number;
    maxConcurrent: number;
  } {
    return {
      activeRequests: this.concurrencyConfig.activeRequests,
      queuedRequests: this.concurrencyConfig.requestQueue.length,
      maxConcurrent: this.concurrencyConfig.maxConcurrentAgents,
    };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * 创建Agent管理器实例
 */
export function createAgentManager(systemConfig: SystemConfig): AgentManager {
  return new AgentManagerImpl(systemConfig);
}
