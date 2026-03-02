/**
 * Agent管理器使用示例
 * Agent Manager Usage Examples
 * 
 * 演示如何使用AgentManager创建、管理和销毁AI角色
 */

import { createAgentManager } from './agentManager';
import type { AgentConfig, AgentRole } from '../types/agent';
import type { SystemConfig } from '../types/config';

// ============================================================================
// Example 1: 创建Agent管理器
// ============================================================================

function example1_CreateAgentManager() {
  console.log('=== Example 1: 创建Agent管理器 ===\n');

  // 创建系统配置
  const systemConfig: SystemConfig = {
    aiServices: [
      {
        id: 'openai-service',
        name: 'OpenAI GPT-4',
        apiKey: 'your-api-key-here',
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
      allowedDomains: [],
    },
    streamingConfig: {
      chunkSize: 1024,
      updateInterval: 100,
    },
  };

  // 创建Agent管理器
  const agentManager = createAgentManager(systemConfig);

  console.log('Agent管理器创建成功');
  console.log('默认AI服务:', systemConfig.defaultService);
  console.log('联网功能:', systemConfig.internetAccess.enabled ? '已启用' : '已禁用');
  console.log();

  return agentManager;
}

// ============================================================================
// Example 2: 创建单个Agent
// ============================================================================

async function example2_CreateSingleAgent() {
  console.log('=== Example 2: 创建单个Agent ===\n');

  const agentManager = example1_CreateAgentManager();

  // 定义Agent配置
  const writerConfig: AgentConfig = {
    id: 'writer-001',
    name: '写作AI-1',
    role: 'writer',
    promptTemplate: 'prompts/writer.yaml',
    aiService: 'openai-service',
    capabilities: {
      canInternetAccess: true,
      canStreamOutput: true,
      canInteractWithPeers: true,
    },
  };

  // 创建Agent
  const writer = await agentManager.createAgent(writerConfig);

  console.log('Agent创建成功:');
  console.log('  ID:', writer.id);
  console.log('  名称:', writer.config.name);
  console.log('  角色:', writer.config.role);
  console.log('  状态:', writer.state.status);
  console.log('  返工次数:', writer.state.revisionCount);
  console.log();

  return { agentManager, writer };
}

// ============================================================================
// Example 3: 创建多个不同角色的Agent
// ============================================================================

async function example3_CreateMultipleAgents() {
  console.log('=== Example 3: 创建多个不同角色的Agent ===\n');

  const agentManager = example1_CreateAgentManager();

  // 创建决策AI
  const decisionAI = await agentManager.createAgent({
    id: 'decision-ai',
    name: '决策AI',
    role: 'decision',
    promptTemplate: 'prompts/decision_ai.yaml',
    aiService: 'openai-service',
    capabilities: {
      canInternetAccess: true,
      canStreamOutput: true,
      canInteractWithPeers: true,
    },
  });

  // 创建监管AI
  const supervisorAI = await agentManager.createAgent({
    id: 'supervisor-ai',
    name: '监管AI',
    role: 'supervisor',
    promptTemplate: 'prompts/supervisor_ai.yaml',
    aiService: 'openai-service',
    capabilities: {
      canInternetAccess: false,
      canStreamOutput: true,
      canInteractWithPeers: true,
    },
  });

  // 创建写作团队
  const writer1 = await agentManager.createAgent({
    id: 'writer-001',
    name: '写作AI-1',
    role: 'writer',
    promptTemplate: 'prompts/writer.yaml',
    aiService: 'openai-service',
    capabilities: {
      canInternetAccess: true,
      canStreamOutput: true,
      canInteractWithPeers: true,
    },
  });

  const writer2 = await agentManager.createAgent({
    id: 'writer-002',
    name: '写作AI-2',
    role: 'writer',
    promptTemplate: 'prompts/writer.yaml',
    aiService: 'openai-service',
    capabilities: {
      canInternetAccess: true,
      canStreamOutput: true,
      canInteractWithPeers: true,
    },
  });

  console.log('创建了以下Agent:');
  console.log('  1. 决策AI:', decisionAI.config.name);
  console.log('  2. 监管AI:', supervisorAI.config.name);
  console.log('  3. 写作AI-1:', writer1.config.name);
  console.log('  4. 写作AI-2:', writer2.config.name);
  console.log();

  // 获取所有活跃Agent
  const activeAgents = agentManager.getActiveAgents();
  console.log('当前活跃Agent数量:', activeAgents.length);
  console.log();

  return { agentManager, decisionAI, supervisorAI, writer1, writer2 };
}

// ============================================================================
// Example 4: 动态增加Agent
// ============================================================================

async function example4_AddDynamicAgent() {
  console.log('=== Example 4: 动态增加Agent ===\n');

  const agentManager = example1_CreateAgentManager();

  // 初始创建一些Agent
  await agentManager.createAgent({
    id: 'writer-001',
    name: '写作AI-1',
    role: 'writer',
    promptTemplate: 'prompts/writer.yaml',
    aiService: 'openai-service',
    capabilities: {
      canInternetAccess: true,
      canStreamOutput: true,
      canInteractWithPeers: true,
    },
  });

  console.log('初始Agent数量:', agentManager.getActiveAgents().length);
  console.log();

  // 动态增加写作AI（因为工作量大）
  const dynamicWriter = await agentManager.addDynamicAgent(
    'writer',
    '撰写论文的文献综述部分，需要查阅大量文献并进行综合分析'
  );

  console.log('动态增加的Agent:');
  console.log('  ID:', dynamicWriter.id);
  console.log('  名称:', dynamicWriter.config.name);
  console.log('  角色:', dynamicWriter.config.role);
  console.log('  任务:', dynamicWriter.state.currentTask?.description);
  console.log('  优先级:', dynamicWriter.state.currentTask?.priority);
  console.log();

  console.log('当前Agent数量:', agentManager.getActiveAgents().length);
  console.log();

  // 再动态增加一个审稿专家
  const dynamicReviewer = await agentManager.addDynamicAgent(
    'peer_reviewer',
    '对论文的方法论部分进行深入评审'
  );

  console.log('再次动态增加的Agent:');
  console.log('  名称:', dynamicReviewer.config.name);
  console.log('  任务:', dynamicReviewer.state.currentTask?.description);
  console.log();

  console.log('最终Agent数量:', agentManager.getActiveAgents().length);
  console.log();

  return { agentManager, dynamicWriter, dynamicReviewer };
}

// ============================================================================
// Example 5: 更新Agent状态
// ============================================================================

async function example5_UpdateAgentState() {
  console.log('=== Example 5: 更新Agent状态 ===\n');

  const { agentManager, writer } = await example2_CreateSingleAgent();

  console.log('初始状态:', writer.state.status);
  console.log();

  // 更新Agent状态为"写作中"
  agentManager.updateAgent(writer.id, {
    state: {
      status: 'writing',
      revisionCount: 0,
      lastActivity: new Date(),
      currentTask: {
        id: 'task-001',
        description: '撰写论文引言部分',
        assignedBy: 'decision-ai',
        priority: 'high',
      },
    },
  });

  const updatedWriter = agentManager.getAgent(writer.id);
  console.log('更新后状态:', updatedWriter?.state.status);
  console.log('当前任务:', updatedWriter?.state.currentTask?.description);
  console.log();

  // 模拟完成任务
  agentManager.updateAgent(writer.id, {
    state: {
      status: 'completed',
      revisionCount: 0,
      lastActivity: new Date(),
    },
    workHistory: [
      {
        taskId: 'task-001',
        startTime: new Date(Date.now() - 3600000), // 1小时前
        endTime: new Date(),
        output: '论文引言部分已完成...',
        status: 'completed',
        feedbackReceived: [],
      },
    ],
  });

  const completedWriter = agentManager.getAgent(writer.id);
  console.log('任务完成后状态:', completedWriter?.state.status);
  console.log('工作历史记录数:', completedWriter?.workHistory.length);
  console.log();

  return { agentManager, writer };
}

// ============================================================================
// Example 6: 销毁Agent
// ============================================================================

async function example6_DestroyAgent() {
  console.log('=== Example 6: 销毁Agent ===\n');

  const { agentManager, writer1, writer2 } = await example3_CreateMultipleAgents();

  console.log('销毁前Agent数量:', agentManager.getActiveAgents().length);
  console.log();

  // 销毁一个Agent
  await agentManager.destroyAgent(writer1.id);

  console.log('销毁writer1后Agent数量:', agentManager.getActiveAgents().length);
  console.log();

  // 验证Agent已被销毁
  const destroyedAgent = agentManager.getAgent(writer1.id);
  console.log('writer1是否还存在:', destroyedAgent ? '是' : '否');
  console.log();

  // 销毁另一个Agent
  await agentManager.destroyAgent(writer2.id);

  console.log('销毁writer2后Agent数量:', agentManager.getActiveAgents().length);
  console.log();

  return agentManager;
}

// ============================================================================
// Example 7: 完整的工作流程
// ============================================================================

async function example7_CompleteWorkflow() {
  console.log('=== Example 7: 完整的工作流程 ===\n');

  const agentManager = example1_CreateAgentManager();

  // 步骤1: 创建核心AI
  console.log('步骤1: 创建核心AI');
  const decisionAI = await agentManager.createAgent({
    id: 'decision-ai',
    name: '决策AI',
    role: 'decision',
    promptTemplate: 'prompts/decision_ai.yaml',
    aiService: 'openai-service',
    capabilities: {
      canInternetAccess: true,
      canStreamOutput: true,
      canInteractWithPeers: true,
    },
  });

  const supervisorAI = await agentManager.createAgent({
    id: 'supervisor-ai',
    name: '监管AI',
    role: 'supervisor',
    promptTemplate: 'prompts/supervisor_ai.yaml',
    aiService: 'openai-service',
    capabilities: {
      canInternetAccess: false,
      canStreamOutput: true,
      canInteractWithPeers: true,
    },
  });

  console.log('  核心AI创建完成');
  console.log();

  // 步骤2: 决策AI分析题目并创建写作团队
  console.log('步骤2: 创建写作团队');
  const writer1 = await agentManager.addDynamicAgent('writer', '撰写引言和背景');
  const writer2 = await agentManager.addDynamicAgent('writer', '撰写方法和实验');
  const writer3 = await agentManager.addDynamicAgent('writer', '撰写结果和讨论');

  console.log('  写作团队创建完成，共', agentManager.getActiveAgents().length, '个Agent');
  console.log();

  // 步骤3: 模拟工作进度
  console.log('步骤3: 模拟工作进度');
  agentManager.updateAgent(writer1.id, {
    state: {
      status: 'writing',
      revisionCount: 0,
      lastActivity: new Date(),
    },
  });

  agentManager.updateAgent(writer2.id, {
    state: {
      status: 'thinking',
      revisionCount: 0,
      lastActivity: new Date(),
    },
  });

  console.log('  Writer1状态:', agentManager.getAgent(writer1.id)?.state.status);
  console.log('  Writer2状态:', agentManager.getAgent(writer2.id)?.state.status);
  console.log('  Writer3状态:', agentManager.getAgent(writer3.id)?.state.status);
  console.log();

  // 步骤4: 检测到需要更多人手，动态增加Agent
  console.log('步骤4: 动态增加格式专家');
  const formatExpert = await agentManager.addDynamicAgent(
    'writer',
    '负责论文格式规范和参考文献整理'
  );

  console.log('  格式专家已加入，当前Agent数量:', agentManager.getActiveAgents().length);
  console.log();

  // 步骤5: 创建审稿团队
  console.log('步骤5: 创建审稿团队');
  await agentManager.createAgent({
    id: 'editorial-office',
    name: '编辑部',
    role: 'editorial_office',
    promptTemplate: 'prompts/editorial_office.yaml',
    aiService: 'openai-service',
    capabilities: {
      canInternetAccess: false,
      canStreamOutput: true,
      canInteractWithPeers: true,
    },
  });

  await agentManager.createAgent({
    id: 'editor-in-chief',
    name: '主编',
    role: 'editor_in_chief',
    promptTemplate: 'prompts/editor_in_chief.yaml',
    aiService: 'openai-service',
    capabilities: {
      canInternetAccess: true,
      canStreamOutput: true,
      canInteractWithPeers: true,
    },
  });

  console.log('  审稿团队创建完成');
  console.log();

  // 步骤6: 显示最终状态
  console.log('步骤6: 最终状态');
  const allAgents = agentManager.getActiveAgents();
  console.log('  总Agent数量:', allAgents.length);
  console.log('  Agent列表:');
  allAgents.forEach((agent, index) => {
    console.log(`    ${index + 1}. ${agent.config.name} (${agent.config.role}) - ${agent.state.status}`);
  });
  console.log();

  return agentManager;
}

// ============================================================================
// 运行所有示例
// ============================================================================

async function runAllExamples() {
  try {
    await example2_CreateSingleAgent();
    await example3_CreateMultipleAgents();
    await example4_AddDynamicAgent();
    await example5_UpdateAgentState();
    await example6_DestroyAgent();
    await example7_CompleteWorkflow();

    console.log('所有示例运行完成！');
  } catch (error) {
    console.error('示例运行出错:', error);
  }
}

// 如果直接运行此文件，执行所有示例
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}

export {
  example1_CreateAgentManager,
  example2_CreateSingleAgent,
  example3_CreateMultipleAgents,
  example4_AddDynamicAgent,
  example5_UpdateAgentState,
  example6_DestroyAgent,
  example7_CompleteWorkflow,
};
