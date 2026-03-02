/**
 * InteractionRouter单元测试
 * 
 * 测试消息传递、订阅机制、团队广播和反馈请求功能。
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { InteractionRouter, createMessage } from './interactionRouter';
import type { AgentMessage } from '../types';
import { useMessageStore } from '../stores/messageStore';

describe('InteractionRouter', () => {
  let router: InteractionRouter;
  
  beforeEach(() => {
    router = new InteractionRouter();
    // 清空消息存储
    useMessageStore.getState().clearMessages();
  });
  
  afterEach(async () => {
    // 等待一小段时间确保所有异步操作完成
    await new Promise(resolve => setTimeout(resolve, 10));
    router.clear();
  });
  
  describe('sendMessage', () => {
    it('应该发送点对点消息并添加到消息存储', async () => {
      const message = createMessage(
        'discussion',
        'writer_1',
        'writer_2',
        'Hello, Writer 2!'
      );
      
      await router.sendMessage(message);
      
      const messageStore = useMessageStore.getState();
      const storedMessage = messageStore.getMessage(message.id);
      
      expect(storedMessage).toBeDefined();
      expect(storedMessage?.content).toBe('Hello, Writer 2!');
      expect(storedMessage?.sender).toBe('writer_1');
      expect(storedMessage?.receiver).toBe('writer_2');
    });
    
    it('应该支持多播消息（多个接收者）', async () => {
      const message = createMessage(
        'discussion',
        'supervisor_ai',
        ['writer_1', 'writer_2', 'writer_3'],
        'Message to all writers'
      );
      
      await router.sendMessage(message);
      
      const messageStore = useMessageStore.getState();
      const storedMessage = messageStore.getMessage(message.id);
      
      expect(storedMessage).toBeDefined();
      expect(Array.isArray(storedMessage?.receiver)).toBe(true);
      expect((storedMessage?.receiver as string[]).length).toBe(3);
    });
    
    it('应该通知订阅者收到新消息', async () => {
      const callback = vi.fn();
      router.subscribeToMessages('writer_2', callback);
      
      const message = createMessage(
        'discussion',
        'writer_1',
        'writer_2',
        'Test message'
      );
      
      await router.sendMessage(message);
      
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(message);
    });
    
    it('应该通知多个订阅者', async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      router.subscribeToMessages('writer_2', callback1);
      router.subscribeToMessages('writer_2', callback2);
      
      const message = createMessage(
        'discussion',
        'writer_1',
        'writer_2',
        'Test message'
      );
      
      await router.sendMessage(message);
      
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('subscribeToMessages', () => {
    it('应该订阅Agent的消息', async () => {
      const callback = vi.fn();
      const unsubscribe = router.subscribeToMessages('writer_1', callback);
      
      const message = createMessage(
        'task_assignment',
        'decision_ai',
        'writer_1',
        'Your task is...'
      );
      
      await router.sendMessage(message);
      
      expect(callback).toHaveBeenCalledWith(message);
      
      // 清理
      unsubscribe();
    });
    
    it('应该支持取消订阅', async () => {
      const callback = vi.fn();
      const unsubscribe = router.subscribeToMessages('writer_1', callback);
      
      // 发送第一条消息
      const message1 = createMessage(
        'discussion',
        'writer_2',
        'writer_1',
        'Message 1'
      );
      await router.sendMessage(message1);
      
      expect(callback).toHaveBeenCalledTimes(1);
      
      // 取消订阅
      unsubscribe();
      
      // 发送第二条消息
      const message2 = createMessage(
        'discussion',
        'writer_2',
        'writer_1',
        'Message 2'
      );
      await router.sendMessage(message2);
      
      // 回调不应该再被调用
      expect(callback).toHaveBeenCalledTimes(1);
    });
    
    it('应该处理订阅回调中的错误', async () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error');
      });
      const normalCallback = vi.fn();
      
      router.subscribeToMessages('writer_1', errorCallback);
      router.subscribeToMessages('writer_1', normalCallback);
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const message = createMessage(
        'discussion',
        'writer_2',
        'writer_1',
        'Test message'
      );
      
      await router.sendMessage(message);
      
      // 错误回调应该被调用并记录错误
      expect(errorCallback).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
      
      // 正常回调应该仍然被调用
      expect(normalCallback).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('broadcastToTeam', () => {
    it('应该广播消息到写作团队所有成员', async () => {
      // 注册团队成员
      router.registerTeamMember('writing', 'writer_1');
      router.registerTeamMember('writing', 'writer_2');
      router.registerTeamMember('writing', 'writer_3');
      
      const message = createMessage(
        'discussion',
        'supervisor_ai',
        '', // receiver会被覆盖
        'Important announcement to all writers'
      );
      
      await router.broadcastToTeam('writing', message);
      
      const messageStore = useMessageStore.getState();
      const storedMessage = messageStore.getMessage(message.id);
      
      expect(storedMessage).toBeDefined();
      expect(Array.isArray(storedMessage?.receiver)).toBe(true);
      expect((storedMessage?.receiver as string[]).length).toBe(3);
      expect((storedMessage?.receiver as string[])).toContain('writer_1');
      expect((storedMessage?.receiver as string[])).toContain('writer_2');
      expect((storedMessage?.receiver as string[])).toContain('writer_3');
    });
    
    it('应该广播消息到审稿团队所有成员', async () => {
      // 注册审稿团队成员
      router.registerTeamMember('review', 'editorial_office');
      router.registerTeamMember('review', 'editor_in_chief');
      router.registerTeamMember('review', 'peer_reviewer');
      
      const message = createMessage(
        'discussion',
        'supervisor_ai',
        '',
        'Review team announcement'
      );
      
      await router.broadcastToTeam('review', message);
      
      const messageStore = useMessageStore.getState();
      const storedMessage = messageStore.getMessage(message.id);
      
      expect(storedMessage).toBeDefined();
      expect((storedMessage?.receiver as string[]).length).toBe(3);
    });
    
    it('应该处理空团队的广播', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const message = createMessage(
        'discussion',
        'supervisor_ai',
        '',
        'Message to empty team'
      );
      
      await router.broadcastToTeam('writing', message);
      
      expect(consoleSpy).toHaveBeenCalledWith('No members found in writing team');
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('requestFeedback', () => {
    it('应该发送反馈请求并等待响应', async () => {
      // 模拟接收者响应
      router.subscribeToMessages('writer_2', async (message) => {
        if (message.type === 'feedback_request') {
          // 发送反馈响应
          const response = createMessage(
            'feedback_response',
            'writer_2',
            'writer_1',
            'Here is my feedback on your question.',
            {
              relatedTaskId: message.metadata.relatedTaskId
            }
          );
          
          await router.sendMessage(response);
        }
      });
      
      const feedbackPromise = router.requestFeedback(
        'writer_1',
        'writer_2',
        'What do you think about the introduction?'
      );
      
      const feedback = await feedbackPromise;
      
      expect(feedback).toBe('Here is my feedback on your question.');
    });
    
    it('应该在超时时拒绝Promise', async () => {
      // 设置较短的超时时间用于测试
      const shortTimeoutRouter = new InteractionRouter();
      shortTimeoutRouter.configureTimeout('reject', 100); // 100ms
      
      const feedbackPromise = shortTimeoutRouter.requestFeedback(
        'writer_1',
        'writer_2',
        'This will timeout',
        100 // 明确设置超时时间
      );
      
      await expect(feedbackPromise).rejects.toThrow();
      
      // 清理
      shortTimeoutRouter.clear();
    }, 10000);
    
    it('应该创建正确的反馈请求消息', async () => {
      const callback = vi.fn();
      
      // 创建一个短超时的路由器用于测试
      const testRouter = new InteractionRouter();
      testRouter.configureTimeout('skip', 100); // 100ms
      testRouter.subscribeToMessages('writer_2', callback);
      
      // 不等待响应，只检查请求消息，但要捕获拒绝
      const feedbackPromise = testRouter.requestFeedback(
        'writer_1',
        'writer_2',
        'Test feedback request',
        100 // 明确设置超时时间
      ).catch(() => {}); // 捕获超时拒绝
      
      // 等待一小段时间让消息被发送
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(callback).toHaveBeenCalled();
      const requestMessage = callback.mock.calls[0]?.[0] as AgentMessage;
      
      expect(requestMessage.type).toBe('feedback_request');
      expect(requestMessage.sender).toBe('writer_1');
      expect(requestMessage.receiver).toBe('writer_2');
      expect(requestMessage.content).toBe('Test feedback request');
      expect(requestMessage.metadata.requiresResponse).toBe(true);
      expect(requestMessage.metadata.relatedTaskId).toBeDefined();
      
      // 等待Promise完成（会超时但被捕获）
      await feedbackPromise;
      
      // 清理
      testRouter.clear();
    }, 5000);
  });
  
  describe('团队成员管理', () => {
    it('应该注册团队成员', () => {
      router.registerTeamMember('writing', 'writer_1');
      router.registerTeamMember('writing', 'writer_2');
      
      const members = router.getTeamMembers('writing');
      
      expect(members).toHaveLength(2);
      expect(members).toContain('writer_1');
      expect(members).toContain('writer_2');
    });
    
    it('应该注销团队成员', () => {
      router.registerTeamMember('writing', 'writer_1');
      router.registerTeamMember('writing', 'writer_2');
      
      router.unregisterTeamMember('writing', 'writer_1');
      
      const members = router.getTeamMembers('writing');
      
      expect(members).toHaveLength(1);
      expect(members).toContain('writer_2');
      expect(members).not.toContain('writer_1');
    });
    
    it('应该返回空数组对于空团队', () => {
      const members = router.getTeamMembers('writing');
      
      expect(members).toEqual([]);
    });
  });
  
  describe('createMessage辅助函数', () => {
    it('应该创建带有默认元数据的消息', () => {
      const message = createMessage(
        'discussion',
        'writer_1',
        'writer_2',
        'Test content'
      );
      
      expect(message.id).toBeDefined();
      expect(message.type).toBe('discussion');
      expect(message.sender).toBe('writer_1');
      expect(message.receiver).toBe('writer_2');
      expect(message.content).toBe('Test content');
      expect(message.metadata.priority).toBe('medium');
      expect(message.metadata.requiresResponse).toBe(false);
      expect(message.metadata.timestamp).toBeDefined();
      expect(message.timestamp).toBeInstanceOf(Date);
    });
    
    it('应该创建带有自定义元数据的消息', () => {
      const message = createMessage(
        'task_assignment',
        'decision_ai',
        'writer_1',
        'Your task',
        {
          priority: 'high',
          requiresResponse: true,
          relatedTaskId: 'task-123',
          tags: ['urgent', 'introduction']
        }
      );
      
      expect(message.metadata.priority).toBe('high');
      expect(message.metadata.requiresResponse).toBe(true);
      expect(message.metadata.relatedTaskId).toBe('task-123');
      expect(message.metadata.tags).toEqual(['urgent', 'introduction']);
    });
    
    it('应该支持多个接收者', () => {
      const message = createMessage(
        'discussion',
        'supervisor_ai',
        ['writer_1', 'writer_2'],
        'Message to multiple receivers'
      );
      
      expect(Array.isArray(message.receiver)).toBe(true);
      expect((message.receiver as string[]).length).toBe(2);
    });
  });
  
  describe('clear', () => {
    it('应该清理所有订阅和待处理请求', async () => {
      // 添加订阅
      const callback = vi.fn();
      router.subscribeToMessages('writer_1', callback);
      
      // 添加团队成员
      router.registerTeamMember('writing', 'writer_1');
      
      // 创建待处理的反馈请求
      const feedbackPromise = router.requestFeedback(
        'writer_1',
        'writer_2',
        'Test'
      ).catch(() => {}); // 捕获拒绝以避免未处理的Promise拒绝
      
      // 清理
      router.clear();
      
      // 等待Promise被拒绝
      await feedbackPromise;
      
      // 验证订阅被清理（发送消息不应触发回调）
      const message = createMessage(
        'discussion',
        'writer_2',
        'writer_1',
        'After clear'
      );
      await router.sendMessage(message);
      
      expect(callback).not.toHaveBeenCalled();
      
      // 验证团队成员被清理
      expect(router.getTeamMembers('writing')).toEqual([]);
    });
  });
});

describe('Task 25.1: 交互优先级处理', () => {
  let router: InteractionRouter;
  
  beforeEach(() => {
    router = new InteractionRouter();
    useMessageStore.getState().clearMessages();
  });
  
  afterEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 10));
    router.clear();
  });
  
  it('应该根据消息优先级排序处理', async () => {
    const processedMessages: string[] = [];
    
    // 订阅接收者以记录消息处理顺序
    router.subscribeToMessages('receiver', (message) => {
      processedMessages.push(message.content);
    });
    
    // 发送不同优先级的消息
    const lowPriorityMsg = createMessage(
      'discussion',
      'sender',
      'receiver',
      'Low priority message',
      { priority: 'low' }
    );
    
    const highPriorityMsg = createMessage(
      'discussion',
      'sender',
      'receiver',
      'High priority message',
      { priority: 'high' }
    );
    
    const mediumPriorityMsg = createMessage(
      'discussion',
      'sender',
      'receiver',
      'Medium priority message',
      { priority: 'medium' }
    );
    
    // 按低、高、中的顺序发送（不等待，让它们都进入队列）
    router.sendMessage(lowPriorityMsg);
    router.sendMessage(highPriorityMsg);
    router.sendMessage(mediumPriorityMsg);
    
    // 等待消息处理完成（异步处理）
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 验证处理顺序：高 > 中 > 低
    expect(processedMessages).toHaveLength(3);
    expect(processedMessages[0]).toBe('High priority message');
    expect(processedMessages[1]).toBe('Medium priority message');
    expect(processedMessages[2]).toBe('Low priority message');
  });
  
  it('应该优先响应高优先级消息', async () => {
    const callbacks: Array<{ priority: string; time: number }> = [];
    
    router.subscribeToMessages('receiver', (message) => {
      callbacks.push({
        priority: message.metadata.priority,
        time: Date.now()
      });
    });
    
    // 同时发送多个不同优先级的消息
    const messages = [
      createMessage('discussion', 'sender', 'receiver', 'Msg 1', { priority: 'low' }),
      createMessage('discussion', 'sender', 'receiver', 'Msg 2', { priority: 'high' }),
      createMessage('discussion', 'sender', 'receiver', 'Msg 3', { priority: 'medium' }),
      createMessage('discussion', 'sender', 'receiver', 'Msg 4', { priority: 'high' }),
    ];
    
    // 同时发送多个不同优先级的消息（不等待，让它们都进入队列）
    messages.forEach(msg => router.sendMessage(msg));
    
    // 等待处理完成（异步处理）
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 验证高优先级消息先被处理
    expect(callbacks[0].priority).toBe('high');
    expect(callbacks[1].priority).toBe('high');
    expect(callbacks[2].priority).toBe('medium');
    expect(callbacks[3].priority).toBe('low');
  });
});

describe('Task 25.2: 交互超时处理', () => {
  let router: InteractionRouter;
  
  beforeEach(() => {
    router = new InteractionRouter();
    useMessageStore.getState().clearMessages();
  });
  
  afterEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 10));
    router.clear();
  });
  
  it('应该支持配置超时处理策略', () => {
    router.configureTimeout('skip', 15000);
    
    // 验证配置已应用（通过内部状态）
    expect((router as any).timeoutStrategy).toBe('skip');
    expect((router as any).feedbackTimeout).toBe(15000);
  });
  
  it('应该在超时后使用skip策略返回空字符串', async () => {
    router.configureTimeout('skip', 100); // 100ms超时
    
    const feedbackPromise = router.requestFeedback(
      'writer_1',
      'writer_2',
      'This will timeout with skip strategy'
    );
    
    const result = await feedbackPromise;
    
    expect(result).toBe('');
  });
  
  it('应该在超时后使用default策略返回默认消息', async () => {
    router.configureTimeout('default', 100); // 100ms超时
    
    const feedbackPromise = router.requestFeedback(
      'writer_1',
      'writer_2',
      'This will timeout with default strategy'
    );
    
    const result = await feedbackPromise;
    
    expect(result).toContain('[Timeout]');
    expect(result).toContain('writer_2');
  });
  
  it('应该在超时后使用reject策略抛出错误', async () => {
    router.configureTimeout('reject', 100); // 100ms超时
    
    const feedbackPromise = router.requestFeedback(
      'writer_1',
      'writer_2',
      'This will timeout with reject strategy'
    );
    
    await expect(feedbackPromise).rejects.toThrow('Feedback request timeout');
  });
  
  it('应该支持自定义超时时间', async () => {
    router.configureTimeout('skip', 5000); // 默认5秒
    
    const startTime = Date.now();
    
    // 使用自定义的100ms超时
    const feedbackPromise = router.requestFeedback(
      'writer_1',
      'writer_2',
      'Custom timeout test',
      100 // 自定义超时
    );
    
    await feedbackPromise;
    
    const elapsed = Date.now() - startTime;
    
    // 应该在100ms左右超时，而不是5000ms
    expect(elapsed).toBeLessThan(200);
  });
  
  it('应该在收到响应后清除超时', async () => {
    router.configureTimeout('reject', 1000); // 1秒超时
    
    // 模拟快速响应
    router.subscribeToMessages('writer_2', async (message) => {
      if (message.type === 'feedback_request') {
        // 立即响应
        const response = createMessage(
          'feedback_response',
          'writer_2',
          'writer_1',
          'Quick response',
          { relatedTaskId: message.metadata.relatedTaskId }
        );
        await router.sendMessage(response);
      }
    });
    
    const feedback = await router.requestFeedback(
      'writer_1',
      'writer_2',
      'Quick response test'
    );
    
    expect(feedback).toBe('Quick response');
  });
});

describe('Task 25.3: 交互冲突检测', () => {
  let router: InteractionRouter;
  
  beforeEach(() => {
    router = new InteractionRouter();
    useMessageStore.getState().clearMessages();
  });
  
  afterEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 10));
    router.clear();
  });
  
  it('应该检测简单的循环依赖（A等待B，B等待A）', async () => {
    // 创建循环依赖：writer_1等待writer_2，writer_2等待writer_1
    router.configureTimeout('skip', 10000); // 长超时以便检测
    
    const promise1 = router.requestFeedback('writer_1', 'writer_2', 'Request from 1 to 2').catch(() => {});
    const promise2 = router.requestFeedback('writer_2', 'writer_1', 'Request from 2 to 1').catch(() => {});
    
    // 等待一小段时间让请求被记录
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const cycles = router.detectCircularDependencies();
    
    expect(cycles.length).toBeGreaterThan(0);
    expect(cycles[0].agents).toContain('writer_1');
    expect(cycles[0].agents).toContain('writer_2');
    expect(cycles[0].description).toContain('Circular dependency detected');
    
    // 清理
    await Promise.all([promise1, promise2]);
  }, 15000);
  
  it('应该检测复杂的循环依赖（A->B->C->A）', async () => {
    router.configureTimeout('skip', 10000);
    
    const promise1 = router.requestFeedback('agent_a', 'agent_b', 'A to B').catch(() => {});
    const promise2 = router.requestFeedback('agent_b', 'agent_c', 'B to C').catch(() => {});
    const promise3 = router.requestFeedback('agent_c', 'agent_a', 'C to A').catch(() => {});
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const cycles = router.detectCircularDependencies();
    
    expect(cycles.length).toBeGreaterThan(0);
    const cycle = cycles[0];
    expect(cycle.agents).toContain('agent_a');
    expect(cycle.agents).toContain('agent_b');
    expect(cycle.agents).toContain('agent_c');
    
    // 清理
    await Promise.all([promise1, promise2, promise3]);
  }, 15000);
  
  it('应该在没有循环依赖时返回空数组', async () => {
    router.configureTimeout('skip', 10000);
    
    // 创建非循环依赖
    const promise1 = router.requestFeedback('writer_1', 'writer_2', 'Linear request 1').catch(() => {});
    const promise2 = router.requestFeedback('writer_2', 'writer_3', 'Linear request 2').catch(() => {});
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const cycles = router.detectCircularDependencies();
    
    expect(cycles).toEqual([]);
    
    // 清理
    await Promise.all([promise1, promise2]);
  }, 15000);
  
  it('应该检测死锁情况', async () => {
    router.configureTimeout('skip', 1000); // 1秒超时
    
    // 创建循环依赖
    const promise1 = router.requestFeedback('writer_1', 'writer_2', 'Deadlock test 1');
    const promise2 = router.requestFeedback('writer_2', 'writer_1', 'Deadlock test 2');
    
    // 等待足够长的时间让系统检测到死锁（超过一半超时时间）
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const deadlock = router.detectDeadlock();
    
    expect(deadlock.detected).toBe(true);
    expect(deadlock.involvedAgents.length).toBeGreaterThan(0);
    expect(deadlock.waitingChain).toContain('writer_1');
    expect(deadlock.waitingChain).toContain('writer_2');
    expect(deadlock.suggestion).toContain('Deadlock detected');
    
    // 清理
    await Promise.all([promise1, promise2]);
  });
  
  it('应该在没有死锁时返回未检测到', async () => {
    const deadlock = router.detectDeadlock();
    
    expect(deadlock.detected).toBe(false);
    expect(deadlock.involvedAgents).toEqual([]);
    expect(deadlock.suggestion).toContain('No deadlock detected');
  });
  
  it('应该提供死锁解决建议', async () => {
    router.configureTimeout('skip', 1000);
    
    // 创建死锁场景
    const promise1 = router.requestFeedback('agent_x', 'agent_y', 'Deadlock scenario');
    const promise2 = router.requestFeedback('agent_y', 'agent_x', 'Deadlock scenario');
    
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const deadlock = router.detectDeadlock();
    
    if (deadlock.detected) {
      expect(deadlock.suggestion).toContain('Cancel one of the pending requests');
      expect(deadlock.suggestion).toContain('increase timeout');
      expect(deadlock.suggestion).toContain('Waiting chain');
    }
    
    // 清理
    await Promise.all([promise1, promise2]);
  });
  
  it('应该检测潜在的循环依赖（等待时间不长）', async () => {
    router.configureTimeout('skip', 10000); // 长超时
    
    // 创建循环但不等待太久
    const promise1 = router.requestFeedback('agent_1', 'agent_2', 'Potential cycle').catch(() => {});
    const promise2 = router.requestFeedback('agent_2', 'agent_1', 'Potential cycle').catch(() => {});
    
    // 只等待很短时间（不足以触发死锁检测）
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const deadlock = router.detectDeadlock();
    
    // 应该检测到循环但不是确认的死锁
    expect(deadlock.detected).toBe(false);
    expect(deadlock.involvedAgents.length).toBeGreaterThan(0);
    expect(deadlock.suggestion).toContain('Potential circular dependency');
    
    // 清理
    await Promise.all([promise1, promise2]);
  }, 15000);
});

describe('Task 25: 集成测试', () => {
  let router: InteractionRouter;
  
  beforeEach(() => {
    router = new InteractionRouter();
    useMessageStore.getState().clearMessages();
  });
  
  afterEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 10));
    router.clear();
  });
  
  it('应该在高负载下正确处理优先级、超时和冲突检测', async () => {
    router.configureTimeout('skip', 500);
    
    const results: string[] = [];
    
    // 设置多个订阅者
    router.subscribeToMessages('receiver_1', (msg) => {
      results.push(`R1: ${msg.metadata.priority}`);
    });
    
    router.subscribeToMessages('receiver_2', (msg) => {
      results.push(`R2: ${msg.metadata.priority}`);
    });
    
    // 发送大量不同优先级的消息
    const messages = [
      createMessage('discussion', 'sender', 'receiver_1', 'Msg 1', { priority: 'low' }),
      createMessage('discussion', 'sender', 'receiver_2', 'Msg 2', { priority: 'high' }),
      createMessage('discussion', 'sender', 'receiver_1', 'Msg 3', { priority: 'medium' }),
      createMessage('discussion', 'sender', 'receiver_2', 'Msg 4', { priority: 'high' }),
      createMessage('discussion', 'sender', 'receiver_1', 'Msg 5', { priority: 'low' }),
    ];
    
    // 发送大量不同优先级的消息（不等待，让它们都进入队列）
    messages.forEach(msg => router.sendMessage(msg));
    
    // 同时创建一些反馈请求
    const feedbackPromises = [
      router.requestFeedback('agent_1', 'agent_2', 'Feedback 1').catch(() => {}),
      router.requestFeedback('agent_3', 'agent_4', 'Feedback 2').catch(() => {}),
    ];
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // 检测冲突
    const cycles = router.detectCircularDependencies();
    const deadlock = router.detectDeadlock();
    
    // 验证消息按优先级处理
    expect(results.length).toBe(5);
    expect(results[0]).toContain('high');
    expect(results[1]).toContain('high');
    
    // 验证没有循环依赖（因为反馈请求是线性的）
    expect(cycles).toEqual([]);
    expect(deadlock.detected).toBe(false);
    
    // 清理
    await Promise.all(feedbackPromises);
  });
});
