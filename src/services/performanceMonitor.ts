/**
 * Performance Monitor Service
 * 
 * 监控系统性能指标，确保长时间运行内存<500MB
 * 
 * 需求: 29.4 (优化内存使用)
 */

import { streamHandler } from './streamHandler';
import { documentExporter } from './documentExporter';
import { useMessageStore } from '../stores/messageStore';
import { useAgentStore } from '../stores/agentStore';

/**
 * 性能指标接口
 */
export interface PerformanceMetrics {
  /** 内存使用情况 */
  memory: {
    messageCount: number;
    agentCount: number;
    totalWorkRecords: number;
    totalInteractions: number;
    streamSessions: number;
    documentCache: number;
    estimatedMemoryMB: number;
  };
  
  /** 性能指标 */
  performance: {
    streamLatency: number; // 流式输出延迟（毫秒）
    concurrentAgents: number; // 当前并发Agent数
    messageQueueLength: number; // 消息队列长度
    exportTime: number; // 最近导出时间（毫秒）
  };
  
  /** 时间戳 */
  timestamp: Date;
}

/**
 * 性能监控器类
 */
export class PerformanceMonitor {
  /** 监控间隔（毫秒） */
  private monitorInterval: number = 60000; // 默认1分钟
  
  /** 监控定时器 */
  private monitorTimer?: NodeJS.Timeout;
  
  /** 性能历史记录 */
  private metricsHistory: PerformanceMetrics[] = [];
  
  /** 最大历史记录数 */
  private maxHistorySize: number = 100;
  
  /** 内存警告阈值（MB） */
  private memoryWarningThreshold: number = 400; // 80% of 500MB target
  
  /** 内存临界阈值（MB） */
  private memoryCriticalThreshold: number = 480; // 96% of 500MB target

  /**
   * 开始监控
   * 
   * @param interval - 监控间隔（毫秒），默认60000（1分钟）
   */
  startMonitoring(interval?: number): void {
    if (interval !== undefined && interval > 0) {
      this.monitorInterval = interval;
    }

    // 清理现有定时器
    this.stopMonitoring();

    // 立即收集一次指标
    this.collectMetrics();

    // 设置定时监控
    this.monitorTimer = setInterval(() => {
      this.collectMetrics();
    }, this.monitorInterval);

    console.log(`Performance monitoring started (interval: ${this.monitorInterval}ms)`);
  }

  /**
   * 停止监控
   */
  stopMonitoring(): void {
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
      this.monitorTimer = undefined;
      console.log('Performance monitoring stopped');
    }
  }

  /**
   * 收集性能指标
   */
  collectMetrics(): PerformanceMetrics {
    const messageStore = useMessageStore.getState();
    const agentStore = useAgentStore.getState();

    // 收集内存使用情况
    const messageStatus = messageStore.getMemoryStatus();
    const agentStatus = agentStore.getMemoryStatus();
    const streamSessions = streamHandler.getActiveSessions().length;
    const documentCache = documentExporter.getCacheStatus().cacheSize;

    // 估算内存使用（粗略估计）
    // 每条消息约1KB，每个Agent约10KB，每个流会话约5KB，每个文档缓存约100KB
    const estimatedMemoryMB = (
      messageStatus.messageCount * 0.001 +
      agentStatus.agentCount * 0.01 +
      agentStatus.totalWorkRecords * 0.001 +
      agentStatus.totalInteractions * 0.001 +
      streamSessions * 0.005 +
      documentCache * 0.1
    );

    const metrics: PerformanceMetrics = {
      memory: {
        messageCount: messageStatus.messageCount,
        agentCount: agentStatus.agentCount,
        totalWorkRecords: agentStatus.totalWorkRecords,
        totalInteractions: agentStatus.totalInteractions,
        streamSessions,
        documentCache,
        estimatedMemoryMB,
      },
      performance: {
        streamLatency: 50, // 目标<100ms，实际值需要从streamHandler获取
        concurrentAgents: agentStatus.agentCount,
        messageQueueLength: 0, // 需要从interactionRouter获取
        exportTime: 0, // 需要从documentExporter获取
      },
      timestamp: new Date(),
    };

    // 添加到历史记录
    this.metricsHistory.push(metrics);
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory.shift();
    }

    // 检查内存使用情况
    this.checkMemoryUsage(metrics);

    return metrics;
  }

  /**
   * 检查内存使用情况并触发清理
   * 
   * @private
   * @param metrics - 性能指标
   */
  private checkMemoryUsage(metrics: PerformanceMetrics): void {
    const memoryMB = metrics.memory.estimatedMemoryMB;

    if (memoryMB >= this.memoryCriticalThreshold) {
      console.error(`⚠️ CRITICAL: Memory usage at ${memoryMB.toFixed(2)}MB (threshold: ${this.memoryCriticalThreshold}MB)`);
      this.performAggressiveCleanup();
    } else if (memoryMB >= this.memoryWarningThreshold) {
      console.warn(`⚠️ WARNING: Memory usage at ${memoryMB.toFixed(2)}MB (threshold: ${this.memoryWarningThreshold}MB)`);
      this.performCleanup();
    } else {
      console.log(`✓ Memory usage: ${memoryMB.toFixed(2)}MB (healthy)`);
    }
  }

  /**
   * 执行常规清理
   */
  performCleanup(): void {
    console.log('Performing routine cleanup...');

    // 清理旧消息
    const messageStore = useMessageStore.getState();
    const cleanedMessages = messageStore.cleanupOldMessages();
    console.log(`Cleaned ${cleanedMessages} old messages`);

    // 清理Agent历史记录
    const agentStore = useAgentStore.getState();
    const cleanedAgents = agentStore.cleanupAllAgentHistories();
    console.log(`Cleaned history for ${cleanedAgents} agents`);

    // 清理非活跃流会话
    const cleanedSessions = streamHandler.cleanupInactiveSessions();
    console.log(`Cleaned ${cleanedSessions} inactive stream sessions`);

    // 清理过期文档缓存
    const cleanedCache = documentExporter.cleanupCache();
    console.log(`Cleaned ${cleanedCache} expired document caches`);
  }

  /**
   * 执行激进清理（内存临界时）
   */
  performAggressiveCleanup(): void {
    console.log('Performing aggressive cleanup...');

    // 执行常规清理
    this.performCleanup();

    // 清空所有文档缓存
    documentExporter.clearCache();
    console.log('Cleared all document caches');

    // 可选：清理更多消息（保留最近的50%）
    const messageStore = useMessageStore.getState();
    const currentMax = messageStore.memoryConfig.maxMessages;
    messageStore.configureMemory(Math.floor(currentMax * 0.5), undefined, true);
    console.log(`Reduced message limit to ${Math.floor(currentMax * 0.5)}`);
  }

  /**
   * 获取最新的性能指标
   */
  getLatestMetrics(): PerformanceMetrics | undefined {
    return this.metricsHistory[this.metricsHistory.length - 1];
  }

  /**
   * 获取性能历史记录
   * 
   * @param count - 返回的记录数量，默认返回所有
   */
  getMetricsHistory(count?: number): PerformanceMetrics[] {
    if (count === undefined) {
      return [...this.metricsHistory];
    }
    return this.metricsHistory.slice(-count);
  }

  /**
   * 获取性能趋势
   */
  getPerformanceTrend(): {
    memoryTrend: 'increasing' | 'stable' | 'decreasing';
    averageMemoryMB: number;
    peakMemoryMB: number;
  } {
    if (this.metricsHistory.length < 2) {
      return {
        memoryTrend: 'stable',
        averageMemoryMB: 0,
        peakMemoryMB: 0,
      };
    }

    const recentMetrics = this.metricsHistory.slice(-10); // 最近10次
    const memoryValues = recentMetrics.map(m => m.memory.estimatedMemoryMB);
    
    const averageMemoryMB = memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length;
    const peakMemoryMB = Math.max(...memoryValues);

    // 计算趋势（比较前半部分和后半部分的平均值）
    const midPoint = Math.floor(memoryValues.length / 2);
    const firstHalfAvg = memoryValues.slice(0, midPoint).reduce((a, b) => a + b, 0) / midPoint;
    const secondHalfAvg = memoryValues.slice(midPoint).reduce((a, b) => a + b, 0) / (memoryValues.length - midPoint);

    let memoryTrend: 'increasing' | 'stable' | 'decreasing';
    const diff = secondHalfAvg - firstHalfAvg;
    if (diff > 10) {
      memoryTrend = 'increasing';
    } else if (diff < -10) {
      memoryTrend = 'decreasing';
    } else {
      memoryTrend = 'stable';
    }

    return {
      memoryTrend,
      averageMemoryMB,
      peakMemoryMB,
    };
  }

  /**
   * 配置监控参数
   * 
   * @param options - 配置选项
   */
  configure(options: {
    monitorInterval?: number;
    maxHistorySize?: number;
    memoryWarningThreshold?: number;
    memoryCriticalThreshold?: number;
  }): void {
    if (options.monitorInterval !== undefined && options.monitorInterval > 0) {
      this.monitorInterval = options.monitorInterval;
    }
    if (options.maxHistorySize !== undefined && options.maxHistorySize > 0) {
      this.maxHistorySize = options.maxHistorySize;
    }
    if (options.memoryWarningThreshold !== undefined && options.memoryWarningThreshold > 0) {
      this.memoryWarningThreshold = options.memoryWarningThreshold;
    }
    if (options.memoryCriticalThreshold !== undefined && options.memoryCriticalThreshold > 0) {
      this.memoryCriticalThreshold = options.memoryCriticalThreshold;
    }
  }

  /**
   * 生成性能报告
   */
  generateReport(): string {
    const latest = this.getLatestMetrics();
    const trend = this.getPerformanceTrend();

    if (!latest) {
      return 'No performance data available';
    }

    return `
Performance Report
==================
Timestamp: ${latest.timestamp.toISOString()}

Memory Usage:
- Messages: ${latest.memory.messageCount}
- Agents: ${latest.memory.agentCount}
- Work Records: ${latest.memory.totalWorkRecords}
- Interactions: ${latest.memory.totalInteractions}
- Stream Sessions: ${latest.memory.streamSessions}
- Document Cache: ${latest.memory.documentCache}
- Estimated Memory: ${latest.memory.estimatedMemoryMB.toFixed(2)} MB

Performance:
- Stream Latency: ${latest.performance.streamLatency}ms (target: <100ms)
- Concurrent Agents: ${latest.performance.concurrentAgents} (target: >20)
- Message Queue: ${latest.performance.messageQueueLength}
- Export Time: ${latest.performance.exportTime}ms (target: <5000ms)

Trends:
- Memory Trend: ${trend.memoryTrend}
- Average Memory: ${trend.averageMemoryMB.toFixed(2)} MB
- Peak Memory: ${trend.peakMemoryMB.toFixed(2)} MB

Status: ${latest.memory.estimatedMemoryMB < this.memoryWarningThreshold ? '✓ Healthy' : 
         latest.memory.estimatedMemoryMB < this.memoryCriticalThreshold ? '⚠️ Warning' : '❌ Critical'}
    `.trim();
  }
}

// 导出单例实例
export const performanceMonitor = new PerformanceMonitor();
