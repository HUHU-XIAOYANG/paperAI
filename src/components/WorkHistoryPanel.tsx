/**
 * Work History Panel Component
 * 
 * Displays work history for agents with timeline view, filtering, and search
 * 
 * Requirements:
 * - 需求 13.5: 实现历史记录UI展示
 * - 支持按时间线浏览
 * - 支持搜索和过滤
 */

import React, { useState, useMemo } from 'react';
import type { WorkRecord } from '../types/agent';
import styles from './WorkHistoryPanel.module.css';

export interface WorkHistoryPanelProps {
  /** Work history records with agent info */
  workHistory: Array<WorkRecord & { agentId: string; agentName: string }>;
  /** Callback when a work record is selected */
  onRecordSelect?: (record: WorkRecord & { agentId: string; agentName: string }) => void;
  /** Show only specific agent's history */
  filterAgentId?: string;
  /** Maximum number of records to display */
  maxRecords?: number;
}

/**
 * WorkHistoryPanel component
 * Displays agent work history in a timeline format
 */
export const WorkHistoryPanel: React.FC<WorkHistoryPanelProps> = ({
  workHistory,
  onRecordSelect,
  filterAgentId,
  maxRecords = 50,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);

  // Filter and search work history
  const filteredHistory = useMemo(() => {
    let filtered = workHistory;

    // Filter by agent
    if (filterAgentId) {
      filtered = filtered.filter((record) => record.agentId === filterAgentId);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((record) => record.status === statusFilter);
    }

    // Search by task ID or output
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (record) =>
          record.taskId.toLowerCase().includes(query) ||
          record.output.toLowerCase().includes(query) ||
          record.agentName.toLowerCase().includes(query)
      );
    }

    // Limit to max records
    return filtered.slice(0, maxRecords);
  }, [workHistory, filterAgentId, statusFilter, searchQuery, maxRecords]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredHistory.length;
    const completed = filteredHistory.filter((r) => r.status === 'completed').length;
    const rejected = filteredHistory.filter((r) => r.status === 'rejected').length;
    const revised = filteredHistory.filter((r) => r.status === 'revised').length;
    const inProgress = filteredHistory.filter((r) => r.status === 'in_progress').length;

    return { total, completed, rejected, revised, inProgress };
  }, [filteredHistory]);

  const handleRecordClick = (record: WorkRecord & { agentId: string; agentName: string }) => {
    setSelectedRecord(record.taskId);
    onRecordSelect?.(record);
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    if (!endTime) return 'In progress';
    
    const duration = endTime.getTime() - startTime.getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getStatusIcon = (status: WorkRecord['status']) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'rejected':
        return '✗';
      case 'revised':
        return '↻';
      case 'in_progress':
        return '⋯';
      default:
        return '•';
    }
  };

  const getStatusClass = (status: WorkRecord['status']) => {
    return styles[`status-${status.replace('_', '-')}`] || '';
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Work History</h2>
        <div className={styles.stats}>
          <span className={styles.statItem}>
            Total: <strong>{stats.total}</strong>
          </span>
          <span className={styles.statItem}>
            Completed: <strong>{stats.completed}</strong>
          </span>
          <span className={styles.statItem}>
            Rejected: <strong>{stats.rejected}</strong>
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search by task ID, agent, or output..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className={styles.statusFilter}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
          <option value="revised">Revised</option>
        </select>
      </div>

      {/* Timeline */}
      <div className={styles.timeline}>
        {filteredHistory.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No work history found</p>
          </div>
        ) : (
          filteredHistory.map((record) => (
            <div
              key={`${record.agentId}-${record.taskId}`}
              className={`${styles.timelineItem} ${
                selectedRecord === record.taskId ? styles.selected : ''
              }`}
              onClick={() => handleRecordClick(record)}
            >
              {/* Status indicator */}
              <div className={`${styles.statusIndicator} ${getStatusClass(record.status)}`}>
                <span className={styles.statusIcon}>{getStatusIcon(record.status)}</span>
              </div>

              {/* Content */}
              <div className={styles.content}>
                <div className={styles.contentHeader}>
                  <span className={styles.agentName}>{record.agentName}</span>
                  <span className={styles.taskId}>{record.taskId}</span>
                  <span className={styles.duration}>
                    {formatDuration(record.startTime, record.endTime)}
                  </span>
                </div>

                <div className={styles.contentBody}>
                  <div className={styles.timestamp}>
                    {record.startTime.toLocaleString()}
                    {record.endTime && ` → ${record.endTime.toLocaleString()}`}
                  </div>

                  {record.output && (
                    <div className={styles.output}>
                      {record.output.length > 150
                        ? `${record.output.substring(0, 150)}...`
                        : record.output}
                    </div>
                  )}

                  {record.feedbackReceived.length > 0 && (
                    <div className={styles.feedback}>
                      <strong>Feedback ({record.feedbackReceived.length}):</strong>
                      <ul>
                        {record.feedbackReceived.map((feedback, index) => (
                          <li key={index}>{feedback}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className={styles.contentFooter}>
                  <span className={`${styles.statusBadge} ${getStatusClass(record.status)}`}>
                    {record.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {filteredHistory.length >= maxRecords && (
        <div className={styles.footer}>
          <p>Showing {maxRecords} most recent records</p>
        </div>
      )}
    </div>
  );
};

export default WorkHistoryPanel;
