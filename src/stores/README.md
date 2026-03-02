# State Management with Zustand

This directory contains all Zustand stores for the Agent Swarm Writing System.

## Store Structure

### 1. Agent Store (`agentStore.ts`)
Manages all AI agents in the system.

**State:**
- `agents`: Map of agent ID to Agent object

**Actions:**
- `addAgent(agent)`: Add a new agent
- `removeAgent(agentId)`: Remove an agent
- `updateAgent(agentId, updates)`: Update agent properties
- `getAgent(agentId)`: Get a specific agent
- `getAllAgents()`: Get all agents as array
- `getAgentsByRole(role)`: Filter agents by role
- `getActiveAgents()`: Get active agent info
- `clearAgents()`: Clear all agents

**Usage:**
```typescript
import { useAgentStore } from './stores';

function MyComponent() {
  const agents = useAgentStore(state => state.getAllAgents());
  const addAgent = useAgentStore(state => state.addAgent);
  
  // Use agents and actions...
}
```

### 2. Message Store (`messageStore.ts`)
Manages all messages between agents.

**State:**
- `messages`: Map of message ID to AgentMessage object

**Actions:**
- `addMessage(message)`: Add a new message
- `getMessage(messageId)`: Get a specific message
- `getAllMessages()`: Get all messages sorted by timestamp
- `getMessagesByAgent(agentId)`: Get messages for a specific agent
- `getMessagesByType(type)`: Filter messages by type
- `getMessagesBetween(senderId, receiverId)`: Get messages between two agents
- `clearMessages()`: Clear all messages

**Usage:**
```typescript
import { useMessageStore } from './stores';

function MessageList() {
  const messages = useMessageStore(state => state.getAllMessages());
  const addMessage = useMessageStore(state => state.addMessage);
  
  // Display messages...
}
```

### 3. System Store (`systemStore.ts`)
Manages overall system state and workflow.

**State:**
- `currentPhase`: Current workflow phase
- `activeAgents`: Array of active agent IDs
- `rejectionCount`: Number of rejections
- `estimatedCompletion`: Estimated completion date
- `currentTopic`: Current paper topic
- `startTime`: Process start time

**Actions:**
- `setPhase(phase)`: Update current phase
- `setTopic(topic)`: Set current topic
- `setEstimatedCompletion(date)`: Set estimated completion
- `incrementRejectionCount()`: Increment rejection counter
- `resetRejectionCount()`: Reset rejection counter
- `addActiveAgent(agentId)`: Add active agent
- `removeActiveAgent(agentId)`: Remove active agent
- `startProcess(topic)`: Start writing process
- `resetSystem()`: Reset to initial state

**Usage:**
```typescript
import { useSystemStore } from './stores';

function SystemStatus() {
  const { currentPhase, currentTopic } = useSystemStore();
  const startProcess = useSystemStore(state => state.startProcess);
  
  // Display system status...
}
```

### 4. Config Store (`configStore.ts`)
Manages system configuration including AI services.

**State:**
- `aiServices`: Array of AI service configurations
- `defaultService`: Default AI service ID
- `promptRepositoryPath`: Path to prompt repository
- `outputDirectory`: Output directory path
- `theme`: UI theme (light/dark/auto)
- `internetAccess`: Internet access configuration
- `streamingConfig`: Streaming configuration

**Actions:**
- `addAIService(service)`: Add AI service
- `removeAIService(serviceId)`: Remove AI service
- `updateAIService(serviceId, updates)`: Update AI service
- `setDefaultService(serviceId)`: Set default service
- `setTheme(theme)`: Set UI theme
- `setInternetAccess(enabled, domains)`: Configure internet access
- `updateStreamingConfig(config)`: Update streaming config
- `loadConfig(config)`: Load complete configuration
- `getAIService(serviceId)`: Get specific AI service

**Usage:**
```typescript
import { useConfigStore } from './stores';

function ConfigPanel() {
  const { aiServices, theme } = useConfigStore();
  const addAIService = useConfigStore(state => state.addAIService);
  
  // Configure system...
}
```

## Best Practices

### 1. Selective Subscriptions
Only subscribe to the state you need to avoid unnecessary re-renders:

```typescript
// ❌ Bad - subscribes to entire store
const store = useAgentStore();

// ✅ Good - subscribes only to needed state
const agents = useAgentStore(state => state.getAllAgents());
```

### 2. Action Usage
Actions can be used without causing re-renders:

```typescript
// Get action without subscribing to state
const addAgent = useAgentStore(state => state.addAgent);
```

### 3. Computed Values
Use selectors for computed values:

```typescript
const writerCount = useAgentStore(state => 
  state.getAgentsByRole('writer').length
);
```

### 4. Multiple Stores
Combine multiple stores in a single component:

```typescript
function Dashboard() {
  const agents = useAgentStore(state => state.getAllAgents());
  const messages = useMessageStore(state => state.getAllMessages());
  const { currentPhase } = useSystemStore();
  
  // Use combined state...
}
```

## Store Communication

Stores are independent but can be used together:

```typescript
// Example: When adding an agent, also update system state
function createAgent(agentConfig: AgentConfig) {
  const agent: Agent = {
    id: generateId(),
    config: agentConfig,
    state: { status: 'idle', revisionCount: 0, lastActivity: new Date() },
    workHistory: [],
    interactionHistory: [],
  };
  
  // Add to agent store
  useAgentStore.getState().addAgent(agent);
  
  // Update system store
  useSystemStore.getState().addActiveAgent(agent.id);
}
```

## Type Safety

All stores are fully typed with TypeScript. Import types from `../types`:

```typescript
import type { Agent, AgentMessage, SystemConfig } from '../types';
```

## Testing

Stores can be tested by accessing their state directly:

```typescript
import { useAgentStore } from './agentStore';

// Get current state
const state = useAgentStore.getState();

// Call actions
state.addAgent(mockAgent);

// Check state
expect(state.agents.size).toBe(1);
```
