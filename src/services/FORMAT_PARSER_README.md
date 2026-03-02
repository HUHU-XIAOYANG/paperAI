# FormatParser - AI输出格式解析器

## 概述

FormatParser是Agent Swarm写作系统的核心服务之一，负责AI输出格式的解析、格式化和验证。它确保所有AI之间的通信都符合统一的`OutputFormat`规范，是系统消息传递的基础设施。

## 功能特性

### 1. 解析 (parse)

将AI输出的JSON字符串解析为结构化的`ParsedMessage`对象。

**功能**:
- 解析符合`OutputFormat`规范的JSON字符串
- 提取所有必需字段（类型、发送者、接收者、内容、元数据）
- 验证字段完整性和有效性
- 返回描述性错误信息（如果解析失败）

**使用场景**:
- Supervisor AI验证AI输出格式
- InteractionRouter处理AI消息
- 系统接收和处理AI生成的内容

### 2. 格式化 (format)

将系统内部的`AgentMessage`对象格式化为符合`OutputFormat`规范的JSON字符串。

**功能**:
- 将`AgentMessage`转换为`OutputFormat`
- 生成格式良好的JSON字符串
- 确保输出可以被`parse`方法重新解析

**使用场景**:
- 生成AI提示词中的示例输出
- 导出消息历史
- 测试和调试

### 3. 验证 (validate)

验证AI输出字符串是否符合`OutputFormat`规范。

**功能**:
- 检查JSON格式有效性
- 验证必需字段存在
- 验证字段类型正确
- 验证字段值有效
- 返回详细的错误和警告列表

**使用场景**:
- Supervisor AI质量检查
- 开发和调试阶段的格式验证
- 自动化测试

## 核心类型

### ParsedMessage

解析后的消息对象：

```typescript
interface ParsedMessage {
  type: MessageType;
  sender: string;
  receiver: string | string[];
  content: string;
  metadata: MessageMetadata;
}
```

### ParseError

解析错误对象：

```typescript
interface ParseError {
  error: string;
  line?: number;
  column?: number;
  suggestion?: string;
}
```

### ValidationResult

验证结果对象：

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
```

## 使用示例

### 基本用法

```typescript
import { FormatParser } from './services/formatParser';

const parser = new FormatParser();

// 解析AI输出
const aiOutput = `{
  "messageType": "work_submission",
  "sender": "writer_1",
  "receiver": "supervisor_ai",
  "content": {
    "text": "我已完成引言部分的初稿"
  },
  "metadata": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requiresResponse": true,
    "priority": "high"
  }
}`;

const result = parser.parse(aiOutput);

if ('error' in result) {
  console.error('解析失败:', result.error);
} else {
  console.log('消息类型:', result.type);
  console.log('发送者:', result.sender);
  console.log('内容:', result.content);
}
```

### 格式化消息

```typescript
import { FormatParser } from './services/formatParser';
import type { AgentMessage } from './types/message';

const parser = new FormatParser();

const message: AgentMessage = {
  id: '123',
  type: 'feedback_request',
  sender: 'writer_1',
  receiver: 'writer_2',
  content: '能否提供方法的关键点概要？',
  metadata: {
    priority: 'medium',
    requiresResponse: true,
    timestamp: '2024-01-15T10:15:00Z'
  },
  timestamp: new Date()
};

const formatted = parser.format(message);
console.log(formatted); // 输出格式化的JSON字符串
```

### 验证输出格式

```typescript
import { FormatParser } from './services/formatParser';

const parser = new FormatParser();

const aiOutput = `{ ... }`;

const validation = parser.validate(aiOutput);

if (validation.isValid) {
  console.log('✅ 格式正确');
} else {
  console.error('❌ 格式错误:');
  validation.errors.forEach(error => {
    console.error(`  - ${error}`);
  });
}

if (validation.warnings.length > 0) {
  console.warn('⚠️ 警告:');
  validation.warnings.forEach(warning => {
    console.warn(`  - ${warning}`);
  });
}
```

### Supervisor AI集成示例

```typescript
import { FormatParser } from './services/formatParser';

const parser = new FormatParser();

function supervisorValidateOutput(aiOutput: string): boolean {
  // 验证格式
  const validation = parser.validate(aiOutput);
  
  if (!validation.isValid) {
    console.log('❌ 输出格式不符合规范');
    validation.errors.forEach(error => {
      console.log(`  - ${error}`);
    });
    return false;
  }
  
  // 解析内容
  const parsed = parser.parse(aiOutput);
  
  if ('error' in parsed) {
    console.log('❌ 解析失败:', parsed.error);
    return false;
  }
  
  console.log('✅ 输出格式正确');
  return true;
}
```

## 验证规则

FormatParser执行以下验证规则：

### 必需字段

所有以下字段必须存在：
- `messageType`: 消息类型
- `sender`: 发送者ID
- `receiver`: 接收者ID（单个或数组）
- `content`: 消息内容对象
- `content.text`: 消息文本内容
- `metadata`: 消息元数据
- `metadata.timestamp`: 时间戳
- `metadata.requiresResponse`: 是否需要响应
- `metadata.priority`: 优先级

### 字段类型

- `messageType`: 必须是有效的`MessageType`值
- `sender`: 必须是非空字符串
- `receiver`: 必须是非空字符串或非空字符串数组
- `content.text`: 必须是字符串
- `metadata.timestamp`: 必须是有效的ISO 8601格式
- `metadata.requiresResponse`: 必须是布尔值
- `metadata.priority`: 必须是'low'、'medium'或'high'
- `metadata.tags`: 如果存在，必须是数组
- `content.attachments`: 如果存在，必须是数组

### 字段值

- `sender`不能是空字符串或仅包含空白字符
- `receiver`不能是空字符串、空数组或包含空字符串的数组
- `messageType`必须是以下之一：
  - `task_assignment`
  - `work_submission`
  - `feedback_request`
  - `feedback_response`
  - `discussion`
  - `revision_request`
  - `approval`
  - `rejection`
- `metadata.priority`必须是以下之一：
  - `low`
  - `medium`
  - `high`

### 警告条件

以下情况会产生警告（但不会导致验证失败）：
- `content.text`为空字符串

## 错误处理

FormatParser提供详细的错误信息，帮助快速定位问题：

### JSON解析错误

```typescript
{
  error: "JSON解析失败: Unexpected token ...",
  suggestion: "请确保输出是有效的JSON格式"
}
```

### 缺少必需字段

```typescript
{
  error: "格式验证失败: 缺少必需字段 \"messageType\", 缺少必需字段 \"sender\"",
  suggestion: "请确保输出包含所有必需字段并符合OutputFormat规范"
}
```

### 无效字段值

```typescript
{
  error: "格式验证失败: 无效的messageType: \"invalid_type\"",
  suggestion: "请确保输出包含所有必需字段并符合OutputFormat规范"
}
```

## 性能考虑

### 解析性能

- 使用原生`JSON.parse`进行解析，性能优异
- 验证逻辑简单高效，适合高频调用
- 支持处理大型消息（测试通过10,000字符内容）

### 内存使用

- 解析过程不创建额外的大型对象
- 格式化使用`JSON.stringify`，内存效率高
- 适合处理大量并发消息

## 测试覆盖

FormatParser包含全面的单元测试：

- ✅ 29个测试用例全部通过
- ✅ 覆盖所有核心功能（parse、format、validate）
- ✅ 测试所有验证规则
- ✅ 测试错误处理
- ✅ 测试边缘情况（特殊字符、长内容、Unicode）
- ✅ 测试往返属性（round-trip）

运行测试：

```bash
npm test formatParser.test.ts
```

## 往返属性 (Round-trip Property)

FormatParser满足往返属性：

```typescript
// 对于任意有效的AgentMessage
const message: AgentMessage = { ... };

// format -> parse -> format 应该产生等价的输出
const formatted1 = parser.format(message);
const parsed = parser.parse(formatted1);
const formatted2 = parser.format(reconstructMessage(parsed));

// formatted1 和 formatted2 应该等价（忽略ID等非关键字段）
```

这确保了消息在系统中传递时不会丢失信息。

## 与其他组件的集成

### Supervisor AI

Supervisor AI使用FormatParser验证所有AI输出：

```typescript
import { formatParser } from './services/formatParser';

class SupervisorAI {
  validateOutput(aiOutput: string): boolean {
    const validation = formatParser.validate(aiOutput);
    
    if (!validation.isValid) {
      // 要求AI返工
      this.requestRevision(validation.errors);
      return false;
    }
    
    return true;
  }
}
```

### InteractionRouter

InteractionRouter使用FormatParser解析消息：

```typescript
import { formatParser } from './services/formatParser';

class InteractionRouter {
  async sendMessage(aiOutput: string): Promise<void> {
    const parsed = formatParser.parse(aiOutput);
    
    if ('error' in parsed) {
      throw new Error(`消息解析失败: ${parsed.error}`);
    }
    
    // 路由消息到接收者
    await this.routeMessage(parsed);
  }
}
```

## 扩展和自定义

### 添加新的消息类型

如果需要添加新的消息类型：

1. 在`src/types/message.ts`中更新`MessageType`枚举
2. 在`formatParser.ts`的`validateOutputFormat`方法中更新`validMessageTypes`数组
3. 添加相应的测试用例

### 自定义验证规则

如果需要添加自定义验证规则，可以扩展`validateOutputFormat`方法：

```typescript
private validateOutputFormat(format: any): ValidationResult {
  // ... 现有验证逻辑 ...
  
  // 添加自定义验证
  if (format.messageType === 'work_submission') {
    if (!format.content.text || format.content.text.length < 10) {
      warnings.push('工作提交的内容过短');
    }
  }
  
  return { isValid: errors.length === 0, errors, warnings };
}
```

## 相关文档

- [OutputFormat规范](../types/OUTPUT_FORMAT_README.md) - AI输出格式的详细说明
- [需求文档 - 需求3](../../.kiro/specs/agent-swarm-writing-system/requirements.md) - AI输出格式规范需求
- [需求文档 - 需求16](../../.kiro/specs/agent-swarm-writing-system/requirements.md) - AI输出格式解析器需求
- [设计文档](../../.kiro/specs/agent-swarm-writing-system/design.md) - 系统整体设计

## 示例文件

查看`src/services/formatParser.example.ts`获取更多使用示例。

运行示例：

```bash
npx tsx src/services/formatParser.example.ts
```

## 总结

FormatParser是Agent Swarm写作系统的关键基础设施，提供：

- ✅ 可靠的AI输出解析
- ✅ 统一的消息格式化
- ✅ 全面的格式验证
- ✅ 详细的错误信息
- ✅ 高性能和低内存占用
- ✅ 完整的测试覆盖

通过FormatParser，系统能够确保所有AI之间的通信都符合统一规范，为多智能体协作提供坚实的基础。
