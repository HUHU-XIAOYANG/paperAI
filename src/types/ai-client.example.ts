/**
 * AI客户端类型使用示例
 * AI Client type usage examples
 */

import type {
  AIClient,
  AIRequest,
  AIResponse,
  StreamChunk,
  SearchResult,
  AIClientOptions,
  AITool,
} from './ai-client';
import { DEFAULT_RETRY_CONFIG } from './ai-client';
import type { AIServiceConfig } from './config';

// ============================================================================
// 示例1: 非流式请求
// ============================================================================

async function exampleNonStreamingRequest(client: AIClient) {
  const request: AIRequest = {
    prompt: '写一篇关于人工智能的简短介绍',
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
  } catch (error) {
    console.error('请求失败:', error);
  }
}

// ============================================================================
// 示例2: 流式请求
// ============================================================================

async function exampleStreamingRequest(client: AIClient) {
  const request: AIRequest = {
    prompt: '写一篇关于机器学习的文章',
    systemPrompt: '你是一个AI研究专家',
    temperature: 0.8,
    stream: true,
  };

  try {
    const stream = (await client.sendRequest(request)) as AsyncIterable<StreamChunk>;

    console.log('开始流式输出:\n');

    for await (const chunk of stream) {
      // 实时输出内容
      process.stdout.write(chunk.content);

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
  } catch (error) {
    console.error('流式请求失败:', error);
  }
}

// ============================================================================
// 示例3: 验证连接
// ============================================================================

async function exampleValidateConnection(client: AIClient) {
  const config: AIServiceConfig = {
    id: 'openai-gpt4',
    name: 'OpenAI GPT-4',
    apiKey: 'sk-proj-...',
    apiUrl: 'https://api.openai.com/v1',
    model: 'gpt-4',
    provider: 'openai',
    temperature: 0.7,
    maxTokens: 2000,
  };

  console.log('验证AI服务连接...');

  try {
    const isValid = await client.validateConnection(config);

    if (isValid) {
      console.log('✓ 连接成功！');
    } else {
      console.log('✗ 连接失败，请检查配置');
    }
  } catch (error) {
    console.error('验证过程出错:', error);
  }
}

// ============================================================================
// 示例4: 网络搜索
// ============================================================================

async function exampleWebSearch(client: AIClient) {
  const query = '2024年最新的大语言模型研究';

  console.log(`搜索: ${query}\n`);

  try {
    const results: SearchResult[] = await client.performWebSearch(query);

    console.log(`找到 ${results.length} 个结果:\n`);

    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.title}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   摘要: ${result.snippet}`);
      if (result.source) {
        console.log(`   来源: ${result.source}`);
      }
      if (result.publishedDate) {
        console.log(`   发布日期: ${result.publishedDate.toLocaleDateString()}`);
      }
      console.log('');
    });
  } catch (error) {
    console.error('搜索失败:', error);
  }
}

// ============================================================================
// 示例5: 使用工具
// ============================================================================

async function exampleWithTools(client: AIClient) {
  const tools: AITool[] = [
    { type: 'web_search', enabled: true },
  ];

  const request: AIRequest = {
    prompt: '搜索并总结2024年AI领域的重大突破',
    systemPrompt: '你是一个AI研究分析师，擅长总结最新的研究进展',
    temperature: 0.7,
    tools,
  };

  try {
    const response = (await client.sendRequest(request)) as AIResponse;

    console.log('AI分析结果:');
    console.log(response.content);
  } catch (error) {
    console.error('请求失败:', error);
  }
}

// ============================================================================
// 示例6: 配置AI客户端选项
// ============================================================================

function exampleClientOptions(): AIClientOptions {
  const config: AIServiceConfig = {
    id: 'anthropic-claude',
    name: 'Anthropic Claude 3',
    apiKey: 'sk-ant-...',
    apiUrl: 'https://api.anthropic.com/v1',
    model: 'claude-3-opus-20240229',
    provider: 'anthropic',
  };

  const options: AIClientOptions = {
    config,
    retryConfig: DEFAULT_RETRY_CONFIG,
    timeout: 30000, // 30秒超时
    providerConfig: {
      apiVersion: '2023-06-01',
    },
  };

  return options;
}

// ============================================================================
// 示例7: 多个AI服务配置
// ============================================================================

function exampleMultipleServices(): AIServiceConfig[] {
  return [
    {
      id: 'openai-gpt4',
      name: 'OpenAI GPT-4',
      apiKey: 'sk-proj-...',
      apiUrl: 'https://api.openai.com/v1',
      model: 'gpt-4',
      provider: 'openai',
      temperature: 0.7,
      maxTokens: 4000,
    },
    {
      id: 'anthropic-claude',
      name: 'Anthropic Claude 3 Opus',
      apiKey: 'sk-ant-...',
      apiUrl: 'https://api.anthropic.com/v1',
      model: 'claude-3-opus-20240229',
      provider: 'anthropic',
      temperature: 0.8,
      maxTokens: 4000,
    },
    {
      id: 'custom-local',
      name: '本地部署模型',
      apiKey: 'local-key',
      apiUrl: 'http://localhost:8000/v1',
      model: 'llama-3-70b',
      provider: 'custom',
      temperature: 0.9,
      maxTokens: 2000,
    },
  ];
}

// ============================================================================
// 示例8: 错误处理
// ============================================================================

async function exampleErrorHandling(client: AIClient) {
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
        console.error('认证失败: API密钥无效或已过期');
        console.error('请检查配置中的apiKey字段');
        break;

      case 'rate_limit':
        console.error('请求限流: 请求过于频繁');
        console.error('请稍后重试或升级API计划');
        break;

      case 'network':
        console.error('网络错误: 无法连接到AI服务');
        if (error.retryable) {
          console.error('此错误可重试，将自动重试...');
        }
        break;

      case 'timeout':
        console.error('请求超时: AI服务响应时间过长');
        console.error('建议增加timeout配置或减少maxTokens');
        break;

      case 'invalid_request':
        console.error('无效请求: 请求参数不正确');
        console.error('错误详情:', error.details);
        break;

      case 'server_error':
        console.error('服务器错误: AI服务内部错误');
        console.error(`状态码: ${error.statusCode}`);
        break;

      default:
        console.error('未知错误:', error.message);
    }
  }
}

// ============================================================================
// 导出示例函数
// ============================================================================

export {
  exampleNonStreamingRequest,
  exampleStreamingRequest,
  exampleValidateConnection,
  exampleWebSearch,
  exampleWithTools,
  exampleClientOptions,
  exampleMultipleServices,
  exampleErrorHandling,
};
