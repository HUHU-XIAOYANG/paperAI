/**
 * Dynamic Team Visualizer Component
 * Implements Requirements 7.5, 7.6, 7.8, 8.7, 12.4
 * 
 * Features:
 * - Visualizes team structure with >20 concurrent agents
 * - Shows interactive connections between agents
 * - Displays connection status and interaction relationships
 * - Agent selection functionality with callbacks
 * - Animated visual feedback for dynamically added agents
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { GlassContainer } from './GlassContainer';
import { useAgentStore } from '../stores/agentStore';
import type { Agent, AgentRole } from '../types/agent';
import styles from './DynamicTeamVisualizer.module.css';

export interface AgentConnection {
  /** Source agent ID */
  from: string;
  /** Target agent ID */
  to: string;
  /** Connection type */
  type: 'task' | 'feedback' | 'collaboration';
  /** Connection status */
  status: 'active' | 'idle' | 'error';
  /** Number of interactions */
  interactionCount?: number;
}

export interface DynamicTeamVisualizerProps {
  /** List of agent connections to display */
  connections?: AgentConnection[];
  /** Callback when an agent is selected */
  onAgentSelect?: (agentId: string) => void;
  /** Callback when an agent is deselected */
  onAgentDeselect?: () => void;
  /** Currently selected agent ID */
  selectedAgentId?: string;
  /** Whether to show connection labels */
  showConnectionLabels?: boolean;
  /** Whether to enable zoom and pan */
  enableZoom?: boolean;
  /** Maximum number of agents to display */
  maxAgents?: number;
  /** Layout algorithm */
  layout?: 'circular' | 'hierarchical' | 'force';
}

interface AgentNode {
  id: string;
  agent: Agent;
  x: number;
  y: number;
  isNew: boolean;
}

/**
 * Dynamic Team Visualizer Component
 * 
 * Visualizes the agent team structure with interactive connections,
 * agent selection, and animations for newly added agents.
 * 
 * @example
 * ```tsx
 * <DynamicTeamVisualizer
 *   connections={connections}
 *   onAgentSelect={(id) => console.log('Selected:', id)}
 *   selectedAgentId={selectedId}
 *   showConnectionLabels
 * />
 * ```
 */
export function DynamicTeamVisualizer({
  connections = [],
  onAgentSelect,
  onAgentDeselect,
  selectedAgentId,
  showConnectionLabels = false,
  enableZoom = true,
  maxAgents = 50,
  layout = 'circular',
}: DynamicTeamVisualizerProps) {
  // 🔧 FIX: 直接 select Map，再用 useMemo 转数组
  // 避免 getAllAgents() 每次返回新引用导致无限循环
  const agentsMap = useAgentStore((state) => state.agents);
  const agents = useMemo(() => Array.from(agentsMap.values()), [agentsMap]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [agentNodes, setAgentNodes] = useState<AgentNode[]>([]);
  const [hoveredAgentId, setHoveredAgentId] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const previousAgentIdsRef = useRef<Set<string>>(new Set());

  // Calculate agent positions based on layout algorithm
  const calculatePositions = useCallback((agentList: Agent[], width: number, height: number): AgentNode[] => {
    const centerX = width / 2;
    const centerY = height / 2;
    const previousIds = previousAgentIdsRef.current;

    if (layout === 'circular') {
      const radius = Math.min(width, height) * 0.35;
      return agentList.slice(0, maxAgents).map((agent, index) => {
        const angle = (index / agentList.length) * 2 * Math.PI - Math.PI / 2;
        return {
          id: agent.id,
          agent,
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
          isNew: !previousIds.has(agent.id),
        };
      });
    } else if (layout === 'hierarchical') {
      // Group by role hierarchy
      const roleOrder: AgentRole[] = ['decision', 'supervisor', 'editor_in_chief', 'deputy_editor', 'editorial_office', 'writer', 'peer_reviewer'];
      const grouped = new Map<AgentRole, Agent[]>();
      
      agentList.forEach(agent => {
        const role = agent.config.role;
        if (!grouped.has(role)) grouped.set(role, []);
        grouped.get(role)!.push(agent);
      });

      const nodes: AgentNode[] = [];
      let currentY = 100;
      const layerHeight = (height - 200) / roleOrder.length;

      roleOrder.forEach(role => {
        const roleAgents = grouped.get(role) || [];
        const spacing = width / (roleAgents.length + 1);
        
        roleAgents.forEach((agent, index) => {
          nodes.push({
            id: agent.id,
            agent,
            x: spacing * (index + 1),
            y: currentY,
            isNew: !previousIds.has(agent.id),
          });
        });
        
        currentY += layerHeight;
      });

      return nodes.slice(0, maxAgents);
    } else {
      // Force-directed layout (simplified)
      return agentList.slice(0, maxAgents).map((agent, index) => {
        const cols = Math.ceil(Math.sqrt(agentList.length));
        const row = Math.floor(index / cols);
        const col = index % cols;
        const spacingX = width / (cols + 1);
        const spacingY = height / (Math.ceil(agentList.length / cols) + 1);
        
        return {
          id: agent.id,
          agent,
          x: spacingX * (col + 1),
          y: spacingY * (row + 1),
          isNew: !previousIds.has(agent.id),
        };
      });
    }
  }, [layout, maxAgents]);

  // Update agent positions when agents change
  // 🔧 FIX: 从依赖中移除 calculatePositions（它由 useCallback 保证稳定）
  // agents 现在由 useMemo 保证只在 Map 真正变化时才是新引用
  useEffect(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const nodes = calculatePositions(agents, rect.width, rect.height);
    setAgentNodes(nodes);

    // Update previous IDs for next render
    previousAgentIdsRef.current = new Set(agents.map(a => a.id));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agents, layout, maxAgents]);

  // Draw visualization on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Apply transformations
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // Draw connections
    connections.forEach(conn => {
      const fromNode = agentNodes.find(n => n.id === conn.from);
      const toNode = agentNodes.find(n => n.id === conn.to);
      
      if (!fromNode || !toNode) return;

      // Connection color based on status
      const colors = {
        active: '#34c759',
        idle: '#86868b',
        error: '#ff3b30',
      };

      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
      ctx.strokeStyle = colors[conn.status];
      ctx.lineWidth = conn.status === 'active' ? 2 : 1;
      ctx.setLineDash(conn.status === 'idle' ? [5, 5] : []);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw arrow
      const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
      const arrowSize = 8;
      const arrowX = toNode.x - Math.cos(angle) * 30;
      const arrowY = toNode.y - Math.sin(angle) * 30;

      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(
        arrowX - arrowSize * Math.cos(angle - Math.PI / 6),
        arrowY - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        arrowX - arrowSize * Math.cos(angle + Math.PI / 6),
        arrowY - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = colors[conn.status];
      ctx.fill();

      // Draw connection label
      if (showConnectionLabels && conn.interactionCount) {
        const midX = (fromNode.x + toNode.x) / 2;
        const midY = (fromNode.y + toNode.y) / 2;
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(midX - 15, midY - 10, 30, 20);
        ctx.fillStyle = '#1d1d1f';
        ctx.font = '12px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(conn.interactionCount.toString(), midX, midY);
      }
    });

    ctx.restore();
  }, [agentNodes, connections, showConnectionLabels, scale, offset]);

  // Handle agent click
  const handleAgentClick = useCallback((agentId: string) => {
    if (selectedAgentId === agentId) {
      onAgentDeselect?.();
    } else {
      onAgentSelect?.(agentId);
    }
  }, [selectedAgentId, onAgentSelect, onAgentDeselect]);

  // Handle mouse events for zoom and pan
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!enableZoom) return;
    
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.5, Math.min(3, prev * delta)));
  }, [enableZoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  }, [offset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Get role color
  const getRoleColor = (role: AgentRole): string => {
    const colors: Record<AgentRole, string> = {
      decision: '#007aff',
      supervisor: '#5ac8fa',
      writer: '#34c759',
      editorial_office: '#ff9500',
      editor_in_chief: '#ff3b30',
      deputy_editor: '#ff2d55',
      peer_reviewer: '#af52de',
    };
    return colors[role] || '#86868b';
  };

  // Get status icon
  const getStatusIcon = (status: Agent['state']['status']): string => {
    const icons: Record<Agent['state']['status'], string> = {
      idle: '⏸',
      thinking: '🤔',
      writing: '✍️',
      waiting_feedback: '⏳',
      revising: '🔄',
      completed: '✅',
    };
    return icons[status] || '•';
  };

  return (
    <GlassContainer className={styles.visualizer} padding="none">
      <div 
        ref={containerRef}
        className={styles.container}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Canvas for connections */}
        <canvas ref={canvasRef} className={styles.canvas} />

        {/* Agent nodes */}
        <div className={styles.nodes}>
          {agentNodes.map(node => (
            <div
              key={node.id}
              className={`${styles.agentNode} ${node.isNew ? styles.newAgent : ''} ${selectedAgentId === node.id ? styles.selected : ''} ${hoveredAgentId === node.id ? styles.hovered : ''}`}
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
                transform: `translate(-50%, -50%) scale(${scale})`,
                borderColor: getRoleColor(node.agent.config.role),
              }}
              onClick={() => handleAgentClick(node.id)}
              onMouseEnter={() => setHoveredAgentId(node.id)}
              onMouseLeave={() => setHoveredAgentId(null)}
            >
              <div 
                className={styles.agentAvatar}
                style={{ backgroundColor: getRoleColor(node.agent.config.role) }}
              >
                <span className={styles.statusIcon}>
                  {getStatusIcon(node.agent.state.status)}
                </span>
              </div>
              <div className={styles.agentInfo}>
                <div className={styles.agentName}>{node.agent.config.name}</div>
                <div className={styles.agentRole}>{node.agent.config.role}</div>
              </div>
              {node.isNew && <div className={styles.newBadge}>NEW</div>}
            </div>
          ))}
        </div>

        {/* Controls */}
        {enableZoom && (
          <div className={styles.controls}>
            <button
              className={styles.controlButton}
              onClick={() => setScale(prev => Math.min(3, prev * 1.2))}
              title="Zoom In"
            >
              +
            </button>
            <button
              className={styles.controlButton}
              onClick={() => setScale(1)}
              title="Reset Zoom"
            >
              ⟲
            </button>
            <button
              className={styles.controlButton}
              onClick={() => setScale(prev => Math.max(0.5, prev * 0.8))}
              title="Zoom Out"
            >
              −
            </button>
          </div>
        )}

        {/* Legend */}
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <div className={styles.legendLine} style={{ backgroundColor: '#34c759' }} />
            <span>Active</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendLine} style={{ backgroundColor: '#86868b' }} />
            <span>Idle</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendLine} style={{ backgroundColor: '#ff3b30' }} />
            <span>Error</span>
          </div>
        </div>

        {/* Agent count */}
        <div className={styles.agentCount}>
          {agents.length} / {maxAgents} Agents
        </div>
      </div>
    </GlassContainer>
  );
}
