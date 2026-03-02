/**
 * 交互路由器 - Agent消息传递基础设施
 * 
 * InteractionRouter负责处理Agent之间的非线性交互和消息传递。
 * 支持点对点消息、团队广播、消息订阅和反馈请求。
 * 
 * @module services/interactionRouter
 * @see design.md - 组件和接口 > 3. Interaction Router
 */

import { v4 as uuidv4 } from 'uuid';
import type { AgentMessage, MessageType, MessageMetadata } from '../types';
import { useMessageStore } from '../stores/messageStore';

/**
 * 消息回调函数类型
 * 当订阅的Agent收到新消息时调用
 */
export type MessageCallback = (message: AgentMessage) => void;

/**
 * 团队类型
 */
export type TeamType = 'writing' | 'review';

/**
 * 交互路由器接口
 * 
 * 定义了Agent之间消息传递和交互的核心功能。
 * 
 * @interface InteractionRouter
 */
export interface IInteractionRouter {
  /**
   * 发送点对点消息
   * 
   * @param message - 要发送的消息对象
   * @returns Promise<void>
   */
  sendMessage(message: AgentMessage): Promise<void>;
  
  /**
   * 订阅Agent的消息
   * 
   * @param agentId - 要订阅的Agent ID
   * @param callback - 收到消息时的回调函数
   * @returns 取消订阅的函数
   */
  subscribeToMessages(agentId: string, callback: MessageCallback): () => void;
  
  /**
   * 广播消息到团队
   * 
   * @param teamType - 团队类型（writing或review）
   * @param message - 要广播的消息
   * @returns Promise<void>
   */
  broadcastToTeam(teamType: TeamType, message: AgentMessage): Promise<void>;
  
  /**
   * 请求反馈
   * 
   * @param fromAgent - 请求者Agent ID
   * @param toAgent - 被请求者Agent ID
   * @param content - 请求内容
   * @param timeout - 可选的超时时间（毫秒）
   * @returns Promise<string> - 返回反馈内容（异步等待响应）
   */
  requestFeedback(fromAgent: string, toAgent: string, content: string, timeout?: number): Promise<string>;
  
  /**
   * 注册团队成员
   * 
   * @param teamType - 团队类型
   * @param agentId - Agent ID
   */
  registerTeamMember(teamType: TeamType, agentId: string): void;
  
  /**
   * 注销团队成员
   * 
   * @param teamType - 团队类型
   * @param agentId - Agent ID
   */
  unregisterTeamMember(teamType: TeamType, agentId: string): void;
  
  /**
   * 获取团队成员列表
   * 
   * @param teamType - 团队类型
   * @returns Agent ID数组
   */
  getTeamMembers(teamType: TeamType): string[];
  
  /**
   * 配置超时处理策略
   * 
   * @param strategy - 超时处理策略
   * @param defaultTimeout - 默认超时时间（毫秒）
   */
  configureTimeout(strategy: TimeoutStrategy, defaultTimeout?: number): void;
  
  /**
   * 检测循环依赖
   * 
   * @returns 循环依赖列表
   */
  detectCircularDependencies(): CircularDependency[];
  
  /**
   * 检测死锁情况
   * 
   * @returns 死锁检测结果
   */
  detectDeadlock(): DeadlockDetection;
}

/**
 * 待处理的反馈请求
 */
interface PendingFeedbackRequest {
  messageId: string;
  fromAgent: string;
  toAgent: string;
  resolve: (value: string) => void;
  reject: (reason: Error) => void;
  timeout: NodeJS.Timeout;
  startTime: Date;
}

/**
 * 超时处理策略
 */
export type TimeoutStrategy = 'reject' | 'skip' | 'default';

/**
 * 循环依赖检测结果
 */
export interface CircularDependency {
  agents: string[];
  description: string;
}

/**
 * 死锁检测结果
 */
export interface DeadlockDetection {
  detected: boolean;
  involvedAgents: string[];
  waitingChain: string[];
  suggestion: string;
}

/**
 * 交互路由器实现类
 * 
 * 实现Agent之间的消息传递、订阅机制和非线性交互。
 * 
 * @class InteractionRouter
 * @implements {IInteractionRouter}
 */
export class InteractionRouter implements IInteractionRouter {
  /** 消息订阅列表 */
  private subscriptions: Map<string, Set<MessageCallback>> = new Map();
  
  /** 待处理的反馈请求 */
  private pendingFeedbackRequests: Map<string, PendingFeedbackRequest> = new Map();
  
  /** 反馈请求默认超时时间（毫秒） - 可配置 */
  private feedbackTimeout: number = 30000; // 默认30秒
  
  /** 超时处理策略 */
  private timeoutStrategy: TimeoutStrategy = 'skip';
  
  /** 消息优先级队列 - 优化为高效队列 */
  private messageQueue: AgentMessage[] = [];
  
  /** 是否正在处理消息队列 */
  private isProcessingQueue: boolean = false;
  
  /** 团队成员映射 */
  private teamMembers: Map<TeamType, Set<string>> = new Map([
    ['writing', new Set()],
    ['review', new Set()]
  ]);

  /** 并发消息处理配置 */
  private concurrencyConfig = {
    maxConcurrentMessages: 50, // 支持高并发消息处理
    batchSize: 10, // 批量处理消息数量
  };
  
  /** 队列处理定时器 */
  private queueProcessTimer: NodeJS.Timeout | null = null;
  
  /**
   * 发送点对点消息
   * 
   * 将消息添加到优先级队列，根据优先级排序处理。
   * 高优先级消息优先响应。
   * 如果消息是反馈响应，会解析对应的待处理请求。
   * 
   * @param message - 要发送的消息对象
   * @returns Promise<void>
   * 
   * @example
   * ```typescript
   * const router = new InteractionRouter();
   * await router.sendMessage({
   *   id: 'msg-123',
   *   type: 'discussion',
   *   sender: 'writer_1',
   *   receiver: 'writer_2',
   *   content: '关于引言部分，我们需要讨论一下研究背景的范围。',
   *   metadata: {
   *     priority: 'high',
   *     requiresResponse: true,
   *     timestamp: new Date().toISOString()
   *   },
   *   timestamp: new Date()
   * });
   * ```
   */
  async sendMessage(message: AgentMessage): Promise<void> {
    // 添加消息到优先级队列
    this.enqueueMessage(message);
    
    // 延迟处理以允许更多消息加入队列并按优先级排序
    // 使用微任务队列确保同步添加的消息都能进入队列
    if (!this.queueProcessTimer) {
      this.queueProcessTimer = setTimeout(() => {
        this.queueProcessTimer = null;
        this.processMessageQueue();
      }, 0);
    }
    
    // 返回一个Promise，等待消息被处理
    return new Promise((resolve) => {
      const checkProcessed = () => {
        if (!this.isProcessingQueue && this.messageQueue.length === 0) {
          resolve();
        } else {
          setTimeout(checkProcessed, 10);
        }
      };
      checkProcessed();
    });
  }
  
  /**
   * 将消息加入优先级队列
   * 根据优先级排序：high > medium > low
   * 
   * @private
   * @param message - 要加入队列的消息
   */
  private enqueueMessage(message: AgentMessage): void {
    this.messageQueue.push(message);
    
    // 按优先级排序（high > medium > low）
    this.messageQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.metadata.priority] || 2;
      const bPriority = priorityOrder[b.metadata.priority] || 2;
      return bPriority - aPriority;
    });
  }
  
  /**
   * 处理消息队列
   * 按优先级顺序批量处理消息，优化并发性能
   * 
   * @private
   */
  private async processMessageQueue(): Promise<void> {
    // 如果正在处理，避免重复处理
    if (this.isProcessingQueue) {
      return;
    }
    
    this.isProcessingQueue = true;
    
    try {
      while (this.messageQueue.length > 0) {
        // 批量处理消息
        const batch = this.messageQueue.splice(0, this.concurrencyConfig.batchSize);
        
        // 并发处理批次中的所有消息
        await Promise.all(batch.map(message => this.deliverMessage(message)));
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }
  
  /**
   * 实际投递消息
   * 
   * @private
   * @param message - 要投递的消息
   */
  private async deliverMessage(message: AgentMessage): Promise<void> {
    // 添加消息到存储
    const messageStore = useMessageStore.getState();
    messageStore.addMessage(message);
    
    // 通知接收者的订阅者
    const receivers = Array.isArray(message.receiver) 
      ? message.receiver 
      : [message.receiver];
    
    for (const receiverId of receivers) {
      this.notifySubscribers(receiverId, message);
    }
    
    // 如果是反馈响应，解析对应的待处理请求
    if (message.type === 'feedback_response' && message.metadata.relatedTaskId) {
      const pendingRequest = this.pendingFeedbackRequests.get(message.metadata.relatedTaskId);
      if (pendingRequest) {
        clearTimeout(pendingRequest.timeout);
        pendingRequest.resolve(message.content);
        this.pendingFeedbackRequests.delete(message.metadata.relatedTaskId);
      }
    }
  }
  
  /**
   * 订阅Agent的消息
   * 
   * 注册回调函数，当指定Agent收到消息时会被调用。
   * 支持多个订阅者订阅同一个Agent。
   * 
   * @param agentId - 要订阅的Agent ID
   * @param callback - 收到消息时的回调函数
   * @returns 取消订阅的函数
   * 
   * @example
   * ```typescript
   * const router = new InteractionRouter();
   * const unsubscribe = router.subscribeToMessages('writer_1', (message) => {
   *   console.log('Writer 1 received:', message.content);
   * });
   * 
   * // 稍后取消订阅
   * unsubscribe();
   * ```
   */
  subscribeToMessages(agentId: string, callback: MessageCallback): () => void {
    // 获取或创建该Agent的订阅集合
    if (!this.subscriptions.has(agentId)) {
      this.subscriptions.set(agentId, new Set());
    }
    
    const callbacks = this.subscriptions.get(agentId)!;
    callbacks.add(callback);
    
    // 返回取消订阅函数
    return () => {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.subscriptions.delete(agentId);
      }
    };
  }
  
  /**
   * 广播消息到团队
   * 
   * 将消息发送给指定团队的所有成员。
   * 消息的receiver字段会被设置为团队所有成员的ID数组。
   * 
   * @param teamType - 团队类型（writing或review）
   * @param message - 要广播的消息（receiver字段会被覆盖）
   * @returns Promise<void>
   * 
   * @example
   * ```typescript
   * const router = new InteractionRouter();
   * router.registerTeamMember('writing', 'writer_1');
   * router.registerTeamMember('writing', 'writer_2');
   * 
   * await router.broadcastToTeam('writing', {
   *   id: 'msg-456',
   *   type: 'discussion',
   *   sender: 'supervisor_ai',
   *   receiver: [], // 会被自动设置为团队成员
   *   content: '请所有写作团队成员注意格式规范。',
   *   metadata: {
   *     priority: 'high',
   *     requiresResponse: false,
   *     timestamp: new Date().toISOString()
   *   },
   *   timestamp: new Date()
   * });
   * ```
   */
  async broadcastToTeam(teamType: TeamType, message: AgentMessage): Promise<void> {
    const members = this.teamMembers.get(teamType);
    
    if (!members || members.size === 0) {
      console.warn(`No members found in ${teamType} team`);
      return;
    }
    
    // 创建广播消息，receiver设置为所有团队成员
    const broadcastMessage: AgentMessage = {
      ...message,
      receiver: Array.from(members)
    };
    
    // 发送消息
    await this.sendMessage(broadcastMessage);
  }
  
  /**
   * 请求反馈
   * 
   * 发送反馈请求消息，并异步等待响应。
   * 支持自定义超时时间和超时处理策略。
   * 
   * @param fromAgent - 请求者Agent ID
   * @param toAgent - 被请求者Agent ID
   * @param content - 请求内容
   * @param timeout - 可选的超时时间（毫秒），默认使用配置的超时时间
   * @returns Promise<string> - 返回反馈内容
   * @throws {Error} - 如果超时未收到响应且策略为reject
   * 
   * @example
   * ```typescript
   * const router = new InteractionRouter();
   * try {
   *   const feedback = await router.requestFeedback(
   *     'writer_1',
   *     'writer_2',
   *     '你对引言部分的研究背景有什么建议？',
   *     15000 // 自定义15秒超时
   *   );
   *   console.log('Received feedback:', feedback);
   * } catch (error) {
   *   console.error('Feedback request timeout:', error);
   * }
   * ```
   */
  async requestFeedback(
    fromAgent: string, 
    toAgent: string, 
    content: string,
    timeout?: number
  ): Promise<string> {
    const requestId = uuidv4();
    const effectiveTimeout = timeout ?? this.feedbackTimeout;
    
    // 创建反馈请求消息
    const requestMessage: AgentMessage = {
      id: requestId,
      type: 'feedback_request',
      sender: fromAgent,
      receiver: toAgent,
      content,
      metadata: {
        priority: 'medium',
        requiresResponse: true,
        relatedTaskId: requestId,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date()
    };
    
    // 创建Promise等待响应
    const feedbackPromise = new Promise<string>((resolve, reject) => {
      // 设置超时处理
      const timeoutHandle = setTimeout(() => {
        this.handleFeedbackTimeout(requestId, fromAgent, toAgent, resolve, reject);
      }, effectiveTimeout);
      
      // 保存待处理请求
      this.pendingFeedbackRequests.set(requestId, {
        messageId: requestId,
        fromAgent,
        toAgent,
        resolve,
        reject,
        timeout: timeoutHandle,
        startTime: new Date()
      });
    });
    
    // 发送请求消息
    await this.sendMessage(requestMessage);
    
    // 等待响应
    return feedbackPromise;
  }
  
  /**
   * 处理反馈请求超时
   * 根据配置的策略进行处理
   * 
   * @private
   * @param requestId - 请求ID
   * @param fromAgent - 请求者
   * @param toAgent - 被请求者
   * @param resolve - Promise resolve函数
   * @param reject - Promise reject函数
   */
  private handleFeedbackTimeout(
    requestId: string,
    fromAgent: string,
    toAgent: string,
    resolve: (value: string) => void,
    reject: (reason: Error) => void
  ): void {
    this.pendingFeedbackRequests.delete(requestId);
    
    const timeoutMessage = `Feedback request timeout: no response from ${toAgent} within ${this.feedbackTimeout}ms`;
    
    switch (this.timeoutStrategy) {
      case 'reject':
        // 拒绝Promise，抛出错误
        reject(new Error(timeoutMessage));
        break;
        
      case 'skip':
        // 跳过该请求，返回空字符串
        console.warn(`${timeoutMessage} - Skipping request from ${fromAgent}`);
        resolve('');
        break;
        
      case 'default':
        // 返回默认响应
        console.warn(`${timeoutMessage} - Using default response`);
        resolve(`[Timeout] ${toAgent} did not respond in time.`);
        break;
    }
  }
  
  /**
   * 注册团队成员
   * 
   * 将Agent添加到指定团队，用于广播消息。
   * 
   * @param teamType - 团队类型
   * @param agentId - Agent ID
   */
  registerTeamMember(teamType: TeamType, agentId: string): void {
    const members = this.teamMembers.get(teamType);
    if (members) {
      members.add(agentId);
    }
  }
  
  /**
   * 注销团队成员
   * 
   * 从指定团队移除Agent。
   * 
   * @param teamType - 团队类型
   * @param agentId - Agent ID
   */
  unregisterTeamMember(teamType: TeamType, agentId: string): void {
    const members = this.teamMembers.get(teamType);
    if (members) {
      members.delete(agentId);
    }
  }
  
  /**
   * 获取团队成员列表
   * 
   * @param teamType - 团队类型
   * @returns Agent ID数组
   */
  getTeamMembers(teamType: TeamType): string[] {
    const members = this.teamMembers.get(teamType);
    return members ? Array.from(members) : [];
  }
  
  /**
   * 配置超时处理策略
   * 
   * @param strategy - 超时处理策略
   *   - 'reject': 超时时拒绝Promise，抛出错误
   *   - 'skip': 超时时跳过请求，返回空字符串
   *   - 'default': 超时时返回默认响应消息
   * @param defaultTimeout - 默认超时时间（毫秒），可选
   * 
   * @example
   * ```typescript
   * const router = new InteractionRouter();
   * // 设置为跳过策略，超时时间20秒
   * router.configureTimeout('skip', 20000);
   * ```
   */
  configureTimeout(strategy: TimeoutStrategy, defaultTimeout?: number): void {
    this.timeoutStrategy = strategy;
    if (defaultTimeout !== undefined && defaultTimeout > 0) {
      this.feedbackTimeout = defaultTimeout;
    }
  }
  
  /**
   * 检测循环依赖
   * 
   * 检测Agent之间是否存在循环等待关系（A等待B，B等待A）。
   * 
   * @returns 循环依赖列表
   * 
   * @example
   * ```typescript
   * const router = new InteractionRouter();
   * const cycles = router.detectCircularDependencies();
   * if (cycles.length > 0) {
   *   console.warn('Detected circular dependencies:', cycles);
   * }
   * ```
   */
  detectCircularDependencies(): CircularDependency[] {
    const dependencies: Map<string, Set<string>> = new Map();
    
    // 构建依赖图：fromAgent -> toAgent
    this.pendingFeedbackRequests.forEach(request => {
      if (!dependencies.has(request.fromAgent)) {
        dependencies.set(request.fromAgent, new Set());
      }
      dependencies.get(request.fromAgent)!.add(request.toAgent);
    });
    
    const cycles: CircularDependency[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    // DFS检测循环
    const detectCycle = (agent: string, path: string[]): void => {
      visited.add(agent);
      recursionStack.add(agent);
      path.push(agent);
      
      const neighbors = dependencies.get(agent);
      if (neighbors) {
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            detectCycle(neighbor, [...path]);
          } else if (recursionStack.has(neighbor)) {
            // 发现循环
            const cycleStart = path.indexOf(neighbor);
            const cycleAgents = path.slice(cycleStart);
            cycleAgents.push(neighbor); // 闭合循环
            
            cycles.push({
              agents: cycleAgents,
              description: `Circular dependency detected: ${cycleAgents.join(' -> ')}`
            });
          }
        }
      }
      
      recursionStack.delete(agent);
    };
    
    // 对每个Agent执行DFS
    dependencies.forEach((_, agent) => {
      if (!visited.has(agent)) {
        detectCycle(agent, []);
      }
    });
    
    return cycles;
  }
  
  /**
   * 检测死锁情况
   * 
   * 检测是否存在多个Agent相互等待导致的死锁。
   * 提供解决建议。
   * 
   * @returns 死锁检测结果
   * 
   * @example
   * ```typescript
   * const router = new InteractionRouter();
   * const deadlock = router.detectDeadlock();
   * if (deadlock.detected) {
   *   console.error('Deadlock detected:', deadlock);
   *   console.log('Suggestion:', deadlock.suggestion);
   * }
   * ```
   */
  detectDeadlock(): DeadlockDetection {
    // 检测循环依赖
    const cycles = this.detectCircularDependencies();
    
    if (cycles.length === 0) {
      return {
        detected: false,
        involvedAgents: [],
        waitingChain: [],
        suggestion: 'No deadlock detected.'
      };
    }
    
    // 找出最长的循环（最可能是死锁）
    const longestCycle = cycles.reduce((longest, current) => 
      current.agents.length > longest.agents.length ? current : longest
    );
    
    // 检查这些Agent是否都在等待（超过一定时间）
    const now = new Date();
    const longWaitingAgents = Array.from(this.pendingFeedbackRequests.values())
      .filter(request => {
        const waitTime = now.getTime() - request.startTime.getTime();
        return waitTime > this.feedbackTimeout / 2; // 超过一半超时时间
      })
      .map(request => request.fromAgent);
    
    const involvedAgents = longestCycle.agents.filter(agent => 
      longWaitingAgents.includes(agent)
    );
    
    if (involvedAgents.length >= 2) {
      // 确认死锁
      return {
        detected: true,
        involvedAgents,
        waitingChain: longestCycle.agents,
        suggestion: `Deadlock detected among agents: ${involvedAgents.join(', ')}. ` +
          `Suggestion: Cancel one of the pending requests or increase timeout. ` +
          `Waiting chain: ${longestCycle.agents.join(' -> ')}`
      };
    }
    
    // 可能的死锁（循环存在但等待时间不长）
    return {
      detected: false,
      involvedAgents: longestCycle.agents,
      waitingChain: longestCycle.agents,
      suggestion: `Potential circular dependency detected: ${longestCycle.description}. ` +
        `Monitor the situation. If agents wait too long, this may become a deadlock.`
    };
  }
  
  /**
   * 通知订阅者
   * 
   * 调用所有订阅该Agent的回调函数。
   * 
   * @private
   * @param agentId - Agent ID
   * @param message - 消息对象
   */
  private notifySubscribers(agentId: string, message: AgentMessage): void {
    const callbacks = this.subscriptions.get(agentId);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          console.error(`Error in message callback for agent ${agentId}:`, error);
        }
      });
    }
  }
  
  /**
   * 清理所有订阅和待处理请求
   * 
   * 用于测试或重置系统状态。
   */
  clear(): void {
    // 清理所有待处理的反馈请求
    this.pendingFeedbackRequests.forEach(request => {
      clearTimeout(request.timeout);
      request.reject(new Error('InteractionRouter cleared'));
    });
    this.pendingFeedbackRequests.clear();
    
    // 清理消息队列
    this.messageQueue = [];
    this.isProcessingQueue = false;
    
    // 清理所有订阅
    this.subscriptions.clear();
    
    // 清理团队成员
    this.teamMembers.get('writing')?.clear();
    this.teamMembers.get('review')?.clear();
  }

  /**
   * 配置并发消息处理参数
   * 
   * @param maxConcurrentMessages - 最大并发消息数
   * @param batchSize - 批量处理大小
   */
  configureConcurrency(maxConcurrentMessages?: number, batchSize?: number): void {
    if (maxConcurrentMessages !== undefined && maxConcurrentMessages > 0) {
      this.concurrencyConfig.maxConcurrentMessages = maxConcurrentMessages;
    }
    if (batchSize !== undefined && batchSize > 0) {
      this.concurrencyConfig.batchSize = batchSize;
    }
  }

  /**
   * 获取消息队列状态
   * 
   * @returns 队列状态信息
   */
  getQueueStatus(): {
    queueLength: number;
    isProcessing: boolean;
    pendingFeedbackRequests: number;
  } {
    return {
      queueLength: this.messageQueue.length,
      isProcessing: this.isProcessingQueue,
      pendingFeedbackRequests: this.pendingFeedbackRequests.size,
    };
  }
}

/**
 * 创建消息的辅助函数
 * 
 * 简化消息对象的创建过程。
 * 
 * @param type - 消息类型
 * @param sender - 发送者Agent ID
 * @param receiver - 接收者Agent ID（或ID数组）
 * @param content - 消息内容
 * @param options - 可选的元数据配置
 * @returns AgentMessage对象
 * 
 * @example
 * ```typescript
 * const message = createMessage(
 *   'discussion',
 *   'writer_1',
 *   'writer_2',
 *   '我们需要讨论一下引言部分。',
 *   { priority: 'high', requiresResponse: true }
 * );
 * ```
 */
export function createMessage(
  type: MessageType,
  sender: string,
  receiver: string | string[],
  content: string,
  options?: Partial<MessageMetadata>
): AgentMessage {
  return {
    id: uuidv4(),
    type,
    sender,
    receiver,
    content,
    metadata: {
      priority: options?.priority || 'medium',
      requiresResponse: options?.requiresResponse || false,
      relatedTaskId: options?.relatedTaskId,
      attachments: options?.attachments,
      timestamp: new Date().toISOString(),
      tags: options?.tags
    },
    timestamp: new Date()
  };
}

// 导出单例实例
export const interactionRouter = new InteractionRouter();
