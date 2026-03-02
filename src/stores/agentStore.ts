import { create } from 'zustand';
import type { Agent, AgentInfo } from '../types';

interface AgentStore {
  // 状态
  agents: Map<string, Agent>;
  
  // 内存管理配置
  memoryConfig: {
    maxWorkHistoryPerAgent: number; // 每个Agent最大工作历史记录数
    maxInteractionHistoryPerAgent: number; // 每个Agent最大交互历史记录数
    autoCleanup: boolean; // 自动清理
  };
  
  // Actions
  addAgent: (agent: Agent) => void;
  removeAgent: (agentId: string) => void;
  updateAgent: (agentId: string, updates: Partial<Agent>) => void;
  getAgent: (agentId: string) => Agent | undefined;
  getAllAgents: () => Agent[];
  getAgentsByRole: (role: Agent['config']['role']) => Agent[];
  getActiveAgents: () => AgentInfo[];
  clearAgents: () => void;
  cleanupAgentHistory: (agentId: string) => void;
  cleanupAllAgentHistories: () => number;
  configureMemory: (maxWorkHistory?: number, maxInteractionHistory?: number, autoCleanup?: boolean) => void;
  getMemoryStatus: () => { agentCount: number; totalWorkRecords: number; totalInteractions: number };
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  // 初始状态
  agents: new Map(),
  
  // 内存管理配置
  memoryConfig: {
    maxWorkHistoryPerAgent: 100, // 每个Agent最多保留100条工作记录
    maxInteractionHistoryPerAgent: 200, // 每个Agent最多保留200条交互记录
    autoCleanup: true,
  },
  
  // 添加Agent
  addAgent: (agent) => set((state) => {
    const newAgents = new Map(state.agents);
    newAgents.set(agent.id, agent);
    return { agents: newAgents };
  }),
  
  // 移除Agent
  removeAgent: (agentId) => set((state) => {
    const newAgents = new Map(state.agents);
    newAgents.delete(agentId);
    return { agents: newAgents };
  }),
  
  // 更新Agent
  updateAgent: (agentId, updates) => set((state) => {
    const agent = state.agents.get(agentId);
    if (!agent) return state;
    
    const updatedAgent = { ...agent, ...updates };
    
    // 自动清理历史记录
    if (state.memoryConfig.autoCleanup) {
      if (updatedAgent.workHistory.length > state.memoryConfig.maxWorkHistoryPerAgent) {
        updatedAgent.workHistory = updatedAgent.workHistory.slice(-state.memoryConfig.maxWorkHistoryPerAgent);
      }
      if (updatedAgent.interactionHistory.length > state.memoryConfig.maxInteractionHistoryPerAgent) {
        updatedAgent.interactionHistory = updatedAgent.interactionHistory.slice(-state.memoryConfig.maxInteractionHistoryPerAgent);
      }
    }
    
    const newAgents = new Map(state.agents);
    newAgents.set(agentId, updatedAgent);
    return { agents: newAgents };
  }),
  
  // 获取单个Agent
  getAgent: (agentId) => {
    return get().agents.get(agentId);
  },
  
  // 获取所有Agent
  getAllAgents: () => {
    return Array.from(get().agents.values());
  },
  
  // 按角色获取Agent
  getAgentsByRole: (role) => {
    return Array.from(get().agents.values()).filter(
      agent => agent.config.role === role
    );
  },
  
  // 获取活跃Agent信息
  getActiveAgents: () => {
    return Array.from(get().agents.values()).map(agent => ({
      id: agent.id,
      name: agent.config.name,
      role: agent.config.role,
      currentTask: agent.state.currentTask?.description,
    }));
  },
  
  // 清空所有Agent
  clearAgents: () => set({ agents: new Map() }),
  
  // 清理单个Agent的历史记录
  cleanupAgentHistory: (agentId) => {
    const state = get();
    const agent = state.agents.get(agentId);
    if (!agent) return;
    
    const updatedAgent = { ...agent };
    updatedAgent.workHistory = updatedAgent.workHistory.slice(-state.memoryConfig.maxWorkHistoryPerAgent);
    updatedAgent.interactionHistory = updatedAgent.interactionHistory.slice(-state.memoryConfig.maxInteractionHistoryPerAgent);
    
    const newAgents = new Map(state.agents);
    newAgents.set(agentId, updatedAgent);
    set({ agents: newAgents });
  },
  
  // 清理所有Agent的历史记录
  cleanupAllAgentHistories: () => {
    const state = get();
    let cleanedCount = 0;
    
    const newAgents = new Map(state.agents);
    for (const [agentId, agent] of newAgents.entries()) {
      const originalWorkCount = agent.workHistory.length;
      const originalInteractionCount = agent.interactionHistory.length;
      
      const updatedAgent = { ...agent };
      updatedAgent.workHistory = updatedAgent.workHistory.slice(-state.memoryConfig.maxWorkHistoryPerAgent);
      updatedAgent.interactionHistory = updatedAgent.interactionHistory.slice(-state.memoryConfig.maxInteractionHistoryPerAgent);
      
      if (updatedAgent.workHistory.length < originalWorkCount || 
          updatedAgent.interactionHistory.length < originalInteractionCount) {
        newAgents.set(agentId, updatedAgent);
        cleanedCount++;
      }
    }
    
    set({ agents: newAgents });
    return cleanedCount;
  },
  
  // 配置内存管理
  configureMemory: (maxWorkHistory, maxInteractionHistory, autoCleanup) => set((state) => ({
    memoryConfig: {
      maxWorkHistoryPerAgent: maxWorkHistory ?? state.memoryConfig.maxWorkHistoryPerAgent,
      maxInteractionHistoryPerAgent: maxInteractionHistory ?? state.memoryConfig.maxInteractionHistoryPerAgent,
      autoCleanup: autoCleanup ?? state.memoryConfig.autoCleanup,
    },
  })),
  
  // 获取内存状态
  getMemoryStatus: () => {
    const agents = get().agents;
    let totalWorkRecords = 0;
    let totalInteractions = 0;
    
    for (const agent of agents.values()) {
      totalWorkRecords += agent.workHistory.length;
      totalInteractions += agent.interactionHistory.length;
    }
    
    return {
      agentCount: agents.size,
      totalWorkRecords,
      totalInteractions,
    };
  },
}));
