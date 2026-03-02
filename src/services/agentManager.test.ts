/**
 * Agent管理器单元测试
 * Agent Manager Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AgentManagerImpl, createAgentManager } from './agentManager';
import type { AgentConfig, AgentRole } from '../types/agent';
import type { SystemConfig } from '../types/config';
import { useAgentStore } from '../stores/agentStore';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock aiClient module
vi.mock('./aiClient', () => ({
  createAIClient: vi.fn(() => ({
    sendRequest: vi.fn(),
    validateConnection: vi.fn(),
    performWebSearch: vi.fn(),
  })),
}));

// Helper to create test system config
function createTestSystemConfig(): SystemConfig {
  return {
    aiServices: [
      {
        id: 'test-service',
        name: 'Test Service',
        apiKey: 'test-api-key',
        apiUrl: 'https://api.test.com/v1',
        model: 'test-model',
        provider: 'openai',
      },
    ],
    defaultService: 'test-service',
    promptRepositoryPath: './prompts',
    outputDirectory: './output',
    theme: 'light',
    internetAccess: {
      enabled: true,
      allowedDomains: [],
    },
    streamingConfig: {
      chunkSize: 1024,
      updateInterval: 100,
    },
  };
}

// Helper to create test agent config
function createTestAgentConfig(role: AgentRole = 'writer'): AgentConfig {
  return {
    id: `test-${role}-${Date.now()}`,
    name: `Test ${role}`,
    role,
    promptTemplate: `prompts/${role}.yaml`,
    aiService: 'test-service',
    capabilities: {
      canInternetAccess: true,
      canStreamOutput: true,
      canInteractWithPeers: true,
    },
  };
}

// ============================================================================
// Tests: Agent Creation
// ============================================================================

describe('AgentManager - Agent Creation', () => {
  let manager: AgentManagerImpl;

  beforeEach(() => {
    // Clear agent store before each test
    useAgentStore.getState().clearAgents();
    
    // Create fresh manager instance
    manager = new AgentManagerImpl(createTestSystemConfig());
  });

  it('should create an agent successfully', async () => {
    const config = createTestAgentConfig('writer');
    const agent = await manager.createAgent(config);

    expect(agent).toBeDefined();
    expect(agent.id).toBe(config.id);
    expect(agent.config.name).toBe(config.name);
    expect(agent.config.role).toBe('writer');
    expect(agent.state.status).toBe('idle');
    expect(agent.state.revisionCount).toBe(0);
    expect(agent.workHistory).toEqual([]);
    expect(agent.interactionHistory).toEqual([]);
  });

  it('should add created agent to store', async () => {
    const config = createTestAgentConfig('writer');
    await manager.createAgent(config);

    const agentFromStore = useAgentStore.getState().getAgent(config.id);
    expect(agentFromStore).toBeDefined();
    expect(agentFromStore?.id).toBe(config.id);
  });

  it('should create agents with different roles', async () => {
    const roles: AgentRole[] = [
      'decision',
      'supervisor',
      'writer',
      'editorial_office',
      'editor_in_chief',
      'deputy_editor',
      'peer_reviewer',
    ];

    for (const role of roles) {
      const config = createTestAgentConfig(role);
      const agent = await manager.createAgent(config);

      expect(agent.config.role).toBe(role);
    }
  });

  it('should throw error if agent config is missing id', async () => {
    const config = createTestAgentConfig('writer');
    config.id = '';

    await expect(manager.createAgent(config)).rejects.toThrow('Agent配置缺少id字段');
  });

  it('should throw error if agent config is missing name', async () => {
    const config = createTestAgentConfig('writer');
    config.name = '';

    await expect(manager.createAgent(config)).rejects.toThrow('Agent配置缺少name字段');
  });

  it('should throw error if agent config is missing role', async () => {
    const config = createTestAgentConfig('writer');
    (config as any).role = '';

    await expect(manager.createAgent(config)).rejects.toThrow('Agent配置缺少role字段');
  });

  it('should throw error if agent config is missing aiService', async () => {
    const config = createTestAgentConfig('writer');
    config.aiService = '';

    await expect(manager.createAgent(config)).rejects.toThrow('Agent配置缺少aiService字段');
  });

  it('should throw error if agent ID already exists', async () => {
    const config = createTestAgentConfig('writer');
    await manager.createAgent(config);

    // Try to create another agent with the same ID
    await expect(manager.createAgent(config)).rejects.toThrow(`Agent ID已存在: ${config.id}`);
  });

  it('should throw error if AI service config not found', async () => {
    const config = createTestAgentConfig('writer');
    config.aiService = 'non-existent-service';

    await expect(manager.createAgent(config)).rejects.toThrow(
      'AI服务配置未找到: non-existent-service'
    );
  });

  it('should set lastActivity to current time', async () => {
    const beforeCreate = new Date();
    const config = createTestAgentConfig('writer');
    const agent = await manager.createAgent(config);
    const afterCreate = new Date();

    expect(agent.state.lastActivity.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(agent.state.lastActivity.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
  });
});

// ============================================================================
// Tests: Agent Destruction
// ============================================================================

describe('AgentManager - Agent Destruction', () => {
  let manager: AgentManagerImpl;

  beforeEach(() => {
    useAgentStore.getState().clearAgents();
    manager = new AgentManagerImpl(createTestSystemConfig());
  });

  it('should destroy an agent successfully', async () => {
    const config = createTestAgentConfig('writer');
    const agent = await manager.createAgent(config);

    await manager.destroyAgent(agent.id);

    const agentFromStore = useAgentStore.getState().getAgent(agent.id);
    expect(agentFromStore).toBeUndefined();
  });

  it('should handle destroying non-existent agent gracefully', async () => {
    await expect(manager.destroyAgent('non-existent-id')).resolves.not.toThrow();
  });

  it('should remove agent from active agents list', async () => {
    const config = createTestAgentConfig('writer');
    const agent = await manager.createAgent(config);

    expect(manager.getActiveAgents()).toHaveLength(1);

    await manager.destroyAgent(agent.id);

    expect(manager.getActiveAgents()).toHaveLength(0);
  });
});

// ============================================================================
// Tests: Get Active Agents
// ============================================================================

describe('AgentManager - Get Active Agents', () => {
  let manager: AgentManagerImpl;

  beforeEach(() => {
    useAgentStore.getState().clearAgents();
    manager = new AgentManagerImpl(createTestSystemConfig());
  });

  it('should return empty array when no agents exist', () => {
    const agents = manager.getActiveAgents();
    expect(agents).toEqual([]);
  });

  it('should return all active agents', async () => {
    const config1 = createTestAgentConfig('writer');
    const config2 = createTestAgentConfig('supervisor');
    const config3 = createTestAgentConfig('decision');

    await manager.createAgent(config1);
    await manager.createAgent(config2);
    await manager.createAgent(config3);

    const agents = manager.getActiveAgents();
    expect(agents).toHaveLength(3);
  });

  it('should return agents with correct properties', async () => {
    const config = createTestAgentConfig('writer');
    await manager.createAgent(config);

    const agents = manager.getActiveAgents();
    expect(agents[0]).toMatchObject({
      id: config.id,
      config: expect.objectContaining({
        name: config.name,
        role: config.role,
      }),
      state: expect.objectContaining({
        status: 'idle',
      }),
    });
  });
});

// ============================================================================
// Tests: Dynamic Agent Addition
// ============================================================================

describe('AgentManager - Dynamic Agent Addition', () => {
  let manager: AgentManagerImpl;

  beforeEach(() => {
    useAgentStore.getState().clearAgents();
    manager = new AgentManagerImpl(createTestSystemConfig());
  });

  it('should add dynamic agent with task', async () => {
    const task = '撰写论文引言部分';
    const agent = await manager.addDynamicAgent('writer', task);

    expect(agent).toBeDefined();
    expect(agent.config.role).toBe('writer');
    expect(agent.state.currentTask).toBeDefined();
    expect(agent.state.currentTask?.description).toBe(task);
    expect(agent.state.currentTask?.priority).toBe('high');
  });

  it('should generate unique ID for dynamic agent', async () => {
    const agent1 = await manager.addDynamicAgent('writer', 'Task 1');
    const agent2 = await manager.addDynamicAgent('writer', 'Task 2');

    expect(agent1.id).not.toBe(agent2.id);
  });

  it('should generate appropriate name for dynamic agent', async () => {
    const agent1 = await manager.addDynamicAgent('writer', 'Task 1');
    expect(agent1.config.name).toBe('写作AI');

    const agent2 = await manager.addDynamicAgent('writer', 'Task 2');
    expect(agent2.config.name).toBe('写作AI 2');

    const agent3 = await manager.addDynamicAgent('writer', 'Task 3');
    expect(agent3.config.name).toBe('写作AI 3');
  });

  it('should set correct prompt template for role', async () => {
    const agent = await manager.addDynamicAgent('supervisor', 'Monitor quality');

    expect(agent.config.promptTemplate).toBe('prompts/supervisor.yaml');
  });

  it('should use default AI service', async () => {
    const agent = await manager.addDynamicAgent('writer', 'Task');

    expect(agent.config.aiService).toBe('test-service');
  });

  it('should enable capabilities based on system config', async () => {
    const agent = await manager.addDynamicAgent('writer', 'Task');

    expect(agent.config.capabilities.canInternetAccess).toBe(true);
    expect(agent.config.capabilities.canStreamOutput).toBe(true);
    expect(agent.config.capabilities.canInteractWithPeers).toBe(true);
  });

  it('should add dynamic agent to active agents list', async () => {
    expect(manager.getActiveAgents()).toHaveLength(0);

    await manager.addDynamicAgent('writer', 'Task');

    expect(manager.getActiveAgents()).toHaveLength(1);
  });

  it('should support adding different role types dynamically', async () => {
    const roles: AgentRole[] = ['writer', 'supervisor', 'peer_reviewer'];

    for (const role of roles) {
      const agent = await manager.addDynamicAgent(role, `Task for ${role}`);
      expect(agent.config.role).toBe(role);
    }
  });
});

// ============================================================================
// Tests: Get and Update Agent
// ============================================================================

describe('AgentManager - Get and Update Agent', () => {
  let manager: AgentManagerImpl;

  beforeEach(() => {
    useAgentStore.getState().clearAgents();
    manager = new AgentManagerImpl(createTestSystemConfig());
  });

  it('should get agent by ID', async () => {
    const config = createTestAgentConfig('writer');
    await manager.createAgent(config);

    const agent = manager.getAgent(config.id);
    expect(agent).toBeDefined();
    expect(agent?.id).toBe(config.id);
  });

  it('should return undefined for non-existent agent', () => {
    const agent = manager.getAgent('non-existent-id');
    expect(agent).toBeUndefined();
  });

  it('should update agent state', async () => {
    const config = createTestAgentConfig('writer');
    await manager.createAgent(config);

    manager.updateAgent(config.id, {
      state: {
        status: 'writing',
        revisionCount: 1,
        lastActivity: new Date(),
      },
    });

    const agent = manager.getAgent(config.id);
    expect(agent?.state.status).toBe('writing');
    expect(agent?.state.revisionCount).toBe(1);
  });

  it('should update agent work history', async () => {
    const config = createTestAgentConfig('writer');
    await manager.createAgent(config);

    const workRecord = {
      taskId: 'task-1',
      startTime: new Date(),
      output: 'Some output',
      status: 'completed' as const,
      feedbackReceived: [],
    };

    manager.updateAgent(config.id, {
      workHistory: [workRecord],
    });

    const agent = manager.getAgent(config.id);
    expect(agent?.workHistory).toHaveLength(1);
    expect(agent?.workHistory[0]).toMatchObject(workRecord);
  });
});

// ============================================================================
// Tests: Factory Function
// ============================================================================

describe('createAgentManager', () => {
  it('should create AgentManager instance', () => {
    const config = createTestSystemConfig();
    const manager = createAgentManager(config);

    expect(manager).toBeDefined();
    expect(typeof manager.createAgent).toBe('function');
    expect(typeof manager.destroyAgent).toBe('function');
    expect(typeof manager.getActiveAgents).toBe('function');
    expect(typeof manager.addDynamicAgent).toBe('function');
  });
});

// ============================================================================
// Tests: Concurrent Operations
// ============================================================================

describe('AgentManager - Concurrent Operations', () => {
  let manager: AgentManagerImpl;

  beforeEach(() => {
    useAgentStore.getState().clearAgents();
    manager = new AgentManagerImpl(createTestSystemConfig());
  });

  it('should handle concurrent agent creation', async () => {
    const configs = [
      createTestAgentConfig('writer'),
      createTestAgentConfig('supervisor'),
      createTestAgentConfig('decision'),
    ];

    const agents = await Promise.all(configs.map((config) => manager.createAgent(config)));

    expect(agents).toHaveLength(3);
    expect(manager.getActiveAgents()).toHaveLength(3);
  });

  it('should handle concurrent dynamic agent addition', async () => {
    const tasks = ['Task 1', 'Task 2', 'Task 3'];

    const agents = await Promise.all(
      tasks.map((task) => manager.addDynamicAgent('writer', task))
    );

    expect(agents).toHaveLength(3);
    expect(manager.getActiveAgents()).toHaveLength(3);
  });
});

// ============================================================================
// Tests: UI Integration (Requirement 7.8)
// ============================================================================

describe('AgentManager - UI Integration', () => {
  let manager: AgentManagerImpl;

  beforeEach(() => {
    useAgentStore.getState().clearAgents();
    manager = new AgentManagerImpl(createTestSystemConfig());
  });

  it('should integrate dynamic agent into store for UI display (Req 7.8)', async () => {
    // 验证需求 7.8: WHEN Decision_AI执行Dynamic_Role_Addition，
    // THE System SHALL 动态创建新成员的Work_Display_Panel并集成到现有团队
    
    const initialCount = useAgentStore.getState().getAllAgents().length;
    expect(initialCount).toBe(0);

    // 动态增加Agent
    const agent = await manager.addDynamicAgent('writer', '撰写引言部分');

    // 验证Agent已添加到store（UI可以通过store获取并显示）
    const agentsInStore = useAgentStore.getState().getAllAgents();
    expect(agentsInStore).toHaveLength(1);
    expect(agentsInStore[0].id).toBe(agent.id);

    // 验证可以通过getActiveAgents获取用于UI显示的信息
    const activeAgents = useAgentStore.getState().getActiveAgents();
    expect(activeAgents).toHaveLength(1);
    expect(activeAgents[0]).toMatchObject({
      id: agent.id,
      name: agent.config.name,
      role: agent.config.role,
      currentTask: '撰写引言部分',
    });
  });

  it('should support multiple dynamic agents in store (Req 7.8)', async () => {
    // 创建多个动态Agent
    await manager.addDynamicAgent('writer', 'Task 1');
    await manager.addDynamicAgent('writer', 'Task 2');
    await manager.addDynamicAgent('supervisor', 'Monitor quality');

    // 验证所有Agent都在store中
    const agentsInStore = useAgentStore.getState().getAllAgents();
    expect(agentsInStore).toHaveLength(3);

    // 验证可以按角色过滤
    const writers = useAgentStore.getState().getAgentsByRole('writer');
    expect(writers).toHaveLength(2);

    const supervisors = useAgentStore.getState().getAgentsByRole('supervisor');
    expect(supervisors).toHaveLength(1);
  });

  it('should update store when agent is destroyed (Req 7.8)', async () => {
    const agent = await manager.addDynamicAgent('writer', 'Task');
    expect(useAgentStore.getState().getAllAgents()).toHaveLength(1);

    await manager.destroyAgent(agent.id);
    expect(useAgentStore.getState().getAllAgents()).toHaveLength(0);
  });
});
