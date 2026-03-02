# HTTP客户端和流式响应处理

## 概述

HTTP客户端模块提供了统一的AI服务接口，支持多种AI提供商（OpenAI、Anthropic、自定义），并实现了流式响应处理、重试机制和错误处理。

## 核心组件

### 1. BaseHTTPClient

基础HTTP客户端类，提供：
- HTTP请求执行
- 指数退避重试机制（最多3次重试）
- 超时处理（默认30秒）
- 错误分类和处理

### 2. SSEStreamParser

Server-Sent Events (SSE) 流式响应解析器：
- 解析SSE数据流
- 处理数据块分割
- 识别流结束标记 `[DONE]`

### 3. FormatAdapter

格式适配器接口，支持不同AI服务的请求/响应格式：

#### OpenAIFormatAdapter
- 请求格式：`/chat/completions` 端点
- 消息格式：`messages` 数组
- 流式格式：`delta` 增量内容

#### AnthropicFormatAdapter
- 请求格式：`/messages` 端点
- 系统提示：独立的 `system` 字段
- 必需参数：`max_tokens`
- 流式事件：`content_block_delta`, `message_delta`, `message_stop`

#### CustomFormatAdapter
- 默认使用OpenAI兼容格式
- 支持简化的自定义格式

### 4. AIClientImpl

完整的AI客户端实现：
- 统一的 `sendRequest` 接口
- 自动选择流式/非流式模式
- 连接验证功能
- 网络搜索功能（占位）

## 使用方法

### 基本用法

```typescript
import { createAIClient } from './services/aiClient';
import type { AIClientOptions, AIRequest } from './types/ai-client';

// 1. 创建客户端
const options: AIClientOptions = {
  config: {
    id: 'openai-gpt4',
    name: 'OpenAI GPT-4',
    apiKey: 'sk-proj-...',
    apiUrl: 'https://api.openai.com/v1',
    model: 'gpt-4',
    provider: 'openai',
  },
  retryConfig: {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  },
  timeout: 30000,
};

const client = createAIClient(options);

// 2. 发送非流式请求
const request: AIRequest = {
  prompt: '写一篇关于AI的文章',
  systemPrompt: '你是一个专业的技术写作助手',
  temperature: 0.7,
  maxTokens: 500,
  stream: false,
};

const response = await client.sendRequest(request);
console.log(response.content);
```

### 流式输出

```typescript
// 发送流式请求
const streamRequest: AIRequest = {
  prompt: '写一篇长文章',
  stream: true,
};

const stream = await client.sendRequest(streamRequest);

// 逐块处理输出
for await (const chunk of stream) {
  if (chunk.content) {
    process.stdout.write(chunk.content);
  }
  
  if (chunk.isComplete) {
    console.log('\n完成！');
    console.log('Token使用:', chunk.usage);
  }
}
```

### 使用Anthropic Claude

```typescript
const claudeOptions: AIClientOptions = {
  config: {
    id: 'anthropic-claude',
    name: 'Claude 3',
    apiKey: 'sk-ant-...',
    apiUrl: 'https://api.anthropic.com/v1',
    model: 'claude-3-opus-20240229',
    provider: 'anthropic',
  },
};

const claudeClient = createAIClient(claudeOptions);
```

### 验证连接

```typescript
const isValid = await client.validateConnection(config);
if (isValid) {
  console.log('连接成功！');
} else {
  console.log('连接失败，请检查配置');
}
```

## 错误处理

客户端会抛出 `AIClientError` 类型的错误：

```typescript
try {
  const response = await client.sendRequest(request);
} catch (error: any) {
  switch (error.type) {
    case 'authentication':
      console.error('认证失败: API密钥无效');
      break;
    case 'rate_limit':
      console.error('请求限流: 请求过于频繁');
      break;
    case 'network':
      console.error('网络错误: 无法连接到服务');
      break;
    case 'timeout':
      console.error('请求超时');
      break;
    case 'invalid_request':
      console.error('无效请求:', error.details);
      break;
    case 'server_error':
      console.error('服务器错误');
      break;
  }
}
```

## 重试机制

客户端实现了指数退避重试机制：

- **最大重试次数**: 3次（可配置）
- **初始延迟**: 1秒（可配置）
- **最大延迟**: 10秒（可配置）
- **退避倍数**: 2（可配置）

重试策略：
- ✅ 网络错误 - 可重试
- ✅ 限流错误 (429) - 可重试
- ✅ 服务器错误 (5xx) - 可重试
- ❌ 认证错误 (401/403) - 不可重试
- ❌ 无效请求 (400/422) - 不可重试

## 流式响应格式

### OpenAI格式

```
data: {"choices":[{"delta":{"content":"Hello"}}]}

data: {"choices":[{"delta":{"content":" world"}}]}

data: {"choices":[{"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

### Anthropic格式

```
data: {"type":"content_block_delta","delta":{"text":"Hello"}}

data: {"type":"content_block_delta","delta":{"text":" world"}}

data: {"type":"message_stop"}
```

## 支持的AI提供商

### OpenAI
- 端点: `/chat/completions`
- 认证: `Authorization: Bearer {apiKey}`
- 模型: gpt-4, gpt-3.5-turbo 等

### Anthropic
- 端点: `/messages`
- 认证: `x-api-key: {apiKey}`
- 版本: `anthropic-version: 2023-06-01`
- 模型: claude-3-opus, claude-3-sonnet 等

### 自定义提供商
- 支持OpenAI兼容端点
- 可自定义请求头和格式
- 适用于本地部署模型（如Ollama、LM Studio）

## 性能特性

- **超时控制**: 默认30秒，可配置
- **流式传输**: 实时输出，降低首字节延迟
- **连接复用**: 使用fetch API的连接池
- **错误恢复**: 自动重试临时性错误

## 测试覆盖

单元测试覆盖：
- ✅ 非流式请求（OpenAI、Anthropic）
- ✅ 流式请求和内容累积
- ✅ 错误处理（认证、限流、网络、超时）
- ✅ 重试机制（可重试/不可重试错误）
- ✅ 连接验证
- ✅ 请求参数（systemPrompt、temperature、maxTokens）

## 未来扩展

### 网络搜索集成
当前 `performWebSearch` 是占位实现，计划集成：
- Tavily Search API
- SerpAPI
- Google Custom Search
- Bing Search API

### 工具调用支持
扩展 `AITool` 支持：
- 函数调用（Function Calling）
- 代码执行
- 文件操作
- 数据库查询

### 缓存机制
- 响应缓存
- 提示词缓存
- 减少重复请求

## 相关文件

- `src/services/httpClient.ts` - 基础HTTP客户端和SSE解析器
- `src/services/formatAdapters.ts` - 格式适配器
- `src/services/aiClient.ts` - AI客户端实现
- `src/services/aiClient.test.ts` - 单元测试
- `src/services/aiClient.example.ts` - 使用示例
- `src/types/ai-client.ts` - 类型定义

## 需求映射

- ✅ 需求 2.4: 支持配置多个不同的AI服务
- ✅ 需求 17.1: 配置流式输出模式
- ✅ 需求 17.2: 实时逐步显示输出内容
- 🔄 需求 18.1, 18.2, 18.3: 联网功能（占位实现）
