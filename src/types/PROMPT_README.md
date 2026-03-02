# 提示词数据模型文档
# Prompt Data Models Documentation

## 概述 (Overview)

提示词管理系统使用YAML格式存储提示词模板，支持变量替换、版本控制和元数据管理。本文档描述了提示词文件的结构和TypeScript类型定义。

The prompt management system uses YAML format to store prompt templates, supporting variable substitution, version control, and metadata management.

## YAML文件结构 (YAML File Structure)

### 基本结构 (Basic Structure)

```yaml
version: "1.0"
role: decision
description: "决策AI负责分析题目、评估工作量并组建写作团队"

system_prompt: |
  你是一个学术论文写作项目的决策AI。你的职责是：
  1. 分析论文题目的复杂度和所需工作量
  2. 确定需要多少个写作AI以及各自的专业分工
  3. 为每个AI分配具体的写作任务
  4. 估算完成时间
  5. 在检测到人手不足时动态增加新的AI角色

templates:
  task_allocation: |
    论文题目：{{topic}}
    
    请分析以下内容：
    1. 该题目涉及的主要研究领域和子领域
    2. 需要撰写的论文章节（引言、文献综述、方法、结果、讨论、结论等）
    3. 每个章节的预估工作量（简单/中等/复杂）
    4. 建议的写作团队规模和角色分工
    
    输出格式要求：
    - 使用标准的JSON输出格式
    - messageType: "task_assignment"
    - 为每个写作AI指定明确的任务描述

  dynamic_addition: |
    当前情况：{{situation}}
    瓶颈分析：{{bottleneck}}
    
    请决定：
    1. 是否需要增加新的AI角色
    2. 新角色的专业方向和职责
    3. 新角色应该承担的具体任务

variables:
  - name: topic
    description: "用户输入的论文题目"
    required: true
  
  - name: situation
    description: "当前流程的具体情况描述"
    required: false
    default_value: "正常进行中"
  
  - name: bottleneck
    description: "识别出的瓶颈问题"
    required: false

metadata:
  author: "System"
  created_at: "2024-01-01T00:00:00Z"
  updated_at: "2024-01-15T10:30:00Z"
  tags: ["decision", "task-allocation", "dynamic-scaling"]
  notes: "支持动态团队扩展的决策AI提示词"
```

### 字段说明 (Field Descriptions)

#### 必需字段 (Required Fields)

- **version** (string): 版本号，使用语义化版本格式（如"1.0", "1.2.3"）
- **role** (string): Agent角色标识符，对应`AgentRole`类型
- **description** (string): 提示词的简短描述
- **system_prompt** (string): 系统提示词，定义AI的基本角色和职责
- **templates** (object): 命名的提示词模板集合，键为模板名称，值为模板内容
- **variables** (array): 可用变量列表

#### 可选字段 (Optional Fields)

- **metadata** (object): 额外的元数据信息
  - **author** (string): 作者名称
  - **created_at** (string): 创建时间（ISO 8601格式）
  - **updated_at** (string): 更新时间（ISO 8601格式）
  - **tags** (array): 标签列表
  - **notes** (string): 备注信息

### 变量定义 (Variable Definition)

每个变量对象包含以下字段：

```yaml
- name: variable_name          # 变量名称（必需）
  description: "变量描述"       # 变量描述（必需）
  required: true               # 是否必需（可选，默认false）
  default_value: "默认值"      # 默认值（可选）
```

## TypeScript类型定义 (TypeScript Type Definitions)

### 核心类型 (Core Types)

#### PromptTemplate

完整的提示词模板，包含所有元数据和内容：

```typescript
interface PromptTemplate {
  version: string;
  role: AgentRole;
  description: string;
  systemPrompt: string;
  templates: Record<string, string>;
  variables: PromptVariable[];
  metadata?: PromptMetadata;
}
```

#### PromptVariable

提示词变量定义：

```typescript
interface PromptVariable {
  name: string;
  description: string;
  required?: boolean;
  defaultValue?: string;
}
```

#### LoadedPrompt

已加载并解析变量的提示词实例：

```typescript
interface LoadedPrompt {
  template: PromptTemplate;
  resolvedSystemPrompt: string;
  resolvedTemplates: Record<string, string>;
  variables: Record<string, string>;
}
```

### 支持的Agent角色 (Supported Agent Roles)

```typescript
type AgentRole = 
  | 'decision'           // 决策AI
  | 'supervisor'         // 监管AI
  | 'writer'             // 写作AI
  | 'editorial_office'   // 编辑部
  | 'editor_in_chief'    // 主编
  | 'deputy_editor'      // 副主编
  | 'peer_reviewer';     // 审稿专家
```

### 文件命名约定 (File Naming Convention)

提示词文件应遵循以下命名约定：

```typescript
const PROMPT_FILE_NAMES: Record<AgentRole, string> = {
  decision: 'decision_ai.yaml',
  supervisor: 'supervisor_ai.yaml',
  writer: 'writer.yaml',
  editorial_office: 'editorial_office.yaml',
  editor_in_chief: 'editor_in_chief.yaml',
  deputy_editor: 'deputy_editor.yaml',
  peer_reviewer: 'peer_reviewer.yaml',
};
```

## 变量替换 (Variable Substitution)

### 语法 (Syntax)

变量使用双花括号语法：`{{variable_name}}`

示例：
```
论文题目：{{topic}}
当前情况：{{situation}}
```

### 替换选项 (Substitution Options)

```typescript
interface VariableSubstitutionOptions {
  strict?: boolean;          // 严格模式（默认true）
  keepUnresolved?: boolean;  // 保留未解析的变量（默认false）
  prefix?: string;           // 变量前缀（默认"{{"）
  suffix?: string;           // 变量后缀（默认"}}"）
}
```

### 替换行为 (Substitution Behavior)

1. **严格模式 (Strict Mode)**: 
   - 如果必需变量未提供，抛出`VariableSubstitutionError`
   - 如果可选变量未提供，使用默认值或空字符串

2. **非严格模式 (Non-Strict Mode)**:
   - 未提供的变量使用默认值或空字符串
   - 不会抛出错误

3. **保留未解析变量 (Keep Unresolved)**:
   - 如果启用，未提供的变量保留原始占位符
   - 如果禁用，未提供的变量替换为空字符串或默认值

## 验证 (Validation)

### 提示词验证 (Prompt Validation)

验证提示词文件的完整性和正确性：

```typescript
interface PromptValidationResult {
  isValid: boolean;
  errors: PromptValidationError[];
  warnings: PromptValidationWarning[];
}
```

### 验证规则 (Validation Rules)

1. **必需字段检查**: 确保所有必需字段存在
2. **版本格式检查**: 验证版本号符合语义化版本格式
3. **角色有效性检查**: 验证角色是否为支持的类型
4. **变量定义检查**: 验证变量定义的完整性
5. **模板语法检查**: 检查模板中的变量引用是否有效

## 错误处理 (Error Handling)

### PromptLoadError

提示词加载失败时抛出：

```typescript
class PromptLoadError extends Error {
  constructor(
    message: string,
    public readonly filePath: string,
    public readonly cause?: Error
  )
}
```

使用示例：
```typescript
try {
  const prompt = await loadPrompt('decision');
} catch (error) {
  if (error instanceof PromptLoadError) {
    console.error(`Failed to load prompt from ${error.filePath}: ${error.message}`);
  }
}
```

### VariableSubstitutionError

变量替换失败时抛出：

```typescript
class VariableSubstitutionError extends Error {
  constructor(
    message: string,
    public readonly variableName: string,
    public readonly template: string
  )
}
```

使用示例：
```typescript
try {
  const resolved = substituteVariables(template, variables);
} catch (error) {
  if (error instanceof VariableSubstitutionError) {
    console.error(`Variable ${error.variableName} is required but not provided`);
  }
}
```

## 最佳实践 (Best Practices)

### 1. 版本管理 (Version Management)

- 使用语义化版本号
- 重大变更时增加主版本号
- 向后兼容的改进增加次版本号
- Bug修复增加补丁版本号

### 2. 变量命名 (Variable Naming)

- 使用小写字母和下划线（snake_case）
- 使用描述性名称（如`topic`而非`t`）
- 为所有变量提供清晰的描述

### 3. 模板组织 (Template Organization)

- 为不同场景创建独立的命名模板
- 使用描述性的模板名称（如`task_allocation`而非`template1`）
- 在模板中包含清晰的指令和格式要求

### 4. 元数据维护 (Metadata Maintenance)

- 始终记录作者和创建时间
- 每次修改时更新`updated_at`字段
- 使用标签帮助分类和搜索
- 在`notes`中记录重要的变更说明

### 5. 文档化 (Documentation)

- 在`description`中提供清晰的提示词用途说明
- 为每个变量提供详细的描述
- 在模板中包含使用示例和输出格式要求

## 示例文件 (Example Files)

### Decision AI 提示词

文件路径: `prompts/decision_ai.yaml`

```yaml
version: "1.0"
role: decision
description: "决策AI负责分析题目、评估工作量并组建写作团队"

system_prompt: |
  你是一个学术论文写作项目的决策AI。你的职责是：
  1. 分析论文题目的复杂度和所需工作量
  2. 确定需要多少个写作AI以及各自的专业分工
  3. 为每个AI分配具体的写作任务
  4. 估算完成时间
  5. 在检测到人手不足时动态增加新的AI角色

templates:
  task_allocation: |
    论文题目：{{topic}}
    
    请分析以下内容：
    1. 该题目涉及的主要研究领域和子领域
    2. 需要撰写的论文章节
    3. 每个章节的预估工作量
    4. 建议的写作团队规模和角色分工

variables:
  - name: topic
    description: "用户输入的论文题目"
    required: true

metadata:
  author: "System"
  created_at: "2024-01-01T00:00:00Z"
  tags: ["decision", "task-allocation"]
```

### Supervisor AI 提示词

文件路径: `prompts/supervisor_ai.yaml`

```yaml
version: "1.0"
role: supervisor
description: "监管AI负责检查输出质量和格式规范性"

system_prompt: |
  你是一个学术论文写作项目的监管AI。你的职责是：
  1. 验证AI输出是否符合格式规范
  2. 检查内容质量
  3. 要求不合规内容返工
  4. 检测人手不足情况并通知决策AI

templates:
  format_validation: |
    AI输出内容：{{output}}
    
    请验证以下方面：
    1. 是否符合OutputFormat规范
    2. 消息类型、发送者、接收者字段是否完整
    3. 内容格式是否正确

  quality_check: |
    提交内容：{{content}}
    任务要求：{{requirements}}
    
    请评估：
    1. 内容是否完整
    2. 质量是否达标
    3. 是否需要返工

variables:
  - name: output
    description: "AI生成的输出内容"
    required: true
  
  - name: content
    description: "提交的工作内容"
    required: true
  
  - name: requirements
    description: "任务要求描述"
    required: true

metadata:
  author: "System"
  created_at: "2024-01-01T00:00:00Z"
  tags: ["supervisor", "validation", "quality-check"]
```

## 相关文档 (Related Documentation)

- [配置管理文档](./CONFIG_README.md) - 系统配置相关类型
- [消息类型文档](./message.ts) - AI消息格式定义
- [Agent类型文档](./agent.ts) - Agent相关类型定义

## 需求追溯 (Requirements Traceability)

本模块实现以下需求：

- **需求 4.4**: 提示词仓库包含提示词版本控制信息
- **需求 15.3**: 支持提示词文件中的变量替换功能
- **需求 15.4**: 验证提示词文件的完整性
- **需求 15.5**: 提示词加载往返属性（属性2）
