# 网络搜索服务文档

## 概述

网络搜索服务为Agent Swarm写作系统提供联网搜索能力，支持多个搜索提供商，包括Tavily、SerpAPI、Google Custom Search和Bing Search。

## 功能特性

- ✅ 支持多个搜索提供商
- ✅ 统一的搜索接口
- ✅ 搜索历史记录和追踪
- ✅ 按Agent ID过滤搜索历史
- ✅ 结构化的搜索结果
- ✅ 灵活的搜索选项（时间范围、域名限制等）
- ✅ 完善的错误处理
- ✅ 与AI客户端无缝集成

## 支持的搜索提供商

### 1. Tavily（推荐）

**特点：**
- 专为AI应用优化
- 高质量的学术和技术内容
- 支持高级搜索深度
- 可选AI生成的答案摘要

**适用场景：**
- 学术研究
- 技术文档查找
- 深度内容分析

**配置示例：**
```typescript
const config: SearchConfig = {
  provider: 'tavily',
  apiKey: 'tvly-your-api-key',
  maxResults: 10,
  searchDepth: 'advanced',
  includeAnswer: true,
};
```

### 2. SerpAPI

**特点：**
- 支持多个搜索引擎（Google、Bing等）
- 丰富的搜索选项
- 时间范围过滤
- 稳定可靠

**适用场景：**
- 通用网络搜索
- 新闻和时事查询
- 多引擎结果对比

**配置示例：**
```typescript
const config: SearchConfig = {
  provider: 'serpapi',
  apiKey: 'your-serpapi-key',
  maxResults: 5,
  language: 'zh',
};
```

### 3. Google Custom Search

**特点：**
- Google官方API
- 可自定义搜索引擎
- 支持语言和地区设置

**适用场景：**
- 需要Google搜索质量
- 自定义搜索范围
- 企业级应用

**配置示例：**
```typescript
const config: SearchConfig & { searchEngineId: string } = {
  provider: 'google',
  apiKey: 'your-google-api-key',
  searchEngineId: 'your-search-engine-id',
  maxResults: 10,
};
```

### 4. Bing Search

**特点：**
- Microsoft官方API
- 全球覆盖
- 多语言支持

**适用场景：**
- 国际化应用
- 多语言内容搜索
- 备用搜索方案

**配置示例：**
```typescript
const config: SearchConfig = {
  provider: 'bing',
  apiKey: 'your-bing-api-key',
  language: 'zh',
};
```

## 快速开始

### 基本使用

```typescript
import { SearchServiceFactory } from './services/searchService';

// 1. 创建搜索服务
const searchConfig = {
  provider: 'tavily',
  apiKey: 'your-api-key',
  maxResults: 10,
};

const searchService = SearchServiceFactory.createSearchService(searchConfig);

// 2. 执行搜索
const results = await searchService.search('人工智能最新进展');

// 3. 处理结果
results.forEach(result => {
  console.log(result.title);
  console.log(result.url);
  console.log(result.snippet);
});
```

### 与AI客户端集成

```typescript
import { createAIClient } from './services/aiClient';

const client = createAIClient({
  config: aiServiceConfig,
  searchConfig: {
    provider: 'tavily',
    apiKey: 'your-api-key',
  },
});

// 执行搜索
const results = await client.performWebSearch('量子计算', 'agent_id_123');

// 查看搜索历史
const history = client.getSearchHistory('agent_id_123');
```

## 高级功能

### 搜索选项

```typescript
const options: SearchOptions = {
  maxResults: 5,           // 最大结果数
  language: 'zh',          // 语言
  dateRange: 'week',       // 时间范围：day, week, month, year
  domains: ['arxiv.org'],  // 限制搜索域名
};

const results = await searchService.search('机器学习', options);
```

### 搜索历史管理

```typescript
// 获取所有搜索历史
const allHistory = searchService.getSearchHistory();

// 获取特定Agent的搜索历史
const agentHistory = searchService.getSearchHistory('agent_id_123');

// 清除搜索历史
searchService.clearSearchHistory();
```

### 多提供商容错

```typescript
const providers = ['tavily', 'serpapi', 'bing'];

for (const provider of providers) {
  try {
    const service = SearchServiceFactory.createSearchService({
      provider,
      apiKey: getApiKey(provider),
    });
    
    const results = await service.search(query);
    return results; // 成功则返回
  } catch (error) {
    console.error(`${provider} 失败，尝试下一个...`);
  }
}
```

## 数据结构

### SearchResult

```typescript
interface SearchResult {
  title: string;           // 标题
  url: string;             // URL
  snippet: string;         // 摘要/片段
  source?: string;         // 来源域名
  publishedDate?: Date;    // 发布日期（如果可用）
}
```

### SearchQueryRecord

```typescript
interface SearchQueryRecord {
  id: string;              // 查询ID
  query: string;           // 查询内容
  timestamp: Date;         // 查询时间
  results: SearchResult[]; // 搜索结果
  agentId?: string;        // 发起查询的Agent ID
}
```

## 错误处理

### 常见错误类型

1. **认证失败（401/403）**
   - 原因：API密钥无效或已过期
   - 解决：检查并更新API密钥

2. **请求频率超限（429）**
   - 原因：请求过于频繁
   - 解决：等待后重试或升级API计划

3. **服务器错误（500+）**
   - 原因：搜索服务暂时不可用
   - 解决：稍后重试或切换提供商

4. **网络错误**
   - 原因：网络连接问题
   - 解决：检查网络连接

### 错误处理示例

```typescript
try {
  const results = await searchService.search(query);
} catch (error: any) {
  if (error.message.includes('认证失败')) {
    console.error('API密钥无效');
  } else if (error.message.includes('请求频率超限')) {
    console.error('请求过于频繁，请稍后重试');
  } else if (error.message.includes('服务器错误')) {
    console.error('服务暂时不可用');
  } else {
    console.error('搜索失败:', error.message);
  }
}
```

## 最佳实践

### 1. 选择合适的提供商

- **学术研究**：使用Tavily，设置`searchDepth: 'advanced'`
- **新闻时事**：使用SerpAPI，设置时间范围过滤
- **通用搜索**：使用Google或Bing
- **成本优化**：根据价格和配额选择

### 2. 优化搜索查询

```typescript
// ❌ 不好的查询
await searchService.search('AI');

// ✅ 好的查询
await searchService.search('大语言模型在医疗诊断中的应用');
```

### 3. 限制搜索域名

```typescript
// 只搜索学术网站
const options: SearchOptions = {
  domains: [
    'arxiv.org',
    'scholar.google.com',
    'ieee.org',
    'acm.org',
  ],
};
```

### 4. 管理搜索历史

```typescript
// 定期清理旧的搜索历史
if (searchService.getSearchHistory().length > 100) {
  searchService.clearSearchHistory();
}
```

### 5. 实现容错机制

```typescript
async function robustSearch(query: string) {
  const providers = ['tavily', 'serpapi', 'bing'];
  
  for (const provider of providers) {
    try {
      const service = createSearchService(provider);
      return await service.search(query);
    } catch (error) {
      console.warn(`${provider} 失败，尝试下一个`);
    }
  }
  
  throw new Error('所有搜索提供商都失败了');
}
```

## 性能考虑

### 1. 缓存搜索结果

```typescript
const cache = new Map<string, SearchResult[]>();

async function cachedSearch(query: string) {
  if (cache.has(query)) {
    return cache.get(query)!;
  }
  
  const results = await searchService.search(query);
  cache.set(query, results);
  return results;
}
```

### 2. 限制并发请求

```typescript
import pLimit from 'p-limit';

const limit = pLimit(3); // 最多3个并发请求

const queries = ['query1', 'query2', 'query3', 'query4'];
const results = await Promise.all(
  queries.map(q => limit(() => searchService.search(q)))
);
```

### 3. 设置合理的超时

```typescript
async function searchWithTimeout(query: string, timeoutMs = 10000) {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('搜索超时')), timeoutMs)
  );
  
  return Promise.race([
    searchService.search(query),
    timeoutPromise,
  ]);
}
```

## API密钥获取

### Tavily
1. 访问 https://tavily.com
2. 注册账号
3. 在Dashboard获取API密钥

### SerpAPI
1. 访问 https://serpapi.com
2. 注册账号
3. 在Dashboard获取API密钥

### Google Custom Search
1. 访问 https://console.cloud.google.com
2. 创建项目并启用Custom Search API
3. 创建搜索引擎：https://cse.google.com
4. 获取API密钥和搜索引擎ID

### Bing Search
1. 访问 https://portal.azure.com
2. 创建Bing Search资源
3. 获取订阅密钥

## 相关需求

- **需求 18.1**: 为所有AI配置Internet_Access能力
- **需求 18.2**: 允许AI执行网络搜索
- **需求 18.3**: 显示AI的联网查询过程和结果
- **需求 18.5**: 记录AI的联网查询历史和引用来源

## 测试

运行测试：
```bash
npm test src/services/searchService.test.ts
```

查看测试覆盖率：
```bash
npm run test:coverage
```

## 故障排查

### 问题：搜索返回空结果

**可能原因：**
1. 查询词过于宽泛或特殊
2. 搜索提供商限制
3. API配额用尽

**解决方案：**
1. 优化查询词
2. 检查API配额
3. 尝试其他提供商

### 问题：搜索速度慢

**可能原因：**
1. 网络延迟
2. 搜索深度设置过高
3. 请求结果数过多

**解决方案：**
1. 使用更快的提供商
2. 降低搜索深度
3. 减少maxResults

### 问题：频繁出现429错误

**可能原因：**
1. 请求频率过高
2. API配额限制

**解决方案：**
1. 实现请求限流
2. 升级API计划
3. 使用多个提供商轮换

## 更新日志

### v1.0.0 (2024-01-20)
- ✅ 实现Tavily搜索服务
- ✅ 实现SerpAPI搜索服务
- ✅ 实现Google搜索服务
- ✅ 实现Bing搜索服务
- ✅ 实现搜索历史记录
- ✅ 实现搜索服务工厂
- ✅ 完整的单元测试覆盖
- ✅ 与AI客户端集成

## 许可证

MIT License
