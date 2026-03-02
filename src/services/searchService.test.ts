/**
 * 搜索服务单元测试
 * Search Service Unit Tests
 * 
 * 任务: 5.4 实现联网搜索功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SearchServiceFactory,
  TavilySearchService,
  SerpAPISearchService,
  GoogleSearchService,
  BingSearchService,
  type SearchConfig,
  type SearchOptions,
} from './searchService';
import type { SearchResult } from '../types/ai-client';

// ============================================================================
// Mock fetch
// ============================================================================

global.fetch = vi.fn();

function mockFetch(response: any, ok = true, status = 200) {
  (global.fetch as any).mockResolvedValueOnce({
    ok,
    status,
    json: async () => response,
  });
}

// ============================================================================
// Tavily Search Service Tests
// ============================================================================

describe('TavilySearchService', () => {
  let service: TavilySearchService;
  const config: SearchConfig = {
    provider: 'tavily',
    apiKey: 'test-tavily-key',
    maxResults: 5,
  };

  beforeEach(() => {
    service = new TavilySearchService(config);
    vi.clearAllMocks();
  });

  it('应该成功执行搜索并返回结果', async () => {
    const mockResponse = {
      results: [
        {
          title: 'Test Article 1',
          url: 'https://example.com/article1',
          content: 'This is a test article about AI',
          published_date: '2024-01-15',
        },
        {
          title: 'Test Article 2',
          url: 'https://example.com/article2',
          content: 'Another article about machine learning',
        },
      ],
    };

    mockFetch(mockResponse);

    const results = await service.search('AI research');

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      title: 'Test Article 1',
      url: 'https://example.com/article1',
      snippet: 'This is a test article about AI',
      source: 'example.com',
      publishedDate: new Date('2024-01-15'),
    });
    expect(results[1].title).toBe('Test Article 2');
  });

  it('应该记录搜索历史', async () => {
    const mockResponse = { results: [] };
    mockFetch(mockResponse);

    await service.search('test query');

    const history = service.getSearchHistory();
    expect(history).toHaveLength(1);
    expect(history[0].query).toBe('test query');
    expect(history[0].results).toEqual([]);
  });

  it('应该处理空结果', async () => {
    const mockResponse = { results: [] };
    mockFetch(mockResponse);

    const results = await service.search('nonexistent query');

    expect(results).toHaveLength(0);
  });

  it('应该处理API错误', async () => {
    mockFetch({}, false, 401);

    await expect(service.search('test')).rejects.toThrow('Tavily');
  });

  it('应该支持自定义搜索选项', async () => {
    const mockResponse = { results: [] };
    mockFetch(mockResponse);

    const options: SearchOptions = {
      maxResults: 3,
      domains: ['arxiv.org', 'scholar.google.com'],
    };

    await service.search('quantum computing', options);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"max_results":3'),
      })
    );
  });

  it('应该限制搜索历史数量', async () => {
    const mockResponse = { results: [] };

    // 执行101次搜索
    for (let i = 0; i < 101; i++) {
      mockFetch(mockResponse);
      await service.search(`query ${i}`);
    }

    const history = service.getSearchHistory();
    expect(history).toHaveLength(100); // 应该只保留最近100条
  });

  it('应该按agentId过滤搜索历史', async () => {
    const mockResponse = { results: [] };

    // 模拟不同agent的搜索
    mockFetch(mockResponse);
    await service.search('query 1');
    (service as any).searchHistory[0].agentId = 'agent1';

    mockFetch(mockResponse);
    await service.search('query 2');
    (service as any).searchHistory[1].agentId = 'agent2';

    mockFetch(mockResponse);
    await service.search('query 3');
    (service as any).searchHistory[2].agentId = 'agent1';

    const agent1History = service.getSearchHistory('agent1');
    expect(agent1History).toHaveLength(2);
    expect(agent1History[0].query).toBe('query 1');
    expect(agent1History[1].query).toBe('query 3');
  });

  it('应该清除搜索历史', async () => {
    const mockResponse = { results: [] };
    mockFetch(mockResponse);

    await service.search('test');
    expect(service.getSearchHistory()).toHaveLength(1);

    service.clearSearchHistory();
    expect(service.getSearchHistory()).toHaveLength(0);
  });
});

// ============================================================================
// SerpAPI Search Service Tests
// ============================================================================

describe('SerpAPISearchService', () => {
  let service: SerpAPISearchService;
  const config: SearchConfig = {
    provider: 'serpapi',
    apiKey: 'test-serpapi-key',
  };

  beforeEach(() => {
    service = new SerpAPISearchService(config);
    vi.clearAllMocks();
  });

  it('应该成功执行搜索并返回结果', async () => {
    const mockResponse = {
      organic_results: [
        {
          title: 'SerpAPI Result 1',
          link: 'https://test.com/page1',
          snippet: 'Test snippet 1',
          date: '2024-01-10',
        },
        {
          title: 'SerpAPI Result 2',
          link: 'https://test.com/page2',
          snippet: 'Test snippet 2',
        },
      ],
    };

    mockFetch(mockResponse);

    const results = await service.search('machine learning');

    expect(results).toHaveLength(2);
    expect(results[0].title).toBe('SerpAPI Result 1');
    expect(results[0].publishedDate).toEqual(new Date('2024-01-10'));
  });

  it('应该支持时间范围过滤', async () => {
    const mockResponse = { organic_results: [] };
    mockFetch(mockResponse);

    const options: SearchOptions = {
      dateRange: 'week',
    };

    await service.search('recent news', options);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('tbs=qdr%3Aw')
    );
  });

  it('应该处理缺少organic_results的响应', async () => {
    const mockResponse = {};
    mockFetch(mockResponse);

    const results = await service.search('test');

    expect(results).toHaveLength(0);
  });
});

// ============================================================================
// Google Search Service Tests
// ============================================================================

describe('GoogleSearchService', () => {
  let service: GoogleSearchService;
  const config: SearchConfig & { searchEngineId: string } = {
    provider: 'google',
    apiKey: 'test-google-key',
    searchEngineId: 'test-engine-id',
  };

  beforeEach(() => {
    service = new GoogleSearchService(config);
    vi.clearAllMocks();
  });

  it('应该成功执行搜索并返回结果', async () => {
    const mockResponse = {
      items: [
        {
          title: 'Google Result 1',
          link: 'https://google-test.com/page1',
          snippet: 'Google snippet 1',
        },
        {
          title: 'Google Result 2',
          link: 'https://google-test.com/page2',
          snippet: 'Google snippet 2',
        },
      ],
    };

    mockFetch(mockResponse);

    const results = await service.search('deep learning');

    expect(results).toHaveLength(2);
    expect(results[0].title).toBe('Google Result 1');
    expect(results[0].source).toBe('google-test.com');
  });

  it('应该限制最大结果数为10', async () => {
    const mockResponse = { items: [] };
    mockFetch(mockResponse);

    const options: SearchOptions = {
      maxResults: 50, // 尝试请求50个结果
    };

    await service.search('test', options);

    // 验证实际请求的是10个结果（Google的限制）
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('num=10')
    );
  });

  it('应该处理空items的响应', async () => {
    const mockResponse = {};
    mockFetch(mockResponse);

    const results = await service.search('test');

    expect(results).toHaveLength(0);
  });
});

// ============================================================================
// Bing Search Service Tests
// ============================================================================

describe('BingSearchService', () => {
  let service: BingSearchService;
  const config: SearchConfig = {
    provider: 'bing',
    apiKey: 'test-bing-key',
  };

  beforeEach(() => {
    service = new BingSearchService(config);
    vi.clearAllMocks();
  });

  it('应该成功执行搜索并返回结果', async () => {
    const mockResponse = {
      webPages: {
        value: [
          {
            name: 'Bing Result 1',
            url: 'https://bing-test.com/page1',
            snippet: 'Bing snippet 1',
            dateLastCrawled: '2024-01-20T10:00:00Z',
          },
          {
            name: 'Bing Result 2',
            url: 'https://bing-test.com/page2',
            snippet: 'Bing snippet 2',
          },
        ],
      },
    };

    mockFetch(mockResponse);

    const results = await service.search('neural networks');

    expect(results).toHaveLength(2);
    expect(results[0].title).toBe('Bing Result 1');
    expect(results[0].publishedDate).toEqual(new Date('2024-01-20T10:00:00Z'));
  });

  it('应该使用正确的API密钥头', async () => {
    const mockResponse = { webPages: { value: [] } };
    mockFetch(mockResponse);

    await service.search('test');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: {
          'Ocp-Apim-Subscription-Key': 'test-bing-key',
        },
      })
    );
  });

  it('应该处理缺少webPages的响应', async () => {
    const mockResponse = {};
    mockFetch(mockResponse);

    const results = await service.search('test');

    expect(results).toHaveLength(0);
  });
});

// ============================================================================
// Search Service Factory Tests
// ============================================================================

describe('SearchServiceFactory', () => {
  it('应该创建Tavily搜索服务', () => {
    const config: SearchConfig = {
      provider: 'tavily',
      apiKey: 'test-key',
    };

    const service = SearchServiceFactory.createSearchService(config);

    expect(service).toBeInstanceOf(TavilySearchService);
  });

  it('应该创建SerpAPI搜索服务', () => {
    const config: SearchConfig = {
      provider: 'serpapi',
      apiKey: 'test-key',
    };

    const service = SearchServiceFactory.createSearchService(config);

    expect(service).toBeInstanceOf(SerpAPISearchService);
  });

  it('应该创建Google搜索服务', () => {
    const config: SearchConfig & { searchEngineId: string } = {
      provider: 'google',
      apiKey: 'test-key',
      searchEngineId: 'test-engine',
    };

    const service = SearchServiceFactory.createSearchService(config);

    expect(service).toBeInstanceOf(GoogleSearchService);
  });

  it('应该创建Bing搜索服务', () => {
    const config: SearchConfig = {
      provider: 'bing',
      apiKey: 'test-key',
    };

    const service = SearchServiceFactory.createSearchService(config);

    expect(service).toBeInstanceOf(BingSearchService);
  });

  it('应该在缺少searchEngineId时抛出错误（Google）', () => {
    const config: SearchConfig = {
      provider: 'google',
      apiKey: 'test-key',
    };

    expect(() => SearchServiceFactory.createSearchService(config)).toThrow(
      'Google搜索需要提供searchEngineId'
    );
  });

  it('应该在不支持的提供商时抛出错误', () => {
    const config: any = {
      provider: 'unsupported',
      apiKey: 'test-key',
    };

    expect(() => SearchServiceFactory.createSearchService(config)).toThrow(
      '不支持的搜索提供商'
    );
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('搜索服务集成测试', () => {
  it('应该正确提取域名', async () => {
    const config: SearchConfig = {
      provider: 'tavily',
      apiKey: 'test-key',
    };

    const service = new TavilySearchService(config);

    const mockResponse = {
      results: [
        {
          title: 'Test',
          url: 'https://www.example.com/path/to/page?query=test',
          content: 'Test content',
        },
      ],
    };

    mockFetch(mockResponse);

    const results = await service.search('test');

    expect(results[0].source).toBe('www.example.com');
  });

  it('应该处理无效URL', async () => {
    const config: SearchConfig = {
      provider: 'tavily',
      apiKey: 'test-key',
    };

    const service = new TavilySearchService(config);

    const mockResponse = {
      results: [
        {
          title: 'Test',
          url: 'not-a-valid-url',
          content: 'Test content',
        },
      ],
    };

    mockFetch(mockResponse);

    const results = await service.search('test');

    expect(results[0].source).toBe('');
  });

  it('应该生成唯一的搜索记录ID', async () => {
    const config: SearchConfig = {
      provider: 'tavily',
      apiKey: 'test-key',
    };

    const service = new TavilySearchService(config);
    const mockResponse = { results: [] };

    mockFetch(mockResponse);
    await service.search('query 1');

    mockFetch(mockResponse);
    await service.search('query 2');

    const history = service.getSearchHistory();
    expect(history[0].id).not.toBe(history[1].id);
    expect(history[0].id).toMatch(/^search_\d+_[a-z0-9]+$/);
  });
});
