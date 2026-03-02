/**
 * InteractionRouter使用示例
 * 
 * 演示如何使用InteractionRouter进行Agent之间的消息传递和交互。
 */

import { InteractionRouter, createMessage } from './interactionRouter';
import type { AgentMessage } from '../types';

// 创建路由器实例
const router = new InteractionRouter();

/**
 * 示例1: 点对点消息传递
 * 
 * Writer 1向Writer 2发送讨论消息
 */
async function example1_pointToPointMessage() {
  console.log('=== 示例1: 点对点消息 ===');
  
  // 订阅Writer 2的消息
  router.subscribeToMessages('writer_2', (message: AgentMessage) => {
    console.log(`Writer 2 received message from ${message.sender}:`);
    console.log(`  Type: ${message.type}`);
    console.log(`  Content: ${message.content}`);
  });
  
  // Writer 1发送消息给Writer 2
  const message = createMessage(
    'discussion',
    'writer_1',
    'writer_2',
    '关于引言部分，我们需要讨论一下研究背景的范围。你觉得应该包含哪些内容？',
    {
      priority: 'medium',
      requiresResponse: true,
      tags: ['introduction', 'discussion']
    }
  );
  
  await router.sendMessage(message);
  
  console.log('Message sent successfully!\n');
}

/**
 * 示例2: 团队广播
 * 
 * Supervisor AI向所有写作团队成员广播消息
 */
async function example2_teamBroadcast() {
  console.log('=== 示例2: 团队广播 ===');
  
  // 注册写作团队成员
  router.registerTeamMember('writing', 'writer_1');
  router.registerTeamMember('writing', 'writer_2');
  router.registerTeamMember('writing', 'writer_3');
  
  // 订阅所有成员的消息
  ['writer_1', 'writer_2', 'writer_3'].forEach(writerId => {
    router.subscribeToMessages(writerId, (message: AgentMessage) => {
      console.log(`${writerId} received broadcast: ${message.content}`);
    });
  });
  
  // Supervisor AI广播消息
  const broadcastMessage = createMessage(
    'discussion',
    'supervisor_ai',
    [], // receiver会被自动设置为团队成员
    '请所有写作团队成员注意：所有提交的内容必须符合OutputFormat规范。',
    {
      priority: 'high',
      requiresResponse: false
    }
  );
  
  await router.broadcastToTeam('writing', broadcastMessage);
  
  console.log('Broadcast sent to all writing team members!\n');
}

/**
 * 示例3: 反馈请求
 * 
 * Writer 1请求Writer 2的反馈，并等待响应
 */
async function example3_feedbackRequest() {
  console.log('=== 示例3: 反馈请求 ===');
  
  // 模拟Writer 2接收反馈请求并响应
  router.subscribeToMessages('writer_2', async (message: AgentMessage) => {
    if (message.type === 'feedback_request') {
      console.log(`Writer 2 received feedback request: ${message.content}`);
      console.log('Writer 2 is thinking...');
      
      // 模拟思考时间
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 发送反馈响应
      const response = createMessage(
        'feedback_response',
        'writer_2',
        'writer_1',
        '我认为引言部分应该包含以下内容：1) 研究领域的背景介绍 2) 当前研究的不足 3) 本研究的创新点。建议控制在2-3段以内。',
        {
          relatedTaskId: message.metadata.relatedTaskId,
          priority: 'medium'
        }
      );
      
      await router.sendMessage(response);
      console.log('Writer 2 sent feedback response');
    }
  });
  
  // Writer 1请求反馈
  console.log('Writer 1 requesting feedback...');
  try {
    const feedback = await router.requestFeedback(
      'writer_1',
      'writer_2',
      '你对引言部分的结构有什么建议？应该包含哪些要点？'
    );
    
    console.log('Writer 1 received feedback:');
    console.log(`  ${feedback}`);
  } catch (error) {
    console.error('Feedback request failed:', error);
  }
  
  console.log();
}

/**
 * 示例4: 多个订阅者
 * 
 * 多个组件订阅同一个Agent的消息
 */
async function example4_multipleSubscribers() {
  console.log('=== 示例4: 多个订阅者 ===');
  
  // UI组件订阅
  const unsubscribeUI = router.subscribeToMessages('writer_1', (message: AgentMessage) => {
    console.log('[UI Component] Updating display for writer_1');
    console.log(`  New message: ${message.content.substring(0, 50)}...`);
  });
  
  // 日志组件订阅
  const unsubscribeLogger = router.subscribeToMessages('writer_1', (message: AgentMessage) => {
    console.log('[Logger] Recording message');
    console.log(`  From: ${message.sender}, Type: ${message.type}`);
  });
  
  // 分析组件订阅
  const unsubscribeAnalytics = router.subscribeToMessages('writer_1', (message: AgentMessage) => {
    console.log('[Analytics] Tracking interaction');
    console.log(`  Priority: ${message.metadata.priority}`);
  });
  
  // 发送消息
  const message = createMessage(
    'task_assignment',
    'decision_ai',
    'writer_1',
    '你的任务是撰写论文的引言部分，包括研究背景、问题陈述和论文结构概述。',
    {
      priority: 'high',
      requiresResponse: false
    }
  );
  
  await router.sendMessage(message);
  
  console.log('\nAll subscribers notified!');
  
  // 清理订阅
  unsubscribeUI();
  unsubscribeLogger();
  unsubscribeAnalytics();
  
  console.log();
}

/**
 * 示例5: 非线性交互
 * 
 * 多个Agent之间的复杂交互场景
 */
async function example5_nonLinearInteraction() {
  console.log('=== 示例5: 非线性交互 ===');
  
  // 设置Writer 1的消息处理
  router.subscribeToMessages('writer_1', async (message: AgentMessage) => {
    console.log(`[Writer 1] Received ${message.type} from ${message.sender}`);
    
    if (message.type === 'feedback_request' && message.sender === 'writer_2') {
      // Writer 1回复Writer 2的反馈请求
      const response = createMessage(
        'feedback_response',
        'writer_1',
        'writer_2',
        '我同意你的观点，我们应该在引言中强调研究的创新性。',
        {
          relatedTaskId: message.metadata.relatedTaskId
        }
      );
      await router.sendMessage(response);
    }
  });
  
  // 设置Writer 2的消息处理
  router.subscribeToMessages('writer_2', async (message: AgentMessage) => {
    console.log(`[Writer 2] Received ${message.type} from ${message.sender}`);
    
    if (message.type === 'discussion' && message.sender === 'writer_1') {
      // Writer 2向Writer 1请求反馈
      console.log('[Writer 2] Requesting feedback from Writer 1...');
      const feedback = await router.requestFeedback(
        'writer_2',
        'writer_1',
        '你觉得我们应该在引言中强调研究的创新性吗？'
      );
      console.log(`[Writer 2] Received feedback: ${feedback}`);
    }
  });
  
  // Writer 1发起讨论
  const discussionMessage = createMessage(
    'discussion',
    'writer_1',
    'writer_2',
    '我正在写引言部分，想和你讨论一下内容结构。',
    {
      priority: 'medium',
      requiresResponse: true
    }
  );
  
  await router.sendMessage(discussionMessage);
  
  // 等待交互完成
  await new Promise(resolve => setTimeout(resolve, 100));
  
  console.log('\nNon-linear interaction completed!\n');
}

/**
 * 示例6: 审稿团队交互
 * 
 * 审稿团队成员之间的协作
 */
async function example6_reviewTeamInteraction() {
  console.log('=== 示例6: 审稿团队交互 ===');
  
  // 注册审稿团队成员
  router.registerTeamMember('review', 'editorial_office');
  router.registerTeamMember('review', 'editor_in_chief');
  router.registerTeamMember('review', 'deputy_editor');
  router.registerTeamMember('review', 'peer_reviewer');
  
  // Editorial Office向Editor in Chief请求意见
  router.subscribeToMessages('editor_in_chief', async (message: AgentMessage) => {
    if (message.type === 'feedback_request') {
      console.log('[Editor in Chief] Reviewing paper...');
      
      const response = createMessage(
        'feedback_response',
        'editor_in_chief',
        'editorial_office',
        '论文整体质量良好，但需要调整格式。建议要求作者修改后重新提交。',
        {
          relatedTaskId: message.metadata.relatedTaskId
        }
      );
      
      await router.sendMessage(response);
    }
  });
  
  console.log('[Editorial Office] Requesting review from Editor in Chief...');
  const review = await router.requestFeedback(
    'editorial_office',
    'editor_in_chief',
    '请审阅这篇论文的初稿，并提供您的意见。'
  );
  
  console.log(`[Editorial Office] Received review: ${review}`);
  
  // Editorial Office向整个审稿团队广播决定
  const decisionMessage = createMessage(
    'revision_request',
    'editorial_office',
    [],
    '根据主编的意见，论文需要进行格式调整。请审稿团队注意后续修订版本。',
    {
      priority: 'high'
    }
  );
  
  await router.broadcastToTeam('review', decisionMessage);
  
  console.log('[Editorial Office] Decision broadcasted to review team\n');
}

/**
 * 运行所有示例
 */
async function runAllExamples() {
  try {
    await example1_pointToPointMessage();
    await example2_teamBroadcast();
    await example3_feedbackRequest();
    await example4_multipleSubscribers();
    await example5_nonLinearInteraction();
    await example6_reviewTeamInteraction();
    
    console.log('=== 所有示例运行完成 ===');
  } catch (error) {
    console.error('Error running examples:', error);
  } finally {
    // 清理
    router.clear();
  }
}

// 如果直接运行此文件，执行所有示例
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}

export {
  example1_pointToPointMessage,
  example2_teamBroadcast,
  example3_feedbackRequest,
  example4_multipleSubscribers,
  example5_nonLinearInteraction,
  example6_reviewTeamInteraction
};
