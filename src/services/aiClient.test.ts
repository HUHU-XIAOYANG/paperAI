/**
 * AI客户端单元测�?
 * AI Client Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIClientImpl, createAIClient } from './aiClient';
import type { AIClientOptions, AIRequest, AIResponse, StreamChunk } from '../types/ai-client';
import type { AIServiceConfig } from '../types/config';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock fetch
globalThis.fetch = vi.fn() as any;

// Helper to create test config
function createTestConfig(provider: 'openai' | 'anthropic' | 'custom' = 'openai'): AIServiceConfig {
  return {
    id: 'test-service',
    name: 'Test Service',
    apiKey: 'test-api-key',
    apiUrl: 'https://api.test.com/v1',
    model: 'test-model',
    provider,
  };
}

// Helper to create test options
function createTestOptions(provider: 'openai' | 'anthropic' | 'custom' = 'openai'): AIClientOptions {
  return {
    config: createTestConfig(provider),
    retryConfig: {
      maxRetries: 3,
      initialDelay: 100,
      maxDelay: 1000,
      backoffMultiplier: 2,
    },
    timeout: 5000,
  };
}

// ============================================================================
// Tests: Non-Streaming Requests
// ============================================================================

describe('AIClient - Non-Streaming Requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send non-streaming request to OpenAI', async () => {
    const client = new AIClientImpl(createTestOptions('openai'));

    const mockResponse = {
      choices: [
        {
          message: { content: 'Hello, world!' },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 5,
        total_tokens: 15,
      },
    };

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const request: AIRequest = {
      prompt: 'Hello',
      stream: false,
    };

    const response = (await client.sendRequest(request)) as AIResponse;

    expect(response.content).toBe('Hello, world!');
    expect(response.usage.totalTokens).toBe(15);
    expect(response.finishReason).toBe('stop');
  });

  it('should send non-streaming request to Anthropic', async () => {
    const client = new AIClientImpl(createTestOptions('anthropic'));

    const mockResponse = {
      content: [{ type: 'text', text: 'Hello from Claude!' }],
      usage: {
        input_tokens: 10,
        output_tokens: 5,
      },
      stop_reason: 'end_turn',
    };

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const request: AIRequest = {
      prompt: 'Hello',
      stream: false,
    };

    const response = (await client.sendRequest(request)) as AIResponse;

    expect(response.content).toBe('Hello from Claude!');
    expect(response.usage.totalTokens).toBe(15);
    expect(response.finishReason).toBe('stop');
  });

  it('should include system prompt in request', async () => {
    const client = new AIClientImpl(createTestOptions('openai'));

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Response' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      }),
    });

    const request: AIRequest = {
      prompt: 'Hello',
      systemPrompt: 'You are a helpful assistant',
      stream: false,
    };

    await client.sendRequest(request);

    const fetchCall = (globalThis.fetch as any).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);

    expect(body.messages).toHaveLength(2);
    expect(body.messages[0].role).toBe('system');
    expect(body.messages[0].content).toBe('You are a helpful assistant');
  });

  it('should include temperature and maxTokens in request', async () => {
    const client = new AIClientImpl(createTestOptions('openai'));

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Response' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      }),
    });

    const request: AIRequest = {
      prompt: 'Hello',
      temperature: 0.8,
      maxTokens: 100,
      stream: false,
    };

    await client.sendRequest(request);

    const fetchCall = (globalThis.fetch as any).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);

    expect(body.temperature).toBe(0.8);
    expect(body.max_tokens).toBe(100);
  });
});

// ============================================================================
// Tests: Streaming Requests
// ============================================================================

describe('AIClient - Streaming Requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle OpenAI streaming response', async () => {
    const client = new AIClientImpl(createTestOptions('openai'));

    // Mock SSE stream
    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n')
        );
        controller.enqueue(
          new TextEncoder().encode('data: {"choices":[{"delta":{"content":" world"}}]}\n\n')
        );
        controller.enqueue(
          new TextEncoder().encode('data: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\n')
        );
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      body: mockStream,
    });

    const request: AIRequest = {
      prompt: 'Hello',
      stream: true,
    };

    const stream = (await client.sendRequest(request)) as AsyncIterable<StreamChunk>;
    const chunks: StreamChunk[] = [];

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.some(c => c.content.includes('Hello'))).toBe(true);
    const lastChunk = chunks[chunks.length - 1];
    expect(lastChunk?.isComplete).toBe(true);
  });

  it('should accumulate streaming content correctly', async () => {
    const client = new AIClientImpl(createTestOptions('openai'));

    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Part1"}}]}\n\n')
        );
        controller.enqueue(
          new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Part2"}}]}\n\n')
        );
        controller.enqueue(
          new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Part3"}}]}\n\n')
        );
        controller.enqueue(
          new TextEncoder().encode('data: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\n')
        );
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      body: mockStream,
    });

    const request: AIRequest = {
      prompt: 'Test',
      stream: true,
    };

    const stream = (await client.sendRequest(request)) as AsyncIterable<StreamChunk>;
    let fullContent = '';

    for await (const chunk of stream) {
      fullContent += chunk.content;
    }

    expect(fullContent).toBe('Part1Part2Part3');
  });
});

// ============================================================================
// Tests: Error Handling
// ============================================================================

describe('AIClient - Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle authentication error (401)', async () => {
    const client = new AIClientImpl(createTestOptions('openai'));

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ error: { message: 'Invalid API key' } }),
    });

    const request: AIRequest = {
      prompt: 'Hello',
      stream: false,
    };

    await expect(client.sendRequest(request)).rejects.toMatchObject({
      type: 'authentication',
      statusCode: 401,
      retryable: false,
    });
  });

  it('should handle rate limit error (429)', async () => {
    // Use a client with no retries to test the error directly
    const options = createTestOptions('openai');
    options.retryConfig = { maxRetries: 0, initialDelay: 0, maxDelay: 0, backoffMultiplier: 1 };
    const client = new AIClientImpl(options);

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      json: async () => ({ error: { message: 'Rate limit exceeded' } }),
    });

    const request: AIRequest = {
      prompt: 'Hello',
      stream: false,
    };

    await expect(client.sendRequest(request)).rejects.toMatchObject({
      type: 'rate_limit',
      statusCode: 429,
      retryable: true,
    });
  });

  it('should handle server error (500)', async () => {
    // Use a client with no retries to test the error directly
    const options = createTestOptions('openai');
    options.retryConfig = { maxRetries: 0, initialDelay: 0, maxDelay: 0, backoffMultiplier: 1 };
    const client = new AIClientImpl(options);

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ error: { message: 'Server error' } }),
    });

    const request: AIRequest = {
      prompt: 'Hello',
      stream: false,
    };

    await expect(client.sendRequest(request)).rejects.toMatchObject({
      type: 'server_error',
      statusCode: 500,
      retryable: true,
    });
  });

  it('should handle network error', async () => {
    const client = new AIClientImpl(createTestOptions('openai'));

    (globalThis.fetch as any).mockRejectedValueOnce(new TypeError('Network error'));

    const request: AIRequest = {
      prompt: 'Hello',
      stream: false,
    };

    await expect(client.sendRequest(request)).rejects.toMatchObject({
      type: 'network',
      retryable: true,
    });
  });
});

// ============================================================================
// Tests: Retry Mechanism
// ============================================================================

describe('AIClient - Retry Mechanism', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should retry on retryable errors', async () => {
    const client = new AIClientImpl(createTestOptions('openai'));

    // First two calls fail, third succeeds
    (globalThis.fetch as any)
      .mockRejectedValueOnce(new TypeError('Network error'))
      .mockRejectedValueOnce(new TypeError('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Success' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        }),
      });

    const request: AIRequest = {
      prompt: 'Hello',
      stream: false,
    };

    const response = (await client.sendRequest(request)) as AIResponse;

    expect(response.content).toBe('Success');
    expect((globalThis.fetch as any).mock.calls.length).toBe(3);
  });

  it('should not retry on non-retryable errors', async () => {
    const client = new AIClientImpl(createTestOptions('openai'));

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ error: { message: 'Invalid API key' } }),
    });

    const request: AIRequest = {
      prompt: 'Hello',
      stream: false,
    };

    await expect(client.sendRequest(request)).rejects.toMatchObject({
      type: 'authentication',
    });

    expect((globalThis.fetch as any).mock.calls.length).toBe(1);
  });

  it('should respect maxRetries limit', async () => {
    const client = new AIClientImpl(createTestOptions('openai'));

    (globalThis.fetch as any).mockRejectedValue(new TypeError('Network error'));

    const request: AIRequest = {
      prompt: 'Hello',
      stream: false,
    };

    await expect(client.sendRequest(request)).rejects.toMatchObject({
      type: 'network',
    });

    // Should try 1 initial + 3 retries = 4 times
    expect((globalThis.fetch as any).mock.calls.length).toBe(4);
  });
});

// ============================================================================
// Tests: Connection Validation
// ============================================================================

describe('AIClient - Connection Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate successful OpenAI connection with detailed result', async () => {
    const client = new AIClientImpl(createTestOptions('openai'));

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Test' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      }),
    });

    const config = createTestConfig('openai');
    const result = await client.validateConnection(config);

    expect(result.isValid).toBe(true);
    expect(result.provider).toBe('openai');
    expect(result.model).toBe('test-model');
    expect(result.latency).toBeGreaterThanOrEqual(0);
    expect(result.error).toBeUndefined();
  });

  it('should validate successful Anthropic connection', async () => {
    const client = new AIClientImpl(createTestOptions('anthropic'));

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: 'Test' }],
        usage: { input_tokens: 1, output_tokens: 1 },
        stop_reason: 'end_turn',
      }),
    });

    const config = createTestConfig('anthropic');
    const result = await client.validateConnection(config);

    expect(result.isValid).toBe(true);
    expect(result.provider).toBe('anthropic');
    expect(result.latency).toBeGreaterThanOrEqual(0);
  });

  it('should validate successful custom provider connection', async () => {
    const client = new AIClientImpl(createTestOptions('custom'));

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Test' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      }),
    });

    const config = createTestConfig('custom');
    const result = await client.validateConnection(config);

    expect(result.isValid).toBe(true);
    expect(result.provider).toBe('custom');
  });

  it('should detect invalid API key (401)', async () => {
    const client = new AIClientImpl(createTestOptions('openai'));

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ error: { message: 'Invalid API key' } }),
    });

    const config = createTestConfig('openai');
    const result = await client.validateConnection(config);

    expect(result.isValid).toBe(false);
    expect(result.provider).toBe('openai');
    expect(result.error).toBeDefined();
    expect(result.error?.type).toBe('authentication');
    expect(result.error?.statusCode).toBe(401);
    expect(result.error?.retryable).toBe(false);
    expect(result.error?.message).toContain('认证失败');
    expect(result.error?.message).toContain('API密钥无效');
  });

  it('should detect forbidden access (403)', async () => {
    const client = new AIClientImpl(createTestOptions('openai'));

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      json: async () => ({ error: { message: 'Access denied' } }),
    });

    const config = createTestConfig('openai');
    const result = await client.validateConnection(config);

    expect(result.isValid).toBe(false);
    expect(result.error?.type).toBe('authentication');
    expect(result.error?.statusCode).toBe(403);
    expect(result.error?.retryable).toBe(false);
  });

  it('should detect rate limit error (429)', async () => {
    const client = new AIClientImpl(createTestOptions('openai'));

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      json: async () => ({ error: { message: 'Rate limit exceeded' } }),
    });

    const config = createTestConfig('openai');
    const result = await client.validateConnection(config);

    expect(result.isValid).toBe(false);
    expect(result.error?.type).toBe('rate_limit');
    expect(result.error?.statusCode).toBe(429);
    expect(result.error?.retryable).toBe(true);
    expect(result.error?.message).toContain('请求频率超限');
  });

  it('should detect invalid request (400)', async () => {
    const client = new AIClientImpl(createTestOptions('openai'));

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ error: { message: 'Invalid request' } }),
    });

    const config = createTestConfig('openai');
    const result = await client.validateConnection(config);

    expect(result.isValid).toBe(false);
    expect(result.error?.type).toBe('invalid_request');
    expect(result.error?.statusCode).toBe(400);
    expect(result.error?.retryable).toBe(false);
    expect(result.error?.message).toContain('请求无效');
  });

  it('should detect server error (500)', async () => {
    const client = new AIClientImpl(createTestOptions('openai'));

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ error: { message: 'Server error' } }),
    });

    const config = createTestConfig('openai');
    const result = await client.validateConnection(config);

    expect(result.isValid).toBe(false);
    expect(result.error?.type).toBe('server_error');
    expect(result.error?.statusCode).toBe(500);
    expect(result.error?.retryable).toBe(true);
    expect(result.error?.message).toContain('服务器错误');
  });

  it('should detect network connection error', async () => {
    const client = new AIClientImpl(createTestOptions('openai'));

    (globalThis.fetch as any).mockRejectedValueOnce(
      new TypeError('Failed to fetch')
    );

    const config = createTestConfig('openai');
    const result = await client.validateConnection(config);

    expect(result.isValid).toBe(false);
    expect(result.error?.type).toBe('network');
    expect(result.error?.retryable).toBe(true);
    expect(result.error?.message).toContain('网络连接失败');
  });

  it('should detect DNS resolution error', async () => {
    const client = new AIClientImpl(createTestOptions('openai'));

    const dnsError = new Error('getaddrinfo ENOTFOUND api.test.com');
    (globalThis.fetch as any).mockRejectedValueOnce(dnsError);

    const config = createTestConfig('openai');
    const result = await client.validateConnection(config);

    expect(result.isValid).toBe(false);
    expect(result.error?.type).toBe('network');
    expect(result.error?.message).toContain('网络连接失败');
  });

  it('should detect timeout error', async () => {
    const client = new AIClientImpl(createTestOptions('openai'));

    const timeoutError = new Error('Request timeout');
    (globalThis.fetch as any).mockRejectedValueOnce(timeoutError);

    const config = createTestConfig('openai');
    const result = await client.validateConnection(config);

    expect(result.isValid).toBe(false);
    expect(result.error?.type).toBe('timeout');
    expect(result.error?.retryable).toBe(true);
    expect(result.error?.message).toContain('连接超时');
  });

  it('should handle wrong API URL gracefully', async () => {
    const client = new AIClientImpl(createTestOptions('openai'));

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ error: { message: 'Endpoint not found' } }),
    });

    const config = createTestConfig('openai');
    const result = await client.validateConnection(config);

    expect(result.isValid).toBe(false);
    expect(result.error?.type).toBe('invalid_request');
    expect(result.error?.message).toContain('请求无效');
  });

  it('should measure connection latency', async () => {
    const client = new AIClientImpl(createTestOptions('openai'));

    // Simulate a delay
    (globalThis.fetch as any).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({
                  choices: [{ message: { content: 'Test' }, finish_reason: 'stop' }],
                  usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
                }),
              }),
            100
          )
        )
    );

    const config = createTestConfig('openai');
    const result = await client.validateConnection(config);

    expect(result.isValid).toBe(true);
    expect(result.latency).toBeGreaterThanOrEqual(100);
  });

  it('should not retry during validation', async () => {
    const client = new AIClientImpl(createTestOptions('openai'));

    (globalThis.fetch as any).mockRejectedValue(new TypeError('Network error'));

    const config = createTestConfig('openai');
    await client.validateConnection(config);

    // Should only try once (no retries during validation)
    expect((globalThis.fetch as any).mock.calls.length).toBe(1);
  });

  it('should handle unknown error types', async () => {
    const client = new AIClientImpl(createTestOptions('openai'));

    (globalThis.fetch as any).mockRejectedValueOnce('Some weird error');

    const config = createTestConfig('openai');
    const result = await client.validateConnection(config);

    expect(result.isValid).toBe(false);
    expect(result.error?.type).toBe('unknown');
    expect(result.error?.retryable).toBe(false);
  });

  it('should include provider name in all error messages', async () => {
    const providers: Array<'openai' | 'anthropic' | 'custom'> = ['openai', 'anthropic', 'custom'];

    for (const provider of providers) {
      const client = new AIClientImpl(createTestOptions(provider));

      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: { message: 'Invalid API key' } }),
      });

      const config = createTestConfig(provider);
      const result = await client.validateConnection(config);

      expect(result.provider).toBe(provider);
      expect(result.error?.message).toContain(provider);
    }
  });
});

// ============================================================================
// Tests: Factory Function
// ============================================================================

describe('createAIClient', () => {
  it('should create AIClient instance', () => {
    const options = createTestOptions('openai');
    const client = createAIClient(options);

    expect(client).toBeDefined();
    expect(typeof client.sendRequest).toBe('function');
    expect(typeof client.validateConnection).toBe('function');
    expect(typeof client.performWebSearch).toBe('function');
  });
});
