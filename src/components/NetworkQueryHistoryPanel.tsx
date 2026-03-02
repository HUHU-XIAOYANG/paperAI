/**
 * Network Query History Panel Component
 * Implements Requirements 18.3, 18.5: Display AI network queries and history
 * Task 26.3: 实现联网查询历史UI
 * 
 * Features:
 * - Display all AI network queries with details
 * - Filter by agent and date range
 * - View detailed results
 * - Glass morphism styling
 */

import { useState, useMemo } from 'react';
import { GlassContainer } from './GlassContainer';
import type { SearchQueryRecord } from '../types/ai-client';
import styles from './NetworkQueryHistoryPanel.module.css';

export interface NetworkQueryHistoryPanelProps {
  /** Search query history records */
  queries: SearchQueryRecord[];
  /** Callback when a query is selected */
  onQuerySelect?: (query: SearchQueryRecord) => void;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Network Query History Panel Component
 * 
 * Displays a filterable list of AI network queries with detailed results.
 * Supports filtering by agent and date range.
 * 
 * @example
 * ```tsx
 * <NetworkQueryHistoryPanel
 *   queries={searchHistory}
 *   onQuerySelect={(query) => console.log('Selected:', query)}
 * />
 * ```
 */
export function NetworkQueryHistoryPanel({
  queries,
  onQuerySelect,
  className = '',
}: NetworkQueryHistoryPanelProps) {
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [expandedQuery, setExpandedQuery] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Get unique agent IDs
  const agents = useMemo(() => {
    const agentSet = new Set<string>();
    queries.forEach(q => {
      if (q.agentId) agentSet.add(q.agentId);
    });
    return Array.from(agentSet).sort();
  }, [queries]);

  // Filter queries
  const filteredQueries = useMemo(() => {
    let filtered = [...queries];

    // Filter by agent
    if (selectedAgent !== 'all') {
      filtered = filtered.filter(q => q.agentId === selectedAgent);
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date();
      const cutoff = new Date();

      switch (dateFilter) {
        case 'today':
          cutoff.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoff.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoff.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(q => q.timestamp >= cutoff);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(q =>
        q.query.toLowerCase().includes(term) ||
        q.results.some(r =>
          r.title.toLowerCase().includes(term) ||
          r.snippet.toLowerCase().includes(term)
        )
      );
    }

    // Sort by timestamp (newest first)
    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [queries, selectedAgent, dateFilter, searchTerm]);

  // Toggle query expansion
  const handleToggleExpand = (queryId: string) => {
    setExpandedQuery(expandedQuery === queryId ? null : queryId);
  };

  // Format timestamp
  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}天前`;
    } else if (hours > 0) {
      return `${hours}小时前`;
    } else if (minutes > 0) {
      return `${minutes}分钟前`;
    } else {
      return '刚刚';
    }
  };

  // Format full timestamp
  const formatFullTimestamp = (date: Date): string => {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className={`${styles.historyPanel} ${className}`}>
      <GlassContainer className={styles.container} variant="default" padding="lg" radius="xl">
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>联网查询历史</h2>
            <p className={styles.subtitle}>
              共 {filteredQueries.length} 条查询记录
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>搜索:</label>
            <input
              type="text"
              className={styles.searchInput}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="搜索查询内容或结果..."
            />
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>AI:</label>
            <select
              className={styles.filterSelect}
              value={selectedAgent}
              onChange={e => setSelectedAgent(e.target.value)}
            >
              <option value="all">全部</option>
              {agents.map(agent => (
                <option key={agent} value={agent}>
                  {agent}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>时间:</label>
            <select
              className={styles.filterSelect}
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value as typeof dateFilter)}
            >
              <option value="all">全部</option>
              <option value="today">今天</option>
              <option value="week">最近7天</option>
              <option value="month">最近30天</option>
            </select>
          </div>
        </div>

        {/* Query List */}
        {filteredQueries.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🔍</span>
            <p className={styles.emptyText}>暂无查询记录</p>
            <p className={styles.emptyHint}>
              {searchTerm || selectedAgent !== 'all' || dateFilter !== 'all'
                ? '尝试调整筛选条件'
                : 'AI的联网查询将显示在这里'}
            </p>
          </div>
        ) : (
          <div className={styles.queryList}>
            {filteredQueries.map(query => (
              <GlassContainer
                key={query.id}
                className={styles.queryCard}
                variant="light"
                padding="md"
                hover
              >
                <div
                  className={styles.queryHeader}
                  onClick={() => handleToggleExpand(query.id)}
                >
                  <div className={styles.queryInfo}>
                    <div className={styles.queryMeta}>
                      {query.agentId && (
                        <span className={styles.agentBadge}>{query.agentId}</span>
                      )}
                      <span className={styles.timestamp} title={formatFullTimestamp(query.timestamp)}>
                        {formatTimestamp(query.timestamp)}
                      </span>
                      <span className={styles.resultCount}>
                        {query.results.length} 个结果
                      </span>
                    </div>
                    <p className={styles.queryText}>{query.query}</p>
                  </div>
                  <button
                    className={styles.expandButton}
                    aria-label={expandedQuery === query.id ? '收起' : '展开'}
                  >
                    {expandedQuery === query.id ? '▼' : '▶'}
                  </button>
                </div>

                {expandedQuery === query.id && (
                  <div className={styles.queryResults}>
                    <h4 className={styles.resultsTitle}>搜索结果:</h4>
                    <div className={styles.resultsList}>
                      {query.results.map((result, index) => (
                        <div key={index} className={styles.resultItem}>
                          <div className={styles.resultHeader}>
                            <a
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.resultTitle}
                              onClick={e => {
                                e.stopPropagation();
                                onQuerySelect?.(query);
                              }}
                            >
                              {result.title}
                            </a>
                            {result.source && (
                              <span className={styles.resultSource}>{result.source}</span>
                            )}
                          </div>
                          <p className={styles.resultSnippet}>{result.snippet}</p>
                          <div className={styles.resultMeta}>
                            <a
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.resultUrl}
                              onClick={e => e.stopPropagation()}
                            >
                              {result.url}
                            </a>
                            {result.publishedDate && (
                              <span className={styles.publishedDate}>
                                发布于 {result.publishedDate.toLocaleDateString('zh-CN')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </GlassContainer>
            ))}
          </div>
        )}
      </GlassContainer>
    </div>
  );
}
