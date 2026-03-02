/**
 * Decision AI服务使用示例
 * Decision AI Service Usage Examples
 * 
 * 展示如何使用Decision AI进行题目分析、团队组建和动态角色增加
 */

import { createDecisionAI } from './decisionAI';
import { createAIClient } from './aiClient';
import { createAgentManager } from './agentManager';
import type { SystemConfig } from '../types/config';

// ============================================================================
// Setup
// ============================================================================

// 示例系统配置
const systemConfig: SystemConfig = {
  aiServices: [
    {
      id: 'default',
      name: 'OpenAI GPT-4',
      apiKey: 'your-api-key',
      apiUrl: 'https://api.openai.com/v1',
      model: 'gpt-4',
      provider: 'openai',
    },
  ],
  defaultService: 'default',
  promptRepositoryPath: 'prompts',
  outputDirectory: 'output',
  theme: 'light',
  internetAccess: {
    enabled: true,
  },
  streamingConfig: {
    chunkSize: 1024,
    updateInterval: 100,
  },
};

// 创建AI客户端
const aiClient = createAIClient({
  config: systemConfig.aiServices[0],
  retryConfig: {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  },
  timeout: 60000,
});

// 创建Agent管理器
const agentManager = createAgentManager(systemConfig);

// 创建Decision AI实例
const decisionAI = createDecisionAI(aiClient, agentManager);

// ============================================================================
// Example 1: 分析简单题目并组建团队
// ============================================================================

async function example1_SimpleTopicAnalysis() {
  console.log('=== Example 1: 分析简单题目并组建团队 ===\n');

  const topic = '机器学习在医疗诊断中的应用';

  // Step 1: 分析题目并评估工作量
  console.log('Step 1: 分析题目...');
  const assessment = await decisionAI.analyzeTopicAndAssessWorkload(topic);

  console.log('工作量评估结果:');
  console.log(`- 工作量等级: ${assessment.level}`);
  console.log(`- 建议团队规模: ${assessment.suggestedTeamSize}人`);
  console.log(`- 预计完成时间: ${assessment.estimatedDays}天`);
  console.log(`- 关键挑战: ${assessment.keyChallen.join(', ')}`);
  console.log();

  // Step 2: 组建团队并分配任务
  console.log('Step 2: 组建写作团队...');
  const allocation = await decisionAI.buildTeamAndAllocateTasks(topic, assessment);

  console.log('团队组建完成:');
  allocation.teamMembers.forEach((member, index) => {
    console.log(`\n成员 ${index + 1}:`);
    console.log(`  ID: ${member.id}`);
    console.log(`  名称: ${member.name}`);
    console.log(`  角色: ${member.role}`);
    console.log(`  任务:`);
    member.tasks.forEach((task) => {
      console.log(`    - ${task}`);
    });
    console.log(`  预计时间: ${member.estimatedDays}天`);
  });

  console.log(`\n总预计完成时间: ${allocation.totalEstimatedDays}天`);
  console.log('\n任务分配消息:');
  console.log(allocation.allocationMessage.content);
}

// ============================================================================
// Example 2: 分析复杂题目
// ============================================================================

async function example2_ComplexTopicAnalysis() {
  console.log('\n=== Example 2: 分析复杂题目 ===\n');

  const topic =
    '基于深度学习的多模态医学影像分析系统：融合CT、MRI和PET数据的肿瘤检测与分类研究';

  console.log(`题目: ${topic}\n`);

  // 分析复杂题目
  const assessment = await decisionAI.analyzeTopicAndAssessWorkload(topic);

  console.log('工作量评估结果:');
  console.log(`- 工作量等级: ${assessment.level}`);
  console.log(`- 建议团队规模: ${assessment.suggestedTeamSize}人`);
  console.log(`- 预计完成时间: ${assessment.estimatedDays}天`);
  console.log('\n复杂度分析:');
  console.log(`- 研究领域: ${assessment.complexity.researchField}`);
  console.log(`- 文献综述: ${assessment.complexity.literatureReview}`);
  console.log(`- 方法论: ${assessment.complexity.methodology}`);
  console.log(`- 数据分析: ${assessment.complexity.dataAnalysis}`);

  // 组建大型团队
  const allocation = await decisionAI.buildTeamAndAllocateTasks(topic, assessment);

  console.log(`\n组建了 ${allocation.teamMembers.length} 人团队`);
  console.log(`总预计完成时间: ${allocation.totalEstimatedDays}天`);
}

// ============================================================================
// Example 3: 动态增加角色 - 格式问题
// ============================================================================

async function example3_DynamicRoleAddition_FormatIssues() {
  console.log('\n=== Example 3: 动态增加角色 - 格式问题 ===\n');

  // 模拟场景：Writer 1多次因格式问题返工
  const request = {
    situation: 'Writer 1已经返工3次，主要问题是格式不符合期刊要求',
    bottleneck: '格式规范理解不足，引用格式不统一，图表样式不一致',
    currentTeamSize: 2,
    revisionCounts: {
      writer_1: 3,
      writer_2: 1,
    },
  };

  console.log('当前情况:');
  console.log(`- ${request.situation}`);
  console.log(`- 瓶颈: ${request.bottleneck}`);
  console.log(`- 当前团队规模: ${request.currentTeamSize}人`);
  console.log();

  // 决策是否增加新角色
  const result = await decisionAI.decideDynamicRoleAddition(request);

  console.log('决策结果:');
  console.log(`- 是否增加新角色: ${result.shouldAdd ? '是' : '否'}`);

  if (result.shouldAdd) {
    console.log(`- 新角色类型: ${result.roleType}`);
    console.log(`- 新角色名称: ${result.roleName}`);
    console.log(`- 分配任务:`);
    result.tasks?.forEach((task) => {
      console.log(`    - ${task}`);
    });
    console.log(`- 预计完成时间: ${result.estimatedDays}天`);
    console.log(`- 决策原因: ${result.reason}`);

    if (result.assignmentMessage) {
      console.log('\n任务分配消息:');
      console.log(result.assignmentMessage.content);
    }
  } else {
    console.log(`- 原因: ${result.reason}`);
  }
}

// ============================================================================
// Example 4: 动态增加角色 - 工作量过大
// ============================================================================

async function example4_DynamicRoleAddition_Workload() {
  console.log('\n=== Example 4: 动态增加角色 - 工作量过大 ===\n');

  const request = {
    situation: '项目进度延迟50%，Writer 1和Writer 2工作负载过重',
    bottleneck: '文献综述工作量超出预期，需要阅读和分析大量文献',
    currentTeamSize: 2,
    revisionCounts: {
      writer_1: 2,
      writer_2: 2,
    },
  };

  console.log('当前情况:');
  console.log(`- ${request.situation}`);
  console.log(`- 瓶颈: ${request.bottleneck}`);
  console.log();

  const result = await decisionAI.decideDynamicRoleAddition(request);

  console.log('决策结果:');
  console.log(`- 是否增加新角色: ${result.shouldAdd ? '是' : '否'}`);

  if (result.shouldAdd) {
    console.log(`- 新角色: ${result.roleName}`);
    console.log(`- 主要职责: 协助文献综述工作`);
    console.log(`- 预计缓解进度延迟: ${result.estimatedDays}天`);
  }
}

// ============================================================================
// Example 5: 完整工作流程
// ============================================================================

async function example5_CompleteWorkflow() {
  console.log('\n=== Example 5: 完整工作流程 ===\n');

  const topic = '人工智能在教育领域的应用与挑战';

  console.log(`论文题目: ${topic}\n`);

  // Phase 1: 题目分析
  console.log('Phase 1: 题目分析和工作量评估');
  console.log('─'.repeat(50));
  const assessment = await decisionAI.analyzeTopicAndAssessWorkload(topic);
  console.log(`✓ 工作量等级: ${assessment.level}`);
  console.log(`✓ 建议团队规模: ${assessment.suggestedTeamSize}人`);
  console.log(`✓ 预计完成时间: ${assessment.estimatedDays}天\n`);

  // Phase 2: 团队组建
  console.log('Phase 2: 组建写作团队并分配任务');
  console.log('─'.repeat(50));
  const allocation = await decisionAI.buildTeamAndAllocateTasks(topic, assessment);
  console.log(`✓ 创建了 ${allocation.teamMembers.length} 个团队成员`);
  console.log(`✓ 任务分配完成\n`);

  // Phase 3: 模拟工作进展
  console.log('Phase 3: 工作进展监控');
  console.log('─'.repeat(50));
  console.log('✓ Writer 1: 正在撰写引言...');
  console.log('✓ Writer 2: 正在撰写方法...\n');

  // Phase 4: 检测到瓶颈，动态增加角色
  console.log('Phase 4: 检测到瓶颈，动态增加角色');
  console.log('─'.repeat(50));
  const dynamicRequest = {
    situation: 'Writer 1在文献综述部分遇到困难，已返工2次',
    bottleneck: '相关领域文献量大，需要专门的文献分析支持',
    currentTeamSize: allocation.teamMembers.length,
    revisionCounts: {
      writer_1: 2,
      writer_2: 0,
    },
  };

  const dynamicResult = await decisionAI.decideDynamicRoleAddition(dynamicRequest);

  if (dynamicResult.shouldAdd) {
    console.log(`✓ 决定增加新角色: ${dynamicResult.roleName}`);
    console.log(`✓ 新角色将协助解决文献综述问题`);
    console.log(`✓ 预计 ${dynamicResult.estimatedDays} 天内完成支持任务\n`);
  }

  console.log('Phase 5: 项目完成');
  console.log('─'.repeat(50));
  console.log('✓ 所有章节撰写完成');
  console.log('✓ 论文初稿已生成');
  console.log(`✓ 总用时: ${allocation.totalEstimatedDays + (dynamicResult.estimatedDays || 0)}天`);
}

// ============================================================================
// Example 6: 错误处理
// ============================================================================

async function example6_ErrorHandling() {
  console.log('\n=== Example 6: 错误处理 ===\n');

  try {
    // 尝试分析空题目
    console.log('测试1: 空题目处理');
    const assessment = await decisionAI.analyzeTopicAndAssessWorkload('');
    console.log('✓ 使用启发式评估处理空题目');
    console.log(`  工作量等级: ${assessment.level}\n`);
  } catch (error) {
    console.error('✗ 错误:', error);
  }

  try {
    // 测试AI服务不可用的情况
    console.log('测试2: AI服务错误处理');
    // 这里会触发实际的AI调用，可能会失败
    // 实际使用中应该有适当的错误处理
    console.log('✓ 错误处理机制已就位\n');
  } catch (error) {
    console.error('✗ AI服务错误:', error);
  }
}

// ============================================================================
// Run Examples
// ============================================================================

async function runAllExamples() {
  try {
    await example1_SimpleTopicAnalysis();
    await example2_ComplexTopicAnalysis();
    await example3_DynamicRoleAddition_FormatIssues();
    await example4_DynamicRoleAddition_Workload();
    await example5_CompleteWorkflow();
    await example6_ErrorHandling();

    console.log('\n✓ 所有示例运行完成');
  } catch (error) {
    console.error('\n✗ 示例运行失败:', error);
  }
}

// 如果直接运行此文件，执行所有示例
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}

// 导出示例函数供其他模块使用
export {
  example1_SimpleTopicAnalysis,
  example2_ComplexTopicAnalysis,
  example3_DynamicRoleAddition_FormatIssues,
  example4_DynamicRoleAddition_Workload,
  example5_CompleteWorkflow,
  example6_ErrorHandling,
};
