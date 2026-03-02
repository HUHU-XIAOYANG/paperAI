/**
 * Stream Store - 流式输出状态管理
 * 
 * 使用Zustand管理流式输出的全局状态，为UI组件提供便捷的访问接口。
 * 
 * @module stores/streamStore
 */

import { create } from 'zustand';
import { streamHandler } from '../services/streamHandler';
import type { StreamSession } from '../types/message.types';

/**
 * Agent流式输出状态
 */
interface AgentStreamState {
  /** 会话ID */
  sessionId: string;
  /** Agent ID */
  agentId: string;
  /** 当前缓冲内容 */
  content: string;
  /** 是否正在流式输出 */
  isStreaming: boolean;
  /** 开始时间 */
  startTime: Date;
}

/**
 * Stream Store状态接口
 */
interface StreamStore {
  /** Agent流式输出状态映射 (agentId -> AgentStreamState) */
  streams: Map<string, AgentStreamState>;

  /** 开始Agent的流式输出 */
  startStream: (agentId: string) => void;

  /** 更新Agent的流式内容 */
  updateStreamContent: (agentId: string, chunk: string) => void;

  /** 结束Agent的流式输出 */
  endStream: (agentId: string) => void;

  /** 获取Agent的流式状态 */
  getStreamState: (agentId: string) => AgentStreamState | undefined;

  /** 清理所有流式状态 */
  clearAllStreams: () => void;
}

/**
 * 创建Stream Store
 */
export const useStreamStore = create<StreamStore>((set, get) => ({
  streams: new Map(),

  startStream: (agentId: string) => {
    try {
      // 检查是否已有活跃会话
      let session = streamHandler.getActiveSessionByAgent(agentId);
      
      if (!session) {
        // 创建新会话
        session = streamHandler.startStream(agentId);

        // 订阅流式输出
        streamHandler.subscribeToStream(session.id, (chunk, isComplete) => {
          const state = get();
          const streamState = state.streams.get(agentId);

          if (streamState) {
            if (isComplete) {
              // 流式输出完成
              set((state) => {
                const newStreams = new Map(state.streams);
                const current = newStreams.get(agentId);
                if (current) {
                  newStreams.set(agentId, {
                    ...current,
                    isStreaming: false,
                  });
                }
                return { streams: newStreams };
              });
            } else if (chunk) {
              // 接收到新数据块
              set((state) => {
                const newStreams = new Map(state.streams);
                const current = newStreams.get(agentId);
                if (current) {
                  newStreams.set(agentId, {
                    ...current,
                    content: current.content + chunk,
                  });
                }
                return { streams: newStreams };
              });
            }
          }
        });
      }

      // 更新状态
      set((state) => {
        const newStreams = new Map(state.streams);
        newStreams.set(agentId, {
          sessionId: session!.id,
          agentId,
          content: session!.buffer,
          isStreaming: session!.isActive,
          startTime: session!.startTime,
        });
        return { streams: newStreams };
      });
    } catch (error) {
      console.error(`Failed to start stream for agent ${agentId}:`, error);
    }
  },

  updateStreamContent: (agentId: string, chunk: string) => {
    set((state) => {
      const newStreams = new Map(state.streams);
      const current = newStreams.get(agentId);
      
      if (current) {
        newStreams.set(agentId, {
          ...current,
          content: current.content + chunk,
        });
      }
      
      return { streams: newStreams };
    });
  },

  endStream: (agentId: string) => {
    const state = get();
    const streamState = state.streams.get(agentId);

    if (streamState) {
      try {
        streamHandler.endStream(streamState.sessionId);
      } catch (error) {
        console.error(`Failed to end stream for agent ${agentId}:`, error);
      }

      set((state) => {
        const newStreams = new Map(state.streams);
        const current = newStreams.get(agentId);
        
        if (current) {
          newStreams.set(agentId, {
            ...current,
            isStreaming: false,
          });
        }
        
        return { streams: newStreams };
      });
    }
  },

  getStreamState: (agentId: string) => {
    return get().streams.get(agentId);
  },

  clearAllStreams: () => {
    streamHandler.clearAllSessions();
    set({ streams: new Map() });
  },
}));

/**
 * Hook: 获取Agent的流式输出内容
 */
export function useAgentStream(agentId: string) {
  const streamState = useStreamStore((state) => state.streams.get(agentId));
  const startStream = useStreamStore((state) => state.startStream);
  const endStream = useStreamStore((state) => state.endStream);

  return {
    content: streamState?.content || '',
    isStreaming: streamState?.isStreaming || false,
    startTime: streamState?.startTime,
    startStream: () => startStream(agentId),
    endStream: () => endStream(agentId),
  };
}

/**
 * Hook: 获取所有活跃的流式输出
 */
export function useActiveStreams() {
  const streams = useStreamStore((state) => state.streams);
  
  return Array.from(streams.values()).filter((stream) => stream.isStreaming);
}
