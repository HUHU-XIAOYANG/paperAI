/**
 * AI服务格式适配器
 * Format Adapters for Different AI Services
 * 
 * 处理不同AI服务提供商的请求和响应格式差异
 * 任务: 5.2 实现HTTP客户端和流式响应处理
 */

import type {
  AIRequest,
  AIResponse,
  StreamChunk,
  TokenUsage,
  FinishReason,
} from '../types/ai-client';

// ============================================================================
// Format Adapter Interface
// ============================================================================

/**
 * 格式适配器接口
 */
export interface FormatAdapter {
  /**
   * 将通用请求格式转换为提供商特定格式
   */
  formatRequest(request: AIRequest, model: string): any;

  /**
   * 将提供商响应转换为通用格式
   */
  parseResponse(response: any): AIResponse;

  /**
   * 解析流式响应数据块
   */
  parseStreamChunk(data: string): StreamChunk | null;
}

// ============================================================================
// OpenAI Format Adapter
// ============================================================================

/**
 * OpenAI格式适配器
 */
export class OpenAIFormatAdapter implements FormatAdapter {
  formatRequest(request: AIRequest, model: string): any {
    const body: any = {
      model,
      messages: [
        ...(request.systemPrompt
          ? [{ role: 'system', content: request.systemPrompt }]
          : []),
        { role: 'user', content: request.prompt },
      ],
      stream: request.stream || false,
    };

    if (request.temperature !== undefined) {
      body.temperature = request.temperature;
    }

    if (request.maxTokens !== undefined) {
      body.max_tokens = request.maxTokens;
    }

    if (request.tools && request.tools.length > 0) {
      // OpenAI工具格式（简化版）
      body.tools = request.tools.map(tool => ({
        type: tool.type,
      }));
    }

    return body;
  }

  parseResponse(response: any): AIResponse {
    const choice = response.choices?.[0];
    if (!choice) {
      throw new Error('无效的OpenAI响应格式');
    }

    return {
      content: choice.message?.content || '',
      usage: this.parseUsage(response.usage),
      finishReason: this.mapFinishReason(choice.finish_reason),
    };
  }

  parseStreamChunk(data: string): StreamChunk | null {
    try {
      const json = JSON.parse(data);
      const choice = json.choices?.[0];

      if (!choice) {
        return null;
      }

      const delta = choice.delta;
      const content = delta?.content || '';
      const finishReason = choice.finish_reason;

      return {
        content,
        isComplete: finishReason !== null && finishReason !== undefined,
        usage: json.usage ? this.parseUsage(json.usage) : undefined,
        finishReason: finishReason ? this.mapFinishReason(finishReason) : undefined,
      };
    } catch (error) {
      console.warn('解析OpenAI流式数据块失败:', error);
      return null;
    }
  }

  private parseUsage(usage: any): TokenUsage {
    return {
      promptTokens: usage?.prompt_tokens || 0,
      completionTokens: usage?.completion_tokens || 0,
      totalTokens: usage?.total_tokens || 0,
    };
  }

  private mapFinishReason(reason: string): FinishReason {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'content_filter':
        return 'content_filter';
      case 'tool_calls':
        return 'tool_calls';
      default:
        return 'stop';
    }
  }
}

// ============================================================================
// Anthropic Format Adapter
// ============================================================================

/**
 * Anthropic格式适配器
 */
export class AnthropicFormatAdapter implements FormatAdapter {
  formatRequest(request: AIRequest, model: string): any {
    const body: any = {
      model,
      messages: [
        { role: 'user', content: request.prompt },
      ],
      stream: request.stream || false,
    };

    if (request.systemPrompt) {
      body.system = request.systemPrompt;
    }

    if (request.temperature !== undefined) {
      body.temperature = request.temperature;
    }

    if (request.maxTokens !== undefined) {
      body.max_tokens = request.maxTokens;
    } else {
      // Anthropic要求必须提供max_tokens
      body.max_tokens = 4096;
    }

    return body;
  }

  parseResponse(response: any): AIResponse {
    if (!response.content || !Array.isArray(response.content)) {
      throw new Error('无效的Anthropic响应格式');
    }

    const textContent = response.content
      .filter((c: any) => c.type === 'text')
      .map((c: any) => c.text)
      .join('');

    return {
      content: textContent,
      usage: this.parseUsage(response.usage),
      finishReason: this.mapFinishReason(response.stop_reason),
    };
  }

  parseStreamChunk(data: string): StreamChunk | null {
    try {
      const json = JSON.parse(data);

      // Anthropic流式事件类型
      switch (json.type) {
        case 'content_block_delta':
          return {
            content: json.delta?.text || '',
            isComplete: false,
          };

        case 'message_delta':
          return {
            content: '',
            isComplete: false,
            usage: json.usage ? this.parseUsage(json.usage) : undefined,
          };

        case 'message_stop':
          return {
            content: '',
            isComplete: true,
            finishReason: this.mapFinishReason(json.stop_reason),
          };

        default:
          return null;
      }
    } catch (error) {
      console.warn('解析Anthropic流式数据块失败:', error);
      return null;
    }
  }

  private parseUsage(usage: any): TokenUsage {
    return {
      promptTokens: usage?.input_tokens || 0,
      completionTokens: usage?.output_tokens || 0,
      totalTokens: (usage?.input_tokens || 0) + (usage?.output_tokens || 0),
    };
  }

  private mapFinishReason(reason: string): FinishReason {
    switch (reason) {
      case 'end_turn':
        return 'stop';
      case 'max_tokens':
        return 'length';
      case 'stop_sequence':
        return 'stop';
      default:
        return 'stop';
    }
  }
}

// ============================================================================
// Custom Format Adapter
// ============================================================================

/**
 * 自定义格式适配器
 * 默认使用OpenAI兼容格式
 */
export class CustomFormatAdapter implements FormatAdapter {
  private openaiAdapter = new OpenAIFormatAdapter();

  formatRequest(request: AIRequest, model: string): any {
    // 默认使用OpenAI格式
    return this.openaiAdapter.formatRequest(request, model);
  }

  parseResponse(response: any): AIResponse {
    // 尝试OpenAI格式
    try {
      return this.openaiAdapter.parseResponse(response);
    } catch {
      // 如果失败，尝试简单格式
      return {
        content: response.content || response.text || '',
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
        finishReason: 'stop',
      };
    }
  }

  parseStreamChunk(data: string): StreamChunk | null {
    // 尝试OpenAI格式
    const chunk = this.openaiAdapter.parseStreamChunk(data);
    if (chunk) {
      return chunk;
    }

    // 如果失败，尝试简单格式
    try {
      const json = JSON.parse(data);
      return {
        content: json.content || json.text || '',
        isComplete: json.done || false,
      };
    } catch {
      return null;
    }
  }
}

// ============================================================================
// Adapter Factory
// ============================================================================

/**
 * 格式适配器工厂
 */
export class FormatAdapterFactory {
  static createAdapter(provider: 'openai' | 'anthropic' | 'custom'): FormatAdapter {
    switch (provider) {
      case 'openai':
        return new OpenAIFormatAdapter();
      case 'anthropic':
        return new AnthropicFormatAdapter();
      case 'custom':
        return new CustomFormatAdapter();
      default:
        return new OpenAIFormatAdapter();
    }
  }
}
