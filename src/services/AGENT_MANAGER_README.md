# Agent Manager

Agent管理器负责管理所有AI角色的生命周期和配置。

## 功能特性

- **Agent创建**: 创建具有特定角色和配置的AI Agent
- **Agent销毁**: 安全地销毁不再需要的Agent
- **动态扩展**: 根据工作负载动态增加新的Agent
- **状态管理**: 跟踪和更新Agent的工作状态
- **生命周期管理**: 完整的Agent生命周期管理

## 核心接口

### AgentManager

```typescript
interface AgentManager {
  // 创建AI角色
  createAgent(config: AgentConfig): Promise<Agent>;
  
  // 销毁AI角色
  destroyAgent(agentId: string): Promise<void>;
  
  // 获取所有活跃角色
  getActiveAgents(): Agent[];
  
  // 动态增加角色
  addDynamicAgent(roleType: AgentRole, task: string): Promise<Agent>;
  
  // 获取指定Agent
  getAgent(agentId: string): Agent | undefined;
  
  // 更新Agent状态
  updateAgent(agentId: string, updates: Partial<Agent>): void;
}
```

## 使用方法

### 1. 创建Agent管理器

```typescript
import { createAgentManager } from './services/agentManager';
import type { SystemConfig } from './types/config';

const systemConfig: SystemConfig = {
  aiServices: [
    {
      id: 'openai-service',
      name: 'OpenAI GPT-4',
      apiKey: 'your-api-key',
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

const agentManager = createAgentManager(systemConfig);
```

### 2. 创建Agent

```typescript
import type { AgentConfig } from './types/agent';

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

const writer = await agentManager.createAgent(writerConfig);
console.log('Agent创建成功:', writer.config.name);
```

### 3. 动态增加Agent

```typescript
// 当检测到工作量大或需要专门技能时，动态增加Agent
const dynamicWriter = await agentManager.addDynamicAgent(
  'writer',
  '撰写论文的文献综述部分'
);

console.log('动态增加的Agent:', dynamicWriter.config.name);
console.log('分配的任务:', dynamicWriter.state.currentTask?.description);
```

### 4. 更新Agent状态

```typescript
// 更新Agent工作状态
agentManager.updateAgent(writer.id, {
  state: {
    status: 'writing',
    revisionCount: 0,
    lastActivity: new Date(),
    currentTask: {
      id: 'task-001',
      description: '撰写引言部分',
      assignedBy: 'decision-ai',
      priority: 'high',
    },
  },
});

// 添加工作历史记录
agentManager.updateAgent(writer.id, {
  workHistory: [
    {
      taskId: 'task-001',
      startTime: new Date(Date.now() - 3600000),
      endTime: new Date(),
      output: '引言部分已完成...',
      status: 'completed',
      feedbackReceived: [],
    },
  ],
});
```

### 5. 获取Agent信息

```typescript
// 获取单个Agent
const agent = agentManager.getAgent('writer-001');
if (agent) {
  console.log('Agent状态:', agent.state.status);
  console.log('返工次数:', agent.state.revisionCount);
}

// 获取所有活跃Agent
const activeAgents = agentManager.getActiveAgents();
console.log('当前活跃Agent数量:', activeAgents.length);

activeAgents.forEach(agent => {
  console.log(`- ${agent.config.name} (${agent.config.role}): ${agent.state.status}`);
});
```

### 6. 销毁Agent

```typescript
// 销毁不再需要的Agent
await agentManager.destroyAgent('writer-001');
console.log('Agent已销毁');
```

## Agent角色类型

系统支持以下Agent角色：

- **decision**: 决策AI - 负责任务分析和团队组建
- **supervisor**: 监管AI - 负责质量检查和流程监控
- **writer**: 写作AI - 负责论文内容撰写
- **editorial_office**: 编辑部 - 负责格式审查和组织送审
- **editor_in_chief**: 主编 - 负责学术质量把控
- **deputy_editor**: 副主编 - 协助主编工作
- **peer_reviewer**: 审稿专家 - 负责深入评估

## Agent状态

Agent可以处于以下状态之一：

- **idle**: 空闲 - 等待任务分配
- **thinking**: 思考中 - 正在分析问题
- **writing**: 写作中 - 正在生成内容
- **waiting_feedback**: 等待反馈 - 等待其他Agent响应
- **revising**: 修订中 - 正在修改内容
- **completed**: 已完成 - 任务完成

## 完整工作流程示例

```typescript
// 1. 创建管理器
const agentManager = createAgentManager(systemConfig);

// 2. 创建核心AI
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

// 3. 动态创建写作团队
const writer1 = await agentManager.addDynamicAgent('writer', '撰写引言');
const writer2 = await agentManager.addDynamicAgent('writer', '撰写方法');
const writer3 = await agentManager.addDynamicAgent('writer', '撰写结果');

// 4. 更新工作状态
agentManager.updateAgent(writer1.id, {
  state: {
    status: 'writing',
    revisionCount: 0,
    lastActivity: new Date(),
  },
});

// 5. 检测到需要更多人手，动态增加
const formatExpert = await agentManager.addDynamicAgent(
  'writer',
  '负责格式规范和参考文献'
);

// 6. 创建审稿团队
const editorialOffice = await agentManager.createAgent({
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

// 7. 查看所有活跃Agent
const allAgents = agentManager.getActiveAgents();
console.log('总Agent数量:', allAgents.length);
allAgents.forEach(agent => {
  console.log(`- ${agent.config.name} (${agent.config.role})`);
});
```

## 错误处理

AgentManager会在以下情况抛出错误：

1. **配置验证失败**: 缺少必需字段（id、name、role、aiService）
2. **ID冲突**: 尝试创建已存在ID的Agent
3. **服务未找到**: 指定的AI服务配置不存在

```typescript
try {
  const agent = await agentManager.createAgent(config);
} catch (error) {
  if (error.message.includes('Agent配置缺少')) {
    console.error('配置错误:', error.message);
  } else if (error.message.includes('Agent ID已存在')) {
    console.error('ID冲突:', error.message);
  } else if (error.message.includes('AI服务配置未找到')) {
    console.error('服务未找到:', error.message);
  }
}
```

## 与Store集成

AgentManager内部使用Zustand store来管理Agent状态，确保UI和业务逻辑的同步：

```typescript
import { useAgentStore } from './stores/agentStore';

// 在React组件中使用
function AgentList() {
  const agents = useAgentStore(state => state.getAllAgents());
  
  return (
    <div>
      {agents.map(agent => (
        <div key={agent.id}>
          {agent.config.name} - {agent.state.status}
        </div>
      ))}
    </div>
  );
}
```

## 最佳实践

1. **使用唯一ID**: 确保每个Agent有唯一的ID
2. **及时更新状态**: 在Agent状态变化时及时调用updateAgent
3. **记录工作历史**: 保存Agent的工作记录以便追溯
4. **合理销毁**: 不再需要的Agent应及时销毁以释放资源
5. **动态扩展**: 根据实际工作负载动态增加Agent，而非一次性创建过多

## 相关文档

- [Agent类型定义](../types/agent.ts)
- [Agent Store](../stores/agentStore.ts)
- [AI Client](./aiClient.ts)
- [系统配置](../types/config.ts)

## 需求追溯

- 需求 7.1: 写作团队管理
- 需求 12.1: 实时工作显示
- 任务 7.2: 实现AgentManager核心功能
