/**
 * API连接验证示例
 * Connection Validation Examples
 * 
 * 演示如何使用增强的API连接验证功能
 */

import { createAIClient } from './aiClient';
import type { AIServiceConfig } from '../types/config';
import type { ConnectionValidationResult } from '../types/ai-client';

// ============================================================================
// 示例 1: 验证OpenAI连接
// ============================================================================

async function validateOpenAIConnection() {
  const config: AIServiceConfig = {
    id: 'openai-gpt4',
    name: 'OpenAI GPT-4',
    apiKey: 'sk-your-api-key-here',
    apiUrl: 'https://api.openai.com/v1',
    model: 'gpt-4',
    provider: 'openai',
  };

  const client = createAIClient({
    config,
    timeout: 10000, // 10秒超时
  });

  console.log('正在验证OpenAI连接...');
  const result = await client.validateConnection(config);

  if (result.isValid) {
    console.log('✓ 连接成功!');
    console.log(`  提供商: ${result.provider}`);
    console.log(`  模型: ${result.model}`);
    console.log(`  延迟: ${result.latency}ms`);
  } else {
    console.log('✗ 连接失败');
    console.log(`  错误类型: ${result.error?.type}`);
    console.log(`  错误信息: ${result.error?.message}`);
    console.log(`  可重试: ${result.error?.retryable ? '是' : '否'}`);
    if (result.error?.statusCode) {
      console.log(`  HTTP状态码: ${result.error.statusCode}`);
    }
  }

  return result;
}

// ============================================================================
// 示例 2: 验证Anthropic连接
// ============================================================================

async function validateAnthropicConnection() {
  const config: AIServiceConfig = {
    id: 'anthropic-claude',
    name: 'Anthropic Claude',
    apiKey: 'sk-ant-your-api-key-here',
    apiUrl: 'https://api.anthropic.com/v1',
    model: 'claude-3-opus-20240229',
    provider: 'anthropic',
  };

  const client = createAIClient({
    config,
    timeout: 10000,
  });

  console.log('正在验证Anthropic连接...');
  const result = await client.validateConnection(config);

  displayValidationResult(result);
  return result;
}

// ============================================================================
// 示例 3: 验证自定义提供商连接
// ============================================================================

async function validateCustomProviderConnection() {
  const config: AIServiceConfig = {
    id: 'custom-local',
    name: 'Local LLM',
    apiKey: 'not-required',
    apiUrl: 'http://localhost:8080/v1',
    model: 'llama-2-7b',
    provider: 'custom',
  };

  const client = createAIClient({
    config,
    timeout: 10000,
  });

  console.log('正在验证自定义提供商连接...');
  const result = await client.validateConnection(config);

  displayValidationResult(result);
  return result;
}

// ============================================================================
// 示例 4: 批量验证多个配置
// ============================================================================

async function validateMultipleConfigs() {
  const configs: AIServiceConfig[] = [
    {
      id: 'openai-gpt4',
      name: 'OpenAI GPT-4',
      apiKey: 'sk-your-api-key-here',
      apiUrl: 'https://api.openai.com/v1',
      model: 'gpt-4',
      provider: 'openai',
    },
    {
      id: 'anthropic-claude',
      name: 'Anthropic Claude',
      apiKey: 'sk-ant-your-api-key-here',
      apiUrl: 'https://api.anthropic.com/v1',
      model: 'claude-3-opus-20240229',
      provider: 'anthropic',
    },
    {
      id: 'custom-local',
      name: 'Local LLM',
      apiKey: 'not-required',
      apiUrl: 'http://localhost:8080/v1',
      model: 'llama-2-7b',
      provider: 'custom',
    },
  ];

  console.log(`正在验证 ${configs.length} 个AI服务配置...\n`);

  const results: ConnectionValidationResult[] = [];

  for (const config of configs) {
    const client = createAIClient({ config, timeout: 10000 });
    const result = await client.validateConnection(config);
    results.push(result);

    console.log(`\n[${config.name}]`);
    displayValidationResult(result);
  }

  // 统计结果
  const validCount = results.filter(r => r.isValid).length;
  const invalidCount = results.length - validCount;

  console.log('\n=== 验证摘要 ===');
  console.log(`总计: ${results.length}`);
  console.log(`成功: ${validCount}`);
  console.log(`失败: ${invalidCount}`);

  return results;
}

// ============================================================================
// 示例 5: 处理不同类型的错误
// ============================================================================

async function handleValidationErrors() {
  const config: AIServiceConfig = {
    id: 'test-service',
    name: 'Test Service',
    apiKey: 'invalid-key',
    apiUrl: 'https://api.example.com/v1',
    model: 'test-model',
    provider: 'openai',
  };

  const client = createAIClient({ config, timeout: 5000 });
  const result = await client.validateConnection(config);

  if (!result.isValid && result.error) {
    switch (result.error.type) {
      case 'authentication':
        console.log('认证错误: 请检查API密钥是否正确');
        console.log('建议: 前往提供商网站重新生成API密钥');
        break;

      case 'network':
        console.log('网络错误: 无法连接到服务器');
        console.log('建议: 检查网络连接和API URL是否正确');
        break;

      case 'timeout':
        console.log('超时错误: 服务器响应时间过长');
        console.log('建议: 稍后重试或增加超时时间');
        break;

      case 'rate_limit':
        console.log('限流错误: 请求过于频繁');
        console.log('建议: 等待一段时间后重试');
        break;

      case 'server_error':
        console.log('服务器错误: 服务暂时不可用');
        console.log('建议: 稍后重试或联系服务提供商');
        break;

      case 'invalid_request':
        console.log('请求错误: 请求格式或参数不正确');
        console.log('建议: 检查API URL和配置是否正确');
        break;

      default:
        console.log('未知错误:', result.error.message);
        break;
    }

    // 显示是否可以重试
    if (result.error.retryable) {
      console.log('\n此错误可以重试');
    } else {
      console.log('\n此错误需要修复配置后才能重试');
    }
  }

  return result;
}

// ============================================================================
// 示例 6: 测量连接性能
// ============================================================================

async function measureConnectionPerformance() {
  const config: AIServiceConfig = {
    id: 'openai-gpt4',
    name: 'OpenAI GPT-4',
    apiKey: 'sk-your-api-key-here',
    apiUrl: 'https://api.openai.com/v1',
    model: 'gpt-4',
    provider: 'openai',
  };

  const client = createAIClient({ config, timeout: 10000 });

  console.log('正在测量连接性能（5次测试）...\n');

  const latencies: number[] = [];

  for (let i = 1; i <= 5; i++) {
    console.log(`测试 ${i}/5...`);
    const result = await client.validateConnection(config);

    if (result.isValid && result.latency) {
      latencies.push(result.latency);
      console.log(`  延迟: ${result.latency}ms`);
    } else {
      console.log(`  失败: ${result.error?.message}`);
    }

    // 等待1秒再进行下一次测试
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  if (latencies.length > 0) {
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const minLatency = Math.min(...latencies);
    const maxLatency = Math.max(...latencies);

    console.log('\n=== 性能统计 ===');
    console.log(`平均延迟: ${avgLatency.toFixed(2)}ms`);
    console.log(`最小延迟: ${minLatency}ms`);
    console.log(`最大延迟: ${maxLatency}ms`);
  }
}

// ============================================================================
// 辅助函数
// ============================================================================

function displayValidationResult(result: ConnectionValidationResult) {
  if (result.isValid) {
    console.log('✓ 连接成功');
    console.log(`  提供商: ${result.provider}`);
    if (result.model) {
      console.log(`  模型: ${result.model}`);
    }
    if (result.latency !== undefined) {
      console.log(`  延迟: ${result.latency}ms`);
    }
  } else {
    console.log('✗ 连接失败');
    if (result.error) {
      console.log(`  错误类型: ${result.error.type}`);
      console.log(`  错误信息: ${result.error.message}`);
      console.log(`  可重试: ${result.error.retryable ? '是' : '否'}`);
      if (result.error.statusCode) {
        console.log(`  HTTP状态码: ${result.error.statusCode}`);
      }
      if (result.latency !== undefined) {
        console.log(`  失败延迟: ${result.latency}ms`);
      }
    }
  }
}

// ============================================================================
// 导出示例函数
// ============================================================================

export {
  validateOpenAIConnection,
  validateAnthropicConnection,
  validateCustomProviderConnection,
  validateMultipleConfigs,
  handleValidationErrors,
  measureConnectionPerformance,
};

// ============================================================================
// 使用示例
// ============================================================================

/*
// 验证单个连接
const result = await validateOpenAIConnection();

// 批量验证
const results = await validateMultipleConfigs();

// 处理错误
await handleValidationErrors();

// 测量性能
await measureConnectionPerformance();
*/
