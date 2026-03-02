/**
 * Dynamic Team Visualizer Example
 * Demonstrates usage of the DynamicTeamVisualizer component
 */

import { useState, useEffect } from 'react';
import { DynamicTeamVisualizer, AgentConnection } from './DynamicTeamVisualizer';
import { useAgentStore } from '../stores/agentStore';
import type { Agent, AgentRole, AgentStatus } from '../types/agent';

/**
 * Example 1: Basic Team Visualization
 */
export function BasicTeamVisualizerExample() {
  const addAgent = useAgentStore((state) => state.addAgent);
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>();

  useEffect(() => {
    // Add sample agents
    const roles: AgentRole[] = ['decision', 'supervisor', 'writer', 'editorial_office', 'editor_in_chief'];
    
    roles.forEach((role, index) => {
      const agent: Agent = {
        id: `agent-${index}`,
        config: {
          id: `agent-${index}`,
          name: `${role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ')} Agent`,
          role: role,
          promptTemplate: 'default',
          aiService: 'openai',
          capabilities: {
            canInternetAccess: true,
            canStreamOutput: true,
            canInteractWithPeers: true,
          },
        },
        state: {
          status: 'idle' as AgentStatus,
          revisionCount: 0,
          lastActivity: new Date(),
        },
        workHistory: [],
        interactionHistory: [],
      };
      addAgent(agent);
    });
  }, [addAgent]);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Basic Team Visualizer</h2>
      <DynamicTeamVisualizer
        onAgentSelect={setSelectedAgentId}
        onAgentDeselect={() => setSelectedAgentId(undefined)}
        selectedAgentId={selectedAgentId}
      />
      {selectedAgentId && (
        <div style={{ marginTop: '20px' }}>
          <p>Selected Agent: {selectedAgentId}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Example 2: Team with Connections
 */
export function TeamWithConnectionsExample() {
  const addAgent = useAgentStore((state) => state.addAgent);
  const [connections, setConnections] = useState<AgentConnection[]>([]);

  useEffect(() => {
    // Add sample agents
    const agentIds = ['decision-1', 'supervisor-1', 'writer-1', 'writer-2', 'editor-1'];
    const roles: AgentRole[] = ['decision', 'supervisor', 'writer', 'writer', 'editor_in_chief'];
    
    agentIds.forEach((id, index) => {
      const role = roles[index];
      if (!role) return; // Skip if role is undefined
      
      const agent: Agent = {
        id,
        config: {
          id,
          name: `${role} ${index + 1}`,
          role: role,
          promptTemplate: 'default',
          aiService: 'openai',
          capabilities: {
            canInternetAccess: true,
            canStreamOutput: true,
            canInteractWithPeers: true,
          },
        },
        state: {
          status: index % 2 === 0 ? 'writing' : 'thinking',
          revisionCount: 0,
          lastActivity: new Date(),
        },
        workHistory: [],
        interactionHistory: [],
      };
      addAgent(agent);
    });

    // Add connections
    setConnections([
      { from: 'decision-1', to: 'supervisor-1', type: 'task', status: 'active', interactionCount: 5 },
      { from: 'supervisor-1', to: 'writer-1', type: 'task', status: 'active', interactionCount: 3 },
      { from: 'supervisor-1', to: 'writer-2', type: 'task', status: 'active', interactionCount: 2 },
      { from: 'writer-1', to: 'editor-1', type: 'feedback', status: 'idle', interactionCount: 1 },
      { from: 'writer-2', to: 'editor-1', type: 'feedback', status: 'idle', interactionCount: 1 },
    ]);
  }, [addAgent]);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Team with Connections</h2>
      <DynamicTeamVisualizer
        connections={connections}
        showConnectionLabels
      />
    </div>
  );
}

/**
 * Example 3: Large Team (>20 agents)
 */
export function LargeTeamExample() {
  const addAgent = useAgentStore((state) => state.addAgent);
  const [connections, setConnections] = useState<AgentConnection[]>([]);

  useEffect(() => {
    const roles: AgentRole[] = ['decision', 'supervisor', 'writer', 'peer_reviewer', 'editorial_office'];
    const agentIds: string[] = [];

    // Create 25 agents
    for (let i = 0; i < 25; i++) {
      const roleIndex = i % roles.length;
      const role = roles[roleIndex];
      if (!role) continue; // Skip if role is undefined
      
      const id = `agent-${i}`;
      agentIds.push(id);

      const statuses: AgentStatus[] = ['idle', 'thinking', 'writing', 'waiting_feedback'];
      const statusIndex = i % 4;
      const status = statuses[statusIndex];
      if (!status) continue; // Skip if status is undefined
      
      const agent: Agent = {
        id,
        config: {
          id,
          name: `${role} ${Math.floor(i / roles.length) + 1}`,
          role: role,
          promptTemplate: 'default',
          aiService: 'openai',
          capabilities: {
            canInternetAccess: true,
            canStreamOutput: true,
            canInteractWithPeers: true,
          },
        },
        state: {
          status: status,
          revisionCount: 0,
          lastActivity: new Date(),
        },
        workHistory: [],
        interactionHistory: [],
      };
      addAgent(agent);
    }

    // Create random connections
    const newConnections: AgentConnection[] = [];
    const connectionTypes: Array<'task' | 'feedback' | 'collaboration'> = ['task', 'feedback', 'collaboration'];
    const connectionStatuses: Array<'active' | 'idle' | 'error'> = ['active', 'idle', 'error'];
    
    for (let i = 0; i < 30; i++) {
      const fromIndex = Math.floor(Math.random() * agentIds.length);
      const toIndex = Math.floor(Math.random() * agentIds.length);
      const from = agentIds[fromIndex];
      const to = agentIds[toIndex];
      const type = connectionTypes[Math.floor(Math.random() * 3)];
      const status = connectionStatuses[Math.floor(Math.random() * 3)];
      
      if (from && to && from !== to && type && status) {
        newConnections.push({
          from,
          to,
          type,
          status,
          interactionCount: Math.floor(Math.random() * 10) + 1,
        });
      }
    }
    setConnections(newConnections);
  }, [addAgent]);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Large Team (&gt;20 Agents)</h2>
      <DynamicTeamVisualizer
        connections={connections}
        showConnectionLabels
        enableZoom
        maxAgents={50}
      />
    </div>
  );
}

/**
 * Example 4: Dynamic Agent Addition
 */
export function DynamicAgentAdditionExample() {
  const addAgent = useAgentStore((state) => state.addAgent);
  const agents = useAgentStore((state) => state.getAllAgents());
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>();

  const handleAddAgent = () => {
    const roles: AgentRole[] = ['writer', 'peer_reviewer', 'deputy_editor'];
    const role = roles[Math.floor(Math.random() * roles.length)];
    if (!role) return; // Skip if role is undefined
    
    const id = `agent-${Date.now()}`;

    const agent: Agent = {
      id,
      config: {
        id,
        name: `New ${role}`,
        role: role,
        promptTemplate: 'default',
        aiService: 'openai',
        capabilities: {
          canInternetAccess: true,
          canStreamOutput: true,
          canInteractWithPeers: true,
        },
      },
      state: {
        status: 'idle',
        revisionCount: 0,
        lastActivity: new Date(),
      },
      workHistory: [],
      interactionHistory: [],
    };
    addAgent(agent);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Dynamic Agent Addition</h2>
      <button
        onClick={handleAddAgent}
        style={{
          padding: '10px 20px',
          marginBottom: '20px',
          background: '#007aff',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        Add New Agent
      </button>
      <p>Total Agents: {agents.length}</p>
      <DynamicTeamVisualizer
        onAgentSelect={setSelectedAgentId}
        selectedAgentId={selectedAgentId}
      />
    </div>
  );
}

/**
 * Example 5: Hierarchical Layout
 */
export function HierarchicalLayoutExample() {
  const addAgent = useAgentStore((state) => state.addAgent);

  useEffect(() => {
    const hierarchy = [
      { role: 'decision' as AgentRole, count: 1 },
      { role: 'supervisor' as AgentRole, count: 2 },
      { role: 'editor_in_chief' as AgentRole, count: 1 },
      { role: 'deputy_editor' as AgentRole, count: 2 },
      { role: 'editorial_office' as AgentRole, count: 3 },
      { role: 'writer' as AgentRole, count: 5 },
      { role: 'peer_reviewer' as AgentRole, count: 4 },
    ];

    let agentIndex = 0;
    hierarchy.forEach(({ role, count }) => {
      for (let i = 0; i < count; i++) {
        const id = `agent-${agentIndex++}`;
        const agent: Agent = {
          id,
          config: {
            id,
            name: `${role} ${i + 1}`,
            role: role,
            promptTemplate: 'default',
            aiService: 'openai',
            capabilities: {
              canInternetAccess: true,
              canStreamOutput: true,
              canInteractWithPeers: true,
            },
          },
          state: {
            status: 'idle',
            revisionCount: 0,
            lastActivity: new Date(),
          },
          workHistory: [],
          interactionHistory: [],
        };
        addAgent(agent);
      }
    });
  }, [addAgent]);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Hierarchical Layout</h2>
      <DynamicTeamVisualizer layout="hierarchical" />
    </div>
  );
}

/**
 * Example 6: All Features Combined
 */
export function ComprehensiveExample() {
  const addAgent = useAgentStore((state) => state.addAgent);
  const [connections, setConnections] = useState<AgentConnection[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>();
  const [layout, setLayout] = useState<'circular' | 'hierarchical' | 'force'>('circular');

  useEffect(() => {
    // Initialize with some agents
    const roles: AgentRole[] = ['decision', 'supervisor', 'writer', 'editor_in_chief', 'peer_reviewer'];
    const agentIds: string[] = [];

    roles.forEach((role) => {
      for (let i = 0; i < 3; i++) {
        const id = `${role}-${i}`;
        agentIds.push(id);
        const statuses: AgentStatus[] = ['idle', 'thinking', 'writing'];
        const status = statuses[i % 3];
        if (!status) continue; // Skip if status is undefined
        
        const agent: Agent = {
          id,
          config: {
            id,
            name: `${role} ${i + 1}`,
            role: role,
            promptTemplate: 'default',
            aiService: 'openai',
            capabilities: {
              canInternetAccess: true,
              canStreamOutput: true,
              canInteractWithPeers: true,
            },
          },
          state: {
            status: status,
            revisionCount: 0,
            lastActivity: new Date(),
          },
          workHistory: [],
          interactionHistory: [],
        };
        addAgent(agent);
      }
    });

    // Add some connections
    const newConnections: AgentConnection[] = [
      { from: 'decision-0', to: 'supervisor-0', type: 'task', status: 'active', interactionCount: 5 },
      { from: 'supervisor-0', to: 'writer-0', type: 'task', status: 'active', interactionCount: 3 },
      { from: 'writer-0', to: 'editor_in_chief-0', type: 'feedback', status: 'idle', interactionCount: 2 },
      { from: 'editor_in_chief-0', to: 'peer_reviewer-0', type: 'collaboration', status: 'active', interactionCount: 4 },
    ];
    setConnections(newConnections);
  }, [addAgent]);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Comprehensive Example</h2>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={() => setLayout('circular')}>Circular</button>
        <button onClick={() => setLayout('hierarchical')}>Hierarchical</button>
        <button onClick={() => setLayout('force')}>Force</button>
      </div>
      <DynamicTeamVisualizer
        connections={connections}
        onAgentSelect={setSelectedAgentId}
        onAgentDeselect={() => setSelectedAgentId(undefined)}
        selectedAgentId={selectedAgentId}
        showConnectionLabels
        enableZoom
        layout={layout}
      />
      {selectedAgentId && (
        <div style={{ marginTop: '20px', padding: '15px', background: '#f5f5f7', borderRadius: '8px' }}>
          <h3>Selected Agent: {selectedAgentId}</h3>
        </div>
      )}
    </div>
  );
}
