# Network Permission Service

网络权限服务 - 用于管理和验证AI的网络访问权限

## 概述

Network Permission Service 提供了一个完整的网络访问权限管理系统，允许系统管理员控制AI是否可以访问互联网，以及限制可访问的域名范围。

## 功能特性

- ✅ **权限检查**: 验证网络访问是否启用
- ✅ **域名验证**: 检查URL是否在允许访问的域名列表中
- ✅ **通配符支持**: 支持 `*.example.com` 格式的通配符域名
- ✅ **子域名匹配**: 自动匹配子域名（example.com 匹配 sub.example.com）
- ✅ **大小写不敏感**: 域名比较不区分大小写
- ✅ **批量验证**: 支持一次验证多个URL
- ✅ **动态管理**: 运行时添加/删除允许的域名
- ✅ **描述性错误**: 提供清晰的错误信息和原因

## 需求映射

- **需求 18.6**: 允许用户配置Internet_Access的权限和范围限制
- **任务 26.2**: 实现联网权限验证

## 安装和导入

```typescript
import {
  NetworkPermissionService,
  createNetworkPermissionService,
} from './services/networkPermissionService';
import type {
  InternetAccessConfig,
  PermissionCheckResult,
  DomainValidationResult,
} from './services/networkPermissionService';
```

## 快速开始

### 基本用法

```typescript
import { createNetworkPermissionService } from './services/networkPermissionService';

// 创建服务实例
const config = {
  enabled: true,
  allowedDomains: ['example.com', 'test.org'],
};

const service = createNetworkPermissionService(config);

// 检查网络访问权限
const permission = service.checkPermission();
if (!permission.allowed) {
  console.error(permission.reason);
}

// 验证域名
const result = service.validateDomain('https://example.com/path');
if (result.allowed) {
  console.log(`Access granted to ${result.domain}`);
} else {
  console.error(result.reason);
}
```

### 允许所有域名

```typescript
const config = {
  enabled: true,
  allowedDomains: undefined, // undefined 或空数组表示允许所有域名
};

const service = createNetworkPermissionService(config);
```

### 使用通配符

```typescript
const config = {
  enabled: true,
  allowedDomains: [
    '*.google.com',      // 允许所有 Google 子域名
    '*.github.com',      // 允许所有 GitHub 子域名
    'example.com',       // 允许 example.com 及其子域名
  ],
};

const service = createNetworkPermissionService(config);

// 这些都会被允许：
// - scholar.google.com
// - maps.google.com
// - api.github.com
// - example.com
// - sub.example.com
```

## API 参考

### NetworkPermissionService

主要的网络权限服务类。

#### 构造函数

```typescript
constructor(config: InternetAccessConfig)
```

创建一个新的网络权限服务实例。

**参数:**
- `config`: 联网访问配置对象

#### 方法

##### checkPermission()

检查网络访问是否启用。

```typescript
checkPermission(): PermissionCheckResult
```

**返回值:**
```typescript
{
  allowed: boolean;    // 是否允许访问
  reason?: string;     // 拒绝原因（如果被拒绝）
}
```

**示例:**
```typescript
const result = service.checkPermission();
if (!result.allowed) {
  console.error('Network access denied:', result.reason);
}
```

##### validateDomain(url)

验证URL的域名是否允许访问。

```typescript
validateDomain(url: string): DomainValidationResult
```

**参数:**
- `url`: 要验证的URL字符串

**返回值:**
```typescript
{
  allowed: boolean;    // 是否允许访问
  domain: string;      // 提取的域名
  reason?: string;     // 拒绝原因（如果被拒绝）
}
```

**示例:**
```typescript
const result = service.validateDomain('https://example.com/path');
if (result.allowed) {
  console.log(`Access to ${result.domain} is allowed`);
} else {
  console.error(`Access denied: ${result.reason}`);
}
```

##### validateDomains(urls)

批量验证多个URL。

```typescript
validateDomains(urls: string[]): DomainValidationResult[]
```

**参数:**
- `urls`: URL字符串数组

**返回值:**
- 验证结果数组，每个URL对应一个结果

**示例:**
```typescript
const urls = [
  'https://example.com',
  'https://test.org',
  'https://blocked.com',
];

const results = service.validateDomains(urls);
results.forEach((result, index) => {
  console.log(`${urls[index]}: ${result.allowed ? 'Allowed' : 'Denied'}`);
});
```

##### addAllowedDomain(domain)

添加一个允许的域名。

```typescript
addAllowedDomain(domain: string): void
```

**参数:**
- `domain`: 要添加的域名

**示例:**
```typescript
service.addAllowedDomain('newsite.com');
service.addAllowedDomain('*.example.org');
```

##### removeAllowedDomain(domain)

移除一个允许的域名。

```typescript
removeAllowedDomain(domain: string): void
```

**参数:**
- `domain`: 要移除的域名

**示例:**
```typescript
service.removeAllowedDomain('oldsite.com');
```

##### clearAllowedDomains()

清空所有允许的域名。

```typescript
clearAllowedDomains(): void
```

**示例:**
```typescript
service.clearAllowedDomains();
```

##### getAllowedDomains()

获取所有允许的域名列表。

```typescript
getAllowedDomains(): string[]
```

**返回值:**
- 允许的域名数组（副本）

**示例:**
```typescript
const domains = service.getAllowedDomains();
console.log('Allowed domains:', domains);
```

##### updateConfig(config)

更新服务配置。

```typescript
updateConfig(config: InternetAccessConfig): void
```

**参数:**
- `config`: 新的配置对象

**示例:**
```typescript
service.updateConfig({
  enabled: false,
  allowedDomains: [],
});
```

##### getConfig()

获取当前配置。

```typescript
getConfig(): InternetAccessConfig
```

**返回值:**
- 当前配置对象（副本）

**示例:**
```typescript
const config = service.getConfig();
console.log('Current config:', config);
```

## 类型定义

### InternetAccessConfig

```typescript
interface InternetAccessConfig {
  enabled: boolean;           // 是否启用网络访问
  allowedDomains?: string[];  // 允许的域名列表（可选）
}
```

### PermissionCheckResult

```typescript
interface PermissionCheckResult {
  allowed: boolean;    // 是否允许访问
  reason?: string;     // 拒绝原因
}
```

### DomainValidationResult

```typescript
interface DomainValidationResult {
  allowed: boolean;    // 是否允许访问
  domain: string;      // 提取的域名
  reason?: string;     // 拒绝原因
}
```

## 域名匹配规则

### 1. 精确匹配

```typescript
allowedDomains: ['example.com']
```

- ✅ `example.com`
- ✅ `sub.example.com` (子域名自动匹配)
- ✅ `deep.sub.example.com`
- ❌ `notexample.com`
- ❌ `examplecom.org`

### 2. 通配符匹配

```typescript
allowedDomains: ['*.example.com']
```

- ✅ `example.com`
- ✅ `sub.example.com`
- ✅ `deep.sub.example.com`
- ❌ `notexample.com`

### 3. 大小写不敏感

```typescript
allowedDomains: ['Example.COM']
```

- ✅ `example.com`
- ✅ `EXAMPLE.COM`
- ✅ `Example.Com`

### 4. 允许所有域名

```typescript
allowedDomains: undefined  // 或 []
```

- ✅ 任何域名都被允许

## 使用场景

### 场景 1: 学术研究AI

限制AI只能访问学术资源：

```typescript
const academicConfig = {
  enabled: true,
  allowedDomains: [
    'scholar.google.com',
    'arxiv.org',
    'pubmed.ncbi.nlm.nih.gov',
    'ieee.org',
    '*.ieee.org',
    '*.edu',
  ],
};

const service = createNetworkPermissionService(academicConfig);
```

### 场景 2: 企业内部AI

只允许访问公司内部资源：

```typescript
const enterpriseConfig = {
  enabled: true,
  allowedDomains: [
    '*.company.com',
    'internal.company.net',
    'docs.company.io',
  ],
};

const service = createNetworkPermissionService(enterpriseConfig);
```

### 场景 3: 完全禁用网络访问

```typescript
const offlineConfig = {
  enabled: false,
  allowedDomains: [],
};

const service = createNetworkPermissionService(offlineConfig);
```

### 场景 4: 与搜索服务集成

```typescript
import { SearchServiceFactory } from './searchService';
import { createNetworkPermissionService } from './networkPermissionService';

async function performSecureSearch(query: string, searchUrl: string) {
  // 创建权限服务
  const permissionService = createNetworkPermissionService({
    enabled: true,
    allowedDomains: ['api.tavily.com', 'serpapi.com'],
  });

  // 检查权限
  const permission = permissionService.checkPermission();
  if (!permission.allowed) {
    throw new Error(permission.reason);
  }

  // 验证域名
  const domainValidation = permissionService.validateDomain(searchUrl);
  if (!domainValidation.allowed) {
    throw new Error(domainValidation.reason);
  }

  // 执行搜索
  const searchService = SearchServiceFactory.createSearchService({
    provider: 'tavily',
    apiKey: 'your-api-key',
  });

  return await searchService.search(query);
}
```

## 错误处理

服务提供描述性的错误信息：

```typescript
const result = service.validateDomain('https://blocked.com');

if (!result.allowed) {
  // 错误信息示例：
  // - "网络访问已被禁用。请在系统配置中启用联网功能。"
  // - "域名 "blocked.com" 不在允许访问的域名列表中。允许的域名: example.com, test.org"
  // - "无效的URL格式: not a url"
  console.error(result.reason);
}
```

## 测试

运行单元测试：

```bash
npm test networkPermissionService.test.ts
```

运行示例：

```bash
npm run example networkPermissionService.example.ts
```

## 性能考虑

- 域名匹配使用高效的字符串比较
- 配置对象使用浅拷贝避免意外修改
- 批量验证避免重复的权限检查
- 域名规范化（小写、去空格）在添加时完成

## 安全考虑

1. **默认拒绝**: 当配置不明确时，默认拒绝访问
2. **严格匹配**: 避免部分字符串匹配导致的安全漏洞
3. **URL解析**: 使用标准URL解析器避免注入攻击
4. **配置隔离**: 返回配置副本防止外部修改

## 最佳实践

1. **最小权限原则**: 只允许必要的域名
2. **使用通配符**: 对于可信的域名组使用通配符简化配置
3. **定期审查**: 定期审查和更新允许的域名列表
4. **记录访问**: 结合日志系统记录所有网络访问尝试
5. **用户通知**: 当访问被拒绝时，向用户提供清晰的说明

## 相关文档

- [Search Service README](./SEARCH_SERVICE_README.md) - 网络搜索服务
- [Configuration Types](../types/CONFIG_README.md) - 配置类型定义
- [Design Document](../../.kiro/specs/agent-swarm-writing-system/design.md) - 系统设计文档

## 更新日志

### v1.0.0 (2024-01)
- ✨ 初始版本
- ✅ 实现基本权限检查
- ✅ 实现域名验证
- ✅ 支持通配符和子域名匹配
- ✅ 提供完整的单元测试

## 许可证

MIT License
