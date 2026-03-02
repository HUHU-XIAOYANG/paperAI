/**
 * 提示词数据模型
 * Prompt data models for the prompt management system
 * 
 * 需求: 4.4
 * 
 * 提示词文件采用YAML格式，支持变量替换、版本控制和元数据管理
 */

import type { AgentRole } from './agent';

// Re-export AgentRole for convenience
export type { AgentRole };

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * 提示词变量定义
 * 描述提示词模板中可用的变量
 */
export interface PromptVariable {
  name: string; // 变量名称（用于{{variable}}占位符）
  description: string; // 变量描述
  required?: boolean; // 是否必需（默认false）
  defaultValue?: string; // 默认值（可选）
}

/**
 * 提示词模板
 * 包含完整的提示词内容和元数据
 */
export interface PromptTemplate {
  version: string; // 版本号（如"1.0"）
  role: AgentRole; // 对应的Agent角色
  description: string; // 提示词描述
  systemPrompt: string; // 系统提示词（定义AI的基本角色和职责）
  templates: Record<string, string>; // 命名的提示词模板（如task_allocation_template）
  variables: PromptVariable[]; // 可用变量列表
  metadata?: PromptMetadata; // 额外元数据（可选）
}

/**
 * 提示词元数据
 * 存储额外的提示词信息
 */
export interface PromptMetadata {
  author?: string; // 作者
  createdAt?: string; // 创建时间（ISO 8601）
  updatedAt?: string; // 更新时间（ISO 8601）
  tags?: string[]; // 标签
  notes?: string; // 备注
}

/**
 * 提示词文件的YAML结构
 * 这是存储在文件系统中的格式
 * 
 * 示例YAML结构：
 * ```yaml
 * version: "1.0"
 * role: decision_ai
 * description: "决策AI负责分析题目、评估工作量并组建写作团队"
 * 
 * system_prompt: |
 *   你是一个学术论文写作项目的决策AI。你的职责是：
 *   1. 分析论文题目的复杂度和所需工作量
 *   2. 确定需要多少个写作AI以及各自的专业分工
 *   3. 为每个AI分配具体的写作任务
 * 
 * templates:
 *   task_allocation: |
 *     论文题目：{{topic}}
 *     请分析以下内容：
 *     1. 该题目涉及的主要研究领域
 *     2. 需要撰写的论文章节
 *   
 *   dynamic_addition: |
 *     当前情况：{{situation}}
 *     瓶颈分析：{{bottleneck}}
 * 
 * variables:
 *   - name: topic
 *     description: "用户输入的论文题目"
 *     required: true
 *   - name: situation
 *     description: "当前流程的具体情况描述"
 *     required: false
 * 
 * metadata:
 *   author: "System"
 *   created_at: "2024-01-01T00:00:00Z"
 *   tags: ["decision", "task-allocation"]
 * ```
 */
export interface PromptFileStructure {
  version: string;
  role: string; // 使用string而非AgentRole以支持自定义角色
  description: string;
  system_prompt: string; // YAML使用snake_case
  templates: Record<string, string>;
  variables: Array<{
    name: string;
    description: string;
    required?: boolean;
    default_value?: string; // YAML使用snake_case
  }>;
  metadata?: {
    author?: string;
    created_at?: string; // YAML使用snake_case
    updated_at?: string; // YAML使用snake_case
    tags?: string[];
    notes?: string;
  };
}

/**
 * 加载的提示词实例
 * 包含已解析的模板和变量值
 */
export interface LoadedPrompt {
  template: PromptTemplate; // 原始模板
  resolvedSystemPrompt: string; // 已替换变量的系统提示词
  resolvedTemplates: Record<string, string>; // 已替换变量的模板
  variables: Record<string, string>; // 实际使用的变量值
}

/**
 * 变量替换选项
 * 用于控制变量替换行为
 */
export interface VariableSubstitutionOptions {
  strict?: boolean; // 严格模式：未提供的必需变量会抛出错误（默认true）
  keepUnresolved?: boolean; // 保留未解析的变量占位符（默认false）
  prefix?: string; // 变量前缀（默认"{{"）
  suffix?: string; // 变量后缀（默认"}}"）
}

/**
 * 提示词验证结果
 */
export interface PromptValidationResult {
  isValid: boolean; // 是否有效
  errors: PromptValidationError[]; // 错误列表
  warnings: PromptValidationWarning[]; // 警告列表
}

/**
 * 提示词验证错误
 */
export interface PromptValidationError {
  field: string; // 错误字段
  message: string; // 错误信息
  value?: unknown; // 错误值（可选）
}

/**
 * 提示词验证警告
 */
export interface PromptValidationWarning {
  field: string; // 警告字段
  message: string; // 警告信息
  suggestion?: string; // 修复建议（可选）
}

/**
 * 提示词加载错误
 */
export class PromptLoadError extends Error {
  constructor(
    message: string,
    public readonly filePath: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'PromptLoadError';
  }
}

/**
 * 变量替换错误
 */
export class VariableSubstitutionError extends Error {
  constructor(
    message: string,
    public readonly variableName: string,
    public readonly template: string
  ) {
    super(message);
    this.name = 'VariableSubstitutionError';
  }
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * 提示词缓存条目
 * 用于缓存已加载的提示词模板
 */
export interface PromptCacheEntry {
  template: PromptTemplate;
  loadedAt: Date;
  filePath: string;
  fileHash?: string; // 文件哈希，用于检测变化
}

/**
 * 提示词仓库配置
 */
export interface PromptRepositoryConfig {
  basePath: string; // 提示词仓库根目录
  cacheEnabled?: boolean; // 是否启用缓存（默认true）
  watchForChanges?: boolean; // 是否监听文件变化（默认false）
  fileExtension?: string; // 文件扩展名（默认".yaml"）
}

/**
 * 提示词统计信息
 */
export interface PromptStatistics {
  totalPrompts: number; // 总提示词数量
  promptsByRole: Record<AgentRole, number>; // 按角色分组的数量
  totalVariables: number; // 总变量数量
  averageTemplatesPerPrompt: number; // 平均每个提示词的模板数量
  lastUpdated?: Date; // 最后更新时间
}

// ============================================================================
// Constants
// ============================================================================

/**
 * 默认变量替换选项
 */
export const DEFAULT_SUBSTITUTION_OPTIONS: Required<VariableSubstitutionOptions> = {
  strict: true,
  keepUnresolved: false,
  prefix: '{{',
  suffix: '}}',
};

/**
 * 支持的Agent角色列表
 */
export const SUPPORTED_AGENT_ROLES: readonly AgentRole[] = [
  'decision',
  'supervisor',
  'writer',
  'editorial_office',
  'editor_in_chief',
  'deputy_editor',
  'peer_reviewer',
] as const;

/**
 * 提示词文件命名约定
 * 角色名称到文件名的映射
 */
export const PROMPT_FILE_NAMES: Record<AgentRole, string> = {
  decision: 'decision_ai.yaml',
  supervisor: 'supervisor_ai.yaml',
  writer: 'writer.yaml',
  editorial_office: 'editorial_office.yaml',
  editor_in_chief: 'editor_in_chief.yaml',
  deputy_editor: 'deputy_editor.yaml',
  peer_reviewer: 'peer_reviewer.yaml',
};

/**
 * 必需的提示词字段
 */
export const REQUIRED_PROMPT_FIELDS = [
  'version',
  'role',
  'description',
  'system_prompt',
  'templates',
  'variables',
] as const;

/**
 * 提示词版本格式正则表达式
 * 支持语义化版本号（如"1.0", "1.2.3", "2.0.0-beta", "1.0.0-alpha.1"）
 */
export const VERSION_PATTERN = /^\d+\.\d+(\.\d+)?(-[a-zA-Z0-9.]+)?$/;
