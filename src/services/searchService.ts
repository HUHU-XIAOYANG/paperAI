/**
 * 网络搜索服务
 * Web Search Service
 * 
 * 需求: 18.1, 18.2, 18.3, 18.5, 18.6 (联网功能和权限控制)
 * 任务: 5.4 实现联网搜索功能, 26.2 实现联网权限验证
 * 
 * 支持多个搜索提供商：
 * - Tavily (推荐用于学术研究)
 * - SerpAPI
 * - Google Custom Search
 * - Bing Search
 * 
 * 集成网络权限验证，确保只访问允许的域名
 */

import type { SearchResult, SearchQueryRecord } from '../types/ai-client';
import type { NetworkPermissionService } from './networkPermissionService';

// ============================================================================
// Search Provider Types
// ============================================================================

/**
 * 搜索提供商类型
 */
export type SearchProvider = 'tavily' | 'serpapi' | 'google' | 'bing';

/**
 * 搜索配置
 */
export interface SearchConfig {
  provider: SearchProvider;
  apiKey: string;
  maxResults?: number; // 最大结果数（默认10）
  language?: string; // 语言（默认'zh'）
  searchDepth?: 'basic' | 'advanced'; // 搜索深度（仅Tavily）
  includeAnswer?: boolean; // 是否包含AI生成的答案（仅Tavily）
}

/**
 * 搜索选项
 */
export interface SearchOptions {
  maxResults?: number;
  language?: string;
  dateRange?: 'day' | 'week' | 'month' | 'year'; // 时间范围
  domains?: string[]; // 限制搜索的域名
}

// ============================================================================
// Search Service Interface
// ============================================================================

/**
 * 搜索服务接口
 */
export interface ISearchService {
  /**
   * 执行搜索
   */
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;

  /**
   * 获取搜索历史
   */
  getSearchHistory(agentId?: string): SearchQueryRecord[];

  /**
   * 清除搜索历史
   */
  clearSearchHistory(): void;
}

// ============================================================================
// Base Search Service
// ============================================================================

/**
 * 基础搜索服务类
 */
export abstract class BaseSearchService implements ISearchService {
  protected config: SearchConfig;
  protected searchHistory: SearchQueryRecord[] = [];
  protected permissionService?: NetworkPermissionService;

  constructor(config: SearchConfig, permissionService?: NetworkPermissionService) {
    this.config = config;
    this.permissionService = permissionService;
  }

  /**
   * 设置权限服务
   */
  setPermissionService(permissionService: NetworkPermissionService): void {
    this.permissionService = permissionService;
  }

  /**
   * 验证网络访问权限
   * @throws Error 如果权限被拒绝
   */
  protected validatePermission(url: string): void {
    if (!this.permissionService) {
      // 如果没有配置权限服务，默认允许
      return;
    }

    // 检查网络访问是否启用
    const permission = this.permissionService.checkPermission();
    if (!permission.allowed) {
      throw new Error(permission.reason || '网络访问被禁用');
    }

    // 验证域名
    const domainValidation = this.permissionService.validateDomain(url);
    if (!domainValidation.allowed) {
      throw new Error(domainValidation.reason || `域名 ${domainValidation.domain} 不被允许访问`);
    }
  }

  /**
   * 执行搜索（抽象方法，由子类实现）
   */
  abstract search(query: string, options?: SearchOptions): Promise<SearchResult[]>;

  /**
   * 记录搜索查询
   */
  protected recordSearch(query: string, results: SearchResult[], agentId?: string): void {
    const record: SearchQueryRecord = {
      id: this.generateId(),
      query,
      timestamp: new Date(),
      results,
      agentId,
    };

    this.searchHistory.push(record);

    // 限制历史记录数量（最多保留100条）
    if (this.searchHistory.length > 100) {
      this.searchHistory.shift();
    }
  }

  /**
   * 获取搜索历史
   */
  getSearchHistory(agentId?: string): SearchQueryRecord[] {
    if (agentId) {
      return this.searchHistory.filter(record => record.agentId === agentId);
    }
    return [...this.searchHistory];
  }

  /**
   * 清除搜索历史
   */
  clearSearchHistory(): void {
    this.searchHistory = [];
  }

  /**
   * 生成唯一ID
   */
  protected generateId(): string {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 处理HTTP错误
   */
  protected handleHttpError(response: Response, provider: string): Error {
    const statusCode = response.status;
    let message = `${provider} API请求失败 (${statusCode})`;

    if (statusCode === 401 || statusCode === 403) {
      message = `${provider} API认证失败: API密钥无效或已过期`;
    } else if (statusCode === 429) {
      message = `${provider} API请求频率超限: 请稍后重试`;
    } else if (statusCode >= 500) {
      message = `${provider} API服务器错误: 服务暂时不可用`;
    }

    return new Error(message);
  }
}

// ============================================================================
// Tavily Search Service
// ============================================================================

/**
 * Tavily搜索服务
 * 推荐用于学术研究，提供高质量的搜索结果
 */
export class TavilySearchService extends BaseSearchService {
  private readonly apiUrl = 'https://api.tavily.com/search';

  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    const maxResults = options?.maxResults || this.config.maxResults || 10;

    // 验证网络访问权限
    this.validatePermission(this.apiUrl);

    const requestBody = {
      api_key: this.config.apiKey,
      query,
      max_results: maxResults,
      search_depth: this.config.searchDepth || 'basic',
      include_answer: this.config.includeAnswer || false,
      include_domains: options?.domains || [],
    };

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw this.handleHttpError(response, 'Tavily');
      }

      const data = await response.json();
      const results = this.parseTavilyResponse(data);

      // 记录搜索历史
      this.recordSearch(query, results);

      return results;
    } catch (error) {
      console.error('Tavily搜索失败:', error);
      throw error;
    }
  }

  /**
   * 解析Tavily响应
   */
  private parseTavilyResponse(data: any): SearchResult[] {
    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.map((item: any) => ({
      title: item.title || '',
      url: item.url || '',
      snippet: item.content || '',
      source: this.extractDomain(item.url),
      publishedDate: item.published_date ? new Date(item.published_date) : undefined,
    }));
  }

  /**
   * 从URL提取域名
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return '';
    }
  }
}

// ============================================================================
// SerpAPI Search Service
// ============================================================================

/**
 * SerpAPI搜索服务
 * 支持Google、Bing等多个搜索引擎
 */
export class SerpAPISearchService extends BaseSearchService {
  private readonly apiUrl = 'https://serpapi.com/search';

  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    const maxResults = options?.maxResults || this.config.maxResults || 10;

    // 验证网络访问权限
    this.validatePermission(this.apiUrl);

    const params = new URLSearchParams({
      api_key: this.config.apiKey,
      q: query,
      num: maxResults.toString(),
      hl: options?.language || this.config.language || 'zh',
    });

    // 添加时间范围过滤
    if (options?.dateRange) {
      params.append('tbs', this.getDateRangeParam(options.dateRange));
    }

    try {
      const response = await fetch(`${this.apiUrl}?${params.toString()}`);

      if (!response.ok) {
        throw this.handleHttpError(response, 'SerpAPI');
      }

      const data = await response.json();
      const results = this.parseSerpAPIResponse(data);

      // 记录搜索历史
      this.recordSearch(query, results);

      return results;
    } catch (error) {
      console.error('SerpAPI搜索失败:', error);
      throw error;
    }
  }

  /**
   * 解析SerpAPI响应
   */
  private parseSerpAPIResponse(data: any): SearchResult[] {
    const results: SearchResult[] = [];

    // 解析有机搜索结果
    if (data.organic_results && Array.isArray(data.organic_results)) {
      for (const item of data.organic_results) {
        results.push({
          title: item.title || '',
          url: item.link || '',
          snippet: item.snippet || '',
          source: this.extractDomain(item.link),
          publishedDate: item.date ? new Date(item.date) : undefined,
        });
      }
    }

    return results;
  }

  /**
   * 获取时间范围参数
   */
  private getDateRangeParam(dateRange: string): string {
    const rangeMap: Record<string, string> = {
      day: 'qdr:d',
      week: 'qdr:w',
      month: 'qdr:m',
      year: 'qdr:y',
    };
    return rangeMap[dateRange] || '';
  }

  /**
   * 从URL提取域名
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return '';
    }
  }
}

// ============================================================================
// Google Custom Search Service
// ============================================================================

/**
 * Google自定义搜索服务
 */
export class GoogleSearchService extends BaseSearchService {
  private readonly apiUrl = 'https://www.googleapis.com/customsearch/v1';
  private searchEngineId: string;

  constructor(config: SearchConfig & { searchEngineId: string }, permissionService?: NetworkPermissionService) {
    super(config, permissionService);
    this.searchEngineId = config.searchEngineId;
  }

  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    const maxResults = Math.min(options?.maxResults || this.config.maxResults || 10, 10); // Google限制最多10个

    // 验证网络访问权限
    this.validatePermission(this.apiUrl);

    const params = new URLSearchParams({
      key: this.config.apiKey,
      cx: this.searchEngineId,
      q: query,
      num: maxResults.toString(),
      lr: `lang_${options?.language || this.config.language || 'zh'}`,
    });

    // 添加时间范围过滤
    if (options?.dateRange) {
      params.append('dateRestrict', this.getDateRestrict(options.dateRange));
    }

    try {
      const response = await fetch(`${this.apiUrl}?${params.toString()}`);

      if (!response.ok) {
        throw this.handleHttpError(response, 'Google');
      }

      const data = await response.json();
      const results = this.parseGoogleResponse(data);

      // 记录搜索历史
      this.recordSearch(query, results);

      return results;
    } catch (error) {
      console.error('Google搜索失败:', error);
      throw error;
    }
  }

  /**
   * 解析Google响应
   */
  private parseGoogleResponse(data: any): SearchResult[] {
    if (!data.items || !Array.isArray(data.items)) {
      return [];
    }

    return data.items.map((item: any) => ({
      title: item.title || '',
      url: item.link || '',
      snippet: item.snippet || '',
      source: this.extractDomain(item.link),
      publishedDate: undefined, // Google API不直接提供发布日期
    }));
  }

  /**
   * 获取时间限制参数
   */
  private getDateRestrict(dateRange: string): string {
    const rangeMap: Record<string, string> = {
      day: 'd1',
      week: 'w1',
      month: 'm1',
      year: 'y1',
    };
    return rangeMap[dateRange] || '';
  }

  /**
   * 从URL提取域名
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return '';
    }
  }
}

// ============================================================================
// Bing Search Service
// ============================================================================

/**
 * Bing搜索服务
 */
export class BingSearchService extends BaseSearchService {
  private readonly apiUrl = 'https://api.bing.microsoft.com/v7.0/search';

  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    const maxResults = options?.maxResults || this.config.maxResults || 10;

    // 验证网络访问权限
    this.validatePermission(this.apiUrl);

    const params = new URLSearchParams({
      q: query,
      count: maxResults.toString(),
      mkt: this.getMarket(options?.language || this.config.language),
    });

    // 添加时间范围过滤
    if (options?.dateRange) {
      params.append('freshness', this.getFreshness(options.dateRange));
    }

    try {
      const response = await fetch(`${this.apiUrl}?${params.toString()}`, {
        headers: {
          'Ocp-Apim-Subscription-Key': this.config.apiKey,
        },
      });

      if (!response.ok) {
        throw this.handleHttpError(response, 'Bing');
      }

      const data = await response.json();
      const results = this.parseBingResponse(data);

      // 记录搜索历史
      this.recordSearch(query, results);

      return results;
    } catch (error) {
      console.error('Bing搜索失败:', error);
      throw error;
    }
  }

  /**
   * 解析Bing响应
   */
  private parseBingResponse(data: any): SearchResult[] {
    if (!data.webPages || !data.webPages.value || !Array.isArray(data.webPages.value)) {
      return [];
    }

    return data.webPages.value.map((item: any) => ({
      title: item.name || '',
      url: item.url || '',
      snippet: item.snippet || '',
      source: this.extractDomain(item.url),
      publishedDate: item.dateLastCrawled ? new Date(item.dateLastCrawled) : undefined,
    }));
  }

  /**
   * 获取市场代码
   */
  private getMarket(language?: string): string {
    const marketMap: Record<string, string> = {
      zh: 'zh-CN',
      en: 'en-US',
      ja: 'ja-JP',
      ko: 'ko-KR',
    };
    return marketMap[language || 'zh'] || 'zh-CN';
  }

  /**
   * 获取新鲜度参数
   */
  private getFreshness(dateRange: string): string {
    const freshnessMap: Record<string, string> = {
      day: 'Day',
      week: 'Week',
      month: 'Month',
    };
    return freshnessMap[dateRange] || '';
  }

  /**
   * 从URL提取域名
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return '';
    }
  }
}

// ============================================================================
// Search Service Factory
// ============================================================================

/**
 * 搜索服务工厂
 */
export class SearchServiceFactory {
  /**
   * 创建搜索服务实例
   * @param config - 搜索配置
   * @param permissionService - 可选的网络权限服务
   */
  static createSearchService(
    config: SearchConfig & { searchEngineId?: string },
    permissionService?: NetworkPermissionService
  ): ISearchService {
    switch (config.provider) {
      case 'tavily':
        return new TavilySearchService(config, permissionService);
      case 'serpapi':
        return new SerpAPISearchService(config, permissionService);
      case 'google':
        if (!config.searchEngineId) {
          throw new Error('Google搜索需要提供searchEngineId');
        }
        return new GoogleSearchService(config as SearchConfig & { searchEngineId: string }, permissionService);
      case 'bing':
        return new BingSearchService(config, permissionService);
      default:
        throw new Error(`不支持的搜索提供商: ${config.provider}`);
    }
  }
}

// ============================================================================
// Export
// ============================================================================

export {
  type SearchResult,
  type SearchQueryRecord,
} from '../types/ai-client';
