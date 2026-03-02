# StreamHandler - 流式输出处理器

## 概述

StreamHandler是Agent Swarm写作系统的核心组件，负责管理AI的流式输出。它为每个AI创建独立的流式会话，处理数据缓冲，并提供订阅机制供UI组件实时接收和显示AI的输出内容。

## 核心功能

### 1. 会话管理
- 为每个AI创建独立的流式会话
- 跟踪会话状态（活跃/非活跃）
- 防止同一Agent同时拥有多个活跃会话
- 支持会话查询和清理

### 2. 数据处理
- 接收并缓冲流式数据块
- 累积完整的输出内容
- 保持数据完整性和顺序

### 3. 订阅机制
- 支持多个订阅者监听同一流
- 新订阅者立即接收已有缓冲内容
- 提供取消订阅功能
- 错误隔离（单个订阅者错误不影响其他订阅者）

### 4. 状态指示
- 实时通知订阅者数据到达
- 明确标记流式输出完成状态
- 支持查询会话活跃状态

## API文档

### 类: StreamHandler

#### 构造函数

```typescript
const handler = new StreamHandler();
```

创建一个新的StreamHandler实例。

#### 方法

##### startStream(agentId: string): StreamSession

开始一个新的流式输出会话。

**参数:**
- `agentId` - Agent的唯一标识符

**返回:**
- `StreamSession` - 创建的会话对象

**抛出:**
- 如果该Agent已有活跃会话，抛出错误

**示例:**
```typescript
const session = handler.startStream('writer_1');
console.log(`Session ID: ${session.id}`);
```

##### handleStreamChunk(sessionId: string, chunk: string): void

处理接收到的流式数据块。

**参数:**
- `sessionId` - 流式会话ID
- `chunk` - 接收到的数据块

**抛出:**
- 如果会话不存在或已结束，抛出错误

**示例:**
```typescript
handler.handleStreamChunk(session.id, 'Hello ');
handler.handleStreamChunk(session.id, 'World');
```

##### endStream(sessionId: string): void

结束流式输出会话。

**参数:**
- `sessionId` - 流式会话ID

**抛出:**
- 如果会话不存在，抛出错误

**示例:**
```typescript
handler.endStream(session.id);
```

##### subscribeToStream(sessionId: string, callback: StreamCallback): () => void

订阅流式输出。

**参数:**
- `sessionId` - 流式会话ID
- `callback` - 回调函数 `(chunk: string, isComplete: boolean) => void`

**返回:**
- 取消订阅的函数

**抛出:**
- 如果会话不存在，抛出错误

**示例:**
```typescript
const unsubscribe = handler.subscribeToStream(session.id, (chunk, isComplete) => {
  if (isComplete) {
    console.log('Stream completed');
  } else {
    console.log('Received:', chunk);
  }
});

// 稍后取消订阅
unsubscribe();
```

##### getSession(sessionId: string): StreamSession | undefined

获取流式会话对象。

**参数:**
- `sessionId` - 流式会话ID

**返回:**
- `StreamSession` 对象，如果不存在则返回 `undefined`

**示例:**
```typescript
const session = handler.getSession('stream_writer_1_123');
if (session) {
  console.log(`Buffer: ${session.buffer}`);
}
```

##### getActiveSessionByAgent(agentId: string): StreamSession | undefined

获取Agent的活跃会话。

**参数:**
- `agentId` - Agent的唯一标识符

**返回:**
- `StreamSession` 对象，如果没有活跃会话则返回 `undefined`

**示例:**
```typescript
const session = handler.getActiveSessionByAgent('writer_1');
if (session) {
  console.log(`Active session: ${session.id}`);
}
```

##### getActiveSessions(): StreamSession[]

获取所有活跃会话。

**返回:**
- `StreamSession` 数组

**示例:**
```typescript
const activeSessions = handler.getActiveSessions();
console.log(`Active sessions: ${activeSessions.length}`);
```

##### cleanupInactiveSessions(): number

清理已结束的会话。

**返回:**
- 清理的会话数量

**示例:**
```typescript
const cleaned = handler.cleanupInactiveSessions();
console.log(`Cleaned up ${cleaned} sessions`);
```

##### clearAllSessions(): void

清理所有会话（包括活跃和非活跃的）。

**示例:**
```typescript
handler.clearAllSessions();
```

## 数据类型

### StreamSession

```typescript
interface StreamSession {
  id: string;              // 会话唯一标识符
  agentId: string;         // 关联的Agent ID
  startTime: Date;         // 会话开始时间
  buffer: string;          // 输出缓冲区
  isActive: boolean;       // 会话是否活跃
}
```

### StreamCallback

```typescript
type StreamCallback = (chunk: string, isComplete: boolean) => void;
```

回调函数参数:
- `chunk` - 新接收到的数据块（如果 `isComplete` 为 `true`，则为空字符串）
- `isComplete` - 流式输出是否已完成

## 使用场景

### 场景1: 基本流式输出

```typescript
// 1. 创建handler
const handler = new StreamHandler();

// 2. 开始会话
const session = handler.startStream('writer_1');

// 3. 订阅输出
handler.subscribeToStream(session.id, (chunk, isComplete) => {
  if (isComplete) {
    console.log('✓ Completed');
  } else {
    console.log('Received:', chunk);
  }
});

// 4. 处理数据块
handler.handleStreamChunk(session.id, 'Hello ');
handler.handleStreamChunk(session.id, 'World');

// 5. 结束会话
handler.endStream(session.id);
```

### 场景2: UI组件集成

```typescript
// React组件示例
function AgentOutputPanel({ agentId }: { agentId: string }) {
  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    // 获取或创建会话
    let session = streamHandler.getActiveSessionByAgent(agentId);
    if (!session) {
      session = streamHandler.startStream(agentId);
    }

    setIsStreaming(true);

    // 订阅流式输出
    const unsubscribe = streamHandler.subscribeToStream(
      session.id,
      (chunk, isComplete) => {
        if (isComplete) {
          setIsStreaming(false);
        } else {
          setContent(prev => prev + chunk);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [agentId]);

  return (
    <div>
      <div>{content}</div>
      {isStreaming && <Spinner />}
    </div>
  );
}
```

### 场景3: 多个并发流

```typescript
// 同时处理多个Agent的流式输出
const agents = ['writer_1', 'writer_2', 'reviewer_1'];

agents.forEach(agentId => {
  const session = handler.startStream(agentId);
  
  handler.subscribeToStream(session.id, (chunk, isComplete) => {
    console.log(`[${agentId}] ${chunk || '[complete]'}`);
  });
});

// 交错发送数据
handler.handleStreamChunk(sessions[0].id, 'Writer 1 output');
handler.handleStreamChunk(sessions[1].id, 'Writer 2 output');
handler.handleStreamChunk(sessions[2].id, 'Reviewer output');
```

### 场景4: 晚加入的订阅者

```typescript
const session = handler.startStream('writer_1');

// 先发送一些数据
handler.handleStreamChunk(session.id, 'Part 1. ');
handler.handleStreamChunk(session.id, 'Part 2. ');

// 晚加入的订阅者会立即收到已有内容
handler.subscribeToStream(session.id, (chunk, isComplete) => {
  console.log('Late subscriber received:', chunk);
  // 输出: "Late subscriber received: Part 1. Part 2. "
});

// 继续发送新数据
handler.handleStreamChunk(session.id, 'Part 3.');
// 输出: "Late subscriber received: Part 3."
```

## 最佳实践

### 1. 会话生命周期管理

```typescript
// ✓ 好的做法：确保会话正确结束
const session = handler.startStream('writer_1');
try {
  // 处理流式输出
  handler.handleStreamChunk(session.id, 'data');
} finally {
  // 确保会话被结束
  handler.endStream(session.id);
}
```

### 2. 错误处理

```typescript
// ✓ 好的做法：捕获并处理错误
try {
  handler.handleStreamChunk(sessionId, chunk);
} catch (error) {
  console.error('Failed to handle stream chunk:', error);
  // 通知用户或重试
}
```

### 3. 内存管理

```typescript
// ✓ 好的做法：定期清理非活跃会话
setInterval(() => {
  const cleaned = handler.cleanupInactiveSessions();
  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} inactive sessions`);
  }
}, 60000); // 每分钟清理一次
```

### 4. 订阅清理

```typescript
// ✓ 好的做法：组件卸载时取消订阅
useEffect(() => {
  const unsubscribe = handler.subscribeToStream(sessionId, callback);
  
  return () => {
    unsubscribe(); // 清理订阅
  };
}, [sessionId]);
```

### 5. 多订阅者场景

```typescript
// ✓ 好的做法：为不同目的创建独立订阅
// UI显示订阅
const unsubscribeUI = handler.subscribeToStream(sessionId, (chunk) => {
  updateDisplay(chunk);
});

// 日志记录订阅
const unsubscribeLog = handler.subscribeToStream(sessionId, (chunk) => {
  logToFile(chunk);
});

// 分析订阅
const unsubscribeAnalytics = handler.subscribeToStream(sessionId, (chunk) => {
  analyzeContent(chunk);
});
```

## 性能考虑

### 1. 缓冲区大小

StreamHandler会累积所有接收到的数据块。对于长时间运行的流，缓冲区可能会变得很大。建议：

- 定期清理已完成的会话
- 对于超长输出，考虑分段处理
- 监控内存使用情况

### 2. 订阅者数量

每个会话可以有多个订阅者。大量订阅者会影响性能。建议：

- 限制每个会话的订阅者数量
- 使用事件聚合减少重复处理
- 及时取消不需要的订阅

### 3. 并发会话

系统可以同时处理多个流式会话。建议：

- 监控活跃会话数量
- 设置合理的并发限制
- 优先处理高优先级Agent的流

## 错误处理

StreamHandler会在以下情况抛出错误：

1. **会话不存在**: 尝试操作不存在的会话
2. **会话已结束**: 尝试向已结束的会话发送数据
3. **重复会话**: 尝试为已有活跃会话的Agent创建新会话

所有错误都应该被捕获并适当处理：

```typescript
try {
  handler.handleStreamChunk(sessionId, chunk);
} catch (error) {
  if (error.message.includes('not found')) {
    // 会话不存在，可能需要重新创建
  } else if (error.message.includes('not active')) {
    // 会话已结束，停止发送数据
  } else {
    // 其他错误
  }
}
```

## 测试

StreamHandler包含完整的单元测试套件，覆盖：

- 会话创建和管理
- 数据块处理
- 订阅机制
- 错误处理
- 并发场景
- 内存清理

运行测试：

```bash
npm test streamHandler.test.ts
```

## 相关文档

- [设计文档](../../.kiro/specs/agent-swarm-writing-system/design.md) - 组件和接口 > Stream Handler
- [需求文档](../../.kiro/specs/agent-swarm-writing-system/requirements.md) - 需求17: 流式输出显示
- [类型定义](../types/message.types.ts) - StreamSession和StreamCallback类型
- [使用示例](./streamHandler.example.ts) - 完整的使用示例代码

## 版本历史

- **v1.0.0** - 初始实现
  - 基本流式会话管理
  - 订阅机制
  - 数据缓冲
  - 会话清理功能
