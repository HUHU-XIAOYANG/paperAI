/**
 * Main Workspace View Component
 * Implements Requirements 12.4, 12.5: Workspace layout and responsive design
 * 
 * Features:
 * - Three-panel layout: Team Visualizer (left), Work Display Panels (center), Interaction Timeline (right)
 * - Responsive design that adapts to different screen sizes
 * - Integration with existing stores
 */

import { useState, useMemo } from 'react';
import { DynamicTeamVisualizer, AgentConnection } from '../components/DynamicTeamVisualizer';
import { WorkDisplayPanel } from '../components/WorkDisplayPanel';
import { InteractionTimeline } from '../components/InteractionTimeline';
import { useAgentStore } from '../stores/agentStore';
import { useMessageStore } from '../stores/messageStore';
import styles from './MainWorkspaceView.module.css';

export interface MainWorkspaceViewProps {
  /** Additional CSS class name */
  className?: string;
}

/**
 * Main Workspace View Component
 * 
 * Displays the main working area with three panels:
 * - Left: Dynamic Team Visualizer showing agent structure
 * - Center: Grid of Work Display Panels for each agent
 * - Right: Interaction Timeline showing message history
 * 
 * @example
 * ```tsx
 * <MainWorkspaceView />
 * ```
 */
export function MainWorkspaceView({ className = '' }: MainWorkspaceViewProps) {
  const agents = useAgentStore((state) => state.getAllAgents());
  const messages = useMessageStore((state) => state.getAllMessages());
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>();
  const [showConnections, setShowConnections] = useState(true);

  // Generate connections from messages (memoized to prevent recalculation)
  const connections: AgentConnection[] = useMemo(() => 
    messages
      .filter(msg => msg.type === 'feedback_request' || msg.type === 'feedback_response')
      .map(msg => ({
        from: msg.sender,
        to: Array.isArray(msg.receiver) ? msg.receiver[0] : msg.receiver,
        type: msg.type === 'feedback_request' ? 'feedback' : 'collaboration' as const,
        status: 'active' as const,
        interactionCount: 1,
      })),
    [messages]
  );

  // Handle agent selection
  const handleAgentSelect = (agentId: string) => {
    setSelectedAgentId(agentId);
  };

  const handleAgentDeselect = () => {
    setSelectedAgentId(undefined);
  };

  // Handle interaction request
  const handleInteractionRequest = (agentId: string) => {
    console.log('Interaction requested for agent:', agentId);
    // TODO: Implement interaction request logic
  };

  // Filter agents to display (selected or all) - memoized
  const displayAgents = useMemo(() => 
    selectedAgentId
      ? agents.filter(agent => agent.id === selectedAgentId)
      : agents,
    [agents, selectedAgentId]
  );

  return (
    <div className={`${styles.mainWorkspace} ${className}`}>
      {/* Left Panel: Team Visualizer */}
      <aside className={styles.leftPanel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>团队结构</h2>
          <button
            className={styles.toggleButton}
            onClick={() => setShowConnections(!showConnections)}
            title={showConnections ? '隐藏连接' : '显示连接'}
          >
            {showConnections ? '🔗' : '⛓️‍💥'}
          </button>
        </div>
        <div className={styles.panelContent}>
          <DynamicTeamVisualizer
            connections={showConnections ? connections : []}
            onAgentSelect={handleAgentSelect}
            onAgentDeselect={handleAgentDeselect}
            selectedAgentId={selectedAgentId}
            showConnectionLabels={showConnections}
            enableZoom
          />
        </div>
      </aside>

      {/* Center Panel: Work Display Panels Grid */}
      <main className={styles.centerPanel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>
            工作面板
            {selectedAgentId && (
              <button
                className={styles.clearButton}
                onClick={handleAgentDeselect}
                title="显示所有智能体"
              >
                ✕ 清除选择
              </button>
            )}
          </h2>
          <span className={styles.agentCount}>
            {displayAgents.length} 个智能体
          </span>
        </div>
        <div className={styles.panelContent}>
          {displayAgents.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🤖</span>
              <p className={styles.emptyText}>暂无活跃的智能体</p>
              <p className={styles.emptyHint}>开始一个新的写作任务来创建智能体团队</p>
            </div>
          ) : (
            <div className={styles.workPanelsGrid}>
              {displayAgents.map(agent => (
                <WorkDisplayPanel
                  key={agent.id}
                  agent={{
                    id: agent.id,
                    name: agent.config.name,
                    role: agent.config.role,
                    currentTask: agent.state.currentTask?.description,
                  }}
                  status={agent.state.status}
                  currentTask={agent.state.currentTask?.description}
                  messages={messages.filter(
                    msg =>
                      msg.sender === agent.id ||
                      msg.receiver === agent.id ||
                      (Array.isArray(msg.receiver) && msg.receiver.includes(agent.id))
                  )}
                  onInteractionRequest={handleInteractionRequest}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Right Panel: Interaction Timeline */}
      <aside className={styles.rightPanel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>交互时间线</h2>
          <span className={styles.messageCount}>
            {messages.length} 条消息
          </span>
        </div>
        <div className={styles.panelContent}>
          <InteractionTimeline
            messages={messages}
            highlightAgent={selectedAgentId}
            sortOrder="desc"
          />
        </div>
      </aside>
    </div>
  );
}
