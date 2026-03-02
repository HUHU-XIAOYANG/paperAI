import { create } from 'zustand';
import type { SystemConfig, AIServiceConfig } from '../types';

interface ConfigStore extends SystemConfig {
  // Actions
  addAIService: (service: AIServiceConfig) => void;
  removeAIService: (serviceId: string) => void;
  updateAIService: (serviceId: string, updates: Partial<AIServiceConfig>) => void;
  setDefaultService: (serviceId: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setInternetAccess: (enabled: boolean, allowedDomains?: string[]) => void;
  updateStreamingConfig: (config: Partial<SystemConfig['streamingConfig']>) => void;
  loadConfig: (config: SystemConfig) => void;
  getAIService: (serviceId: string) => AIServiceConfig | undefined;
}

const initialConfig: SystemConfig = {
  aiServices: [],
  defaultService: '',
  promptRepositoryPath: './prompts',
  outputDirectory: './output',
  theme: 'auto',
  internetAccess: {
    enabled: true,
    allowedDomains: undefined,
  },
  streamingConfig: {
    chunkSize: 1024,
    updateInterval: 100,
  },
};

export const useConfigStore = create<ConfigStore>((set, get) => ({
  // 初始状态
  ...initialConfig,
  
  // 添加AI服务
  addAIService: (service) => set((state) => ({
    aiServices: [...state.aiServices, service],
  })),
  
  // 移除AI服务
  removeAIService: (serviceId) => set((state) => ({
    aiServices: state.aiServices.filter(s => s.id !== serviceId),
  })),
  
  // 更新AI服务
  updateAIService: (serviceId, updates) => set((state) => ({
    aiServices: state.aiServices.map(s => 
      s.id === serviceId ? { ...s, ...updates } : s
    ),
  })),
  
  // 设置默认服务
  setDefaultService: (serviceId) => set({ defaultService: serviceId }),
  
  // 设置主题
  setTheme: (theme) => set({ theme }),
  
  // 设置联网访问
  setInternetAccess: (enabled, allowedDomains) => set((state) => ({
    internetAccess: {
      enabled,
      allowedDomains: allowedDomains ?? state.internetAccess.allowedDomains,
    },
  })),
  
  // 更新流式配置
  updateStreamingConfig: (config) => set((state) => ({
    streamingConfig: { ...state.streamingConfig, ...config },
  })),
  
  // 加载配置
  loadConfig: (config) => set(config),
  
  // 获取AI服务
  getAIService: (serviceId) => {
    return get().aiServices.find(s => s.id === serviceId);
  },
}));
