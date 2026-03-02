import { create } from 'zustand';
import type { AgentMessage, MessageType } from '../types';

interface MessageStore {
  // 状态
  messages: Map<string, AgentMessage>;
  
  // 内存管理配置
  memoryConfig: {
    maxMessages: number; // 最大消息数量
    maxAge: number; // 消息最大保留时间（毫秒）
    autoCleanup: boolean; // 自动清理
  };
  
  // Actions
  addMessage: (message: AgentMessage) => void;
  getMessage: (messageId: string) => AgentMessage | undefined;
  getAllMessages: () => AgentMessage[];
  getMessagesByAgent: (agentId: string) => AgentMessage[];
  getMessagesByType: (type: MessageType) => AgentMessage[];
  getMessagesBetween: (senderId: string, receiverId: string) => AgentMessage[];
  clearMessages: () => void;
  cleanupOldMessages: () => number;
  configureMemory: (maxMessages?: number, maxAge?: number, autoCleanup?: boolean) => void;
  getMemoryStatus: () => { messageCount: number; oldestMessage?: Date };
}

export const useMessageStore = create<MessageStore>((set, get) => ({
  // 初始状态
  messages: new Map(),
  
  // 内存管理配置 - 目标：长时间运行内存<500MB
  memoryConfig: {
    maxMessages: 10000, // 最多保留10000条消息
    maxAge: 3600000, // 1小时
    autoCleanup: true,
  },
  
  // 添加消息
  addMessage: (message) => set((state) => {
    const newMessages = new Map(state.messages);
    newMessages.set(message.id, message);
    
    // 自动清理旧消息
    if (state.memoryConfig.autoCleanup) {
      // 检查消息数量限制
      if (newMessages.size > state.memoryConfig.maxMessages) {
        // 删除最旧的消息
        const sortedMessages = Array.from(newMessages.entries())
          .sort((a, b) => a[1].timestamp.getTime() - b[1].timestamp.getTime());
        
        const toDelete = sortedMessages.slice(0, sortedMessages.length - state.memoryConfig.maxMessages);
        toDelete.forEach(([id]) => newMessages.delete(id));
      }
      
      // 检查消息年龄
      const now = new Date();
      for (const [id, msg] of newMessages.entries()) {
        const age = now.getTime() - msg.timestamp.getTime();
        if (age > state.memoryConfig.maxAge) {
          newMessages.delete(id);
        }
      }
    }
    
    return { messages: newMessages };
  }),
  
  // 获取单个消息
  getMessage: (messageId) => {
    return get().messages.get(messageId);
  },
  
  // 获取所有消息
  getAllMessages: () => {
    return Array.from(get().messages.values())
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  },
  
  // 获取与特定Agent相关的消息
  getMessagesByAgent: (agentId) => {
    return Array.from(get().messages.values())
      .filter(msg => 
        msg.sender === agentId || 
        msg.receiver === agentId ||
        (Array.isArray(msg.receiver) && msg.receiver.includes(agentId))
      )
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  },
  
  // 按类型获取消息
  getMessagesByType: (type) => {
    return Array.from(get().messages.values())
      .filter(msg => msg.type === type)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  },
  
  // 获取两个Agent之间的消息
  getMessagesBetween: (senderId, receiverId) => {
    return Array.from(get().messages.values())
      .filter(msg => 
        (msg.sender === senderId && msg.receiver === receiverId) ||
        (msg.sender === receiverId && msg.receiver === senderId)
      )
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  },
  
  // 清空所有消息
  clearMessages: () => set({ messages: new Map() }),
  
  // 清理旧消息
  cleanupOldMessages: () => {
    const state = get();
    const now = new Date();
    let cleanedCount = 0;
    
    const newMessages = new Map(state.messages);
    for (const [id, msg] of newMessages.entries()) {
      const age = now.getTime() - msg.timestamp.getTime();
      if (age > state.memoryConfig.maxAge) {
        newMessages.delete(id);
        cleanedCount++;
      }
    }
    
    set({ messages: newMessages });
    return cleanedCount;
  },
  
  // 配置内存管理
  configureMemory: (maxMessages, maxAge, autoCleanup) => set((state) => ({
    memoryConfig: {
      maxMessages: maxMessages ?? state.memoryConfig.maxMessages,
      maxAge: maxAge ?? state.memoryConfig.maxAge,
      autoCleanup: autoCleanup ?? state.memoryConfig.autoCleanup,
    },
  })),
  
  // 获取内存状态
  getMemoryStatus: () => {
    const messages = get().messages;
    const messageArray = Array.from(messages.values());
    
    return {
      messageCount: messages.size,
      oldestMessage: messageArray.length > 0
        ? messageArray.reduce((oldest, msg) => 
            msg.timestamp < oldest ? msg.timestamp : oldest, 
            messageArray[0].timestamp)
        : undefined,
    };
  },
}));
