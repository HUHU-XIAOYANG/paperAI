/**
 * Agent数据模型使用示例
 * 
 * 展示如何使用Agent相关类型定义创建和管理Agent实例
 */

import type {
  AgentStatus,
  AgentCapabilities,
  AgentConfig,
  Task,
  AgentState,
  WorkRecord,
  Agent,
  AgentInfo
} from './agent';

// ============================================================================
// 示例1: 创建Agent能力配置
// ============================================================================

/**
 * 创建具有完整能力的Agent配置
 */
export function createFullCapabilities(): AgentCapabilities {
  return {
    canInternetAccess: true,
    canStreamOutput: true,
    canInteractWithPeers: true
  };
}

/**
 * 创建受限能力的Agent配置（例如：不需要联网的Agent）
 */
export function createLimitedCapabilities(): AgentCapabilities {
  return {
    canInternetAccess: false,
    canStreamOutput: true,
    canInteractWithPeers: true
  };
}

// ============================================================================
// 示例2: 创建不同角色的Agent配置
// ============================================================================

/**
 * 创建Decision AI配置
 */
export function createDecisionAIConfig(): AgentConfig {
  return {
    id: 'decision-ai-001',
    name: 'Decision AI',
    role: 'decision',
    promptTemplate: 'prompts/decision_ai.yaml',
    aiService: 'openai-gpt4',
    capabilities: {
      canInternetAccess: true,
      canStreamOutput: true,
      canInteractWithPeers: true
    }
  };
}

/**
 * 创建Supervisor AI配置
 */
export function createSupervisorAIConfig(): AgentConfig {
  return {
    id: 'supervisor-ai-001',
    name: 'Supervisor AI',
    role: 'supervisor',
    promptTemplate: 'prompts/supervisor_ai.yaml',
    aiService: 'openai-gpt4',
    capabilities: {
      canInternetAccess: false,
      canStreamOutput: true,
      canInteractWithPeers: true
    }
  };
}

/**
 * 创建Writer AI配置
 */
export function createWriterAIConfig(id: string, name: string): AgentConfig {
  return {
    id,
    name,
    role: 'writer',
    promptTemplate: 'prompts/writer.yaml',
    aiService: 'openai-gpt4',
    capabilities: {
      canInternetAccess: true,
      canStreamOutput: true,
      canInteractWithPeers: true
    }
  };
}

/**
 * 创建审稿团队成员配置
 */
export function createReviewTeamConfigs(): AgentConfig[] {
  return [
    {
      id: 'editorial-office-001',
      name: 'Editorial Office',
      role: 'editorial_office',
      promptTemplate: 'prompts/editorial_office.yaml',
      aiService: 'openai-gpt4',
      capabilities: createFullCapabilities()
    },
    {
      id: 'editor-in-chief-001',
      name: 'Editor in Chief',
      role: 'editor_in_chief',
      promptTemplate: 'prompts/editor_in_chief.yaml',
      aiService: 'openai-gpt4',
      capabilities: createFullCapabilities()
    },
    {
      id: 'deputy-editor-001',
      name: 'Deputy Editor',
      role: 'deputy_editor',
      promptTemplate: 'prompts/deputy_editor.yaml',
      aiService: 'openai-gpt4',
      capabilities: createFullCapabilities()
    },
    {
      id: 'peer-reviewer-001',
      name: 'Peer Reviewer',
      role: 'peer_reviewer',
      promptTemplate: 'prompts/peer_reviewer.yaml',
      aiService: 'openai-gpt4',
      capabilities: createFullCapabilities()
    }
  ];
}

// ============================================================================
// 示例3: 创建和管理任务
// ============================================================================

/**
 * 创建简单任务
 */
export function createSimpleTask(
  id: string,
  description: string,
  assignedBy: string,
  priority: 'low' | 'medium' | 'high' = 'medium'
): Task {
  return {
    id,
    description,
    assignedBy,
    priority
  };
}

/**
 * 创建带截止时间和依赖的复杂任务
 */
export function createComplexTask(
  id: string,
  description: string,
  assignedBy: string,
  deadline: Date,
  dependencies: string[],
  priority: 'low' | 'medium' | 'high' = 'high'
): Task {
  return {
    id,
    description,
    assignedBy,
    deadline,
    priority,
    dependencies
  };
}

/**
 * 创建论文写作任务示例
 */
export function createPaperWritingTasks(): Task[] {
  return [
    {
      id: 'task-001',
      description: '撰写论文引言部分，包括研究背景、问题陈述和论文结构',
      assignedBy: 'decision-ai-001',
      priority: 'high'
    },
    {
      id: 'task-002',
      description: '撰写文献综述部分，总结相关研究现状',
      assignedBy: 'decision-ai-001',
      priority: 'high',
      dependencies: ['task-001']
    },
    {
      id: 'task-003',
      description: '撰写研究方法部分，详细描述实验设计和数据收集方法',
      assignedBy: 'decision-ai-001',
      priority: 'medium'
    },
    {
      id: 'task-004',
      description: '撰写结果部分，展示实验数据和分析结果',
      assignedBy: 'decision-ai-001',
      priority: 'medium',
      dependencies: ['task-003']
    },
    {
      id: 'task-005',
      description: '撰写讨论和结论部分，解释结果并总结贡献',
      assignedBy: 'decision-ai-001',
      priority: 'high',
      dependencies: ['task-004']
    }
  ];
}

// ============================================================================
// 示例4: 创建和更新Agent状态
// ============================================================================

/**
 * 创建初始Agent状态（空闲状态）
 */
export function createInitialAgentState(): AgentState {
  return {
    status: 'idle',
    revisionCount: 0,
    lastActivity: new Date()
  };
}

/**
 * 创建工作中的Agent状态
 */
export function createWorkingAgentState(task: Task): AgentState {
  return {
    status: 'writing',
    currentTask: task,
    revisionCount: 0,
    lastActivity: new Date()
  };
}

/**
 * 更新Agent状态（模拟状态转换）
 */
export function updateAgentStatus(
  currentState: AgentState,
  newStatus: AgentStatus
): AgentState {
  return {
    ...currentState,
    status: newStatus,
    lastActivity: new Date()
  };
}

/**
 * 增加返工次数
 */
export function incrementRevisionCount(state: AgentState): AgentState {
  return {
    ...state,
    revisionCount: state.revisionCount + 1,
    lastActivity: new Date()
  };
}

// ============================================================================
// 示例5: 创建工作记录
// ============================================================================

/**
 * 创建进行中的工作记录
 */
export function createInProgressWorkRecord(
  taskId: string,
  output: string
): WorkRecord {
  return {
    taskId,
    startTime: new Date(),
    output,
    status: 'in_progress',
    feedbackReceived: []
  };
}

/**
 * 完成工作记录
 */
export function completeWorkRecord(
  record: WorkRecord,
  finalOutput: string
): WorkRecord {
  return {
    ...record,
    endTime: new Date(),
    output: finalOutput,
    status: 'completed'
  };
}

/**
 * 添加反馈到工作记录
 */
export function addFeedbackToWorkRecord(
  record: WorkRecord,
  feedback: string
): WorkRecord {
  return {
    ...record,
    feedbackReceived: [...record.feedbackReceived, feedback]
  };
}

/**
 * 标记工作记录为需要修订
 */
export function markWorkRecordForRevision(
  record: WorkRecord,
  feedback: string
): WorkRecord {
  return {
    ...record,
    status: 'revised',
    feedbackReceived: [...record.feedbackReceived, feedback],
    lastActivity: new Date()
  } as WorkRecord & { lastActivity: Date };
}

// ============================================================================
// 示例6: 创建完整的Agent实例
// ============================================================================

/**
 * 创建新的Agent实例
 */
export function createAgent(config: AgentConfig): Agent {
  return {
    id: config.id,
    config,
    state: createInitialAgentState(),
    workHistory: [],
    interactionHistory: []
  };
}

/**
 * 创建Decision AI实例
 */
export function createDecisionAIInstance(): Agent {
  const config = createDecisionAIConfig();
  return createAgent(config);
}

/**
 * 创建Writer AI实例
 */
export function createWriterAIInstance(index: number): Agent {
  const config = createWriterAIConfig(
    `writer-ai-${String(index).padStart(3, '0')}`,
    `Writer AI ${index}`
  );
  return createAgent(config);
}

/**
 * 创建写作团队（多个Writer AI）
 */
export function createWritingTeam(size: number): Agent[] {
  return Array.from({ length: size }, (_, i) => createWriterAIInstance(i + 1));
}

/**
 * 创建审稿团队
 */
export function createReviewTeam(): Agent[] {
  const configs = createReviewTeamConfigs();
  return configs.map(config => createAgent(config));
}

// ============================================================================
// 示例7: Agent操作示例
// ============================================================================

/**
 * 为Agent分配任务
 */
export function assignTaskToAgent(agent: Agent, task: Task): Agent {
  return {
    ...agent,
    state: {
      ...agent.state,
      status: 'thinking',
      currentTask: task,
      lastActivity: new Date()
    }
  };
}

/**
 * Agent开始工作
 */
export function startAgentWork(agent: Agent): Agent {
  if (!agent.state.currentTask) {
    throw new Error('Cannot start work without a task');
  }

  const workRecord = createInProgressWorkRecord(
    agent.state.currentTask.id,
    ''
  );

  return {
    ...agent,
    state: {
      ...agent.state,
      status: 'writing',
      lastActivity: new Date()
    },
    workHistory: [...agent.workHistory, workRecord]
  };
}

/**
 * Agent完成工作
 */
export function completeAgentWork(agent: Agent, output: string): Agent {
  if (!agent.state.currentTask) {
    throw new Error('No current task to complete');
  }

  const lastWorkIndex = agent.workHistory.length - 1;
  const lastWork = agent.workHistory[lastWorkIndex];
  
  if (!lastWork) {
    throw new Error('No work record found');
  }

  const completedWork = completeWorkRecord(lastWork, output);
  const newWorkHistory = [...agent.workHistory];
  newWorkHistory[lastWorkIndex] = completedWork;

  return {
    ...agent,
    state: {
      ...agent.state,
      status: 'completed',
      lastActivity: new Date()
    },
    workHistory: newWorkHistory
  };
}

/**
 * Agent接收反馈并进入修订状态
 */
export function agentReceiveFeedback(agent: Agent, feedback: string): Agent {
  const lastWorkIndex = agent.workHistory.length - 1;
  const lastWork = agent.workHistory[lastWorkIndex];
  
  if (!lastWork) {
    throw new Error('No work record found');
  }

  const updatedWork = addFeedbackToWorkRecord(lastWork, feedback);
  const newWorkHistory = [...agent.workHistory];
  newWorkHistory[lastWorkIndex] = updatedWork;

  return {
    ...agent,
    state: incrementRevisionCount({
      ...agent.state,
      status: 'revising'
    }),
    workHistory: newWorkHistory
  };
}

/**
 * 添加交互消息到Agent历史
 */
export function addInteractionToAgent(agent: Agent, messageId: string): Agent {
  return {
    ...agent,
    interactionHistory: [...agent.interactionHistory, messageId]
  };
}

// ============================================================================
// 示例8: 创建AgentInfo用于UI显示
// ============================================================================

/**
 * 从Agent实例创建AgentInfo
 */
export function createAgentInfoFromAgent(agent: Agent): AgentInfo {
  return {
    id: agent.id,
    name: agent.config.name,
    role: agent.config.role,
    currentTask: agent.state.currentTask?.description
  };
}

/**
 * 创建带头像的AgentInfo
 */
export function createAgentInfoWithAvatar(
  agent: Agent,
  avatarUrl: string
): AgentInfo {
  return {
    ...createAgentInfoFromAgent(agent),
    avatar: avatarUrl
  };
}

// ============================================================================
// 示例9: 完整工作流程示例
// ============================================================================

/**
 * 模拟完整的Agent工作流程
 */
export function simulateAgentWorkflow(): Agent {
  // 1. 创建Agent
  let agent = createWriterAIInstance(1);
  console.log('1. Agent创建:', agent.config.name);

  // 2. 分配任务
  const task = createSimpleTask(
    'task-001',
    '撰写论文引言部分',
    'decision-ai-001',
    'high'
  );
  agent = assignTaskToAgent(agent, task);
  console.log('2. 任务分配:', agent.state.currentTask?.description);

  // 3. 开始工作
  agent = startAgentWork(agent);
  console.log('3. 开始工作，状态:', agent.state.status);

  // 4. 完成工作
  agent = completeAgentWork(agent, '引言部分初稿内容...');
  console.log('4. 工作完成，输出长度:', agent.workHistory[0]?.output.length);

  // 5. 接收反馈
  agent = agentReceiveFeedback(agent, '需要补充研究背景');
  console.log('5. 接收反馈，返工次数:', agent.state.revisionCount);

  // 6. 添加交互记录
  agent = addInteractionToAgent(agent, 'msg-001');
  console.log('6. 交互记录数:', agent.interactionHistory.length);

  return agent;
}

// ============================================================================
// 示例10: 团队管理示例
// ============================================================================

/**
 * 创建完整的Agent团队结构
 */
export function createCompleteAgentTeam() {
  return {
    decisionAI: createDecisionAIInstance(),
    supervisorAI: createAgent(createSupervisorAIConfig()),
    writingTeam: createWritingTeam(3),
    reviewTeam: createReviewTeam()
  };
}

/**
 * 获取团队中所有Agent的信息
 */
export function getTeamInfo(team: ReturnType<typeof createCompleteAgentTeam>): {
  decision: AgentInfo;
  supervisor: AgentInfo;
  writers: AgentInfo[];
  reviewers: AgentInfo[];
} {
  return {
    decision: createAgentInfoFromAgent(team.decisionAI),
    supervisor: createAgentInfoFromAgent(team.supervisorAI),
    writers: team.writingTeam.map(createAgentInfoFromAgent),
    reviewers: team.reviewTeam.map(createAgentInfoFromAgent)
  };
}

/**
 * 统计团队工作状态
 */
export function getTeamStatistics(agents: Agent[]): {
  total: number;
  byStatus: Record<AgentStatus, number>;
  totalRevisions: number;
  totalWorkRecords: number;
} {
  const byStatus: Record<AgentStatus, number> = {
    idle: 0,
    thinking: 0,
    writing: 0,
    waiting_feedback: 0,
    revising: 0,
    completed: 0
  };

  let totalRevisions = 0;
  let totalWorkRecords = 0;

  agents.forEach(agent => {
    byStatus[agent.state.status]++;
    totalRevisions += agent.state.revisionCount;
    totalWorkRecords += agent.workHistory.length;
  });

  return {
    total: agents.length,
    byStatus,
    totalRevisions,
    totalWorkRecords
  };
}
