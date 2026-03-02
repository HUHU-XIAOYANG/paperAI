/**
 * StreamHandler使用示例
 * 
 * 演示如何使用StreamHandler处理AI的流式输出。
 */

import { StreamHandler } from './streamHandler';
import type { StreamSession } from '../types/message.types';

// ============================================================================
// 示例1: 基本流式输出处理
// ============================================================================

export function example1_BasicStreaming() {
  console.log('=== 示例1: 基本流式输出处理 ===\n');

  const handler = new StreamHandler();
  const agentId = 'writer_1';

  // 1. 开始流式会话
  const session = handler.startStream(agentId);
  console.log(`Started stream session: ${session.id}`);
  console.log(`Agent: ${session.agentId}`);
  console.log(`Start time: ${session.startTime.toISOString()}\n`);

  // 2. 订阅流式输出
  handler.subscribeToStream(session.id, (chunk, isComplete) => {
    if (isComplete) {
      console.log('\n[Stream completed]');
    } else {
      console.log(`Received chunk: "${chunk}"`);
    }
  });

  // 3. 模拟接收数据块
  handler.handleStreamChunk(session.id, '我已完成');
  handler.handleStreamChunk(session.id, '引言部分');
  handler.handleStreamChunk(session.id, '的初稿。');

  // 4. 结束流式会话
  handler.endStream(session.id);

  // 5. 查看完整缓冲区
  const finalSession = handler.getSession(session.id);
  console.log(`\nFinal buffer: "${finalSession?.buffer}"`);
  console.log(`Is active: ${finalSession?.isActive}\n`);
}

// ============================================================================
// 示例2: 多个订阅者
// ============================================================================

export function example2_MultipleSubscribers() {
  console.log('=== 示例2: 多个订阅者 ===\n');

  const handler = new StreamHandler();
  const session = handler.startStream('writer_1');

  // UI组件1订阅
  handler.subscribeToStream(session.id, (chunk, isComplete) => {
    if (!isComplete && chunk) {
      console.log(`[UI Component 1] Displaying: ${chunk}`);
    }
  });

  // UI组件2订阅
  handler.subscribeToStream(session.id, (chunk, isComplete) => {
    if (!isComplete && chunk) {
      console.log(`[UI Component 2] Logging: ${chunk}`);
    }
  });

  // 发送数据块
  handler.handleStreamChunk(session.id, 'Hello');
  handler.handleStreamChunk(session.id, ' World');

  handler.endStream(session.id);
  console.log();
}

// ============================================================================
// 示例3: 晚加入的订阅者
// ============================================================================

export function example3_LateSubscriber() {
  console.log('=== 示例3: 晚加入的订阅者 ===\n');

  const handler = new StreamHandler();
  const session = handler.startStream('writer_1');

  // 先发送一些数据
  handler.handleStreamChunk(session.id, 'Part 1. ');
  handler.handleStreamChunk(session.id, 'Part 2. ');
  console.log('Sent initial chunks\n');

  // 晚加入的订阅者会立即收到已有的缓冲内容
  handler.subscribeToStream(session.id, (chunk, isComplete) => {
    if (chunk) {
      console.log(`[Late Subscriber] Received: "${chunk}"`);
    }
    if (isComplete) {
      console.log('[Late Subscriber] Stream completed');
    }
  });

  // 继续发送数据
  handler.handleStreamChunk(session.id, 'Part 3.');

  handler.endStream(session.id);
  console.log();
}

// ============================================================================
// 示例4: 取消订阅
// ============================================================================

export function example4_Unsubscribe() {
  console.log('=== 示例4: 取消订阅 ===\n');

  const handler = new StreamHandler();
  const session = handler.startStream('writer_1');

  // 订阅并保存取消订阅函数
  const unsubscribe = handler.subscribeToStream(session.id, (chunk, isComplete) => {
    console.log(`Received: ${chunk || '[complete]'}`);
  });

  handler.handleStreamChunk(session.id, 'Message 1');
  
  // 取消订阅
  console.log('\nUnsubscribing...\n');
  unsubscribe();

  // 这条消息不会被接收
  handler.handleStreamChunk(session.id, 'Message 2');
  console.log('Message 2 sent but not received by unsubscribed callback\n');

  handler.endStream(session.id);
}

// ============================================================================
// 示例5: 多个并发流
// ============================================================================

export function example5_ConcurrentStreams() {
  console.log('=== 示例5: 多个并发流 ===\n');

  const handler = new StreamHandler();

  // 创建多个Agent的流式会话
  const session1 = handler.startStream('writer_1');
  const session2 = handler.startStream('writer_2');
  const session3 = handler.startStream('reviewer_1');

  console.log(`Created ${handler.getActiveSessions().length} active sessions\n`);

  // 为每个会话订阅
  handler.subscribeToStream(session1.id, (chunk) => {
    if (chunk) console.log(`[Writer 1] ${chunk}`);
  });

  handler.subscribeToStream(session2.id, (chunk) => {
    if (chunk) console.log(`[Writer 2] ${chunk}`);
  });

  handler.subscribeToStream(session3.id, (chunk) => {
    if (chunk) console.log(`[Reviewer 1] ${chunk}`);
  });

  // 交错发送数据
  handler.handleStreamChunk(session1.id, 'Writing introduction...');
  handler.handleStreamChunk(session2.id, 'Writing methods...');
  handler.handleStreamChunk(session3.id, 'Reviewing format...');
  handler.handleStreamChunk(session1.id, 'Done.');
  handler.handleStreamChunk(session2.id, 'Done.');

  // 结束部分会话
  handler.endStream(session1.id);
  handler.endStream(session2.id);

  console.log(`\nActive sessions: ${handler.getActiveSessions().length}`);
  console.log();
}

// ============================================================================
// 示例6: 会话管理和清理
// ============================================================================

export function example6_SessionManagement() {
  console.log('=== 示例6: 会话管理和清理 ===\n');

  const handler = new StreamHandler();

  // 创建多个会话
  const session1 = handler.startStream('agent_1');
  const session2 = handler.startStream('agent_2');
  const session3 = handler.startStream('agent_3');

  console.log(`Created sessions: ${handler.getActiveSessions().length}`);

  // 结束部分会话
  handler.endStream(session1.id);
  handler.endStream(session2.id);

  console.log(`Active sessions: ${handler.getActiveSessions().length}`);

  // 清理非活跃会话
  const cleaned = handler.cleanupInactiveSessions();
  console.log(`Cleaned up ${cleaned} inactive sessions`);

  // 获取特定Agent的会话
  const agentSession = handler.getActiveSessionByAgent('agent_3');
  console.log(`Agent 3 session: ${agentSession?.id}`);

  // 清理所有会话
  handler.clearAllSessions();
  console.log(`All sessions cleared. Active: ${handler.getActiveSessions().length}\n`);
}

// ============================================================================
// 示例7: 错误处理
// ============================================================================

export function example7_ErrorHandling() {
  console.log('=== 示例7: 错误处理 ===\n');

  const handler = new StreamHandler();

  // 尝试处理不存在的会话
  try {
    handler.handleStreamChunk('nonexistent_session', 'data');
  } catch (error) {
    console.log(`Error caught: ${(error as Error).message}`);
  }

  // 尝试为同一Agent创建多个活跃会话
  const session = handler.startStream('writer_1');
  try {
    handler.startStream('writer_1');
  } catch (error) {
    console.log(`Error caught: ${(error as Error).message}`);
  }

  // 尝试向已结束的会话发送数据
  handler.endStream(session.id);
  try {
    handler.handleStreamChunk(session.id, 'data');
  } catch (error) {
    console.log(`Error caught: ${(error as Error).message}`);
  }

  console.log();
}

// ============================================================================
// 示例8: 实际应用场景 - AI写作流程
// ============================================================================

export function example8_RealWorldScenario() {
  console.log('=== 示例8: 实际应用场景 - AI写作流程 ===\n');

  const handler = new StreamHandler();

  // 模拟Decision AI分配任务
  console.log('[Decision AI] Assigning tasks to writers...\n');

  // Writer 1开始写作
  const writerSession = handler.startStream('writer_1');
  
  // UI订阅显示进度
  let displayBuffer = '';
  handler.subscribeToStream(writerSession.id, (chunk, isComplete) => {
    if (chunk) {
      displayBuffer += chunk;
      console.log(`[UI Display] ${displayBuffer}`);
    }
    if (isComplete) {
      console.log('[UI Display] ✓ Writing completed\n');
    }
  });

  // 模拟AI逐步生成内容
  console.log('[Writer 1] Starting to write...\n');
  
  setTimeout(() => {
    handler.handleStreamChunk(writerSession.id, '# 引言\n\n');
  }, 100);

  setTimeout(() => {
    handler.handleStreamChunk(writerSession.id, '本研究探讨了');
  }, 200);

  setTimeout(() => {
    handler.handleStreamChunk(writerSession.id, '多智能体协作');
  }, 300);

  setTimeout(() => {
    handler.handleStreamChunk(writerSession.id, '在学术写作中的应用。');
  }, 400);

  setTimeout(() => {
    handler.endStream(writerSession.id);
    
    // Supervisor AI检查输出
    const finalContent = handler.getSession(writerSession.id)?.buffer;
    console.log(`[Supervisor AI] Reviewing content (${finalContent?.length} chars)`);
    console.log('[Supervisor AI] ✓ Content approved\n');
  }, 500);
}

// ============================================================================
// 运行所有示例
// ============================================================================

export function runAllExamples() {
  example1_BasicStreaming();
  example2_MultipleSubscribers();
  example3_LateSubscriber();
  example4_Unsubscribe();
  example5_ConcurrentStreams();
  example6_SessionManagement();
  example7_ErrorHandling();
  
  // 异步示例需要单独运行
  console.log('Running async example...\n');
  example8_RealWorldScenario();
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}
