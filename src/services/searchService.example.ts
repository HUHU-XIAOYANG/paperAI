/**
 * 搜索服务使用示例
 * Search Service Usage Examples
 * 
 * 任务: 5.4 实现联网搜索功能
 */

import { SearchServiceFactory, type SearchConfig, type SearchOptions } from './searchService';
import { createAIClient } from './aiClient';
import type { AIClientOptions } from '../types/ai-client';
import type { AIServiceConfig } from '../types/config';

// ============================================================================
// 示例1: 使用Tavily搜索（推荐用于学术研究）
// ============================================================================

async function exampleTavilySearch() {
  const searchConfig: SearchConfig = {
    provider: 'tavily',
    apiKey: 'tvly-your-api-key-here',
    maxResults: 10,
    searchDepth: 'advanced', // 使用高级搜索获取更深入的结果
    includeAnswer: true, // 包含AI生成的答案摘要
  };

  const searchService = SearchServiceFactory.createSearchService(searchConfig);

  try {
    const results = await searchService.search('大语言模型最新研究进展');

    console.log(`找到 ${results.length} 个结果:\n`);

    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.title}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   摘要: ${result.snippet}`);
      console.log(`   来源: ${result.source}`);
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
// 示例2: 使用SerpAPI搜索
// ============================================================================

async function exampleSerpAPISearch() {
  const searchConfig: SearchConfig = {
    provider: 'serpapi',
    apiKey: 'your-serpapi-key-here',
    maxResults: 5,
    language: 'zh',
  };

  const searchService = SearchServiceFactory.createSearchService(searchConfig);

  // 搜索最近一周的内容
  const options: SearchOptions = {
    dateRange: 'week',
  };

  try {
    const results = await searchService.search('人工智能新闻', options);

    console.log('最近一周的AI新闻:');
    results.forEach(result => {
      console.log(`- ${result.title}`);
      console.log(`  ${result.url}\n`);
    });
  } catch (error) {
    console.error('搜索失败:', error);
  }
}

// ============================================================================
// 示例3: 使用Google自定义搜索
// ============================================================================

async function exampleGoogleSearch() {
  const searchConfig: SearchConfig & { searchEngineId: string } = {
    provider: 'google',
    apiKey: 'your-google-api-key-here',
    searchEngineId: 'your-search-engine-id',
    maxResults: 10,
  };

  const searchService = SearchServiceFactory.createSearchService(searchConfig);

  try {
    const results = await searchService.search('机器学习算法');

    console.log('Google搜索结果:');
    results.forEach(result => {
      console.log(`${result.title} - ${result.source}`);
    });
  } catch (error) {
    console.error('搜索失败:', error);
  }
}

// ============================================================================
// 示例4: 使用Bing搜索
// ============================================================================

async function exampleBingSearch() {
  const searchConfig: SearchConfig = {
    provider: 'bing',
    apiKey: 'your-bing-api-key-here',
    language: 'zh',
  };

  const searchService = SearchServiceFactory.createSearchService(searchConfig);

  try {
    const results = await searchService.search('深度学习框架比较');

    console.log('Bing搜索结果:');
    results.forEach(result => {
      console.log(`${result.title}`);
      console.log(`${result.snippet}\n`);
    });
  } catch (error) {
    console.error('搜索失败:', error);
  }
}

// ============================================================================
// 示例5: 限制搜索域名
// ============================================================================

async function exampleDomainRestriction() {
  const searchConfig: SearchConfig = {
    provider: 'tavily',
    apiKey: 'tvly-your-api-key-here',
  };

  const searchService = SearchServiceFactory.createSearchService(searchConfig);

  // 只搜索学术网站
  const options: SearchOptions = {
    domains: ['arxiv.org', 'scholar.google.com', 'ieee.org'],
  };

  try {
    const results = await searchService.search('transformer architecture', options);

    console.log('学术网站搜索结果:');
    results.forEach(result => {
      console.log(`${result.title} (${result.source})`);
    });
  } catch (error) {
    console.error('搜索失败:', error);
  }
}

// ============================================================================
// 示例6: 查看搜索历史
// ============================================================================

async function exampleSearchHistory() {
  const searchConfig: SearchConfig = {
    provider: 'tavily',
    apiKey: 'tvly-your-api-key-here',
  };

  const searchService = SearchServiceFactory.createSearchService(searchConfig);

  // 执行多次搜索
  await searchService.search('AI ethics');
  await searchService.search('neural networks');
  await searchService.search('reinforcement learning');

  // 查看搜索历史
  const history = searchService.getSearchHistory();

  console.log(`搜索历史 (共 ${history.length} 条):\n`);

  history.forEach((record, index) => {
    console.log(`${index + 1}. "${record.query}"`);
    console.log(`   时间: ${record.timestamp.toLocaleString()}`);
    console.log(`   结果数: ${record.results.length}`);
    if (record.agentId) {
      console.log(`   Agent: ${record.agentId}`);
    }
    console.log('');
  });

  // 清除历史
  searchService.clearSearchHistory();
  console.log('搜索历史已清除');
}

// ============================================================================
// 示例7: 集成到AI客户端
// ============================================================================

async function exampleAIClientWithSearch() {
  // 配置AI服务
  const aiConfig: AIServiceConfig = {
    id: 'openai-gpt4',
    name: 'OpenAI GPT-4',
    apiKey: 'sk-proj-your-api-key-here',
    apiUrl: 'https://api.openai.com/v1',
    model: 'gpt-4',
    provider: 'openai',
  };

  // 配置搜索服务
  const searchConfig: SearchConfig = {
    provider: 'tavily',
    apiKey: 'tvly-your-api-key-here',
    maxResults: 5,
  };

  // 创建带搜索功能的AI客户端
  const options: AIClientOptions = {
    config: aiConfig,
    searchConfig, // 添加搜索配置
  };

  const client = createAIClient(options);

  try {
    // 执行网络搜索
    const results = await client.performWebSearch('量子计算最新突破', 'agent_researcher_1');

    console.log('搜索结果:');
    results.forEach(result => {
      console.log(`- ${result.title}`);
      console.log(`  ${result.snippet}\n`);
    });

    // 查看该Agent的搜索历史
    const agentHistory = client.getSearchHistory('agent_researcher_1');
    console.log(`Agent搜索历史: ${agentHistory.length} 条`);
  } catch (error) {
    console.error('操作失败:', error);
  }
}

// ============================================================================
// 示例8: 错误处理
// ============================================================================

async function exampleErrorHandling() {
  const searchConfig: SearchConfig = {
    provider: 'tavily',
    apiKey: 'invalid-key', // 无效的API密钥
  };

  const searchService = SearchServiceFactory.createSearchService(searchConfig);

  try {
    await searchService.search('test query');
  } catch (error: any) {
    console.error('搜索失败:');

    if (error.message.includes('认证失败')) {
      console.error('- API密钥无效或已过期');
      console.error('- 请检查配置中的apiKey字段');
    } else if (error.message.includes('请求频率超限')) {
      console.error('- 请求过于频繁');
      console.error('- 请稍后重试或升级API计划');
    } else if (error.message.includes('服务器错误')) {
      console.error('- 搜索服务暂时不可用');
      console.error('- 请稍后重试');
    } else {
      console.error(`- ${error.message}`);
    }
  }
}

// ============================================================================
// 示例9: 多提供商切换
// ============================================================================

async function exampleMultiProviderFallback() {
  const providers: SearchConfig[] = [
    {
      provider: 'tavily',
      apiKey: 'tvly-key',
    },
    {
      provider: 'serpapi',
      apiKey: 'serpapi-key',
    },
    {
      provider: 'bing',
      apiKey: 'bing-key',
    },
  ];

  const query = 'artificial intelligence trends 2024';

  for (const config of providers) {
    try {
      console.log(`尝试使用 ${config.provider}...`);
      const service = SearchServiceFactory.createSearchService(config);
      const results = await service.search(query);

      console.log(`✓ ${config.provider} 成功返回 ${results.length} 个结果\n`);
      return results; // 成功则返回
    } catch (error: any) {
      console.error(`✗ ${config.provider} 失败: ${error.message}\n`);
      // 继续尝试下一个提供商
    }
  }

  console.error('所有搜索提供商都失败了');
  return [];
}

// ============================================================================
// 示例10: 实时搜索与AI结合
// ============================================================================

async function exampleSearchAndSummarize() {
  // 创建搜索服务
  const searchConfig: SearchConfig = {
    provider: 'tavily',
    apiKey: 'tvly-your-api-key-here',
    maxResults: 5,
  };

  const searchService = SearchServiceFactory.createSearchService(searchConfig);

  // 创建AI客户端
  const aiConfig: AIServiceConfig = {
    id: 'openai-gpt4',
    name: 'OpenAI GPT-4',
    apiKey: 'sk-proj-your-api-key-here',
    apiUrl: 'https://api.openai.com/v1',
    model: 'gpt-4',
    provider: 'openai',
  };

  const aiClient = createAIClient({ config: aiConfig });

  try {
    // 1. 执行搜索
    console.log('正在搜索最新信息...');
    const searchResults = await searchService.search('GPT-4最新功能');

    // 2. 构建包含搜索结果的提示词
    const searchContext = searchResults
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\n来源: ${r.url}`)
      .join('\n\n');

    const prompt = `基于以下搜索结果，总结GPT-4的最新功能:\n\n${searchContext}\n\n请提供简洁的总结。`;

    // 3. 让AI总结搜索结果
    console.log('正在生成总结...');
    const response = await aiClient.sendRequest({
      prompt,
      systemPrompt: '你是一个专业的技术分析师，擅长总结和分析最新技术动态。',
      stream: false,
    });

    if ('content' in response) {
      console.log('\nAI总结:');
      console.log(response.content);
      console.log(`\n引用来源: ${searchResults.length} 个网页`);
    }
  } catch (error) {
    console.error('操作失败:', error);
  }
}

// ============================================================================
// 导出示例函数
// ============================================================================

export {
  exampleTavilySearch,
  exampleSerpAPISearch,
  exampleGoogleSearch,
  exampleBingSearch,
  exampleDomainRestriction,
  exampleSearchHistory,
  exampleAIClientWithSearch,
  exampleErrorHandling,
  exampleMultiProviderFallback,
  exampleSearchAndSummarize,
};
