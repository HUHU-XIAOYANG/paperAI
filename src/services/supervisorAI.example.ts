/**
 * Supervisor AI服务使用示例
 * Supervisor AI Service Usage Examples
 * 
 * 本文件展示如何使用SupervisorAI服务进行输出格式验证、返工管理、
 * 人手不足检测和质量检查报告生成。
 */

import { createSupervisorAI } from './supervisorAI';
import { createAIClient } from './aiClient';
import { createAgentManager } from './agentManager';
import { createDecisionAI } from './decisionAI';
import type { SystemConfig } from '../types/config';

// ============================================================================
// 示例 1: 创建Supervisor AI实例
// ============================================================================

async function example1_CreateSupervisorAI() {
  console.log('=== 示例 1: 创建Supervisor AI实例 ===\n');

  // 系统配置
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
  };

  // 创建依赖服务
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

  const agentManager = createAgentManager(systemConfig);
  const decisionAI = createDecisionAI(aiClient, agentManager);

  // 创建Supervisor AI
  const supervisorAI = createSupervisorAI(aiClient, agentManager, decisionAI);

  console.log('Supervisor AI实例创建成功\n');

  return supervisorAI;
}

// ============================================================================
// 示例 2: 验证AI输出格式
// ============================================================================

async function example2_ValidateOutputFormat() {
  console.log('=== 示例 2: 验证AI输出格式 ===\n');

  const supervisorAI = await example1_CreateSupervisorAI();

  // 有效的输出
  const validOutput = JSON.stringify({
    messageType: 'work_submission',
    sender: 'writer_1',
    receiver: 'supervisor_ai',
    content: {
      text: '我已完成引言部分的初稿，包含研究背景、问题陈述和论文结构概述。',
    },
    metadata: {
      timestamp: new Date().toISOString(),
      requiresResponse: true,
      priority: 'high',
    },
  });

  console.log('验证有效输出:');
  const validResult = await supervisorAI.validateOutputFormat(
    validOutput,
    'writer_1'
  );
  console.log('- 是否有效:', validResult.isValid);
  console.log('- 是否需要返工:', validResult.shouldRework);
  console.log('- 错误数量:', validResult.errors.length);
  console.log();

  // 无效的输出（缺少receiver字段）
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

  console.log('验证无效输出:');
  const invalidResult = await supervisorAI.validateOutputFormat(
    invalidOutput,
    'writer_1'
  );
  console.log('- 是否有效:', invalidResult.isValid);
  console.log('- 是否需要返工:', invalidResult.shouldRework);
  console.log('- 错误列表:', invalidResult.errors);
  console.log();
}

// ============================================================================
// 示例 3: 要求AI返工
// ============================================================================

async function example3_RequestRework() {
  console.log('=== 示例 3: 要求AI返工 ===\n');

  const supervisorAI = await example1_CreateSupervisorAI();

  // 第一次返工
  console.log('第一次返工:');
  const message1 = await supervisorAI.requestRework(
    'writer_1',
    '输出格式不符合Output_Format规范，缺少receiver字段'
  );
  console.log('- 消息类型:', message1.type);
  console.log('- 接收者:', message1.receiver);
  console.log('- 内容预览:', message1.content.substring(0, 50) + '...');
  console.log();

  // 查看返工记录
  const records1 = supervisorAI.getReworkRecords('writer_1');
  console.log('返工记录:');
  console.log('- 返工次数:', records1[0].count);
  console.log('- 返工原因:', records1[0].reasons);
  console.log();

  // 第二次返工
  console.log('第二次返工:');
  await supervisorAI.requestRework(
    'writer_1',
    '输出格式仍然不正确，metadata.timestamp格式错误'
  );

  const records2 = supervisorAI.getReworkRecords('writer_1');
  console.log('- 返工次数:', records2[0].count);
  console.log('- 返工原因:', records2[0].reasons);
  console.log();

  // 第三次返工（超过阈值，会触发人手不足检测）
  console.log('第三次返工（超过阈值）:');
  await supervisorAI.requestRework(
    'writer_1',
    '输出格式问题持续存在'
  );

  const records3 = supervisorAI.getReworkRecords('writer_1');
  console.log('- 返工次数:', records3[0].count);
  console.log('- 注意: 已触发人手不足检测');
  console.log();
}

// ============================================================================
// 示例 4: 检测人手不足
// ============================================================================

async function example4_DetectShortage() {
  console.log('=== 示例 4: 检测人手不足 ===\n');

  const supervisorAI = await example1_CreateSupervisorAI();

  // 模拟多次返工
  await supervisorAI.requestRework('writer_1', '格式错误1');
  await supervisorAI.requestRework('writer_1', '格式错误2');
  await supervisorAI.requestRework('writer_1', '格式错误3');

  // 检测人手不足
  console.log('执行人手不足检测:');
  const shortageResult = await supervisorAI.detectShortage();

  console.log('- 是否人手不足:', shortageResult.hasShortage);
  console.log('- 原因:', shortageResult.reason);
  console.log('- 受影响的AI:', shortageResult.affectedAgents);
  console.log('- 建议角色类型:', shortageResult.suggestedRoleType);
  console.log('- 建议角色名称:', shortageResult.suggestedRoleName);
  console.log('- 优先级:', shortageResult.priority);
  console.log();
}

// ============================================================================
// 示例 5: 检测人手不足并通知Decision AI
// ============================================================================

async function example5_DetectShortageAndNotify() {
  console.log('=== 示例 5: 检测人手不足并通知Decision AI ===\n');

  const supervisorAI = await example1_CreateSupervisorAI();

  // 模拟多次返工
  await supervisorAI.requestRework('writer_1', '格式错误1');
  await supervisorAI.requestRework('writer_1', '格式错误2');
  await supervisorAI.requestRework('writer_1', '格式错误3');

  // 检测并通知
  console.log('执行人手不足检测并通知Decision AI:');
  const notified = await supervisorAI.detectShortageAndNotify();

  console.log('- 是否成功通知:', notified);
  if (notified) {
    console.log('- Decision AI已收到通知，将决策是否增加新角色');
  }
  console.log();
}

// ============================================================================
// 示例 6: 生成质量检查报告
// ============================================================================

async function example6_GenerateQualityReport() {
  console.log('=== 示例 6: 生成质量检查报告 ===\n');

  const supervisorAI = await example1_CreateSupervisorAI();

  // 模拟一些工作和返工
  await supervisorAI.requestRework('writer_1', '格式错误');
  await supervisorAI.requestRework('writer_2', '内容不完整');
  await supervisorAI.requestRework('writer_1', '格式仍有问题');

  // 生成质量报告
  console.log('生成质量检查报告:');
  const report = await supervisorAI.generateQualityReport();

  console.log('- 报告时间:', report.timestamp.toISOString());
  console.log('- 活跃AI数量:', report.activeAgentsCount);
  console.log('- 总返工次数:', report.totalRevisions);
  console.log('- 整体状态:', report.overallStatus);
  console.log();

  console.log('返工记录:');
  report.reworkRecords.forEach((record) => {
    console.log(`  - ${record.agentId}: ${record.count}次`);
    console.log(`    原因: ${record.reasons.join(', ')}`);
  });
  console.log();

  console.log('瓶颈分析:');
  report.bottlenecks.forEach((bottleneck) => {
    console.log(`  - ${bottleneck}`);
  });
  console.log();

  console.log('改进建议:');
  report.recommendations.forEach((recommendation) => {
    console.log(`  - ${recommendation}`);
  });
  console.log();

  if (report.shortageDetection) {
    console.log('人手不足检测:');
    console.log('  - 是否人手不足:', report.shortageDetection.hasShortage);
    console.log('  - 原因:', report.shortageDetection.reason);
    console.log('  - 建议角色:', report.shortageDetection.suggestedRoleName);
  }
  console.log();
}

// ============================================================================
// 示例 7: 完整工作流程
// ============================================================================

async function example7_CompleteWorkflow() {
  console.log('=== 示例 7: 完整工作流程 ===\n');

  const supervisorAI = await example1_CreateSupervisorAI();

  // 1. Writer 1 提交工作
  console.log('1. Writer 1 提交工作');
  const writer1Output = JSON.stringify({
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

  // 2. Supervisor AI验证格式
  console.log('2. Supervisor AI验证格式');
  const validationResult = await supervisorAI.validateOutputFormat(
    writer1Output,
    'writer_1'
  );
  console.log('   - 格式验证:', validationResult.isValid ? '通过' : '失败');

  if (!validationResult.isValid) {
    // 3. 要求返工
    console.log('3. 要求返工');
    const reworkMessage = await supervisorAI.requestRework(
      'writer_1',
      validationResult.errors.join('; ')
    );
    console.log('   - 返工通知已发送');

    // 4. 检查返工次数
    const records = supervisorAI.getReworkRecords('writer_1');
    console.log(`4. 当前返工次数: ${records[0].count}`);

    if (records[0].count > 2) {
      // 5. 触发人手不足检测
      console.log('5. 触发人手不足检测');
      const notified = await supervisorAI.detectShortageAndNotify();
      console.log(`   - Decision AI通知: ${notified ? '已发送' : '未发送'}`);
    }
  }

  // 6. 生成质量报告
  console.log('6. 生成质量检查报告');
  const report = await supervisorAI.generateQualityReport();
  console.log(`   - 整体状态: ${report.overallStatus}`);
  console.log(`   - 瓶颈数量: ${report.bottlenecks.length}`);
  console.log(`   - 建议数量: ${report.recommendations.length}`);
  console.log();
}

// ============================================================================
// 运行所有示例
// ============================================================================

async function runAllExamples() {
  try {
    await example2_ValidateOutputFormat();
    await example3_RequestRework();
    await example4_DetectShortage();
    await example5_DetectShortageAndNotify();
    await example6_GenerateQualityReport();
    await example7_CompleteWorkflow();

    console.log('所有示例运行完成！');
  } catch (error) {
    console.error('示例运行出错:', error);
  }
}

// 如果直接运行此文件，执行所有示例
if (require.main === module) {
  runAllExamples();
}

export {
  example1_CreateSupervisorAI,
  example2_ValidateOutputFormat,
  example3_RequestRework,
  example4_DetectShortage,
  example5_DetectShortageAndNotify,
  example6_GenerateQualityReport,
  example7_CompleteWorkflow,
};
