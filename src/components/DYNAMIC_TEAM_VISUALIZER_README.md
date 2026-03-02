# Dynamic Team Visualizer Component

A comprehensive React component for visualizing agent team structures with interactive connections, agent selection, and dynamic animations.

## Requirements Implemented

- **Requirement 7.5**: Support for >20 concurrent AI agents visualization
- **Requirement 7.6**: Display AI interaction relationships
- **Requirement 7.8**: Animated display for newly added AI agents
- **Requirement 8.7**: Display interaction connection status
- **Requirement 12.4**: Team structure visualization and agent selection

## Features

### Core Functionality

1. **Team Structure Visualization**
   - Displays all agents in the team with visual representation
   - Supports multiple layout algorithms (circular, hierarchical, force-directed)
   - Scales to handle >20 concurrent agents
   - Real-time updates when agents are added or removed

2. **Interactive Connection Display**
   - Visual connection lines between interacting agents
   - Color-coded connection status (active, idle, error)
   - Directional arrows showing interaction flow
   - Optional connection labels showing interaction counts
   - Animated connection rendering

3. **Agent Selection**
   - Click to select/deselect agents
   - Visual feedback for selected agents
   - Hover effects for better interactivity
   - Callbacks for selection events
   - Support for programmatic selection

4. **Dynamic Agent Animations**
   - Smooth entrance animation for new agents
   - Pulse effect highlighting newly added agents
   - "NEW" badge for recently added agents
   - Scale and fade animations

### Additional Features

- **Zoom and Pan**: Interactive canvas navigation with mouse wheel zoom and drag-to-pan
- **Multiple Layouts**: Choose between circular, hierarchical, or force-directed layouts
- **Status Indicators**: Visual icons showing agent status (idle, thinking, writing, etc.)
- **Role-based Coloring**: Each agent role has a distinct color
- **Legend**: Visual guide for connection status colors
- **Agent Counter**: Display current agent count vs maximum
- **Responsive Design**: Adapts to different screen sizes
- **Glass Morphism**: Modern UI with semi-transparent effects
- **Dark Mode Support**: Automatic theme adaptation

## Usage

### Basic Usage

```tsx
import { DynamicTeamVisualizer } from './components/DynamicTeamVisualizer';

function App() {
  return (
    <DynamicTeamVisualizer />
  );
}
```

### With Agent Selection

```tsx
import { DynamicTeamVisualizer } from './components/DynamicTeamVisualizer';
import { useState } from 'react';

function App() {
  const [selectedAgentId, setSelectedAgentId] = useState<string>();

  return (
    <DynamicTeamVisualizer
      onAgentSelect={setSelectedAgentId}
      onAgentDeselect={() => setSelectedAgentId(undefined)}
      selectedAgentId={selectedAgentId}
    />
  );
}
```

### With Connections

```tsx
import { DynamicTeamVisualizer, AgentConnection } from './components/DynamicTeamVisualizer';

function App() {
  const connections: AgentConnection[] = [
    {
      from: 'agent-1',
      to: 'agent-2',
      type: 'task',
      status: 'active',
      interactionCount: 5
    },
    {
      from: 'agent-2',
      to: 'agent-3',
      type: 'feedback',
      status: 'idle',
      interactionCount: 2
    }
  ];

  return (
    <DynamicTeamVisualizer
      connections={connections}
      showConnectionLabels
    />
  );
}
```

### With Custom Layout

```tsx
import { DynamicTeamVisualizer } from './components/DynamicTeamVisualizer';

function App() {
  return (
    <DynamicTeamVisualizer
      layout="hierarchical"
      maxAgents={50}
      enableZoom
    />
  );
}
```

## Props

### DynamicTeamVisualizerProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `connections` | `AgentConnection[]` | `[]` | List of agent connections to display |
| `onAgentSelect` | `(agentId: string) => void` | - | Callback when an agent is selected |
| `onAgentDeselect` | `() => void` | - | Callback when an agent is deselected |
| `selectedAgentId` | `string` | - | Currently selected agent ID |
| `showConnectionLabels` | `boolean` | `false` | Whether to show interaction counts on connections |
| `enableZoom` | `boolean` | `true` | Whether to enable zoom and pan controls |
| `maxAgents` | `number` | `50` | Maximum number of agents to display |
| `layout` | `'circular' \| 'hierarchical' \| 'force'` | `'circular'` | Layout algorithm to use |

### AgentConnection

| Property | Type | Description |
|----------|------|-------------|
| `from` | `string` | Source agent ID |
| `to` | `string` | Target agent ID |
| `type` | `'task' \| 'feedback' \| 'collaboration'` | Connection type |
| `status` | `'active' \| 'idle' \| 'error'` | Connection status |
| `interactionCount` | `number` | Number of interactions (optional) |

## Layout Algorithms

### Circular Layout (Default)
- Arranges agents in a circle
- Best for small to medium teams (5-20 agents)
- Easy to see all agents at once
- Good for showing peer relationships

### Hierarchical Layout
- Arranges agents by role hierarchy
- Best for showing organizational structure
- Groups agents by role type
- Good for understanding team composition

### Force-Directed Layout
- Grid-based arrangement
- Best for large teams (>20 agents)
- Evenly distributes agents
- Good for dense networks

## Connection Status Colors

- **Green (#34c759)**: Active connection - agents are currently interacting
- **Gray (#86868b)**: Idle connection - connection exists but not currently active
- **Red (#ff3b30)**: Error connection - connection has encountered an error

## Agent Status Icons

- ⏸ **Idle**: Agent is waiting for tasks
- 🤔 **Thinking**: Agent is analyzing or processing
- ✍️ **Writing**: Agent is generating content
- ⏳ **Waiting Feedback**: Agent is waiting for responses
- 🔄 **Revising**: Agent is modifying content
- ✅ **Completed**: Agent has finished its task

## Role Colors

Each agent role has a distinct color for easy identification:

- **Decision AI**: Blue (#007aff)
- **Supervisor AI**: Light Blue (#5ac8fa)
- **Writer**: Green (#34c759)
- **Editorial Office**: Orange (#ff9500)
- **Editor in Chief**: Red (#ff3b30)
- **Deputy Editor**: Pink (#ff2d55)
- **Peer Reviewer**: Purple (#af52de)

## Interactions

### Mouse Controls

- **Click Agent**: Select/deselect agent
- **Hover Agent**: Show hover effect and highlight
- **Mouse Wheel**: Zoom in/out (when `enableZoom` is true)
- **Click + Drag**: Pan the canvas (when `enableZoom` is true)

### Zoom Controls

- **+ Button**: Zoom in
- **⟲ Button**: Reset zoom to 100%
- **− Button**: Zoom out

## Animation Details

### New Agent Animation
When a new agent is added:
1. Agent appears with scale animation (0 to 1)
2. Pulse effect radiates from the agent
3. "NEW" badge appears with bounce animation
4. Badge remains visible to indicate recent addition

### Selection Animation
When an agent is selected:
1. Border width increases
2. Glow effect appears around the agent
3. Agent scales up slightly
4. Z-index increases to bring to front

## Integration with Agent Store

The component automatically integrates with the Zustand agent store:

```typescript
import { useAgentStore } from '../stores/agentStore';

// Component automatically reads from store
const agents = useAgentStore((state) => state.getAllAgents());

// Add agents to store to see them in visualizer
const addAgent = useAgentStore((state) => state.addAgent);
addAgent(newAgent);
```

## Styling

The component uses CSS modules with glass morphism design:

- Semi-transparent backgrounds with backdrop blur
- Smooth transitions and animations
- Theme-aware colors (light/dark mode)
- Responsive design for mobile devices

### Custom Styling

You can customize the appearance by overriding CSS variables:

```css
.visualizer {
  --glass-blur: 15px;
  --glass-opacity: 0.8;
  --color-accent: #ff6b6b;
}
```

## Performance Considerations

- Canvas-based connection rendering for optimal performance
- Efficient re-rendering with React hooks
- Supports up to 50 agents by default (configurable)
- Smooth animations with CSS transforms
- Debounced position calculations

## Accessibility

- Keyboard navigation support (planned)
- ARIA labels for interactive elements (planned)
- High contrast mode support
- Screen reader friendly (planned)

## Browser Support

- Modern browsers with ES6+ support
- Backdrop filter support (with fallback)
- Canvas API support required
- Touch events for mobile devices

## Examples

See `DynamicTeamVisualizer.example.tsx` for comprehensive examples including:

1. Basic team visualization
2. Team with connections
3. Large team (>20 agents)
4. Dynamic agent addition
5. Hierarchical layout
6. All features combined

## Testing

The component can be tested with:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { DynamicTeamVisualizer } from './DynamicTeamVisualizer';

test('renders agent nodes', () => {
  render(<DynamicTeamVisualizer />);
  // Add test assertions
});

test('handles agent selection', () => {
  const onSelect = jest.fn();
  render(<DynamicTeamVisualizer onAgentSelect={onSelect} />);
  // Test selection behavior
});
```

## Future Enhancements

- [ ] Keyboard navigation
- [ ] Agent filtering by role or status
- [ ] Connection animation
- [ ] Export visualization as image
- [ ] Custom agent icons
- [ ] Minimap for large teams
- [ ] Search and highlight agents
- [ ] Connection strength visualization
- [ ] Time-based replay of interactions

## Related Components

- `GlassContainer`: Provides the glass morphism container
- `InteractionTimeline`: Shows interaction history
- `WorkDisplayPanel`: Displays agent work output

## License

Part of the Agent Swarm Writing System project.
