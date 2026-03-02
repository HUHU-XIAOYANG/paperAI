/**
 * Review Team使用示例
 * 
 * 展示如何使用Review Team服务管理审稿流程
 */

import { createReviewTeam, type ReviewReport, type ReviewIssue } from './reviewTeam';
import { createAgentManager } from './agentManager';
import { InteractionRouter } from './interactionRouter';
import type { SystemConfig } from '../types/config';

// ============================================================================
// 示例1: 基本使用 - 初始化和开始审稿
// ============================================================================

async function example1_BasicUsage() {
  console.log('=== 示例1: 基本使用 ===\n');

  // 模拟系统配置
  const systemConfig: SystemConfig = {
    aiServices: [
      {
        id: 'openai-service',
        name: 'OpenAI GPT-4',
        apiKey: 'sk-xxx',
        apiUrl: 'https://api.openai.com/v1',
        model: 'gpt-4',
        provider: 'openai',
      },
    ],
    defaultService: 'openai-service',
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
  const agentManager = createAgentManager(systemConfig);
  const interactionRouter = new InteractionRouter();

  // 创建审稿团队
  const reviewTeam = createReviewTeam(agentManager, interactionRouter, systemConfig);

  // 初始化团队（创建所有4个角色）
  console.log('初始化审稿团队...');
  await reviewTeam.initialize();

  // 获取团队成员
  const members = reviewTeam.getTeamMembers();
  console.log(`\n审稿团队成员 (${members.length}个):`);
  members.forEach((member) => {
    console.log(`- ${member.config.name} (${member.config.role})`);
  });

  // 开始审稿流程
  const documentContent = `
    # 基于深度学习的图像识别研究
    
    ## 摘要
    本文提出了一种新的图像识别方法...
    
    ## 引言
    图像识别是计算机视觉领域的重要研究方向...
  `;

  console.log('\n开始审稿流程...');
  await reviewTeam.startReview('paper-001', documentContent);

  // 获取流程状态
  const state = reviewTeam.getWorkflowState();
  console.log(`\n当前审稿阶段: ${state.currentPhase}`);
  console.log(`开始时间: ${state.startTime.toISOString()}`);
}

// ============================================================================
// 示例2: 提交审稿报告
// ============================================================================

async function example2_SubmitReports() {
  console.log('\n=== 示例2: 提交审稿报告 ===\n');

  // ... 初始化代码省略 ...
  const reviewTeam = {} as any; // 假设已初始化

  // Editorial Office提交格式审查报告
  const formatIssues: ReviewIssue[] = [
    {
      type: 'format',
      severity: 'minor',
      description: '参考文献格式不统一',
      affectedSection: '参考文献',
      suggestion: '请使用APA格式统一所有参考文献',
    },
    {
      type: 'format',
      severity: 'major',
      description: '图表缺少标题和说明',
      affectedSection: '实验结果',
      suggestion: '为所有图表添加详细的标题和说明文字',
    },
  ];

  const formatReport: ReviewReport = {
    id: 'report-format-001',
    reviewer: 'editorial_office',
    reviewerId: 'editorial_office_123',
    phase: 'format_check',
    decision: 'minor_revision',
    comments: '文档格式基本符合要求，但存在一些需要修正的问题。',
    issues: formatIssues,
    timestamp: new Date(),
  };

  console.log('Editorial Office提交格式审查报告...');
  await reviewTeam.submitReport(formatReport);
  console.log('✓ 格式审查报告已提交');

  // Editor in Chief提交初审报告
  const initialReviewIssues: ReviewIssue[] = [
    {
      type: 'quality',
      severity: 'major',
      description: '研究方法论描述不够详细',
      affectedSection: '方法',
      suggestion: '需要补充实验设计的详细步骤和参数设置',
    },
    {
      type: 'completeness',
      severity: 'minor',
      description: '文献综述覆盖不够全面',
      affectedSection: '文献综述',
      suggestion: '建议增加近三年的相关研究',
    },
  ];

  const initialReviewReport: ReviewReport = {
    id: 'report-initial-001',
    reviewer: 'editor_in_chief',
    reviewerId: 'editor_in_chief_456',
    phase: 'initial_review',
    decision: 'major_revision',
    comments: '论文具有一定的创新性，但方法论部分需要大幅改进。',
    issues: initialReviewIssues,
    timestamp: new Date(),
  };

  console.log('\nEditor in Chief提交初审报告...');
  await reviewTeam.submitReport(initialReviewReport);
  console.log('✓ 初审报告已提交');

  // Peer Reviewer提交同行评审报告
  const peerReviewIssues: ReviewIssue[] = [
    {
      type: 'methodology',
      severity: 'critical',
      description: '实验对照组设置不合理',
      affectedSection: '实验设计',
      suggestion: '需要重新设计对照组，确保实验的科学性',
    },
    {
      type: 'citation',
      severity: 'major',
      description: '关键文献引用缺失',
      affectedSection: '引言',
      suggestion: '需要引用Smith et al. (2023)的相关研究',
    },
  ];

  const peerReviewReport: ReviewReport = {
    id: 'report-peer-001',
    reviewer: 'peer_reviewer',
    reviewerId: 'peer_reviewer_789',
    phase: 'peer_review',
    decision: 'major_revision',
    comments: '论文的研究思路很好，但实验设计存在严重缺陷，需要大幅修改。',
    issues: peerReviewIssues,
    timestamp: new Date(),
  };

  console.log('\nPeer Reviewer提交同行评审报告...');
  await reviewTeam.submitReport(peerReviewReport);
  console.log('✓ 同行评审报告已提交');

  // 查看所有报告
  const state = reviewTeam.getWorkflowState();
  console.log(`\n已收到 ${state.reports.length} 份审稿报告`);
}

// ============================================================================
// 示例3: 非线性交互 - 审稿团队成员之间的讨论
// ============================================================================

async function example3_NonLinearInteraction() {
  console.log('\n=== 示例3: 非线性交互 ===\n');

  const interactionRouter = new InteractionRouter();

  // 场景1: 主编向副主编请求意见
  console.log('场景1: 主编向副主编请求意见');
  console.log('Editor in Chief: "关于这篇论文的创新性，你有什么看法？"');

  const feedback1 = await interactionRouter.requestFeedback(
    'editor_in_chief_456',
    'deputy_editor_789',
    '关于这篇论文的创新性，你有什么看法？'
  );

  console.log(`Deputy Editor: "${feedback1}"\n`);

  // 场景2: 审稿专家向编辑部请求作者信息
  console.log('场景2: 审稿专家向编辑部请求作者信息');
  console.log('Peer Reviewer: "能否提供作者的研究背景信息？"');

  const feedback2 = await interactionRouter.requestFeedback(
    'peer_reviewer_012',
    'editorial_office_123',
    '能否提供作者的研究背景信息？'
  );

  console.log(`Editorial Office: "${feedback2}"\n`);

  // 场景3: 副主编和主编讨论论文质量
  console.log('场景3: 副主编和主编讨论论文质量');

  await interactionRouter.sendMessage({
    id: 'msg-001',
    type: 'discussion',
    sender: 'deputy_editor_789',
    receiver: 'editor_in_chief_456',
    content: '我认为这篇论文的方法论部分需要加强，建议要求作者补充实验细节。',
    metadata: {
      priority: 'medium',
      requiresResponse: true,
      timestamp: new Date().toISOString(),
    },
    timestamp: new Date(),
  });

  console.log('Deputy Editor: "我认为这篇论文的方法论部分需要加强..."');

  await interactionRouter.sendMessage({
    id: 'msg-002',
    type: 'feedback_response',
    sender: 'editor_in_chief_456',
    receiver: 'deputy_editor_789',
    content: '我同意你的看法。我会在初审报告中明确指出这一点。',
    metadata: {
      priority: 'medium',
      requiresResponse: false,
      relatedTaskId: 'msg-001',
      timestamp: new Date().toISOString(),
    },
    timestamp: new Date(),
  });

  console.log('Editor in Chief: "我同意你的看法。我会在初审报告中明确指出这一点。"\n');

  // 场景4: 审稿专家向主编请求澄清
  console.log('场景4: 审稿专家向主编请求澄清');

  await interactionRouter.sendMessage({
    id: 'msg-003',
    type: 'feedback_request',
    sender: 'peer_reviewer_012',
    receiver: 'editor_in_chief_456',
    content: '关于评审标准，我需要确认：对于方法论的创新性要求是什么？',
    metadata: {
      priority: 'high',
      requiresResponse: true,
      timestamp: new Date().toISOString(),
    },
    timestamp: new Date(),
  });

  console.log('Peer Reviewer: "关于评审标准，我需要确认..."');
  console.log('(等待Editor in Chief的回复)\n');
}

// ============================================================================
// 示例4: 完整的审稿流程
// ============================================================================

async function example4_CompleteWorkflow() {
  console.log('\n=== 示例4: 完整的审稿流程 ===\n');

  // ... 初始化代码省略 ...
  const reviewTeam = {} as any; // 假设已初始化

  // 开始审稿
  await reviewTeam.startReview('paper-002', 'document content');

  // 模拟审稿流程的各个阶段
  const phases = [
    'format_check',
    'initial_review',
    'peer_review',
    'final_decision',
    'completed',
  ];

  for (const phase of phases) {
    const state = reviewTeam.getWorkflowState();
    console.log(`\n当前阶段: ${state.currentPhase}`);
    console.log(`已收到报告: ${state.reports.length} 份`);

    // 模拟提交报告
    if (phase !== 'completed') {
      console.log(`等待 ${phase} 阶段的审稿报告...`);
      // 实际应用中，这里会等待AI生成报告
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('✓ 报告已提交，进入下一阶段');
    }
  }

  const finalState = reviewTeam.getWorkflowState();
  console.log('\n审稿流程完成！');
  console.log(`最终决定: ${finalState.finalDecision}`);
  console.log(`总耗时: ${finalState.endTime!.getTime() - finalState.startTime.getTime()}ms`);
}

// ============================================================================
// 示例5: 监听审稿进度
// ============================================================================

async function example5_MonitorProgress() {
  console.log('\n=== 示例5: 监听审稿进度 ===\n');

  const reviewTeam = {} as any; // 假设已初始化
  const interactionRouter = new InteractionRouter();

  // 订阅所有审稿团队成员的消息
  const members = reviewTeam.getTeamMembers();

  members.forEach((member: any) => {
    interactionRouter.subscribeToMessages(member.id, (message) => {
      console.log(`\n[${member.config.name}] 收到消息:`);
      console.log(`  类型: ${message.type}`);
      console.log(`  发送者: ${message.sender}`);
      console.log(`  内容: ${message.content.substring(0, 50)}...`);
    });
  });

  // 定期检查审稿进度
  const progressInterval = setInterval(() => {
    const state = reviewTeam.getWorkflowState();
    console.log(`\n[进度更新] 当前阶段: ${state.currentPhase}`);

    if (state.currentPhase === 'completed') {
      console.log('审稿流程已完成，停止监听');
      clearInterval(progressInterval);
    }
  }, 5000);
}

// ============================================================================
// 示例6: 错误处理
// ============================================================================

async function example6_ErrorHandling() {
  console.log('\n=== 示例6: 错误处理 ===\n');

  const systemConfig = {} as SystemConfig; // 假设配置
  const agentManager = createAgentManager(systemConfig);
  const interactionRouter = new InteractionRouter();

  try {
    const reviewTeam = createReviewTeam(agentManager, interactionRouter, systemConfig);

    // 尝试在未初始化的情况下开始审稿
    await reviewTeam.startReview('paper-003', 'content');
  } catch (error: any) {
    console.error('错误:', error.message);
    console.log('处理方案: 先调用 initialize() 初始化团队');
  }

  try {
    const reviewTeam = createReviewTeam(agentManager, interactionRouter, systemConfig);
    await reviewTeam.initialize();

    // 尝试提交无效的报告
    const invalidReport = {
      id: 'invalid',
      reviewer: 'unknown_role' as any,
      // ... 缺少必需字段
    } as ReviewReport;

    await reviewTeam.submitReport(invalidReport);
  } catch (error: any) {
    console.error('错误:', error.message);
    console.log('处理方案: 确保报告包含所有必需字段');
  }
}

// ============================================================================
// 示例7: 与Core Engine集成
// ============================================================================

class CoreEngineExample {
  private reviewTeam?: any;
  private agentManager: any;
  private interactionRouter: any;
  private systemConfig: SystemConfig;

  constructor(systemConfig: SystemConfig) {
    this.systemConfig = systemConfig;
    this.agentManager = createAgentManager(systemConfig);
    this.interactionRouter = new InteractionRouter();
  }

  async startReviewProcess(documentId: string, content: string) {
    console.log('\n=== 示例7: 与Core Engine集成 ===\n');

    // 创建审稿团队
    this.reviewTeam = createReviewTeam(
      this.agentManager,
      this.interactionRouter,
      this.systemConfig
    );

    // 初始化团队
    console.log('初始化审稿团队...');
    await this.reviewTeam.initialize();

    // 开始审稿
    console.log('开始审稿流程...');
    await this.reviewTeam.startReview(documentId, content);

    // 监听审稿进度
    this.monitorReviewProgress();
  }

  private monitorReviewProgress() {
    console.log('开始监听审稿进度...\n');

    const checkProgress = setInterval(() => {
      const state = this.reviewTeam!.getWorkflowState();

      console.log(`[${new Date().toISOString()}] 当前阶段: ${state.currentPhase}`);
      console.log(`  已收到报告: ${state.reports.length} 份`);

      if (state.currentPhase === 'completed') {
        console.log('\n审稿完成！');
        console.log(`最终决定: ${state.finalDecision}`);
        console.log(`总耗时: ${state.endTime!.getTime() - state.startTime.getTime()}ms`);
        clearInterval(checkProgress);

        // 清理资源
        this.cleanup();
      }
    }, 3000);
  }

  private async cleanup() {
    console.log('\n清理资源...');
    if (this.reviewTeam) {
      await this.reviewTeam.destroy();
      console.log('✓ 审稿团队已销毁');
    }
  }
}

// ============================================================================
// 运行示例
// ============================================================================

async function runExamples() {
  try {
    // 运行各个示例
    // await example1_BasicUsage();
    // await example2_SubmitReports();
    // await example3_NonLinearInteraction();
    // await example4_CompleteWorkflow();
    // await example5_MonitorProgress();
    // await example6_ErrorHandling();

    // 运行Core Engine集成示例
    const systemConfig: SystemConfig = {
      aiServices: [],
      defaultService: 'openai-service',
      promptRepositoryPath: './prompts',
      outputDirectory: './output',
      theme: 'light',
      internetAccess: { enabled: true },
      streamingConfig: { chunkSize: 1024, updateInterval: 100 },
    };

    const coreEngine = new CoreEngineExample(systemConfig);
    await coreEngine.startReviewProcess('paper-001', 'document content');
  } catch (error) {
    console.error('示例运行错误:', error);
  }
}

// 如果直接运行此文件，执行示例
if (require.main === module) {
  runExamples();
}

export {
  example1_BasicUsage,
  example2_SubmitReports,
  example3_NonLinearInteraction,
  example4_CompleteWorkflow,
  example5_MonitorProgress,
  example6_ErrorHandling,
  CoreEngineExample,
};
