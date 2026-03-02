/**
 * HTTP客户端和流式响应处理
 * HTTP Client and Streaming Response Handler
 * 
 * 需求: 17.1, 17.2 (流式输出)
 * 任务: 5.2 实现HTTP客户端和流式响应处理
 */

import type {
  AIClient,
  AIRequest,
  AIResponse,
  StreamChunk,
  SearchResult,
  AIClientOptions,
  AIClientError,
  RetryConfig,
} from '../types/ai-client';
import { DEFAULT_RETRY_CONFIG } from '../types/ai-client';
import type { AIServiceConfig } from '../types/config';

// ============================================================================
// Base HTTP Client
// ============================================================================

/**
 * 基础HTTP客户端类
 * 提供HTTP请求、重试机制和错误处理
 */
export class BaseHTTPClient {
  protected config: AIServiceConfig;
  protected retryConfig: RetryConfig;
  protected timeout: number;

  constructor(options: AIClientOptions) {
    this.config = options.config;
    this.retryConfig = options.retryConfig || DEFAULT_RETRY_CONFIG;
    this.timeout = options.timeout || 30000; // 默认30秒超时
  }

  /**
   * 执行HTTP请求（带重试机制）
   */
  protected async fetchWithRetry(
    url: string,
    options: RequestInit,
    retryCount = 0
  ): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 检查HTTP错误
      if (!response.ok) {
        throw await this.createErrorFromResponse(response);
      }

      return response;
    } catch (error: any) {
      // 处理超时错误
      if (error.name === 'AbortError') {
        const timeoutError: AIClientError = {
          type: 'timeout',
          message: `请求超时（${this.timeout}ms）`,
          retryable: true,
        };
        throw timeoutError;
      }

      // 处理网络错误
      if (error instanceof TypeError) {
        const networkError: AIClientError = {
          type: 'network',
          message: `网络连接失败: ${error.message}`,
          retryable: true,
        };

        // 如果可重试且未达到最大重试次数，则重试
        if (networkError.retryable && retryCount < this.retryConfig.maxRetries) {
          const delay = this.calculateBackoffDelay(retryCount);
          await this.sleep(delay);
          return this.fetchWithRetry(url, options, retryCount + 1);
        }

        throw networkError;
      }

      // 如果是AIClientError且可重试
      if (this.isAIClientError(error) && error.retryable && retryCount < this.retryConfig.maxRetries) {
        const delay = this.calculateBackoffDelay(retryCount);
        await this.sleep(delay);
        return this.fetchWithRetry(url, options, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * 从HTTP响应创建错误对象
   */
  protected async createErrorFromResponse(response: Response): Promise<AIClientError> {
    const statusCode = response.status;
    let message = response.statusText;
    let details: any;

    try {
      const body = await response.json();
      message = body.error?.message || body.message || message;
      details = body;
    } catch {
      // 无法解析JSON，使用默认消息
    }

    // 根据状态码确定错误类型
    let type: AIClientError['type'] = 'unknown';
    let retryable = false;

    if (statusCode === 401 || statusCode === 403) {
      type = 'authentication';
      retryable = false;
    } else if (statusCode === 429) {
      type = 'rate_limit';
      retryable = true;
    } else if (statusCode === 400 || statusCode === 404 || statusCode === 422) {
      type = 'invalid_request';
      retryable = false;
    } else if (statusCode >= 500) {
      type = 'server_error';
      retryable = true;
    }

    return {
      type,
      message,
      statusCode,
      retryable,
      details,
    };
  }

  /**
   * 计算指数退避延迟
   */
  protected calculateBackoffDelay(retryCount: number): number {
    const delay = Math.min(
      this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, retryCount),
      this.retryConfig.maxDelay
    );
    return delay;
  }

  /**
   * 睡眠函数
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 类型守卫：检查是否为AIClientError
   */
  protected isAIClientError(error: any): error is AIClientError {
    return (
      error &&
      typeof error === 'object' &&
      'type' in error &&
      'message' in error &&
      'retryable' in error
    );
  }
}

// ============================================================================
// SSE Stream Parser
// ============================================================================

/**
 * SSE（Server-Sent Events）流式响应解析器
 */
export class SSEStreamParser {
  /**
   * 解析SSE流
   */
  static async *parseSSEStream(response: Response): AsyncIterable<string> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('响应体不可读');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // 解码数据块
        buffer += decoder.decode(value, { stream: true });

        // 按行分割
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留最后一个不完整的行

        for (const line of lines) {
          const trimmedLine = line.trim();

          // 跳过空行和注释
          if (!trimmedLine || trimmedLine.startsWith(':')) {
            continue;
          }

          // 解析SSE数据行
          if (trimmedLine.startsWith('data: ')) {
            const data = trimmedLine.slice(6); // 移除 "data: " 前缀

            // 检查是否为结束标记
            if (data === '[DONE]') {
              return;
            }

            yield data;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

// ============================================================================
// Export
// ============================================================================

export { DEFAULT_RETRY_CONFIG } from '../types/ai-client';
