/**
 * AI客户端使用示例
 * AI Client Usage Examples
 */

import { createAIClient } from './aiClient';
import type { AIClientOptions, AIRequest, AIResponse, StreamChunk } from '../types/ai-client';
import type { AIServiceConfig } from '../types/config';

// ============================================================================
// 示例1: 创建AI客户端
// ============================================================================

function exampleCreateClient() {
  const config: AIServiceConfig = {
    id: 'openai-gpt4',
    name: 'OpenAI GPT-4',
    apiKey: 'sk-proj-your-api-key-here',
    apiUrl: 'https://api.openai.com/v1',
    model: 'gpt-4',
    provider: 'openai',
    temperature: 0.7,
    maxTokens: 2000,
  };

  const options: AIClientOptions = {
    config,
    retryConfig: {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
    },
    timeout: 30000,
  };

  const client = createAIClient(options);
  return client;
}

// ============================================================================
// 示例2: 非流式请求
// ============================================================================

async function exampleNonStreamingRequest() {
  const client = exampleCreateClient();

  const request: AIRequest = {
    prompt: '请写一篇关于人工智能的简短介绍',
    systemPrompt: '你是一个专业的技术写作助手',
    temperature: 0.7,
    maxTokens: 500,
    stream: false,
  };

  try {
    const response = (await client.sendRequest(request)) as AIResponse;

    console.log('生成的内容:');
    console.log(response.content);
    console.log('\nToken使用统计:');
    console.log(`- 提示词: ${response.usage.promptTokens}`);
    console.log(`- 完成: ${response.usage.completionTokens}`);
    console.log(`- 总计: ${response.usage.totalTokens}`);
    console.log(`\n完成原因: ${response.finishReason}`);
  } catch (error: any) {
    console.error('请求失败:', error.message);
    if (error.type) {
      console.error('错误类型:', error.type);
    }
  }
}

// ============================================================================
// 示例3: 流式请求
// ============================================================================

async function exampleStreamingRequest() {
  const client = exampleCreateClient();

  const request: AIRequest = {
    prompt: '请写一篇关于机器学习的文章',
    systemPrompt: '你是一个AI研究专家',
    temperature: 0.8,
    stream: true,
  };

  try {
    const stream = (await client.sendRequest(request)) as AsyncIterable<StreamChunk>;

    console.log('开始流式输出:\n');

    let fullContent = '';

    for await (const chunk of stream) {
      // 实时输出内容
      if (chunk.content) {
        process.stdout.write(chunk.content);
        fullContent += chunk.content;
      }

      if (chunk.isComplete) {
        console.log('\n\n流式输出完成！');
        if (chunk.usage) {
          console.log(`总共使用了 ${chunk.usage.totalTokens} 个tokens`);
        }
        if (chunk.finishReason) {
          console.log(`完成原因: ${chunk.finishReason}`);
        }
      }
    }

    console.log('\n完整内容长度:', fullContent.length);
  } catch (error: any) {
    console.error('流式请求失败:', error.message);
  }
}

// ============================================================================
// 示例4: 使用Anthropic Claude
// ============================================================================

async function exampleAnthropicClient() {
  const config: AIServiceConfig = {
    id: 'anthropic-claude',
    name: 'Anthropic Claude 3',
    apiKey: 'sk-ant-your-api-key-here',
    apiUrl: 'https://api.anthropic.com/v1',
    model: 'claude-3-opus-20240229',
    provider: 'anthropic',
    temperature: 0.8,
    maxTokens: 4000,
  };

  const client = createAIClient({ config });

  const request: AIRequest = {
    prompt: '解释量子计算的基本原理',
    systemPrompt: '你是一个物理学专家',
    stream: false,
  };

  try {
    const response = (await client.sendRequest(request)) as AIResponse;
    console.log('Claude的回答:');
    console.log(response.content);
  } catch (error: any) {
    console.error('请求失败:', error.message);
  }
}

// ============================================================================
// 示例5: 验证连接
// ============================================================================

async function exampleValidateConnection() {
  const client = exampleCreateClient();

  const config: AIServiceConfig = {
    id: 'test-service',
    name: 'Test Service',
    apiKey: 'test-key',
    apiUrl: 'https://api.test.com/v1',
    model: 'test-model',
    provider: 'openai',
  };

  console.log('验证AI服务连接...');

  try {
    const isValid = await client.validateConnection(config);

    if (isValid) {
      console.log('✓ 连接成功！');
    } else {
      console.log('✗ 连接失败，请检查配置');
    }
  } catch (error: any) {
    console.error('验证过程出错:', error.message);
  }
}

// ============================================================================
// 示例6: 错误处理
// ============================================================================

async function exampleErrorHandling() {
  const client = exampleCreateClient();

  const request: AIRequest = {
    prompt: '测试请求',
    stream: false,
  };

  try {
    const response = (await client.sendRequest(request)) as AIResponse;
    console.log(response.content);
  } catch (error: any) {
    // 根据错误类型进行不同处理
    switch (error.type) {
      case 'authentication':
        console.error('❌ 认证失败: API密钥无效或已过期');
        console.error('   请检查配置中的apiKey字段');
        break;

      case 'rate_limit':
        console.error('❌ 请求限流: 请求过于频繁');
        console.error('   请稍后重试或升级API计划');
        if (error.retryable) {
          console.log('   系统将自动重试...');
        }
        break;

      case 'network':
        console.error('❌ 网络错误: 无法连接到AI服务');
        console.error(`   错误详情: ${error.message}`);
        if (error.retryable) {
          console.log('   系统将自动重试...');
        }
        break;

      case 'timeout':
        console.error('❌ 请求超时: AI服务响应时间过长');
        console.error('   建议增加timeout配置或减少maxTokens');
        break;

      case 'invalid_request':
        console.error('❌ 无效请求: 请求参数不正确');
        console.error('   错误详情:', error.details);
        break;

      case 'server_error':
        console.error('❌ 服务器错误: AI服务内部错误');
        console.error(`   状态码: ${error.statusCode}`);
        if (error.retryable) {
          console.log('   系统将自动重试...');
        }
        break;

      default:
        console.error('❌ 未知错误:', error.message);
    }
  }
}

// ============================================================================
// 示例7: 自定义提供商
// ============================================================================

async function exampleCustomProvider() {
  const config: AIServiceConfig = {
    id: 'local-llama',
    name: '本地Llama模型',
    apiKey: 'local-key',
    apiUrl: 'http://localhost:8000/v1',
    model: 'llama-3-70b',
    provider: 'custom',
    temperature: 0.9,
    maxTokens: 2000,
  };

  const client = createAIClient({ config });

  const request: AIRequest = {
    prompt: '介绍一下开源大语言模型',
    stream: false,
  };

  try {
    const response = (await client.sendRequest(request)) as AIResponse;
    console.log('本地模型的回答:');
    console.log(response.content);
  } catch (error: any) {
    console.error('请求失败:', error.message);
  }
}

// ============================================================================
// 示例8: 流式输出到UI
// ============================================================================

async function exampleStreamToUI(
  onChunk: (content: string) => void,
  onComplete: (usage?: any) => void,
  onError: (error: any) => void
) {
  const client = exampleCreateClient();

  const request: AIRequest = {
    prompt: '写一个关于未来科技的故事',
    stream: true,
  };

  try {
    const stream = (await client.sendRequest(request)) as AsyncIterable<StreamChunk>;

    for await (const chunk of stream) {
      if (chunk.content) {
        onChunk(chunk.content);
      }

      if (chunk.isComplete) {
        onComplete(chunk.usage);
      }
    }
  } catch (error) {
    onError(error);
  }
}

// ============================================================================
// 导出示例函数
// ============================================================================

export {
  exampleCreateClient,
  exampleNonStreamingRequest,
  exampleStreamingRequest,
  exampleAnthropicClient,
  exampleValidateConnection,
  exampleErrorHandling,
  exampleCustomProvider,
  exampleStreamToUI,
};
