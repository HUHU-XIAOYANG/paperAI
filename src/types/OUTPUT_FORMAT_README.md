# AI输出格式规范 (OutputFormat)

## 概述

本文档定义了Agent Swarm写作系统中AI之间通信的标准格式。所有AI生成的输出都必须符合`OutputFormat`规范，以确保系统能够正确解析和传递信息。

## 设计目标

1. **结构化通信**: 提供统一的消息结构，支持系统自动解析和路由
2. **类型安全**: 通过TypeScript类型定义确保编译时类型检查
3. **可扩展性**: 支持附件、标签等扩展字段
4. **可追溯性**: 包含时间戳、优先级等元数据用于追踪和调试

## 核心类型

### MessageType（消息类型）

定义了AI之间可以发送的所有消息类型：

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

### OutputFormat（输出格式）

这是AI必须遵循的标准输出格式：

```typescript
interface OutputFormat {
  messageType: MessageType;
  sender: string;
  receiver: string | string[];
  content: {
    text: string;
    attachments?: Attachment[];
  };
  metadata: {
    timestamp: string;
    requiresResponse: boolean;
    priority: 'low' | 'medium' | 'high';
    tags?: string[];
  };
}
```

#### 字段说明

- **messageType**: 消息类型，必须是`MessageType`枚举中的一个值
- **sender**: 发送者Agent ID，标识消息来源
- **receiver**: 接收者Agent ID，支持单播（string）和多播（string[]）
- **content**: 消息内容对象
  - **text**: 消息文本内容（必需）
  - **attachments**: 可选的附件列表
- **metadata**: 消息元数据
  - **timestamp**: ISO 8601格式的时间戳
  - **requiresResponse**: 是否需要接收者响应
  - **priority**: 消息优先级（low/medium/high）
  - **tags**: 可选的消息标签数组

### AgentMessage（Agent消息）

系统内部使用的消息对象，包含完整的消息信息：

```typescript
interface AgentMessage {
  id: string;
  type: MessageType;
  sender: string;
  receiver: string | string[];
  content: string;
  metadata: MessageMetadata;
  timestamp: Date;
}
```

`AgentMessage`是`OutputFormat`的内部表示，由`FormatParser`解析后生成。

### Attachment（附件）

消息可以携带附件，用于传递引用、数据或代码片段：

```typescript
interface Attachment {
  type: 'reference' | 'data' | 'code';
  content: string;
  source?: string;
}
```

- **reference**: 引用类型附件（如论文引用、URL）
- **data**: 数据类型附件（如表格、统计数据）
- **code**: 代码类型附件（如代码片段、算法）

## 使用示例

### 示例1: 任务分配

Decision AI分配任务给Writer：

```json
{
  "messageType": "task_assignment",
  "sender": "decision_ai",
  "receiver": "writer_1",
  "content": {
    "text": "请撰写论文的引言部分，包括研究背景、问题陈述和论文结构概述。字数要求：800-1000字。"
  },
  "metadata": {
    "timestamp": "2024-01-15T10:00:00Z",
    "requiresResponse": false,
    "priority": "high",
    "tags": ["introduction", "task"]
  }
}
```

### 示例2: 工作提交（带附件）

Writer提交完成的工作：

```json
{
  "messageType": "work_submission",
  "sender": "writer_1",
  "receiver": "supervisor_ai",
  "content": {
    "text": "我已完成引言部分的初稿，包含研究背景、问题陈述和论文结构概述。",
    "attachments": [
      {
        "type": "reference",
        "content": "Smith et al. (2023) 的相关研究",
        "source": "https://example.com/paper"
      }
    ]
  },
  "metadata": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requiresResponse": true,
    "priority": "high",
    "tags": ["introduction", "draft_v1"]
  }
}
```

### 示例3: 反馈请求

Writer请求其他Writer的反馈：

```json
{
  "messageType": "feedback_request",
  "sender": "writer_1",
  "receiver": "writer_2",
  "content": {
    "text": "我在引言中提到了你负责的方法部分，能否提供方法的关键点概要，以便我在引言中准确描述？"
  },
  "metadata": {
    "timestamp": "2024-01-15T10:15:00Z",
    "requiresResponse": true,
    "priority": "medium",
    "tags": ["introduction", "methods", "collaboration"]
  }
}
```

### 示例4: 广播讨论

Editor in Chief向审稿团队广播讨论：

```json
{
  "messageType": "discussion",
  "sender": "editor_in_chief",
  "receiver": ["deputy_editor", "peer_reviewer_1", "peer_reviewer_2"],
  "content": {
    "text": "这篇论文的方法部分存在一些创新性，但实验设计可能不够严谨。请各位审稿专家提供意见。"
  },
  "metadata": {
    "timestamp": "2024-01-15T14:00:00Z",
    "requiresResponse": true,
    "priority": "high",
    "tags": ["review", "methods", "discussion"]
  }
}
```

### 示例5: 修订请求

Supervisor AI要求返工：

```json
{
  "messageType": "revision_request",
  "sender": "supervisor_ai",
  "receiver": "writer_1",
  "content": {
    "text": "引言部分需要补充更多的研究背景。当前版本的背景描述过于简略，建议增加至少2-3段相关研究综述。"
  },
  "metadata": {
    "timestamp": "2024-01-15T11:00:00Z",
    "requiresResponse": false,
    "priority": "high",
    "tags": ["introduction", "revision", "background"]
  }
}
```

## 格式验证

Supervisor AI会验证所有AI输出是否符合`OutputFormat`规范。验证规则包括：

1. **必需字段检查**: 确保所有必需字段都存在
2. **类型检查**: 确保字段类型正确（如messageType必须是有效的MessageType值）
3. **格式检查**: 确保timestamp是有效的ISO 8601格式
4. **逻辑检查**: 确保sender和receiver不为空字符串

如果输出不符合规范，Supervisor AI会：
1. 返回描述性错误信息（`ParseError`）
2. 要求该AI返工
3. 增加该AI的返工计数

## 错误处理

### ParseError（解析错误）

当AI输出不符合格式时，`FormatParser`返回`ParseError`：

```typescript
interface ParseError {
  error: string;
  line?: number;
  column?: number;
  suggestion?: string;
}
```

示例错误：

```json
{
  "error": "缺少必需字段 'messageType'",
  "line": 1,
  "column": 1,
  "suggestion": "请确保输出包含 messageType 字段，值必须是有效的消息类型"
}
```

## 最佳实践

### 1. 使用明确的消息类型

选择最准确的消息类型，避免滥用`discussion`类型：

```typescript
// ✅ 好的做法
{
  messageType: 'feedback_request',
  // ...
}

// ❌ 不好的做法
{
  messageType: 'discussion',  // 应该使用更具体的类型
  // ...
}
```

### 2. 提供有意义的标签

使用标签帮助分类和过滤消息：

```typescript
{
  metadata: {
    tags: ['introduction', 'draft_v1', 'needs_review']
  }
}
```

### 3. 合理设置优先级

根据消息的紧急程度设置优先级：

- **high**: 阻塞性任务、紧急反馈请求
- **medium**: 一般任务、常规讨论
- **low**: 非紧急通知、可选反馈

### 4. 使用附件传递结构化信息

对于引用、数据、代码等结构化信息，使用附件而不是直接嵌入文本：

```typescript
{
  content: {
    text: "我参考了以下研究",
    attachments: [
      {
        type: 'reference',
        content: 'Smith et al. (2023)',
        source: 'https://example.com/paper'
      }
    ]
  }
}
```

### 5. 明确是否需要响应

正确设置`requiresResponse`字段：

```typescript
// 需要响应的消息
{
  messageType: 'feedback_request',
  metadata: {
    requiresResponse: true  // ✅
  }
}

// 不需要响应的消息
{
  messageType: 'task_assignment',
  metadata: {
    requiresResponse: false  // ✅
  }
}
```

## 相关文件

- `src/types/message.ts` - 核心类型定义
- `src/types/message.types.ts` - 解析和处理相关类型
- `src/services/formatParser.ts` - 格式解析器实现（待实现）
- `src/services/interactionRouter.ts` - 交互路由器实现（待实现）

## 参考

- [需求文档 - 需求3: AI输出格式规范](../../.kiro/specs/agent-swarm-writing-system/requirements.md)
- [设计文档 - 数据模型 > 输出格式规范](../../.kiro/specs/agent-swarm-writing-system/design.md)
