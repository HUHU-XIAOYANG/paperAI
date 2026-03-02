# Agent数据模型文档

## 概述

Agent数据模型定义了Agent Swarm写作系统中所有智能体（Agent）的核心数据结构。这些类型定义支持多智能体协作、任务管理、状态追踪和历史记录等功能。

**相关需求**: 5.2, 7.1

## 核心类型

### AgentRole（Agent角色）

定义系统中所有可能的Agent角色类型。

```typescript
type AgentRole = 
  | 'decision'          // 决策AI
  | 'supervisor'        // 监管AI
  | 'writer'            // 写作AI
  | 'editorial_office'  // 编辑部
  | 'editor_in_chief'   // 主编
  | 'deputy_editor'     // 副主编
  | 'peer_reviewer';    // 审稿专家
```

**角色说明**:
- **decision**: 负责分析论文题目、评估工作量、组建写作团队、动态增加角色
- **supervisor**: 负责检查输出格式、质量把控、触发返工和退稿机制
- **writer**: 负责撰写论文的具体章节内容
- **editorial_office**: 负责格式审查、组织送审、联络沟通
- **editor_in_chief**: 负责学术质量把控、初审筛选、最终录用决定
- **deputy_editor**: 协助主编进行质量把控和初审筛选
- **peer_reviewer**: 负责深入评估论文并撰写详细审稿报告

### AgentStatus（Agent状态）

表示Agent当前的工作状态。

```typescript
type AgentStatus = 
  | 'idle'              // 空闲
  | 'thinking'          // 思考中
  | 'writing'           // 写作中
  | 'waiting_feedback'  // 等待反馈
  | 'revising'          // 修订中
  | 'completed';        // 已完成
```

**状态转换流程**:
```
idle → thinking → writing → completed
                    ↓
                 revising → writing
                    ↓
              waiting_feedback → revising
```

### AgentCapabilities（Agent能力）

定义Agent具备的功能能力。

```typescript
interface AgentCapabilities {
  canInternetAccess: boolean;    // 是否可以访问互联网
  canStreamOutput: boolean;      // 是否支持流式输出
  canInteractWithPeers: boolean; // 是否可以与其他Agent交互
}
```

**使用示例**:
```typescript
// 完整能力配置（适用于大多数Agent）
const fullCapabilities: AgentCapabilities = {
  canInternetAccess: true,
  canStreamOutput: true,
  canInteractWithPeers: true
};

// 受限能力配置（例如：不需要联网的Supervisor AI）
const limitedCapabilities: AgentCapabilities = {
  canInternetAccess: false,
  canStreamOutput: true,
  canInteractWithPeers: true
};
```

### AgentConfig（Agent配置）

定义创建Agent所需的配置信息。

```typescript
interface AgentConfig {
  id: string;              // Agent唯一标识符
  name: string;            // Agent显示名称
  role: AgentRole;         // Agent角色类型
  promptTemplate: string;  // 提示词模板路径或内容
  aiService: string;       // AI服务配置名称
  capabilities: AgentCapabilities; // Agent能力配置
}
```

**使用示例**:
```typescript
const decisionAIConfig: AgentConfig = {
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
```

### Task（任务）

表示分配给Agent的具体任务。

```typescript
interface Task {
  id: string;              // 任务唯一标识符
  description: string;     // 任务描述
  assignedBy: string;      // 任务分配者ID
  deadline?: Date;         // 任务截止时间（可选）
  priority: 'low' | 'medium' | 'high'; // 任务优先级
  dependencies?: string[]; // 依赖的其他任务ID列表（可选）
}
```

**使用示例**:
```typescript
// 简单任务
const simpleTask: Task = {
  id: 'task-001',
  description: '撰写论文引言部分',
  assignedBy: 'decision-ai-001',
  priority: 'high'
};

// 带依赖的复杂任务
const complexTask: Task = {
  id: 'task-002',
  description: '撰写文献综述部分',
  assignedBy: 'decision-ai-001',
  deadline: new Date('2024-12-31'),
  priority: 'high',
  dependencies: ['task-001'] // 依赖引言部分完成
};
```

### AgentState（Agent状态）

表示Agent的当前运行时状态。

```typescript
interface AgentState {
  status: AgentStatus;     // 当前工作状态
  currentTask?: Task;      // 当前正在执行的任务（可选）
  revisionCount: number;   // 返工次数计数器
  lastActivity: Date;      // 最后活动时间
}
```

**使用示例**:
```typescript
// 初始状态（空闲）
const initialState: AgentState = {
  status: 'idle',
  revisionCount: 0,
  lastActivity: new Date()
};

// 工作中状态
const workingState: AgentState = {
  status: 'writing',
  currentTask: {
    id: 'task-001',
    description: '撰写引言',
    assignedBy: 'decision-ai-001',
    priority: 'high'
  },
  revisionCount: 0,
  lastActivity: new Date()
};
```

### WorkRecord（工作记录）

记录Agent执行任务的历史信息。

```typescript
interface WorkRecord {
  taskId: string;          // 关联的任务ID
  startTime: Date;         // 任务开始时间
  endTime?: Date;          // 任务结束时间（可选）
  output: string;          // 任务输出内容
  status: 'in_progress' | 'completed' | 'rejected' | 'revised'; // 任务执行状态
  feedbackReceived: string[]; // 收到的反馈列表
}
```

**使用示例**:
```typescript
// 进行中的工作记录
const inProgressRecord: WorkRecord = {
  taskId: 'task-001',
  startTime: new Date(),
  output: '引言初稿内容...',
  status: 'in_progress',
  feedbackReceived: []
};

// 已完成的工作记录
const completedRecord: WorkRecord = {
  taskId: 'task-001',
  startTime: new Date('2024-01-01T10:00:00'),
  endTime: new Date('2024-01-01T12:00:00'),
  output: '引言最终版本...',
  status: 'completed',
  feedbackReceived: ['需要补充背景信息', '格式符合要求']
};
```

### Agent（Agent实例）

表示一个完整的Agent实例，包含配置、状态和历史记录。

```typescript
interface Agent {
  id: string;                    // Agent唯一标识符
  config: AgentConfig;           // Agent配置信息
  state: AgentState;             // Agent当前状态
  workHistory: WorkRecord[];     // 工作历史记录
  interactionHistory: string[];  // 交互消息ID列表
}
```

**使用示例**:
```typescript
const writerAgent: Agent = {
  id: 'writer-ai-001',
  config: {
    id: 'writer-ai-001',
    name: 'Writer AI 1',
    role: 'writer',
    promptTemplate: 'prompts/writer.yaml',
    aiService: 'openai-gpt4',
    capabilities: {
      canInternetAccess: true,
      canStreamOutput: true,
      canInteractWithPeers: true
    }
  },
  state: {
    status: 'writing',
    currentTask: {
      id: 'task-001',
      description: '撰写引言',
      assignedBy: 'decision-ai-001',
      priority: 'high'
    },
    revisionCount: 0,
    lastActivity: new Date()
  },
  workHistory: [],
  interactionHistory: []
};
```

### AgentInfo（Agent基本信息）

用于UI显示的简化Agent信息。

```typescript
interface AgentInfo {
  id: string;           // Agent唯一标识符
  name: string;         // Agent显示名称
  role: AgentRole;      // Agent角色类型
  avatar?: string;      // Agent头像URL（可选）
  currentTask?: string; // 当前任务描述（可选）
}
```

**使用示例**:
```typescript
const agentInfo: AgentInfo = {
  id: 'writer-ai-001',
  name: 'Writer AI 1',
  role: 'writer',
  avatar: 'https://example.com/avatar.png',
  currentTask: '撰写论文引言部分'
};
```

## 使用场景

### 1. 创建Agent实例

```typescript
import { createAgent, createWriterAIConfig } from './agent.example';

// 创建Writer AI配置
const config = createWriterAIConfig('writer-001', 'Writer AI 1');

// 创建Agent实例
const agent = createAgent(config);
```

### 2. 任务分配和执行

```typescript
import { assignTaskToAgent, startAgentWork, completeAgentWork } from './agent.example';

// 创建任务
const task: Task = {
  id: 'task-001',
  description: '撰写论文引言部分',
  assignedBy: 'decision-ai-001',
  priority: 'high'
};

// 分配任务
let agent = assignTaskToAgent(agent, task);

// 开始工作
agent = startAgentWork(agent);

// 完成工作
agent = completeAgentWork(agent, '引言部分内容...');
```

### 3. 反馈和修订

```typescript
import { agentReceiveFeedback } from './agent.example';

// Agent接收反馈
agent = agentReceiveFeedback(agent, '需要补充研究背景');

// 返工次数自动增加
console.log(agent.state.revisionCount); // 1
```

### 4. 创建团队

```typescript
import { createCompleteAgentTeam } from './agent.example';

// 创建完整的Agent团队
const team = createCompleteAgentTeam();

console.log('Decision AI:', team.decisionAI.config.name);
console.log('Supervisor AI:', team.supervisorAI.config.name);
console.log('Writing Team:', team.writingTeam.length, 'members');
console.log('Review Team:', team.reviewTeam.length, 'members');
```

### 5. 状态管理

```typescript
import { updateAgentStatus, incrementRevisionCount } from './agent.example';

// 更新Agent状态
agent = updateAgentStatus(agent.state, 'thinking');

// 增加返工次数
agent.state = incrementRevisionCount(agent.state);
```

## 最佳实践

### 1. Agent ID命名规范

建议使用以下格式命名Agent ID：
- Decision AI: `decision-ai-001`
- Supervisor AI: `supervisor-ai-001`
- Writer AI: `writer-ai-001`, `writer-ai-002`, ...
- Editorial Office: `editorial-office-001`
- Editor in Chief: `editor-in-chief-001`
- Deputy Editor: `deputy-editor-001`
- Peer Reviewer: `peer-reviewer-001`, `peer-reviewer-002`, ...

### 2. 任务优先级设置

- **high**: 关键任务，如引言、结论、核心章节
- **medium**: 重要但非关键任务，如方法、结果部分
- **low**: 辅助任务，如格式调整、参考文献整理

### 3. 返工次数监控

- 返工次数 = 0: 正常状态
- 返工次数 = 1-2: 需要关注，可能需要额外指导
- 返工次数 >= 3: 触发退稿机制，需要分析原因并可能增加专门角色

### 4. 能力配置建议

| 角色 | 联网 | 流式输出 | 交互 |
|------|------|----------|------|
| Decision AI | ✓ | ✓ | ✓ |
| Supervisor AI | ✗ | ✓ | ✓ |
| Writer AI | ✓ | ✓ | ✓ |
| Editorial Office | ✓ | ✓ | ✓ |
| Editor in Chief | ✓ | ✓ | ✓ |
| Deputy Editor | ✓ | ✓ | ✓ |
| Peer Reviewer | ✓ | ✓ | ✓ |

### 5. 状态转换规则

确保Agent状态转换遵循合理的流程：

```typescript
// ✓ 正确的状态转换
idle → thinking → writing → completed

// ✓ 正确的修订流程
writing → revising → writing → completed

// ✗ 错误的状态转换
idle → completed  // 跳过工作过程
writing → idle    // 未完成就返回空闲
```

## 相关文件

- **类型定义**: `src/types/agent.ts`
- **单元测试**: `src/types/agent.test.ts`
- **使用示例**: `src/types/agent.example.ts`
- **设计文档**: `.kiro/specs/agent-swarm-writing-system/design.md`

## 测试

运行Agent数据模型的单元测试：

```bash
npm test -- src/types/agent.test.ts
```

测试覆盖：
- ✓ 所有类型定义的正确性
- ✓ 接口字段的完整性
- ✓ 可选字段的支持
- ✓ 类型组合的有效性

## 版本历史

- **v1.0.0** (2024-01-15): 初始版本，定义所有核心Agent数据模型
  - 支持7种Agent角色
  - 支持6种Agent状态
  - 完整的任务管理和工作记录功能
  - 支持能力配置和交互历史

## 贡献指南

如需修改Agent数据模型：

1. 更新 `src/types/agent.ts` 中的类型定义
2. 更新 `src/types/agent.test.ts` 中的测试用例
3. 更新 `src/types/agent.example.ts` 中的使用示例
4. 更新本README文档
5. 确保所有测试通过
6. 更新设计文档中的相关部分

## 许可证

本项目采用 MIT 许可证。
