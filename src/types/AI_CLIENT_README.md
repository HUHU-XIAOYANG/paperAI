# AI客户端类型定义文档

## 概述

本文档描述了AI客户端的接口和类型定义。AI客户端提供统一的接口来访问多种AI服务提供商（OpenAI、Anthropic、自定义），支持流式和非流式响应、连接验证和网络搜索功能。

## 核心接口

### AIClient

统一的AI服务客户端接口。

```typescript
interface AIClient {
  sendRequest(request: AIRequest): Promise<AIResponse | AsyncIterable<StreamChunk>>;
  validateConnection(config: AIServiceConfig): Promise<boolean>;
  performWebSearch(query: string): Promise<SearchResult[]>;
}
```

**方法说明：**

- `sendRequest`: 发送AI请求，支持流式和非流式输出
- `validateConnection`: 验证AI服务连接是否有效
- `performWebSearch`: 执行网络搜索并返回结果

## 请求和响应类型

### AIRequest

AI请求参数。

```typescript
interface AIRequest {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: AITool[];
}
```

**字段说明：**

- `prompt`: 用户提示词（必需）
- `systemPrompt`: 系统提示词（可选）
- `temperature`: 温度参数，范围0-2（可选）
- `maxTokens`: 最大生成token数（可选）
- `stream`: 是否使用流式输出（可选，默认false）
- `tools`: 可用工具列表（可选）

### AIResponse

非流式AI响应。

```typescript
interface AIResponse {
  content: string;
  usage: TokenUsage;
  finishReason: FinishReason;
}
```

**字段说明：**

- `content`: AI生成的内容
- `usage`: Token使用统计
- `finishReason`: 完成原因（stop、length、content_filter、tool_calls、error）

### StreamChunk

流式响应数据块。

```typescript
interface StreamChunk {
  content: string;
  isComplete: boolean;
  usage?: TokenUsage;
  finishReason?: FinishReason;
}
```

**字段说明：**

- `content`: 增量内容
- `isComplete`: 是否完成
- `usage`: Token使用统计（仅在完成时提供）
- `finishReason`: 完成原因（仅在完成时提供）

## 工具类型

### AITool

AI工具配置。

```typescript
interface AITool {
  type: AIToolType;
  enabled: boolean;
}

type AIToolType = 'web_search' | 'code_execution';
```

**支持的工具类型：**

- `web_search`: 网络搜索
- `code_execution`: 代码执行

## 搜索功能

### SearchResult

搜索结果。

```typescript
interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source?: string;
  publishedDate?: Date;
}
```

### SearchQueryRecord

搜索查询记录。

```typescript
interface SearchQueryRecord {
  id: string;
  query: string;
  timestamp: Date;
  results: SearchResult[];
  agentId?: string;
}
```

## 错误处理

### AIClientError

AI客户端错误。

```typescript
interface AIClientError {
  type: AIClientErrorType;
  message: string;
  statusCode?: number;
  retryable: boolean;
  details?: unknown;
}

type AIClientErrorType = 
  | 'network'
  | 'authentication'
  | 'rate_limit'
  | 'invalid_request'
  | 'server_error'
  | 'timeout'
  | 'unknown';
```

**错误类型说明：**

- `network`: 网络连接错误
- `authentication`: 认证失败（API密钥无效）
- `rate_limit`: 请求限流
- `invalid_request`: 无效的请求参数
- `server_error`: 服务器内部错误
- `timeout`: 请求超时
- `unknown`: 未知错误

## 重试机制

### RetryConfig

重试配置。

```typescript
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};
```

**字段说明：**

- `maxRetries`: 最大重试次数（默认3次）
- `initialDelay`: 初始延迟（默认1秒）
- `maxDelay`: 最大延迟（默认10秒）
- `backoffMultiplier`: 指数退避倍数（默认2）

## 提供商特定配置

### OpenAIConfig

```typescript
interface OpenAIConfig {
  organizationId?: string;
  apiVersion?: string;
}
```

### AnthropicConfig

```typescript
interface AnthropicConfig {
  apiVersion?: string;
}
```

### CustomProviderConfig

```typescript
interface CustomProviderConfig {
  headers?: Record<string, string>;
  requestFormat?: 'openai' | 'anthropic' | 'custom';
  responseFormat?: 'openai' | 'anthropic' | 'custom';
}
```

## 客户端选项

### AIClientOptions

```typescript
interface AIClientOptions {
  config: AIServiceConfig;
  retryConfig?: RetryConfig;
  timeout?: number;
  providerConfig?: ProviderSpecificConfig;
}
```

**字段说明：**

- `config`: AI服务配置（必需）
- `retryConfig`: 重试配置（可选）
- `timeout`: 请求超时时间（毫秒，可选）
- `providerConfig`: 提供商特定配置（可选）

## 使用示例

### 非流式请求

```typescript
const client: AIClient = createAIClient(options);

const request: AIRequest = {
  prompt: "写一篇关于人工智能的文章",
  systemPrompt: "你是一个专业的技术写作助手",
  temperature: 0.7,
  maxTokens: 2000,
  stream: false,
};

const response = await client.sendRequest(request) as AIResponse;
console.log(response.content);
console.log(`使用了 ${response.usage.totalTokens} 个tokens`);
```

### 流式请求

```typescript
const request: AIRequest = {
  prompt: "写一篇关于人工智能的文章",
  stream: true,
};

const stream = await client.sendRequest(request) as AsyncIterable<StreamChunk>;

for await (const chunk of stream) {
  process.stdout.write(chunk.content);
  
  if (chunk.isComplete) {
    console.log(`\n完成！使用了 ${chunk.usage?.totalTokens} 个tokens`);
  }
}
```

### 验证连接

```typescript
const config: AIServiceConfig = {
  id: 'openai-1',
  name: 'OpenAI GPT-4',
  apiKey: 'sk-...',
  apiUrl: 'https://api.openai.com/v1',
  model: 'gpt-4',
  provider: 'openai',
};

const isValid = await client.validateConnection(config);
if (isValid) {
  console.log('连接成功！');
} else {
  console.log('连接失败，请检查配置');
}
```

### 网络搜索

```typescript
const results = await client.performWebSearch('最新的AI研究进展');

results.forEach(result => {
  console.log(`标题: ${result.title}`);
  console.log(`URL: ${result.url}`);
  console.log(`摘要: ${result.snippet}`);
  console.log('---');
});
```

### 使用工具

```typescript
const request: AIRequest = {
  prompt: "搜索最新的机器学习论文并总结",
  tools: [
    { type: 'web_search', enabled: true }
  ],
};

const response = await client.sendRequest(request) as AIResponse;
console.log(response.content);
```

## 错误处理示例

```typescript
try {
  const response = await client.sendRequest(request);
  // 处理响应
} catch (error) {
  const aiError = error as AIClientError;
  
  switch (aiError.type) {
    case 'authentication':
      console.error('API密钥无效，请检查配置');
      break;
    case 'rate_limit':
      console.error('请求过于频繁，请稍后重试');
      break;
    case 'network':
      console.error('网络连接失败');
      if (aiError.retryable) {
        // 可以重试
      }
      break;
    default:
      console.error(`未知错误: ${aiError.message}`);
  }
}
```

## 设计原则

1. **统一接口**: 所有AI提供商使用相同的接口，便于切换
2. **流式支持**: 原生支持流式输出，提供实时反馈
3. **错误处理**: 明确的错误类型和重试机制
4. **类型安全**: 完整的TypeScript类型定义
5. **扩展性**: 支持提供商特定配置和自定义工具

## 相关需求

- 需求 2.4: AI配置管理 - 支持配置多个不同的AI服务
- 需求 17.1, 17.2: 流式输出显示
- 需求 18.1, 18.2, 18.3: AI联网功能

## 下一步

实现具体的AI客户端类（Task 5.2），包括：

1. HTTP客户端和流式响应处理
2. 不同AI服务的响应格式适配
3. 错误处理和重试逻辑
4. 网络搜索功能集成
