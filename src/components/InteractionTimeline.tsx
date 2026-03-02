/**
 * Interaction Timeline Component
 * 
 * Displays a chronological view of all agent communications with filtering and highlighting.
 * Shows message flow between agents with clear visual distinction.
 * 
 * Requirements: 7.7, 8.7, 12.3
 */

import { useState, useMemo } from 'react';
import { GlassContainer } from './GlassContainer';
import { AgentMessage, MessageType } from '../types';
import styles from './InteractionTimeline.module.css';

export interface InteractionTimelineProps {
  /** Array of messages to display */
  messages: AgentMessage[];
  
  /** Agent ID to highlight (optional) */
  highlightAgent?: string;
  
  /** Filter by message types (optional) */
  filterByType?: MessageType[];
  
  /** Filter by specific agent (optional) */
  filterByAgent?: string;
  
  /** Callback when a message is clicked */
  onMessageClick?: (message: AgentMessage) => void;
  
  /** Sort order: 'asc' (oldest first) or 'desc' (newest first) */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Get message type display configuration
 */
function getMessageTypeConfig(type: MessageType): {
  label: string;
  icon: string;
  color: string;
} {
  const configs: Record<MessageType, { label: string; icon: string; color: string }> = {
    task_assignment: { label: '任务分配', icon: '📋', color: 'var(--msg-task)' },
    work_submission: { label: '工作提交', icon: '📤', color: 'var(--msg-submission)' },
    feedback_request: { label: '反馈请求', icon: '❓', color: 'var(--msg-request)' },
    feedback_response: { label: '反馈响应', icon: '💬', color: 'var(--msg-response)' },
    discussion: { label: '讨论', icon: '💭', color: 'var(--msg-discussion)' },
    revision_request: { label: '修订请求', icon: '🔄', color: 'var(--msg-revision)' },
    approval: { label: '批准', icon: '✅', color: 'var(--msg-approval)' },
    rejection: { label: '退稿', icon: '❌', color: 'var(--msg-rejection)' },
  };
  return configs[type] || { label: type, icon: '📨', color: 'var(--msg-default)' };
}

/**
 * Get agent color based on ID (consistent color per agent)
 */
function getAgentColor(agentId: string): string {
  const colors = [
    'var(--agent-color-1)',
    'var(--agent-color-2)',
    'var(--agent-color-3)',
    'var(--agent-color-4)',
    'var(--agent-color-5)',
    'var(--agent-color-6)',
  ];
  
  // Simple hash function to get consistent color for each agent
  let hash = 0;
  for (let i = 0; i < agentId.length; i++) {
    hash = agentId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = colors[Math.abs(hash) % colors.length];
  return color || 'var(--agent-color-1)';
}

/**
 * Format relative time (e.g., "2 minutes ago")
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay < 7) return `${diffDay}天前`;
  
  return date.toLocaleDateString('zh-CN');
}

/**
 * Format absolute time
 */
function formatAbsoluteTime(date: Date): string {
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Interaction Timeline Component
 * 
 * Displays messages in chronological order with filtering and highlighting capabilities.
 */
export function InteractionTimeline({
  messages,
  highlightAgent,
  filterByType,
  filterByAgent,
  onMessageClick,
  sortOrder = 'desc',
}: InteractionTimelineProps) {
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

  // Filter and sort messages
  const filteredMessages = useMemo(() => {
    let filtered = [...messages];

    // Filter by agent
    if (filterByAgent) {
      filtered = filtered.filter(
        msg =>
          msg.sender === filterByAgent ||
          msg.receiver === filterByAgent ||
          (Array.isArray(msg.receiver) && msg.receiver.includes(filterByAgent))
      );
    }

    // Filter by message type
    if (filterByType && filterByType.length > 0) {
      filtered = filtered.filter(msg => filterByType.includes(msg.type));
    }

    // Sort by timestamp
    filtered.sort((a, b) => {
      const timeA = a.timestamp.getTime();
      const timeB = b.timestamp.getTime();
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });

    return filtered;
  }, [messages, filterByAgent, filterByType, sortOrder]);

  // Toggle message expansion
  const toggleExpanded = (messageId: string) => {
    setExpandedMessages(prev => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  // Handle message click
  const handleMessageClick = (message: AgentMessage) => {
    toggleExpanded(message.id);
    onMessageClick?.(message);
  };

  // Check if agent is highlighted
  const isAgentHighlighted = (agentId: string): boolean => {
    return highlightAgent === agentId;
  };

  // Check if message involves highlighted agent
  const isMessageHighlighted = (message: AgentMessage): boolean => {
    if (!highlightAgent) return false;
    return (
      message.sender === highlightAgent ||
      message.receiver === highlightAgent ||
      (Array.isArray(message.receiver) && message.receiver.includes(highlightAgent))
    );
  };

  return (
    <GlassContainer className={styles.interactionTimeline} padding="md" radius="lg">
      <div className={styles.header}>
        <h3 className={styles.title}>交互时间线</h3>
        <span className={styles.messageCount}>
          {filteredMessages.length} 条消息
        </span>
      </div>

      {filteredMessages.length === 0 && (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>📭</span>
          <p className={styles.emptyText}>暂无消息</p>
        </div>
      )}

      <div className={styles.timeline}>
        {filteredMessages.map((message, index) => {
          const typeConfig = getMessageTypeConfig(message.type);
          const isExpanded = expandedMessages.has(message.id);
          const isHighlighted = isMessageHighlighted(message);
          const senderColor = getAgentColor(message.sender);
          const isSenderHighlighted = isAgentHighlighted(message.sender);

          // Get receiver display
          const receiverDisplay = Array.isArray(message.receiver)
            ? message.receiver.join(', ')
            : message.receiver;

          return (
            <div
              key={message.id}
              className={`${styles.messageItem} ${
                isHighlighted ? styles.highlighted : ''
              }`}
              onClick={() => handleMessageClick(message)}
            >
              {/* Timeline connector */}
              {index < filteredMessages.length - 1 && (
                <div className={styles.connector} />
              )}

              {/* Message card */}
              <div className={styles.messageCard}>
                {/* Message header */}
                <div className={styles.messageHeader}>
                  <div className={styles.messageType}>
                    <span
                      className={styles.typeIcon}
                      style={{ color: typeConfig.color }}
                    >
                      {typeConfig.icon}
                    </span>
                    <span className={styles.typeLabel}>{typeConfig.label}</span>
                  </div>
                  <div className={styles.messageTime}>
                    <span className={styles.relativeTime}>
                      {formatRelativeTime(message.timestamp)}
                    </span>
                    <span className={styles.absoluteTime}>
                      {formatAbsoluteTime(message.timestamp)}
                    </span>
                  </div>
                </div>

                {/* Sender and receiver */}
                <div className={styles.participants}>
                  <div className={styles.sender}>
                    <span
                      className={`${styles.agentBadge} ${
                        isSenderHighlighted ? styles.highlightedAgent : ''
                      }`}
                      style={{ '--agent-color': senderColor } as React.CSSProperties}
                    >
                      {message.sender}
                    </span>
                  </div>
                  <div className={styles.arrow}>→</div>
                  <div className={styles.receiver}>
                    {Array.isArray(message.receiver) ? (
                      message.receiver.map(receiverId => (
                        <span
                          key={receiverId}
                          className={`${styles.agentBadge} ${
                            isAgentHighlighted(receiverId) ? styles.highlightedAgent : ''
                          }`}
                          style={{
                            '--agent-color': getAgentColor(receiverId),
                          } as React.CSSProperties}
                        >
                          {receiverId}
                        </span>
                      ))
                    ) : (
                      <span
                        className={`${styles.agentBadge} ${
                          isAgentHighlighted(message.receiver as string)
                            ? styles.highlightedAgent
                            : ''
                        }`}
                        style={{
                          '--agent-color': getAgentColor(message.receiver as string),
                        } as React.CSSProperties}
                      >
                        {message.receiver}
                      </span>
                    )}
                  </div>
                </div>

                {/* Message content preview */}
                <div className={styles.contentPreview}>
                  {isExpanded ? (
                    <div className={styles.fullContent}>{message.content}</div>
                  ) : (
                    <div className={styles.truncatedContent}>
                      {message.content.length > 150
                        ? `${message.content.substring(0, 150)}...`
                        : message.content}
                    </div>
                  )}
                </div>

                {/* Message metadata */}
                {isExpanded && (
                  <div className={styles.metadata}>
                    <div className={styles.metadataItem}>
                      <span className={styles.metadataLabel}>优先级:</span>
                      <span
                        className={`${styles.priorityBadge} ${
                          styles[`priority-${message.metadata.priority}`]
                        }`}
                      >
                        {message.metadata.priority === 'high'
                          ? '高'
                          : message.metadata.priority === 'medium'
                          ? '中'
                          : '低'}
                      </span>
                    </div>
                    {message.metadata.requiresResponse && (
                      <div className={styles.metadataItem}>
                        <span className={styles.requiresResponse}>需要响应</span>
                      </div>
                    )}
                    {message.metadata.relatedTaskId && (
                      <div className={styles.metadataItem}>
                        <span className={styles.metadataLabel}>任务ID:</span>
                        <span className={styles.taskId}>
                          {message.metadata.relatedTaskId}
                        </span>
                      </div>
                    )}
                    {message.metadata.tags && message.metadata.tags.length > 0 && (
                      <div className={styles.metadataItem}>
                        <span className={styles.metadataLabel}>标签:</span>
                        <div className={styles.tags}>
                          {message.metadata.tags.map(tag => (
                            <span key={tag} className={styles.tag}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Expand indicator */}
                <div className={styles.expandIndicator}>
                  {isExpanded ? '收起 ▲' : '展开 ▼'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </GlassContainer>
  );
}
