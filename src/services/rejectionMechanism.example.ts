/**
 * Rejection Mechanism使用示例
 * Rejection Mechanism Usage Examples
 * 
 * 展示如何使用Rejection Mechanism服务进行退稿检测、原因分析、流程修复和重启
 */

import { createRejectionMechanism } from './rejectionMechanism';
import { createSupervisorAI } from './supervisorAI';
import { createDecisionAI } from './decisionAI';
import { createAgentManager } from './agentManager';
import { createAIClient } from './aiClient';
import type { AgentMessage } from '../types/message';
import type { SystemConfig } from '../types/config';

// ============================================================================
// 示例配置
// ============================================================================

const exampleSystemConfig: SystemConfig = {
  aiServices: [
    {
      id: 'default',
      name: 'OpenAI GPT-4',
      apiKey: 'sk-example-key',
      apiUrl: 'https://api.openai.com/v1',
      model: 'gpt-4',
      provider: 'openai',
    },
  ],
  defaultService: 'default',
  promptRepositoryPath: './prompts',
  outputDirectory: './output',
  theme: 'dark',
  internetAccess: {
    enabled: true,
  },
  streamingConfig: {
    chunkSize: 1024,
    updateInterval: 100,
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 创建服务实例的辅助函数
 */
function createServices() {
  const aiServiceConfig = exampleSystemConfig.aiServices[0];
  if (!aiServiceConfig) {
    throw new Error('AI服务配置未找到');
  }

  const aiClient = createAIClient({
    config: aiServiceConfig,
    retryConfig: {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
    },
    timeout: 60000,
  });

  const agentManager = createAgentManager(exampleSystemConfig);
  const decisionAI = createDecisionAI(aiClient, agentManager);
  const supervisorAI = createSupervisorAI(aiClient, agentManager, decisionAI);
  const rejectionMechanism = createRejectionMechanism(
    aiClient,
    supervisorAI,
    decisionAI,
    agentManager
  );

  return { aiClient, agentManager, decisionAI, supervisorAI, rejectionMechanism };
}

// ============================================================================
// 示例 1: 基本的退稿机制触发检测
// ============================================================================

async function example1_BasicTriggerDetection() {
  console.log('\n=== 示例 1: 基本的退稿机制触发检测 ===\n');

  // 创建服务实例
  const { rejectionMechanism } = createServices();

  // 检测不同退稿次数
  console.log('退稿次数 1:', rejectionMechanism.shouldTrigger(1)); // false
  console.log('退稿次数 2:', rejectionMechanism.shouldTrigger(2)); // false
  console.log('退稿次数 3:', rejectionMechanism.shouldTrigger(3)); // true
  console.log('退稿次数 5:', rejectionMechanism.shouldTrigger(5)); // true
}

// ============================================================================
// 示例 2: 退稿原因分析
// ============================================================================

async function example2_RejectionAnalysis() {
  console.log('\n=== 示例 2: 退稿原因分析 ===\n');

  // 创建服务实例
  const { rejectionMechanism } = createServices();

  // 模拟退稿消息
  const rejectionMessages: AgentMessage[] = [
    {
      id: 'msg_1',
      type: 'rejection',
      sender: 'editor_in_chief',
      receiver: 'writer_1',
      content: '论文格式不符合要求，请按照Output_Format规范重新提交',
      metadata: {
        timestamp: new Date().toISOString(),
        requiresResponse: true,
        priority: 'high',
      },
      timestamp: new Date(),
    },
    {
      id: 'msg_2',
      type: 'rejection',
      sender: 'peer_reviewer',
      receiver: 'writer_2',
      content: '内容质量不达标，缺少关键论证',
      metadata: {
        timestamp: new Date().toISOString(),
        requiresResponse: true,
        priority: 'high',
      },
      timestamp: new Date(),
    },
  ];

  // 分析退稿原因
  const analysis = await rejectionMechanism.analyzeRejection(3, rejectionMessages);

  console.log('退稿分析结果:');
  console.log('- 退稿次数:', analysis.rejectionCount);
  console.log('- 退稿原因数量:', analysis.reasons.length);
  console.log('- 流程瓶颈数量:', analysis.bottlenecks.length);
  console.log('- 建议动作数量:', analysis.suggestedActions.length);

  console.log('\n退稿原因详情:');
  analysis.reasons.forEach((reason, index) => {
    console.log(`  ${index + 1}. [${reason.category}] ${reason.description}`);
    console.log(`     严重程度: ${reason.severity}`);
    console.log(`     影响范围: ${reason.affectedSections.join(', ')}`);
  });

  console.log('\n流程瓶颈详情:');
  analysis.bottlenecks.forEach((bottleneck, index) => {
    console.log(`  ${index + 1}. [${bottleneck.type}] ${bottleneck.description}`);
    console.log(`     受影响的AI: ${bottleneck.affectedAgents.join(', ')}`);
    if (bottleneck.suggestedRoleType) {
      console.log(`     建议角色类型: ${bottleneck.suggestedRoleType}`);
    }
  });

  console.log('\n建议修复动作:');
  analysis.suggestedActions.forEach((action, index) => {
    console.log(`  ${index + 1}. [优先级 ${action.priority}] ${action.type}`);
    console.log(`     描述: ${action.description}`);
  });
}

// ============================================================================
// 示例 3: 流程修复
// ============================================================================

async function example3_ProcessFix() {
  console.log('\n=== 示例 3: 流程修复 ===\n');

  // 创建服务实例
  const { rejectionMechanism } = createServices();

  // 先进行退稿分析
  const analysis = await rejectionMechanism.analyzeRejection(3, []);

  // 执行流程修复
  console.log('开始执行流程修复...');
  const fixResult = await rejectionMechanism.fixProcess(analysis);

  console.log('\n流程修复结果:');
  console.log('- 修复成功:', fixResult.success);
  console.log('- 执行的动作数量:', fixResult.actionsExecuted.length);
  console.log('- 新增的AI数量:', fixResult.newAgentsAdded.length);
  console.log('- 错误数量:', fixResult.errors.length);
  console.log('- 消息:', fixResult.message);

  if (fixResult.actionsExecuted.length > 0) {
    console.log('\n已执行的动作:');
    fixResult.actionsExecuted.forEach((action, index) => {
      console.log(`  ${index + 1}. ${action.type}: ${action.description}`);
    });
  }

  if (fixResult.newAgentsAdded.length > 0) {
    console.log('\n新增的AI:');
    fixResult.newAgentsAdded.forEach((agentName, index) => {
      console.log(`  ${index + 1}. ${agentName}`);
    });
  }

  if (fixResult.errors.length > 0) {
    console.log('\n错误信息:');
    fixResult.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }
}

// ============================================================================
// 示例 4: 流程重启
// ============================================================================

async function example4_ProcessRestart() {
  console.log('\n=== 示例 4: 流程重启 ===\n');

  // 创建服务实例
  const { rejectionMechanism } = createServices();

  // 重启流程（保留历史记录和修订信息）
  console.log('重启流程（保留历史和修订）...');
  const restartResult1 = await rejectionMechanism.restartProcess(true, true);

  console.log('\n重启结果:');
  console.log('- 重启成功:', restartResult1.success);
  console.log('- 保留历史记录:', restartResult1.preservedHistory);
  console.log('- 保留修订信息:', restartResult1.preservedRevisions);
  console.log('- 新流程ID:', restartResult1.newProcessId);
  console.log('- 消息:', restartResult1.message);

  // 重启流程（清除所有记录）
  console.log('\n重启流程（清除所有记录）...');
  const restartResult2 = await rejectionMechanism.restartProcess(false, false);

  console.log('\n重启结果:');
  console.log('- 重启成功:', restartResult2.success);
  console.log('- 保留历史记录:', restartResult2.preservedHistory);
  console.log('- 保留修订信息:', restartResult2.preservedRevisions);
  console.log('- 新流程ID:', restartResult2.newProcessId);
}

// ============================================================================
// 示例 5: 完整的退稿机制流程
// ============================================================================

async function example5_CompleteRejectionFlow() {
  console.log('\n=== 示例 5: 完整的退稿机制流程 ===\n');

  // 创建服务实例
  const { rejectionMechanism } = createServices();

  // 模拟退稿场景
  let rejectionCount = 0;
  const rejectionMessages: AgentMessage[] = [];

  // 第一次退稿
  rejectionCount++;
  console.log(`第 ${rejectionCount} 次退稿`);
  if (rejectionMechanism.shouldTrigger(rejectionCount)) {
    console.log('触发退稿机制！');
  } else {
    console.log('未达到触发阈值，继续流程');
  }

  // 第二次退稿
  rejectionCount++;
  console.log(`\n第 ${rejectionCount} 次退稿`);
  if (rejectionMechanism.shouldTrigger(rejectionCount)) {
    console.log('触发退稿机制！');
  } else {
    console.log('未达到触发阈值，继续流程');
  }

  // 第三次退稿 - 触发退稿机制
  rejectionCount++;
  console.log(`\n第 ${rejectionCount} 次退稿`);
  if (rejectionMechanism.shouldTrigger(rejectionCount)) {
    console.log('触发退稿机制！\n');

    // 1. 分析退稿原因
    console.log('步骤 1: 分析退稿原因...');
    const analysis = await rejectionMechanism.analyzeRejection(
      rejectionCount,
      rejectionMessages
    );
    console.log(`  - 识别到 ${analysis.reasons.length} 个退稿原因`);
    console.log(`  - 识别到 ${analysis.bottlenecks.length} 个流程瓶颈`);
    console.log(`  - 生成 ${analysis.suggestedActions.length} 个修复建议`);

    // 2. 修复流程问题
    console.log('\n步骤 2: 修复流程问题...');
    const fixResult = await rejectionMechanism.fixProcess(analysis);
    console.log(`  - 修复${fixResult.success ? '成功' : '失败'}`);
    console.log(`  - 执行了 ${fixResult.actionsExecuted.length} 个动作`);
    console.log(`  - 新增了 ${fixResult.newAgentsAdded.length} 个AI`);

    // 3. 重启写作流程
    console.log('\n步骤 3: 重启写作流程...');
    const restartResult = await rejectionMechanism.restartProcess(true, true);
    console.log(`  - 重启${restartResult.success ? '成功' : '失败'}`);
    console.log(`  - 新流程ID: ${restartResult.newProcessId}`);

    console.log('\n退稿机制流程完成！');
  }
}

// ============================================================================
// 示例 6: 退稿历史记录管理
// ============================================================================

async function example6_RejectionHistory() {
  console.log('\n=== 示例 6: 退稿历史记录管理 ===\n');

  // 创建服务实例
  const { rejectionMechanism } = createServices();

  // 进行多次退稿分析
  await rejectionMechanism.analyzeRejection(3, []);
  await rejectionMechanism.analyzeRejection(4, []);
  await rejectionMechanism.analyzeRejection(5, []);

  // 获取退稿历史
  const history = rejectionMechanism.getRejectionHistory();
  console.log(`退稿历史记录数量: ${history.length}`);

  history.forEach((analysis, index) => {
    console.log(`\n记录 ${index + 1}:`);
    console.log(`  - 退稿次数: ${analysis.rejectionCount}`);
    console.log(`  - 时间: ${analysis.timestamp.toISOString()}`);
    console.log(`  - 原因数量: ${analysis.reasons.length}`);
    console.log(`  - 瓶颈数量: ${analysis.bottlenecks.length}`);
  });

  // 清除历史记录
  console.log('\n清除退稿历史记录...');
  rejectionMechanism.clearRejectionHistory();
  console.log(`清除后的记录数量: ${rejectionMechanism.getRejectionHistory().length}`);
}

// ============================================================================
// 运行所有示例
// ============================================================================

async function runAllExamples() {
  try {
    await example1_BasicTriggerDetection();
    await example2_RejectionAnalysis();
    await example3_ProcessFix();
    await example4_ProcessRestart();
    await example5_CompleteRejectionFlow();
    await example6_RejectionHistory();
  } catch (error) {
    console.error('示例执行出错:', error);
  }
}

export {
  example1_BasicTriggerDetection,
  example2_RejectionAnalysis,
  example3_ProcessFix,
  example4_ProcessRestart,
  example5_CompleteRejectionFlow,
  example6_RejectionHistory,
  runAllExamples,
};
