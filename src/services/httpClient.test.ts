/**
 * HTTP客户端和重试机制测试
 * HTTP Client and Retry Mechanism Tests
 * 
 * 任务: 5.6 实现网络错误处理和重试机制
 * 验证: 错误处理策略
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BaseHTTPClient, SSEStreamParser } from './httpClient';
import type { AIClientOptions, AIClientError } from '../types/ai-client';
import type { AIServiceConfig } from '../types/config';

// ============================================================================
// Mock Setup
// ============================================================================

// 创建模拟的fetch函数
const createMockFetch = () => {
  return vi.fn();
};

// 创建测试用的AI服务配置
const createTestConfig = (): AIServiceConfig => ({
  id: 'test-service-id',
  name: 'test-service',
  apiKey: 'test-key',
  apiUrl: 'https://api.test.com',
  model: 'test-model',
  provider: 'openai',
});

// 创建测试用的客户端选项
const createTestOptions = (overrides?: Partial<AIClientOptions>): AIClientOptions => ({
  config: createTestConfig(),
  retryConfig: {
    maxRetries: 3,
    initialDelay: 100, // 使用较短的延迟以加快测试
    maxDelay: 1000,
    backoffMultiplier: 2,
  },
  timeout: 5000,
  ...overrides,
});

// 测试用的HTTP客户端类（暴露protected方法用于测试）
class TestHTTPClient extends BaseHTTPClient {
  public async testFetchWithRetry(url: string, options: RequestInit, retryCount = 0) {
    return this.fetchWithRetry(url, options, retryCount);
  }

  public async testCreateErrorFromResponse(response: Response) {
    return this.createErrorFromResponse(response);
  }

  public testCalculateBackoffDelay(retryCount: number) {
    return this.calculateBackoffDelay(retryCount);
  }

  public testIsAIClientError(error: any) {
    return this.isAIClientError(error);
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('BaseHTTPClient', () => {
  let client: TestHTTPClient;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    client = new TestHTTPClient(createTestOptions());
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // 指数退避计算测试
  // ==========================================================================

  describe('calculateBackoffDelay', () => {
    it('应该为第一次重试返回初始延迟', () => {
      const delay = client.testCalculateBackoffDelay(0);
      expect(delay).toBe(100); // initialDelay
    });

    it('应该为后续重试应用指数退避', () => {
      const delay1 = client.testCalculateBackoffDelay(1);
      const delay2 = client.testCalculateBackoffDelay(2);
      
      expect(delay1).toBe(200); // 100 * 2^1
      expect(delay2).toBe(400); // 100 * 2^2
    });

    it('应该不超过最大延迟', () => {
      const delay = client.testCalculateBackoffDelay(10); // 非常大的重试次数
      expect(delay).toBeLessThanOrEqual(1000); // maxDelay
    });
  });

  // ==========================================================================
  // 错误类型识别测试
  // ==========================================================================

  describe('isAIClientError', () => {
    it('应该识别有效的AIClientError', () => {
      const error: AIClientError = {
        type: 'network',
        message: 'Network error',
        retryable: true,
      };
      expect(client.testIsAIClientError(error)).toBe(true);
    });

    it('应该拒绝普通Error对象', () => {
      const error = new Error('Regular error');
      expect(client.testIsAIClientError(error)).toBe(false);
    });

    it('应该拒绝null和undefined', () => {
      expect(client.testIsAIClientError(null)).toBeFalsy();
      expect(client.testIsAIClientError(undefined)).toBeFalsy();
    });
  });

  // ==========================================================================
  // HTTP响应错误创建测试
  // ==========================================================================

  describe('createErrorFromResponse', () => {
    it('应该为401状态码创建认证错误（不可重试）', async () => {
      const response = new Response(JSON.stringify({ error: { message: 'Unauthorized' } }), {
        status: 401,
        statusText: 'Unauthorized',
      });

      const error = await client.testCreateErrorFromResponse(response);
      
      expect(error.type).toBe('authentication');
      expect(error.retryable).toBe(false);
      expect(error.statusCode).toBe(401);
    });

    it('应该为403状态码创建认证错误（不可重试）', async () => {
      const response = new Response(null, {
        status: 403,
        statusText: 'Forbidden',
      });

      const error = await client.testCreateErrorFromResponse(response);
      
      expect(error.type).toBe('authentication');
      expect(error.retryable).toBe(false);
      expect(error.statusCode).toBe(403);
    });

    it('应该为429状态码创建限流错误（可重试）', async () => {
      const response = new Response(JSON.stringify({ message: 'Rate limit exceeded' }), {
        status: 429,
        statusText: 'Too Many Requests',
      });

      const error = await client.testCreateErrorFromResponse(response);
      
      expect(error.type).toBe('rate_limit');
      expect(error.retryable).toBe(true);
      expect(error.statusCode).toBe(429);
    });

    it('应该为400状态码创建无效请求错误（不可重试）', async () => {
      const response = new Response(JSON.stringify({ error: { message: 'Bad request' } }), {
        status: 400,
        statusText: 'Bad Request',
      });

      const error = await client.testCreateErrorFromResponse(response);
      
      expect(error.type).toBe('invalid_request');
      expect(error.retryable).toBe(false);
      expect(error.statusCode).toBe(400);
    });

    it('应该为422状态码创建无效请求错误（不可重试）', async () => {
      const response = new Response(null, {
        status: 422,
        statusText: 'Unprocessable Entity',
      });

      const error = await client.testCreateErrorFromResponse(response);
      
      expect(error.type).toBe('invalid_request');
      expect(error.retryable).toBe(false);
    });

    it('应该为500状态码创建服务器错误（可重试）', async () => {
      const response = new Response(JSON.stringify({ message: 'Internal server error' }), {
        status: 500,
        statusText: 'Internal Server Error',
      });

      const error = await client.testCreateErrorFromResponse(response);
      
      expect(error.type).toBe('server_error');
      expect(error.retryable).toBe(true);
      expect(error.statusCode).toBe(500);
    });

    it('应该为503状态码创建服务器错误（可重试）', async () => {
      const response = new Response(null, {
        status: 503,
        statusText: 'Service Unavailable',
      });

      const error = await client.testCreateErrorFromResponse(response);
      
      expect(error.type).toBe('server_error');
      expect(error.retryable).toBe(true);
    });
  });

  // ==========================================================================
  // 网络错误处理和重试测试
  // ==========================================================================

  describe('fetchWithRetry - Network Errors', () => {
    it('应该在网络错误时重试（最多3次）', async () => {
      const mockFetch = vi.fn()
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockRejectedValueOnce(new TypeError('Network error'));

      global.fetch = mockFetch;

      await expect(
        client.testFetchWithRetry('https://api.test.com/test', {})
      ).rejects.toMatchObject({
        type: 'network',
        retryable: true,
      });

      // 应该调用4次：初始请求 + 3次重试
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it('应该在重试成功后返回响应', async () => {
      const successResponse = new Response(JSON.stringify({ success: true }), {
        status: 200,
      });

      const mockFetch = vi.fn()
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockResolvedValueOnce(successResponse);

      global.fetch = mockFetch;

      const response = await client.testFetchWithRetry('https://api.test.com/test', {});
      
      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(3); // 初始 + 2次重试
    });
  });

  // ==========================================================================
  // 限流错误重试测试
  // ==========================================================================

  describe('fetchWithRetry - Rate Limit Errors', () => {
    it('应该在429错误时重试', async () => {
      const rateLimitResponse = new Response(JSON.stringify({ error: 'Rate limit' }), {
        status: 429,
      });
      const successResponse = new Response(JSON.stringify({ success: true }), {
        status: 200,
      });

      const mockFetch = vi.fn()
        .mockResolvedValueOnce(rateLimitResponse)
        .mockResolvedValueOnce(rateLimitResponse)
        .mockResolvedValueOnce(successResponse);

      global.fetch = mockFetch;

      const response = await client.testFetchWithRetry('https://api.test.com/test', {});
      
      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  // ==========================================================================
  // 服务器错误重试测试
  // ==========================================================================

  describe('fetchWithRetry - Server Errors', () => {
    it('应该在5xx错误时重试', async () => {
      const serverErrorResponse = new Response(null, { status: 500 });
      const successResponse = new Response(JSON.stringify({ success: true }), {
        status: 200,
      });

      const mockFetch = vi.fn()
        .mockResolvedValueOnce(serverErrorResponse)
        .mockResolvedValueOnce(successResponse);

      global.fetch = mockFetch;

      const response = await client.testFetchWithRetry('https://api.test.com/test', {});
      
      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  // ==========================================================================
  // 不可重试错误测试
  // ==========================================================================

  describe('fetchWithRetry - Non-Retryable Errors', () => {
    it('不应该在401错误时重试', async () => {
      const authErrorResponse = new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });

      const mockFetch = vi.fn().mockResolvedValue(authErrorResponse);
      global.fetch = mockFetch;

      await expect(
        client.testFetchWithRetry('https://api.test.com/test', {})
      ).rejects.toMatchObject({
        type: 'authentication',
        retryable: false,
      });

      // 应该只调用1次，不重试
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('不应该在400错误时重试', async () => {
      const badRequestResponse = new Response(JSON.stringify({ error: 'Bad request' }), {
        status: 400,
      });

      const mockFetch = vi.fn().mockResolvedValue(badRequestResponse);
      global.fetch = mockFetch;

      await expect(
        client.testFetchWithRetry('https://api.test.com/test', {})
      ).rejects.toMatchObject({
        type: 'invalid_request',
        retryable: false,
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // 超时处理测试
  // ==========================================================================

  describe('fetchWithRetry - Timeout', () => {
    it('应该在超时时创建超时错误', async () => {
      // 模拟AbortError
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      
      const mockFetch = vi.fn().mockRejectedValue(abortError);
      global.fetch = mockFetch;

      // 使用禁用重试的配置以加快测试
      const noRetryClient = new TestHTTPClient(createTestOptions({ 
        retryConfig: {
          maxRetries: 0,
          initialDelay: 100,
          maxDelay: 1000,
          backoffMultiplier: 2,
        }
      }));

      await expect(
        noRetryClient.testFetchWithRetry('https://api.test.com/test', {})
      ).rejects.toMatchObject({
        type: 'timeout',
        retryable: true,
        message: expect.stringContaining('请求超时'),
      });
    });
  });

  // ==========================================================================
  // 指数退避延迟测试
  // ==========================================================================

  describe('fetchWithRetry - Exponential Backoff', () => {
    it('应该在重试之间应用指数退避延迟', async () => {
      const startTime = Date.now();
      
      const mockFetch = vi.fn()
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockRejectedValueOnce(new TypeError('Network error'));

      global.fetch = mockFetch;

      await expect(
        client.testFetchWithRetry('https://api.test.com/test', {})
      ).rejects.toMatchObject({
        type: 'network',
      });

      const elapsedTime = Date.now() - startTime;
      
      // 预期延迟: 100ms + 200ms + 400ms = 700ms
      // 允许一些误差
      expect(elapsedTime).toBeGreaterThanOrEqual(600);
      expect(elapsedTime).toBeLessThan(1000);
    });
  });
});

// ============================================================================
// SSE Stream Parser Tests
// ============================================================================

describe('SSEStreamParser', () => {
  describe('parseSSEStream', () => {
    it('应该解析SSE数据流', async () => {
      const sseData = 'data: {"content":"Hello"}\n\ndata: {"content":" World"}\n\ndata: [DONE]\n\n';
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(sseData));
          controller.close();
        },
      });
      const response = new Response(stream);

      const chunks: string[] = [];
      for await (const chunk of SSEStreamParser.parseSSEStream(response)) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(2);
      expect(chunks[0]).toBe('{"content":"Hello"}');
      expect(chunks[1]).toBe('{"content":" World"}');
    });

    it('应该跳过空行和注释', async () => {
      const sseData = ': comment\n\ndata: {"content":"test"}\n\n\n\ndata: [DONE]\n\n';
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(sseData));
          controller.close();
        },
      });
      const response = new Response(stream);

      const chunks: string[] = [];
      for await (const chunk of SSEStreamParser.parseSSEStream(response)) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe('{"content":"test"}');
    });

    it('应该在[DONE]标记时停止', async () => {
      const sseData = 'data: {"content":"first"}\n\ndata: [DONE]\n\ndata: {"content":"after done"}\n\n';
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(sseData));
          controller.close();
        },
      });
      const response = new Response(stream);

      const chunks: string[] = [];
      for await (const chunk of SSEStreamParser.parseSSEStream(response)) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe('{"content":"first"}');
    });

    it('应该处理分块传输的数据', async () => {
      // 模拟分块传输：数据被分成多个块
      const chunk1 = new TextEncoder().encode('data: {"con');
      const chunk2 = new TextEncoder().encode('tent":"test"}\n\n');
      const chunk3 = new TextEncoder().encode('data: [DONE]\n\n');

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(chunk1);
          controller.enqueue(chunk2);
          controller.enqueue(chunk3);
          controller.close();
        },
      });

      const response = new Response(stream);

      const chunks: string[] = [];
      for await (const chunk of SSEStreamParser.parseSSEStream(response)) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe('{"content":"test"}');
    });

    it('应该在响应体不可读时抛出错误', async () => {
      const response = new Response(null);

      await expect(async () => {
        for await (const chunk of SSEStreamParser.parseSSEStream(response)) {
          // 不应该执行到这里
        }
      }).rejects.toThrow('响应体不可读');
    });
  });
});
