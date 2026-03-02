# InteractionRouter - 交互路由器

## 概述

InteractionRouter是Agent Swarm写作系统的消息传递基础设施，负责处理Agent之间的非线性交互和消息路由。它支持点对点消息、团队广播、消息订阅和反馈请求等功能。

## 核心功能

### 1. 点对点消息传递

发送消息给单个或多个Agent：

```typescript
import { interactionRouter, createMessage } from './services/interactionRouter';

// 发送给单个Agent
const message = createMessage(
  'discussion',
  'writer_1',
  'writer_2',
  '我们需要讨论引言部分的内容。'
);
await interactionRouter.sendMessage(message);

// 发送给多个Agent（多播）
const multicastMessage = createMessage(
  'discussion',
  'supervisor_ai',
  ['writer_1', 'writer_2', 'writer_3'],
  '请注意格式规范。'
);
await interactionRouter.sendMessage(multicastMessage);
```

### 2. 消息订阅

订阅Agent的消息，实时接收通知：

```typescript
// 订阅消息
const unsubscribe = interactionRouter.subscribeToMessages('writer_1', (message) => {
  console.log('Writer 1 received:', message.content);
  // 更新UI或执行其他操作
});

// 取消订阅
unsubscribe();
```

**特性：**
- 支持多个订阅者订阅同一个Agent
- 自动错误处理，单个订阅者的错误不影响其他订阅者
- 返回取消订阅函数，便于清理

### 3. 团队广播

向整个团队广播消息：

```typescript
// 注册团队成员
interactionRouter.registerTeamMember('writing', 'writer_1');
interactionRouter.registerTeamMember('writing', 'writer_2');
interactionRouter.registerTeamMember('writing', 'writer_3');

// 广播消息
const announcement = createMessage(
  'discussion',
  'supervisor_ai',
  [], // receiver会被自动设置
  '重要通知：所有内容必须符合格式规范。',
  { priority: 'high' }
);

await interactionRouter.broadcastToTeam('writing', announcement);
```

**支持的团队类型：**
- `'writing'` - 写作团队
- `'review'` - 审稿团队

### 4. 反馈请求

发送反馈请求并异步等待响应：

```typescript
// 请求反馈
try {
  const feedback = await interactionRouter.requestFeedback(
    'writer_1',
    'writer_2',
    '你对引言部分有什么建议？'
  );
  console.log('收到反馈:', feedback);
} catch (error) {
  console.error('反馈请求超时:', error);
}

// 响应反馈请求
interactionRouter.subscribeToMessages('writer_2', async (message) => {
  if (message.type === 'feedback_request') {
    const response = createMessage(
      'feedback_response',
      'writer_2',
      message.sender,
      '我的建议是...',
      { relatedTaskId: message.metadata.relatedTaskId }
    );
    await interactionRouter.sendMessage(response);
  }
});
```

**特性：**
- 自动超时处理（默认30秒）
- 使用Promise实现异步等待
- 自动匹配请求和响应（通过relatedTaskId）

## 消息类型

系统支持以下消息类型：

| 类型 | 说明 | 使用场景 |
|------|------|----------|
| `task_assignment` | 任务分配 | Decision AI分配任务给Writing Team |
| `work_submission` | 工作提交 | AI提交完成的工作给Supervisor AI |
| `feedback_request` | 反馈请求 | AI请求其他AI提供反馈或意见 |
| `feedback_response` | 反馈响应 | AI回复反馈请求 |
| `discussion` | 讨论 | AI之间的非正式讨论和协商 |
| `revision_request` | 修订请求 | Supervisor AI要求AI返工 |
| `approval` | 批准 | 审稿团队批准内容 |
| `rejection` | 退稿 | 审稿团队退稿 |

## 消息元数据

每条消息包含以下元数据：

```typescript
interface MessageMetadata {
  priority: 'low' | 'medium' | 'high';  // 消息优先级
  requiresResponse: boolean;             // 是否需要响应
  relatedTaskId?: string;                // 关联的任务ID
  attachments?: string[];                // 附件ID列表
  timestamp: string;                     // ISO 8601时间戳
  tags?: string[];                       // 消息标签
}
```

## 辅助函数

### createMessage

简化消息创建：

```typescript
const message = createMessage(
  'discussion',              // 消息类型
  'writer_1',               // 发送者
  'writer_2',               // 接收者
  '消息内容',               // 内容
  {                         // 可选的元数据
    priority: 'high',
    requiresResponse: true,
    tags: ['urgent']
  }
);
```

**自动生成：**
- 消息ID（UUID）
- 时间戳
- 默认元数据值

## 团队管理

### 注册团队成员

```typescript
interactionRouter.registerTeamMember('writing', 'writer_1');
interactionRouter.registerTeamMember('review', 'editor_in_chief');
```

### 注销团队成员

```typescript
interactionRouter.unregisterTeamMember('writing', 'writer_1');
```

### 获取团队成员

```typescript
const writingTeam = interactionRouter.getTeamMembers('writing');
console.log('写作团队成员:', writingTeam);
```

## 与消息存储集成

InteractionRouter自动与`messageStore`集成：

```typescript
import { useMessageStore } from '../stores/messageStore';

// 发送的消息会自动添加到存储
await interactionRouter.sendMessage(message);

// 可以从存储中查询消息
const messageStore = useMessageStore.getState();
const allMessages = messageStore.getAllMessages();
const agentMessages = messageStore.getMessagesByAgent('writer_1');
```

## 错误处理

### 订阅回调错误

订阅回调中的错误会被捕获并记录，不会影响其他订阅者：

```typescript
interactionRouter.subscribeToMessages('writer_1', (message) => {
  throw new Error('Callback error');
  // 错误会被记录，但不会中断其他订阅者
});
```

### 反馈请求超时

反馈请求超时会抛出错误：

```typescript
try {
  const feedback = await interactionRouter.requestFeedback(...);
} catch (error) {
  // 处理超时错误
  console.error('Feedback timeout:', error.message);
}
```

### 空团队广播

向空团队广播会记录警告，但不会抛出错误：

```typescript
// 如果writing团队没有成员，会记录警告
await interactionRouter.broadcastToTeam('writing', message);
// Console: "No members found in writing team"
```

## 清理和重置

清理所有订阅和待处理请求：

```typescript
interactionRouter.clear();
```

**清理内容：**
- 所有消息订阅
- 所有待处理的反馈请求（会被拒绝）
- 所有团队成员注册

## 使用模式

### 模式1: UI组件订阅

```typescript
import { useEffect } from 'react';
import { interactionRouter } from '../services/interactionRouter';

function AgentPanel({ agentId }) {
  const [messages, setMessages] = useState([]);
  
  useEffect(() => {
    const unsubscribe = interactionRouter.subscribeToMessages(
      agentId,
      (message) => {
        setMessages(prev => [...prev, message]);
      }
    );
    
    return unsubscribe; // 组件卸载时自动取消订阅
  }, [agentId]);
  
  return <div>{/* 渲染消息 */}</div>;
}
```

### 模式2: Agent行为处理

```typescript
class WriterAgent {
  constructor(private id: string) {
    // 订阅自己的消息
    interactionRouter.subscribeToMessages(this.id, (message) => {
      this.handleMessage(message);
    });
  }
  
  private async handleMessage(message: AgentMessage) {
    switch (message.type) {
      case 'task_assignment':
        await this.handleTaskAssignment(message);
        break;
      case 'feedback_request':
        await this.handleFeedbackRequest(message);
        break;
      case 'revision_request':
        await this.handleRevisionRequest(message);
        break;
    }
  }
  
  private async handleFeedbackRequest(message: AgentMessage) {
    // 处理反馈请求
    const feedback = await this.generateFeedback(message.content);
    
    const response = createMessage(
      'feedback_response',
      this.id,
      message.sender,
      feedback,
      { relatedTaskId: message.metadata.relatedTaskId }
    );
    
    await interactionRouter.sendMessage(response);
  }
}
```

### 模式3: 非线性交互

```typescript
// Agent之间的动态讨论
async function agentDiscussion() {
  // Writer 1发起讨论
  const discussion = createMessage(
    'discussion',
    'writer_1',
    'writer_2',
    '关于引言部分的结构，你有什么想法？'
  );
  await interactionRouter.sendMessage(discussion);
  
  // Writer 2请求Writer 1的反馈
  const feedback = await interactionRouter.requestFeedback(
    'writer_2',
    'writer_1',
    '我觉得应该先介绍背景，你同意吗？'
  );
  
  // Writer 1回复后，Writer 2继续讨论
  const followUp = createMessage(
    'discussion',
    'writer_2',
    'writer_1',
    `好的，我会按照你的建议：${feedback}`
  );
  await interactionRouter.sendMessage(followUp);
}
```

## 性能考虑

### 订阅管理

- 使用`Set`存储订阅者，确保O(1)的添加和删除
- 自动清理空的订阅集合，避免内存泄漏

### 消息路由

- 直接通知订阅者，无需轮询
- 支持多播，一次发送多个接收者

### 反馈请求

- 使用Map存储待处理请求，O(1)查找
- 自动超时清理，防止内存泄漏

## 测试

运行测试：

```bash
npm test interactionRouter.test.ts
```

运行示例：

```bash
npm run example:interaction-router
```

## 相关文档

- [设计文档](../../.kiro/specs/agent-swarm-writing-system/design.md) - 组件和接口 > 3. Interaction Router
- [需求文档](../../.kiro/specs/agent-swarm-writing-system/requirements.md) - 需求3.5, 7.6, 8.6
- [消息类型定义](../types/message.ts)
- [消息存储](../stores/messageStore.ts)

## 未来扩展

计划中的功能：

1. **消息优先级队列** - 根据优先级排序处理消息
2. **消息持久化** - 保存消息历史到磁盘
3. **消息过滤** - 支持基于条件的消息过滤
4. **消息重试** - 失败消息的自动重试机制
5. **消息统计** - 消息流量和性能统计
