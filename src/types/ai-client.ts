/**
 * AI客户端接口和类型定义
 * AI Client interfaces and type definitions
 * 
 * 需求: 2.4 (AI配置管理 - 支持配置多个不同的AI服务)
 * 需求: 17.1, 17.2 (流式输出)
 * 需求: 18.1, 18.2, 18.3 (联网功能)
 */

import type { AIServiceConfig } from './config';

// ============================================================================
// AI Tool Types
// ============================================================================

/**
 * AI工具类型
 */
export type AIToolType = 'web_search' | 'code_execution';

/**
 * AI工具配置
 */
export interface AITool {
  type: AIToolType;
  enabled: boolean;
}

// ============================================================================
// Token Usage Types
// ============================================================================

/**
 * Token使用统计
 */
export interface TokenUsage {
  promptTokens: number; // 提示词token数
  completionTokens: number; // 完成token数
  totalTokens: number; // 总token数
}

// ============================================================================
// AI Request Types
// ============================================================================

/**
 * AI请求参数
 */
export interface AIRequest {
  prompt: string; // 用户提示词
  systemPrompt?: string; // 系统提示词（可选）
  temperature?: number; // 温度参数（0-2，可选）
  maxTokens?: number; // 最大token数（可选）
  stream?: boolean; // 是否使用流式输出（可选，默认false）
  tools?: AITool[]; // 可用工具列表（可选）
}

// ============================================================================
// AI Response Types
// ============================================================================

/**
 * 完成原因
 */
export type FinishReason = 
  | 'stop' // 正常完成
  | 'length' // 达到最大长度
  | 'content_filter' // 内容过滤
  | 'tool_calls' // 工具调用
  | 'error'; // 错误

/**
 * AI响应（非流式）
 */
export interface AIResponse {
  content: string; // 生成的内容
  usage: TokenUsage; // Token使用统计
  finishReason: FinishReason; // 完成原因
}

/**
 * 流式响应数据块
 */
export interface StreamChunk {
  content: string; // 增量内容
  isComplete: boolean; // 是否完成
  usage?: TokenUsage; // Token使用统计（仅在完成时提供）
  finishReason?: FinishReason; // 完成原因（仅在完成时提供）
}

// ============================================================================
// Search Result Types
// ============================================================================

/**
 * 搜索结果
 */
export interface SearchResult {
  title: string; // 标题
  url: string; // URL
  snippet: string; // 摘要
  source?: string; // 来源（可选）
  publishedDate?: Date; // 发布日期（可选）
}

/**
 * 搜索查询记录
 */
export interface SearchQueryRecord {
  id: string; // 查询ID
  query: string; // 查询内容
  timestamp: Date; // 查询时间
  results: SearchResult[]; // 搜索结果
  agentId?: string; // 发起查询的Agent ID（可选）
}

// ============================================================================
// AI Client Interface
// ============================================================================

/**
 * AI客户端接口
 * 
 * 统一的AI服务接口，支持多种AI提供商（OpenAI、Anthropic、自定义）
 */
export interface AIClient {
  /**
   * 发送AI请求
   * 
   * @param request - AI请求参数
   * @returns 如果stream=false，返回AIResponse；如果stream=true，返回AsyncIterable<StreamChunk>
   */
  sendRequest(request: AIRequest): Promise<AIResponse | AsyncIterable<StreamChunk>>;

  /**
   * 验证AI服务连接
   * 
   * @param config - AI服务配置
   * @returns 连接验证结果，包含详细的错误信息
   */
  validateConnection(config: AIServiceConfig): Promise<ConnectionValidationResult>;

  /**
   * 执行网络搜索
   * 
   * @param query - 搜索查询
   * @returns 搜索结果列表
   */
  performWebSearch(query: string): Promise<SearchResult[]>;
}

// ============================================================================
// Provider-Specific Types
// ============================================================================

/**
 * OpenAI特定配置
 */
export interface OpenAIConfig {
  organizationId?: string; // 组织ID（可选）
  apiVersion?: string; // API版本（可选）
}

/**
 * Anthropic特定配置
 */
export interface AnthropicConfig {
  apiVersion?: string; // API版本（可选）
}

/**
 * 自定义提供商配置
 */
export interface CustomProviderConfig {
  headers?: Record<string, string>; // 自定义请求头（可选）
  requestFormat?: 'openai' | 'anthropic' | 'custom'; // 请求格式（可选）
  responseFormat?: 'openai' | 'anthropic' | 'custom'; // 响应格式（可选）
}

/**
 * 提供商特定配置联合类型
 */
export type ProviderSpecificConfig = 
  | OpenAIConfig 
  | AnthropicConfig 
  | CustomProviderConfig;

// ============================================================================
// Connection Validation Types
// ============================================================================

/**
 * 连接验证结果
 */
export interface ConnectionValidationResult {
  isValid: boolean; // 连接是否有效
  provider: string; // 提供商名称
  error?: AIClientError; // 错误信息（如果验证失败）
  latency?: number; // 响应延迟（毫秒，如果验证成功）
  model?: string; // 使用的模型（如果验证成功）
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * AI客户端错误类型
 */
export type AIClientErrorType = 
  | 'network' // 网络错误
  | 'authentication' // 认证错误
  | 'rate_limit' // 限流错误
  | 'invalid_request' // 无效请求
  | 'server_error' // 服务器错误
  | 'timeout' // 超时
  | 'unknown'; // 未知错误
// ============================================================================
// Connection Validation Types
// ============================================================================

/**
 * 连接验证结果
 */
export interface ConnectionValidationResult {
  isValid: boolean; // 连接是否有效
  provider: string; // 提供商名称
  error?: AIClientError; // 错误信息（如果验证失败）
  latency?: number; // 响应延迟（毫秒，如果验证成功）
  model?: string; // 使用的模型（如果验证成功）
}

/**
 * AI客户端错误类型
 */

/**
 * AI客户端错误
 */
export interface AIClientError {
  type: AIClientErrorType;
  message: string;
  statusCode?: number; // HTTP状态码（可选）
  retryable: boolean; // 是否可重试
  details?: unknown; // 错误详情（可选）
}

// ============================================================================
// Retry Configuration
// ============================================================================

/**
 * 重试配置
 */
export interface RetryConfig {
  maxRetries: number; // 最大重试次数
  initialDelay: number; // 初始延迟（毫秒）
  maxDelay: number; // 最大延迟（毫秒）
  backoffMultiplier: number; // 退避倍数
}

/**
 * 默认重试配置
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1秒
  maxDelay: 10000, // 10秒
  backoffMultiplier: 2,
};

// ============================================================================
// Client Options
// ============================================================================

/**
 * 搜索配置（从searchService导入）
 */
export interface SearchConfig {
  provider: 'tavily' | 'serpapi' | 'google' | 'bing';
  apiKey: string;
  maxResults?: number;
  language?: string;
  searchDepth?: 'basic' | 'advanced';
  includeAnswer?: boolean;
  searchEngineId?: string; // Google搜索需要
}

/**
 * AI客户端选项
 */
export interface AIClientOptions {
  config: AIServiceConfig; // AI服务配置
  retryConfig?: RetryConfig; // 重试配置（可选）
  timeout?: number; // 请求超时（毫秒，可选）
  providerConfig?: ProviderSpecificConfig; // 提供商特定配置（可选）
  searchConfig?: SearchConfig; // 搜索服务配置（可选）
}
