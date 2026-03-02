import { create } from 'zustand';
import type { SystemState, ProcessPhase } from '../types';

interface SystemStore extends SystemState {
  // Actions
  setPhase: (phase: ProcessPhase) => void;
  setTopic: (topic: string) => void;
  setEstimatedCompletion: (date: Date) => void;
  incrementRejectionCount: () => void;
  resetRejectionCount: () => void;
  addActiveAgent: (agentId: string) => void;
  removeActiveAgent: (agentId: string) => void;
  startProcess: (topic: string) => void;
  resetSystem: () => void;
}

const initialState: SystemState = {
  currentPhase: 'idle',
  activeAgents: [],
  rejectionCount: 0,
  estimatedCompletion: undefined,
  currentTopic: undefined,
  startTime: undefined,
};

export const useSystemStore = create<SystemStore>((set) => ({
  // 初始状态
  ...initialState,
  
  // 设置流程阶段
  setPhase: (phase) => set({ currentPhase: phase }),
  
  // 设置当前题目
  setTopic: (topic) => set({ currentTopic: topic }),
  
  // 设置预计完成时间
  setEstimatedCompletion: (date) => set({ estimatedCompletion: date }),
  
  // 增加退稿次数
  incrementRejectionCount: () => set((state) => ({ 
    rejectionCount: state.rejectionCount + 1 
  })),
  
  // 重置退稿次数
  resetRejectionCount: () => set({ rejectionCount: 0 }),
  
  // 添加活跃Agent
  addActiveAgent: (agentId) => set((state) => ({
    activeAgents: [...state.activeAgents, agentId]
  })),
  
  // 移除活跃Agent
  removeActiveAgent: (agentId) => set((state) => ({
    activeAgents: state.activeAgents.filter(id => id !== agentId)
  })),
  
  // 开始流程
  startProcess: (topic) => set({
    currentPhase: 'initialization',
    currentTopic: topic,
    startTime: new Date(),
    rejectionCount: 0,
  }),
  
  // 重置系统
  resetSystem: () => set(initialState),
}));
