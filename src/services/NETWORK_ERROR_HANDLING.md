# 网络错误处理和重试机制
# Network Error Handling and Retry Mechanism

## 概述 Overview

本文档描述了HTTP客户端的网络错误处理和重试机制实现。该机制确保系统能够优雅地处理各种网络错误，并在适当的情况下自动重试失败的请求。

This document describes the network error handling and retry mechanism implementation in the HTTP client. This mechanism ensures the system can gracefully handle various network errors and automatically retry failed requests when appropriate.

## 错误分类 Error Classification

系统将错误分为以下类型：

The system classifies errors into the following types:

### 1. 认证错误 (Authentication Errors)
- **HTTP状态码**: 401 (Unauthorized), 403 (Forbidden)
- **可重试**: ❌ 否 (No)
- **原因**: 认证错误通常表示API密钥无效或权限不足，重试不会改变结果
- **处理**: 立即失败，提示用户检查API配置

### 2. 限流错误 (Rate Limit Errors)
- **HTTP状态码**: 429 (Too Many Requests)
- **可重试**: ✅ 是 (Yes)
- **原因**: 请求频率超过API限制，等待后可能成功
- **处理**: 使用指数退避重试，最多3次

### 3. 无效请求错误 (Invalid Request Errors)
- **HTTP状态码**: 400 (Bad Request), 404 (Not Found), 422 (Unprocessable Entity)
- **可重试**: ❌ 否 (No)
- **原因**: 请求参数或格式错误，重试不会改变结果
- **处理**: 立即失败，返回详细错误信息

### 4. 服务器错误 (Server Errors)
- **HTTP状态码**: 500 (Internal Server Error), 502 (Bad Gateway), 503 (Service Unavailable), 504 (Gateway Timeout)
- **可重试**: ✅ 是 (Yes)
- **原因**: 服务器临时故障，重试可能成功
- **处理**: 使用指数退避重试，最多3次

### 5. 网络错误 (Network Errors)
- **错误类型**: TypeError (网络连接失败)
- **可重试**: ✅ 是 (Yes)
- **原因**: 网络连接问题，重试可能成功
- **处理**: 使用指数退避重试，最多3次

### 6. 超时错误 (Timeout Errors)
- **错误类型**: AbortError (请求超时)
- **可重试**: ✅ 是 (Yes)
- **原因**: 请求响应时间过长，重试可能成功
- **处理**: 使用指数退避重试，最多3次
- **默认超时**: 30秒

## 重试机制 Retry Mechanism

### 配置 Configuration

```typescript
interface RetryConfig {
  maxRetries: number;        // 最大重试次数 (默认: 3)
  initialDelay: number;      // 初始延迟毫秒数 (默认: 1000ms)
  maxDelay: number;          // 最大延迟毫秒数 (默认: 10000ms)
  backoffMultiplier: number; // 退避倍数 (默认: 2)
}
```

### 指数退避算法 Exponential Backoff Algorithm

重试延迟使用指数退避算法计算：

```
delay = min(initialDelay * (backoffMultiplier ^ retryCount), maxDelay)
```

**示例 Example:**
- 第1次重试: 1000ms * 2^0 = 1000ms (1秒)
- 第2次重试: 1000ms * 2^1 = 2000ms (2秒)
- 第3次重试: 1000ms * 2^2 = 4000ms (4秒)

### 重试流程 Retry Flow

```
请求 → 失败 → 检查错误类型
              ↓
         可重试? 
         ↙     ↘
       是        否
       ↓         ↓
   检查重试次数  立即失败
       ↓
   < maxRetries?
   ↙         ↘
  是          否
  ↓           ↓
等待延迟    最终失败
  ↓
重新请求
```

## 使用示例 Usage Examples

### 基本使用 Basic Usage

```typescript
import { BaseHTTPClient } from './httpClient';
import type { AIClientOptions } from '../types/ai-client';

// 创建客户端
const client = new BaseHTTPClient({
  config: {
    name: 'openai',
    apiKey: 'your-api-key',
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
});

// 发送请求（自动处理错误和重试）
try {
  const response = await client.fetchWithRetry(
    'https://api.openai.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    }
  );
  
  const data = await response.json();
  console.log(data);
} catch (error) {
  // 错误已经过重试处理
  if (error.type === 'authentication') {
    console.error('认证失败，请检查API密钥');
  } else if (error.type === 'rate_limit') {
    console.error('请求频率过高，请稍后再试');
  } else {
    console.error('请求失败:', error.message);
  }
}
```

### 自定义重试配置 Custom Retry Configuration

```typescript
// 更激进的重试策略（适用于关键请求）
const aggressiveClient = new BaseHTTPClient({
  config: myConfig,
  retryConfig: {
    maxRetries: 5,        // 更多重试次数
    initialDelay: 500,    // 更短的初始延迟
    maxDelay: 30000,      // 更长的最大延迟
    backoffMultiplier: 2,
  },
  timeout: 60000,         // 更长的超时时间
});

// 保守的重试策略（适用于非关键请求）
const conservativeClient = new BaseHTTPClient({
  config: myConfig,
  retryConfig: {
    maxRetries: 1,        // 只重试一次
    initialDelay: 2000,   // 更长的初始延迟
    maxDelay: 5000,
    backoffMultiplier: 2,
  },
  timeout: 10000,         // 更短的超时时间
});

// 禁用重试（用于测试或特殊场景）
const noRetryClient = new BaseHTTPClient({
  config: myConfig,
  retryConfig: {
    maxRetries: 0,        // 不重试
    initialDelay: 0,
    maxDelay: 0,
    backoffMultiplier: 1,
  },
});
```

## 错误处理最佳实践 Error Handling Best Practices

### 1. 区分错误类型 Distinguish Error Types

```typescript
try {
  const response = await client.fetchWithRetry(url, options);
  // 处理成功响应
} catch (error) {
  if (error.type === 'authentication') {
    // 认证错误：提示用户更新API密钥
    showAuthenticationError();
  } else if (error.type === 'rate_limit') {
    // 限流错误：提示用户稍后再试
    showRateLimitError();
  } else if (error.type === 'timeout') {
    // 超时错误：提示用户检查网络或增加超时时间
    showTimeoutError();
  } else if (error.type === 'network') {
    // 网络错误：提示用户检查网络连接
    showNetworkError();
  } else {
    // 其他错误：显示通用错误信息
    showGenericError(error.message);
  }
}
```

### 2. 记录错误详情 Log Error Details

```typescript
try {
  const response = await client.fetchWithRetry(url, options);
} catch (error) {
  // 记录完整的错误信息用于调试
  console.error('Request failed:', {
    type: error.type,
    message: error.message,
    statusCode: error.statusCode,
    retryable: error.retryable,
    details: error.details,
    url,
    timestamp: new Date().toISOString(),
  });
  
  // 向用户显示友好的错误信息
  showUserFriendlyError(error);
}
```

### 3. 监控重试行为 Monitor Retry Behavior

```typescript
class MonitoredHTTPClient extends BaseHTTPClient {
  protected async fetchWithRetry(
    url: string,
    options: RequestInit,
    retryCount = 0
  ): Promise<Response> {
    if (retryCount > 0) {
      // 记录重试事件
      console.log(`Retry attempt ${retryCount} for ${url}`);
      
      // 可选：发送到监控系统
      sendMetric('http.retry', {
        url,
        retryCount,
        timestamp: Date.now(),
      });
    }
    
    return super.fetchWithRetry(url, options, retryCount);
  }
}
```

## 测试覆盖 Test Coverage

系统包含全面的测试覆盖：

The system includes comprehensive test coverage:

### 单元测试 Unit Tests

1. **指数退避计算测试**
   - 验证初始延迟计算
   - 验证指数增长
   - 验证最大延迟限制

2. **错误类型识别测试**
   - 验证各种HTTP状态码的错误分类
   - 验证可重试标志的正确性

3. **重试行为测试**
   - 验证网络错误重试（最多3次）
   - 验证限流错误重试
   - 验证服务器错误重试
   - 验证不可重试错误不会重试
   - 验证重试成功场景

4. **超时处理测试**
   - 验证超时错误创建
   - 验证超时错误可重试

5. **SSE流解析测试**
   - 验证SSE数据流解析
   - 验证空行和注释跳过
   - 验证[DONE]标记处理
   - 验证分块传输处理

### 运行测试 Running Tests

```bash
# 运行所有HTTP客户端测试
npm test -- httpClient.test.ts

# 运行特定测试套件
npm test -- httpClient.test.ts -t "fetchWithRetry"

# 查看测试覆盖率
npm test -- httpClient.test.ts --coverage
```

## 性能考虑 Performance Considerations

### 1. 重试开销 Retry Overhead

- 每次重试都会增加总请求时间
- 最坏情况（3次重试）：初始请求 + 1s + 2s + 4s = 7秒额外延迟
- 建议：根据应用场景调整重试配置

### 2. 并发请求 Concurrent Requests

- 多个并发请求可能同时触发重试
- 建议：实现请求队列或限流机制
- 示例：使用p-limit库限制并发数

```typescript
import pLimit from 'p-limit';

const limit = pLimit(5); // 最多5个并发请求

const requests = urls.map(url => 
  limit(() => client.fetchWithRetry(url, options))
);

const results = await Promise.all(requests);
```

### 3. 内存使用 Memory Usage

- 重试机制不会显著增加内存使用
- 每个请求的错误对象很小（< 1KB）
- 建议：定期清理错误日志

## 故障排查 Troubleshooting

### 问题：请求总是超时 Requests Always Timeout

**可能原因:**
- 网络连接不稳定
- API服务器响应慢
- 超时时间设置过短

**解决方案:**
```typescript
// 增加超时时间
const client = new BaseHTTPClient({
  config: myConfig,
  timeout: 60000, // 60秒
});
```

### 问题：频繁遇到限流错误 Frequent Rate Limit Errors

**可能原因:**
- 请求频率过高
- API配额不足

**解决方案:**
```typescript
// 1. 增加初始延迟
const client = new BaseHTTPClient({
  config: myConfig,
  retryConfig: {
    maxRetries: 3,
    initialDelay: 5000, // 5秒
    maxDelay: 30000,
    backoffMultiplier: 2,
  },
});

// 2. 实现请求队列
import pQueue from 'p-queue';

const queue = new pQueue({
  concurrency: 1,
  interval: 1000, // 每秒最多1个请求
  intervalCap: 1,
});

await queue.add(() => client.fetchWithRetry(url, options));
```

### 问题：认证错误但API密钥正确 Authentication Error with Valid API Key

**可能原因:**
- API密钥格式错误（多余空格、换行符）
- API密钥已过期
- 请求头格式不正确

**解决方案:**
```typescript
// 清理API密钥
const apiKey = config.apiKey.trim();

// 检查请求头格式
const headers = {
  'Authorization': `Bearer ${apiKey}`, // 注意Bearer后有空格
  'Content-Type': 'application/json',
};
```

## 相关文档 Related Documentation

- [AI Client Implementation](./aiClient.ts)
- [Configuration Management](../types/config.ts)
- [Error Types](../types/ai-client.ts)
- [Testing Guide](./httpClient.test.ts)

## 更新日志 Changelog

### v1.0.0 (2024-01-15)
- ✅ 实现基础HTTP客户端
- ✅ 实现指数退避重试机制
- ✅ 实现错误分类和处理
- ✅ 实现超时处理
- ✅ 添加全面的单元测试
- ✅ 添加文档

## 贡献 Contributing

如果发现错误处理或重试机制的问题，请：

If you find issues with error handling or retry mechanism:

1. 检查现有测试是否覆盖该场景
2. 添加新的测试用例
3. 更新实现代码
4. 更新本文档

## 许可 License

本项目采用MIT许可证。详见LICENSE文件。

This project is licensed under the MIT License. See LICENSE file for details.
