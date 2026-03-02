/**
 * Work Display Panel Component
 * 
 * Displays individual agent work status, streaming output, and interaction messages.
 * Integrates with StreamHandler for real-time output and InteractionRouter for messages.
 * 
 * Requirements: 7.2, 12.1, 17.2, 17.3, 17.4, 7.7, 12.3, 7.6, 8.8
 */

import { useEffect, useState, useRef } from 'react';
import { GlassContainer } from './GlassContainer';
import { AgentInfo, AgentStatus } from '../types/agent';
import { AgentMessage } from '../types';
import { streamHandler } from '../services/streamHandler';
import styles from './WorkDisplayPanel.module.css';

export interface WorkDisplayPanelProps {
  /** Agent information to display */
  agent: AgentInfo;
  
  /** Current task description (optional) */
  currentTask?: string;
  
  /** Current agent status */
  status: AgentStatus;
  
  /** Streaming output content (optional) */
  streamingOutput?: string;
  
  /** Interaction messages for this agent */
  messages?: AgentMessage[];
  
  /** Callback when user requests interaction with another agent */
  onInteractionRequest?: (agentId: string) => void;
}

/**
 * Get status display configuration
 */
function getStatusConfig(status: AgentStatus): {
  label: string;
  color: string;
  icon: string;
} {
  switch (status) {
    case 'idle':
      return { label: '空闲', color: 'var(--status-idle)', icon: '⏸️' };
    case 'thinking':
      return { label: '思考中', color: 'var(--status-thinking)', icon: '🤔' };
    case 'writing':
      return { label: '写作中', color: 'var(--status-writing)', icon: '✍️' };
    case 'waiting_feedback':
      return { label: '等待反馈', color: 'var(--status-waiting)', icon: '⏳' };
    case 'revising':
      return { label: '修订中', color: 'var(--status-revising)', icon: '🔄' };
    case 'completed':
      return { label: '已完成', color: 'var(--status-completed)', icon: '✅' };
    default:
      return { label: '未知', color: 'var(--status-idle)', icon: '❓' };
  }
}

/**
 * Get role display name
 */
function getRoleDisplayName(role: string): string {
  const roleNames: Record<string, string> = {
    decision: '决策AI',
    supervisor: '监管AI',
    writer: '写作AI',
    editorial_office: '编辑部',
    editor_in_chief: '主编',
    deputy_editor: '副主编',
    peer_reviewer: '审稿专家',
  };
  return roleNames[role] || role;
}

/**
 * Get message type display name
 */
function getMessageTypeDisplay(type: string): string {
  const typeNames: Record<string, string> = {
    task_assignment: '任务分配',
    work_submission: '工作提交',
    feedback_request: '反馈请求',
    feedback_response: '反馈响应',
    discussion: '讨论',
    revision_request: '修订请求',
    approval: '批准',
    rejection: '退稿',
  };
  return typeNames[type] || type;
}

/**
 * Work Display Panel Component
 * 
 * Main UI component for visualizing individual agent work.
 * Shows agent info, status, streaming output, and interaction messages.
 */
export function WorkDisplayPanel({
  agent,
  currentTask,
  status,
  streamingOutput,
  messages = [],
  onInteractionRequest,
}: WorkDisplayPanelProps) {
  const [liveOutput, setLiveOutput] = useState(streamingOutput || '');
  const [isStreaming, setIsStreaming] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const statusConfig = getStatusConfig(status);

  // Subscribe to streaming output
  useEffect(() => {
    const activeSession = streamHandler.getActiveSessionByAgent(agent.id);
    
    if (activeSession) {
      setIsStreaming(true);
      
      const unsubscribe = streamHandler.subscribeToStream(
        activeSession.id,
        (chunk, isComplete) => {
          if (isComplete) {
            setIsStreaming(false);
          } else {
            setLiveOutput(prev => prev + chunk);
          }
        }
      );
      
      return () => {
        unsubscribe();
      };
    } else {
      setIsStreaming(false);
    }
  }, [agent.id]);

  // Update output when prop changes
  useEffect(() => {
    if (streamingOutput !== undefined) {
      setLiveOutput(streamingOutput);
    }
  }, [streamingOutput]);

  // Auto-scroll to bottom when output updates
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [liveOutput]);

  // Filter messages for this agent
  const agentMessages = messages.filter(
    msg => msg.receiver === agent.id || 
           (Array.isArray(msg.receiver) && msg.receiver.includes(agent.id)) ||
           msg.sender === agent.id
  );

  return (
    <GlassContainer className={styles.workDisplayPanel} padding="md" radius="lg">
      {/* Agent Header */}
      <div className={styles.header}>
        <div className={styles.agentInfo}>
          {agent.avatar && (
            <img 
              src={agent.avatar} 
              alt={agent.name} 
              className={styles.avatar}
            />
          )}
          {!agent.avatar && (
            <div className={styles.avatarPlaceholder}>
              {agent.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className={styles.agentDetails}>
            <h3 className={styles.agentName}>{agent.name}</h3>
            <span className={styles.agentRole}>
              {getRoleDisplayName(agent.role)}
            </span>
          </div>
        </div>
        
        {/* Status Indicator */}
        <div 
          className={styles.statusIndicator}
          style={{ '--status-color': statusConfig.color } as React.CSSProperties}
        >
          <span className={styles.statusIcon}>{statusConfig.icon}</span>
          <span className={styles.statusLabel}>{statusConfig.label}</span>
        </div>
      </div>

      {/* Current Task */}
      {currentTask && (
        <div className={styles.taskSection}>
          <h4 className={styles.sectionTitle}>当前任务</h4>
          <p className={styles.taskDescription}>{currentTask}</p>
        </div>
      )}

      {/* Streaming Output */}
      {liveOutput && (
        <div className={styles.outputSection}>
          <div className={styles.outputHeader}>
            <h4 className={styles.sectionTitle}>输出内容</h4>
            {isStreaming && (
              <span className={styles.streamingIndicator}>
                <span className={styles.streamingDot}></span>
                实时输出中...
              </span>
            )}
          </div>
          <div 
            ref={outputRef}
            className={styles.outputContent}
          >
            <pre className={styles.outputText}>{liveOutput}</pre>
          </div>
        </div>
      )}

      {/* Interaction Messages */}
      {agentMessages.length > 0 && (
        <div className={styles.messagesSection}>
          <h4 className={styles.sectionTitle}>交互消息</h4>
          <div className={styles.messagesList}>
            {agentMessages.map(message => (
              <div 
                key={message.id}
                className={`${styles.messageItem} ${
                  message.sender === agent.id ? styles.sentMessage : styles.receivedMessage
                }`}
              >
                <div className={styles.messageHeader}>
                  <span className={styles.messageType}>
                    {getMessageTypeDisplay(message.type)}
                  </span>
                  <span className={styles.messageTime}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className={styles.messageContent}>
                  {message.content}
                </div>
                {message.sender === agent.id && (
                  <div className={styles.messageFooter}>
                    发送至: {Array.isArray(message.receiver) 
                      ? message.receiver.join(', ') 
                      : message.receiver}
                  </div>
                )}
                {message.sender !== agent.id && (
                  <div className={styles.messageFooter}>
                    来自: {message.sender}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interaction Request Button */}
      {onInteractionRequest && status !== 'idle' && status !== 'completed' && (
        <div className={styles.actionsSection}>
          <button
            className={styles.interactionButton}
            onClick={() => onInteractionRequest(agent.id)}
          >
            <span className={styles.buttonIcon}>💬</span>
            请求反馈
          </button>
        </div>
      )}
    </GlassContainer>
  );
}
