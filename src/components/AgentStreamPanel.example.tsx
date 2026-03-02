/**
 * AgentStreamPanel组件示例
 * 
 * 演示如何使用StreamHandler和streamStore在React组件中显示AI的流式输出。
 */

import React, { useEffect } from 'react';
import { useAgentStream } from '../stores/streamStore';

/**
 * Agent流式输出面板组件
 * 
 * 显示单个Agent的实时流式输出内容。
 */
interface AgentStreamPanelProps {
  /** Agent ID */
  agentId: string;
  /** Agent名称 */
  agentName: string;
  /** Agent角色 */
  agentRole: string;
}

export function AgentStreamPanel({ agentId, agentName, agentRole }: AgentStreamPanelProps) {
  const { content, isStreaming, startTime, startStream } = useAgentStream(agentId);

  useEffect(() => {
    // 组件挂载时自动开始流式会话（如果还没有）
    if (!content && !isStreaming) {
      startStream();
    }
  }, [agentId]);

  return (
    <div className="agent-stream-panel">
      {/* 头部 */}
      <div className="panel-header">
        <div className="agent-info">
          <h3>{agentName}</h3>
          <span className="agent-role">{agentRole}</span>
        </div>
        
        {/* 状态指示器 */}
        {isStreaming && (
          <div className="streaming-indicator">
            <span className="pulse-dot"></span>
            <span>正在输出...</span>
          </div>
        )}
      </div>

      {/* 内容区域 */}
      <div className="panel-content">
        {content ? (
          <div className="stream-content">
            {content}
            {isStreaming && <span className="cursor">|</span>}
          </div>
        ) : (
          <div className="empty-state">
            等待AI开始输出...
          </div>
        )}
      </div>

      {/* 底部信息 */}
      {startTime && (
        <div className="panel-footer">
          <span>开始时间: {startTime.toLocaleTimeString()}</span>
          <span>字符数: {content.length}</span>
        </div>
      )}
    </div>
  );
}

/**
 * 多Agent流式输出网格组件
 * 
 * 同时显示多个Agent的流式输出。
 */
interface MultiAgentStreamGridProps {
  agents: Array<{
    id: string;
    name: string;
    role: string;
  }>;
}

export function MultiAgentStreamGrid({ agents }: MultiAgentStreamGridProps) {
  return (
    <div className="multi-agent-grid">
      {agents.map((agent) => (
        <AgentStreamPanel
          key={agent.id}
          agentId={agent.id}
          agentName={agent.name}
          agentRole={agent.role}
        />
      ))}
    </div>
  );
}

/**
 * 流式输出监控面板
 * 
 * 显示所有活跃流的概览信息。
 */
import { useActiveStreams } from '../stores/streamStore';

export function StreamMonitorPanel() {
  const activeStreams = useActiveStreams();

  return (
    <div className="stream-monitor">
      <h3>活跃流式输出</h3>
      <div className="stream-list">
        {activeStreams.length === 0 ? (
          <p>当前没有活跃的流式输出</p>
        ) : (
          activeStreams.map((stream) => (
            <div key={stream.agentId} className="stream-item">
              <span className="agent-id">{stream.agentId}</span>
              <span className="content-length">{stream.content.length} 字符</span>
              <span className="duration">
                {Math.floor((Date.now() - stream.startTime.getTime()) / 1000)}秒
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * 示例样式（CSS-in-JS或单独的CSS文件）
 */
export const exampleStyles = `
.agent-stream-panel {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 20px;
  margin: 10px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.agent-info h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.agent-role {
  display: inline-block;
  margin-top: 4px;
  padding: 2px 8px;
  background: rgba(100, 150, 255, 0.2);
  border-radius: 4px;
  font-size: 12px;
}

.streaming-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #4CAF50;
  font-size: 14px;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: #4CAF50;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.panel-content {
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
  padding: 12px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
}

.stream-content {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.cursor {
  display: inline-block;
  margin-left: 2px;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
}

.panel-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.multi-agent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  padding: 20px;
}

.stream-monitor {
  background: rgba(255, 255, 255, 0.05);
  padding: 16px;
  border-radius: 12px;
  margin: 20px;
}

.stream-list {
  margin-top: 12px;
}

.stream-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  margin: 4px 0;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  font-size: 14px;
}
`;

/**
 * 使用示例
 */
export function ExampleUsage() {
  const agents = [
    { id: 'writer_1', name: 'Writer 1', role: 'writer' },
    { id: 'writer_2', name: 'Writer 2', role: 'writer' },
    { id: 'reviewer_1', name: 'Reviewer 1', role: 'peer_reviewer' },
  ];

  return (
    <div className="app">
      <StreamMonitorPanel />
      <MultiAgentStreamGrid agents={agents} />
    </div>
  );
}
