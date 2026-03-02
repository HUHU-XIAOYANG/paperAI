# Work Display Panel Component

## 概述

Work Display Panel 是 Agent Swarm 写作系统的核心 UI 组件，用于实时展示单个 AI Agent 的工作状态、流式输出和交互消息。该组件集成了 StreamHandler 和 InteractionRouter，提供完整的 Agent 工作可视化功能。

## 功能特性

### 1. Agent 信息显示（需求 7.2, 12.1）
- 显示 Agent 名称、角色和头像
- 支持自定义头像或自动生成首字母头像
- 清晰的角色标识（决策AI、监管AI、写作AI等）

### 2. 工作状态指示（需求 7.2, 12.1）
- 实时显示 Agent 当前状态
- 状态类型：
  - **空闲** (idle) - 灰色，等待任务分配
  - **思考中** (thinking) - 蓝色，正在分析问题
  - **写作中** (writing) - 绿色，正在生成内容
  - **等待反馈** (waiting_feedback) - 黄色，等待其他 Agent 响应
  - **修订中** (revising) - 紫色，正在修改内容
  - **已完成** (completed) - 绿色，任务完成
- 每个状态配有对应的图标和颜色

### 3. 当前任务显示（需求 7.2）
- 显示 Agent 正在执行的具体任务描述
- 清晰的视觉分隔和强调

### 4. 流式输出显示（需求 17.2, 17.3, 17.4）
- **自动订阅**：组件自动订阅 StreamHandler 的流式数据
- **实时渲染**：逐步显示 AI 生成的内容，无需等待完成
- **格式保持**：保持输出内容的格式和可读性
- **状态指示**：显示"实时输出中..."指示器和动画
- **自动滚动**：内容更新时自动滚动到底部
- **可滚动区域**：支持查看长内容

### 5. 交互消息显示（需求 7.7, 12.3）
- 显示 Agent 接收和发送的所有消息
- **消息类型区分**：
  - 任务分配 (task_assignment)
  - 工作提交 (work_submission)
  - 反馈请求 (feedback_request)
  - 反馈响应 (feedback_response)
  - 讨论 (discussion)
  - 修订请求 (revision_request)
  - 批准 (approval)
  - 退稿 (rejection)
- **视觉区分**：
  - 发送的消息：蓝色边框
  - 接收的消息：紫色边框
- 显示消息时间戳和发送者/接收者信息

### 6. 交互请求功能（需求 7.6, 8.8）
- 提供"请求反馈"按钮
- 支持 Agent 之间的主动交互
- 仅在 Agent 活跃时显示（非空闲和已完成状态）
- 通过回调函数触发交互流程

### 7. Glass Morphism 设计
- 使用 GlassContainer 实现苹果液态玻璃效果
- 半透明背景、模糊效果和柔和阴影
- 支持深色和浅色主题
- 响应式设计，适配不同屏幕尺寸

## 组件接口

### Props

```typescript
interface WorkDisplayPanelProps {
  /** Agent 信息（必需） */
  agent: AgentInfo;
  
  /** 当前任务描述（可选） */
  currentTask?: string;
  
  /** 当前 Agent 状态（必需） */
  status: AgentStatus;
  
  /** 流式输出内容（可选） */
  streamingOutput?: string;
  
  /** 交互消息列表（可选） */
  messages?: AgentMessage[];
  
  /** 交互请求回调（可选） */
  onInteractionRequest?: (agentId: string) => void;
}
```

### AgentInfo 类型

```typescript
interface AgentInfo {
  id: string;           // Agent 唯一标识符
  name: string;         // Agent 显示名称
  role: AgentRole;      // Agent 角色类型
  avatar?: string;      // Agent 头像 URL（可选）
  currentTask?: string; // 当前任务描述（可选）
}
```

### AgentStatus 类型

```typescript
type AgentStatus = 
  | 'idle'              // 空闲
  | 'thinking'          // 思考中
  | 'writing'           // 写作中
  | 'waiting_feedback'  // 等待反馈
  | 'revising'          // 修订中
  | 'completed';        // 已完成
```

## 使用示例

### 基础使用

```tsx
import { WorkDisplayPanel } from './components/WorkDisplayPanel';

function App() {
  const agent = {
    id: 'writer_1',
    name: 'Writer Alpha',
    role: 'writer',
    currentTask: '撰写论文引言部分',
  };

  return (
    <WorkDisplayPanel
      agent={agent}
      currentTask={agent.currentTask}
      status="writing"
    />
  );
}
```

### 带流式输出

```tsx
function WriterWithStreaming() {
  const [output, setOutput] = useState('');

  // 模拟流式输出
  useEffect(() => {
    const text = '这是一段逐步生成的内容...';
    let index = 0;
    
    const interval = setInterval(() => {
      if (index < text.length) {
        setOutput(prev => prev + text[index]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <WorkDisplayPanel
      agent={agent}
      status="writing"
      streamingOutput={output}
    />
  );
}
```

### 带交互消息

```tsx
function WriterWithMessages() {
  const messages = [
    {
      id: 'msg-1',
      type: 'task_assignment',
      sender: 'decision_ai',
      receiver: 'writer_1',
      content: '请撰写论文的引言部分。',
      metadata: {
        priority: 'high',
        requiresResponse: false,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date(),
    },
  ];

  return (
    <WorkDisplayPanel
      agent={agent}
      status="writing"
      messages={messages}
    />
  );
}
```

### 带交互请求功能

```tsx
function WriterWithInteraction() {
  const handleInteractionRequest = (agentId: string) => {
    console.log(`Request interaction with: ${agentId}`);
    // 打开交互对话框或发送反馈请求
  };

  return (
    <WorkDisplayPanel
      agent={agent}
      status="writing"
      onInteractionRequest={handleInteractionRequest}
    />
  );
}
```

### 多面板网格布局

```tsx
function MultiAgentDashboard() {
  const agents = [
    { id: 'decision_ai', name: 'Decision AI', role: 'decision', status: 'thinking' },
    { id: 'supervisor_ai', name: 'Supervisor', role: 'supervisor', status: 'writing' },
    { id: 'writer_1', name: 'Writer 1', role: 'writer', status: 'writing' },
    { id: 'writer_2', name: 'Writer 2', role: 'writer', status: 'revising' },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
      gap: '1.5rem',
      padding: '2rem',
    }}>
      {agents.map(agent => (
        <WorkDisplayPanel
          key={agent.id}
          agent={agent}
          status={agent.status}
        />
      ))}
    </div>
  );
}
```

## 集成指南

### 与 StreamHandler 集成

组件会自动订阅 StreamHandler 的流式输出：

```tsx
import { streamHandler } from '../services/streamHandler';

// 在 Agent 开始工作时启动流式会话
const session = streamHandler.startStream(agentId);

// 处理 AI 的流式输出
aiClient.sendRequest({
  prompt: '...',
  stream: true,
}).then(async (stream) => {
  for await (const chunk of stream) {
    streamHandler.handleStreamChunk(session.id, chunk);
  }
  streamHandler.endStream(session.id);
});

// WorkDisplayPanel 会自动显示流式输出
<WorkDisplayPanel agent={agent} status="writing" />
```

### 与 InteractionRouter 集成

通过 InteractionRouter 发送和接收消息：

```tsx
import { interactionRouter } from '../services/interactionRouter';

// 订阅 Agent 的消息
useEffect(() => {
  const unsubscribe = interactionRouter.subscribeToMessages(
    agentId,
    (message) => {
      // 更新消息列表
      setMessages(prev => [...prev, message]);
    }
  );
  
  return unsubscribe;
}, [agentId]);

// 发送消息
const sendMessage = async () => {
  await interactionRouter.sendMessage({
    id: uuidv4(),
    type: 'discussion',
    sender: 'writer_1',
    receiver: 'writer_2',
    content: '我们需要讨论一下...',
    metadata: {
      priority: 'medium',
      requiresResponse: true,
      timestamp: new Date().toISOString(),
    },
    timestamp: new Date(),
  });
};
```

### 与状态管理集成

使用 Zustand 或其他状态管理库：

```tsx
import { useAgentStore } from '../stores/agentStore';
import { useMessageStore } from '../stores/messageStore';

function AgentPanel({ agentId }: { agentId: string }) {
  const agent = useAgentStore(state => 
    state.agents.find(a => a.id === agentId)
  );
  
  const messages = useMessageStore(state =>
    state.messages.filter(m => 
      m.receiver === agentId || m.sender === agentId
    )
  );

  if (!agent) return null;

  return (
    <WorkDisplayPanel
      agent={agent}
      currentTask={agent.state.currentTask?.description}
      status={agent.state.status}
      messages={messages}
    />
  );
}
```

## 样式定制

### CSS 变量

组件使用 CSS 变量支持主题定制：

```css
:root {
  /* 状态颜色 */
  --status-idle: #9ca3af;
  --status-thinking: #3b82f6;
  --status-writing: #10b981;
  --status-waiting: #f59e0b;
  --status-revising: #8b5cf6;
  --status-completed: #22c55e;
  
  /* 文本颜色 */
  --text-primary: #f3f4f6;
  --text-secondary: #d1d5db;
  
  /* 主题颜色 */
  --primary-color: #667eea;
  --secondary-color: #764ba2;
}
```

### 自定义样式

通过 className 添加自定义样式：

```tsx
<WorkDisplayPanel
  agent={agent}
  status="writing"
  className="custom-panel"
/>
```

```css
.custom-panel {
  max-height: 800px;
  border: 2px solid var(--primary-color);
}
```

## 性能优化

### 1. 消息过滤

组件内部会自动过滤与当前 Agent 相关的消息，避免渲染无关内容。

### 2. 自动滚动优化

使用 `useRef` 和 `useEffect` 实现高效的自动滚动，仅在内容更新时触发。

### 3. 订阅清理

组件卸载时自动取消 StreamHandler 订阅，避免内存泄漏。

### 4. 虚拟滚动（可选）

对于大量消息，可以集成虚拟滚动库（如 react-window）：

```tsx
import { FixedSizeList } from 'react-window';

// 在消息列表中使用虚拟滚动
<FixedSizeList
  height={250}
  itemCount={messages.length}
  itemSize={80}
>
  {({ index, style }) => (
    <div style={style}>
      {/* 渲染消息项 */}
    </div>
  )}
</FixedSizeList>
```

## 可访问性

### 键盘导航

- 交互按钮支持键盘焦点和回车键触发
- 可滚动区域支持键盘滚动

### 屏幕阅读器

- 使用语义化 HTML 标签
- 为图标添加 aria-label
- 状态变化提供适当的 ARIA 属性

### 颜色对比

- 所有文本颜色符合 WCAG AA 标准
- 状态指示器使用颜色+图标双重标识

## 测试

### 单元测试示例

```tsx
import { render, screen } from '@testing-library/react';
import { WorkDisplayPanel } from './WorkDisplayPanel';

describe('WorkDisplayPanel', () => {
  it('renders agent name and role', () => {
    const agent = {
      id: 'test-agent',
      name: 'Test Agent',
      role: 'writer',
    };
    
    render(<WorkDisplayPanel agent={agent} status="idle" />);
    
    expect(screen.getByText('Test Agent')).toBeInTheDocument();
    expect(screen.getByText('写作AI')).toBeInTheDocument();
  });

  it('displays current task', () => {
    const agent = { id: 'test', name: 'Test', role: 'writer' };
    const task = '撰写引言';
    
    render(
      <WorkDisplayPanel 
        agent={agent} 
        status="writing" 
        currentTask={task}
      />
    );
    
    expect(screen.getByText(task)).toBeInTheDocument();
  });

  it('shows streaming indicator when active', () => {
    const agent = { id: 'test', name: 'Test', role: 'writer' };
    
    render(
      <WorkDisplayPanel 
        agent={agent} 
        status="writing"
        streamingOutput="Content..."
      />
    );
    
    expect(screen.getByText(/实时输出中/)).toBeInTheDocument();
  });
});
```

## 故障排除

### 问题：流式输出不显示

**原因**：StreamHandler 未正确启动会话

**解决**：确保在 AI 开始工作前调用 `streamHandler.startStream(agentId)`

### 问题：消息不更新

**原因**：未订阅 InteractionRouter 或消息过滤错误

**解决**：检查消息的 sender 和 receiver 字段是否正确

### 问题：样式不生效

**原因**：CSS 模块未正确导入或主题变量未定义

**解决**：确保导入 `.module.css` 文件并定义必要的 CSS 变量

## 相关文档

- [StreamHandler 文档](../services/STREAM_HANDLER_README.md)
- [InteractionRouter 文档](../services/INTERACTION_ROUTER_README.md)
- [Agent 类型定义](../types/AGENT_README.md)
- [Glass Morphism 设计](./GLASS_MORPHISM_README.md)

## 更新日志

### v1.0.0 (2024-01-15)
- ✅ 实现基础面板结构（需求 7.2, 12.1）
- ✅ 实现流式输出显示（需求 17.2, 17.3, 17.4）
- ✅ 实现交互消息显示（需求 7.7, 12.3）
- ✅ 实现交互请求功能（需求 7.6, 8.8）
- ✅ 集成 Glass Morphism 设计
- ✅ 支持深色和浅色主题
- ✅ 响应式设计
- ✅ 完整的文档和示例

## 许可证

MIT License
