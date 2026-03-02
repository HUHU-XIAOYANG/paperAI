/**
 * AI客户端实现
 * AI Client Implementation
 * 
 * 需求: 2.4 (AI配置管理)
 * 需求: 17.1, 17.2 (流式输出)
 * 需求: 18.1, 18.2, 18.3 (联网功能)
 * 任务: 5.2 实现HTTP客户端和流式响应处理
 */

import type {
  AIClient,
  AIRequest,
  AIResponse,
  StreamChunk,
  SearchResult,
  AIClientOptions,
} from '../types/ai-client';
import type { AIServiceConfig } from '../types/config';
import { BaseHTTPClient, SSEStreamParser } from './httpClient';
import { FormatAdapterFactory, type FormatAdapter } from './formatAdapters';
import { SearchServiceFactory, type ISearchService, type SearchConfig } from './searchService';

// ============================================================================
// AI Client Implementation
// ============================================================================

/**
 * AI客户端实现类
 * 支持OpenAI、Anthropic和自定义AI服务
 */
export class AIClientImpl extends BaseHTTPClient implements AIClient {
  private adapter: FormatAdapter;
  private searchService?: ISearchService;

  constructor(options: AIClientOptions) {
    super(options);
    this.adapter = FormatAdapterFactory.createAdapter(this.config.provider);
    
    // 如果配置中包含搜索服务配置，则初始化搜索服务
    if (options.searchConfig) {
      this.searchService = SearchServiceFactory.createSearchService(options.searchConfig);
    }
  }

  /**
   * 发送AI请求
   */
  async sendRequest(request: AIRequest): Promise<AIResponse | AsyncIterable<StreamChunk>> {
    if (request.stream) {
      return this.sendStreamingRequest(request);
    } else {
      return this.sendNonStreamingRequest(request);
    }
  }

  /**
   * 发送非流式请求
   */
  private async sendNonStreamingRequest(request: AIRequest): Promise<AIResponse> {
    const url = this.buildRequestUrl();
    const body = this.adapter.formatRequest(request, this.config.model);

    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return this.adapter.parseResponse(data);
  }

  /**
   * 发送流式请求
   */
  private async sendStreamingRequest(request: AIRequest): Promise<AsyncIterable<StreamChunk>> {
    const url = this.buildRequestUrl();
    const body = this.adapter.formatRequest(request, this.config.model);

    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
    });

    return this.createStreamIterator(response);
  }

  /**
   * 创建流式迭代器
   */
  private async *createStreamIterator(response: Response): AsyncIterable<StreamChunk> {
    let accumulatedContent = '';
    let finalUsage: StreamChunk['usage'] | undefined;
    let finalFinishReason: StreamChunk['finishReason'] | undefined;

    try {
      for await (const data of SSEStreamParser.parseSSEStream(response)) {
        const chunk = this.adapter.parseStreamChunk(data);

        if (chunk) {
          // 累积内容
          if (chunk.content) {
            accumulatedContent += chunk.content;
          }

          // 保存最终的usage和finishReason
          if (chunk.usage) {
            finalUsage = chunk.usage;
          }
          if (chunk.finishReason) {
            finalFinishReason = chunk.finishReason;
          }

          yield chunk;
        }
      }

      // 确保发送完成标记
      yield {
        content: '',
        isComplete: true,
        usage: finalUsage,
        finishReason: finalFinishReason || 'stop',
      };
    } catch (error) {
      console.error('流式响应处理错误:', error);
      throw error;
    }
  }

  /**
   * 验证AI服务连接
   * 提供详细的验证结果，包括错误信息、延迟等
   */
  async validateConnection(config: AIServiceConfig): Promise<import('../types/ai-client').ConnectionValidationResult> {
    const startTime = Date.now();

    try {
      // 创建一个临时客户端实例，禁用重试以快速失败
      const tempClient = new AIClientImpl({
        config,
        retryConfig: { maxRetries: 0, initialDelay: 0, maxDelay: 0, backoffMultiplier: 1 },
        timeout: 10000, // 10秒超时
      });

      // 发送一个简单的测试请求
      const testRequest: AIRequest = {
        prompt: 'Hello',
        maxTokens: 10,
        stream: false,
      };

      await tempClient.sendRequest(testRequest);
      
      const latency = Date.now() - startTime;

      return {
        isValid: true,
        provider: config.provider,
        latency,
        model: config.model,
      };
    } catch (error) {
      const latency = Date.now() - startTime;

      // 解析错误类型
      const aiError = this.parseValidationError(error, config.provider);

      console.error('连接验证失败:', {
        provider: config.provider,
        error: aiError,
        latency,
      });

      return {
        isValid: false,
        provider: config.provider,
        error: aiError,
        latency,
      };
    }
  }

  /**
   * 解析验证错误，提供详细的错误信息
   */
  private parseValidationError(error: unknown, provider: string): import('../types/ai-client').AIClientError {
    // 如果已经是AIClientError，直接使用并增强消息
    if (this.isAIClientError(error)) {
      const enhancedMessage = this.enhanceErrorMessage(error, provider);
      return {
        ...error,
        message: enhancedMessage,
      };
    }

    // 如果是标准Error对象
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      // 网络连接错误
      if (message.includes('fetch') || message.includes('network') || message.includes('enotfound')) {
        return {
          type: 'network',
          message: `网络连接失败: 无法连接到 ${provider} 服务，请检查网络和API URL`,
          retryable: true,
          details: error.message,
        };
      }
      
      // 超时错误
      if (message.includes('timeout') || message.includes('aborted')) {
        return {
          type: 'timeout',
          message: `连接超时: ${provider} 服务响应时间过长`,
          retryable: true,
          details: error.message,
        };
      }
      
      // 其他错误
      return {
        type: 'unknown',
        message: `未知错误: ${error.message}`,
        retryable: false,
        details: error.message,
      };
    }

    // 未知错误类型
    return {
      type: 'unknown',
      message: `验证失败: 发生未知错误`,
      retryable: false,
      details: String(error),
    };
  }

  /**
   * 增强错误消息，添加提供商特定信息
   */
  private enhanceErrorMessage(error: import('../types/ai-client').AIClientError, provider: string): string {
    switch (error.type) {
      case 'authentication':
        return `认证失败: API密钥无效或已过期 (${provider})`;
      case 'rate_limit':
        return `请求频率超限: 请稍后重试 (${provider})`;
      case 'server_error':
        return `服务器错误: ${provider} 服务暂时不可用`;
      case 'invalid_request':
        return `请求无效: 请检查API URL和配置 (${provider})`;
      case 'network':
        return `网络连接失败: 无法连接到 ${provider} 服务，请检查网络和API URL`;
      case 'timeout':
        return `连接超时: ${provider} 服务响应时间过长`;
      default:
        return error.message;
    }
  }

  /**
   * 执行网络搜索
   * 支持多个搜索提供商（Tavily、SerpAPI、Google、Bing）
   */
  async performWebSearch(query: string, agentId?: string): Promise<SearchResult[]> {
    if (!this.searchService) {
      throw new Error('搜索服务未配置，请在AIClientOptions中提供searchConfig');
    }

    try {
      const results = await this.searchService.search(query);
      
      // 记录搜索历史（如果提供了agentId）
      if (agentId) {
        // 搜索服务内部已经记录了历史，这里可以添加额外的日志
        console.log(`Agent ${agentId} 执行搜索: "${query}", 找到 ${results.length} 个结果`);
      }

      return results;
    } catch (error) {
      console.error('网络搜索失败:', error);
      throw error;
    }
  }

  /**
   * 获取搜索历史
   */
  getSearchHistory(agentId?: string) {
    if (!this.searchService) {
      return [];
    }
    return this.searchService.getSearchHistory(agentId);
  }

  /**
   * 清除搜索历史
   */
  clearSearchHistory(): void {
    if (this.searchService) {
      this.searchService.clearSearchHistory();
    }
  }

  /**
   * 构建请求URL
   */
  private buildRequestUrl(): string {
    const baseUrl = this.config.apiUrl.replace(/\/$/, ''); // 移除末尾斜杠

    switch (this.config.provider) {
      case 'openai':
        return `${baseUrl}/chat/completions`;
      case 'anthropic':
        return `${baseUrl}/messages`;
      case 'custom':
        // 自定义提供商可能使用OpenAI兼容端点
        return `${baseUrl}/chat/completions`;
      default:
        return `${baseUrl}/chat/completions`;
    }
  }

  /**
   * 构建请求头
   */
  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    switch (this.config.provider) {
      case 'openai':
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        break;
      case 'anthropic':
        headers['x-api-key'] = this.config.apiKey;
        headers['anthropic-version'] = '2023-06-01';
        break;
      case 'custom':
        // 自定义提供商可能使用不同的认证方式
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        break;
    }

    return headers;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * 创建AI客户端实例
 */
export function createAIClient(options: AIClientOptions): AIClient {
  return new AIClientImpl(options);
}
