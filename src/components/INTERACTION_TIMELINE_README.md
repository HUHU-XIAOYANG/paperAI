# Interaction Timeline Component

## Overview

The `InteractionTimeline` component provides a chronological view of all agent communications in the Agent Swarm Writing System. It displays messages in a timeline format with support for filtering, highlighting, and detailed message inspection.

## Features

### Core Features
- **Chronological Display**: Messages displayed in time order (newest first or oldest first)
- **Visual Distinction**: Different colors for different agents and message types
- **Expandable Content**: Click to expand/collapse full message content
- **Filtering**: Filter by agent ID or message type
- **Highlighting**: Highlight messages involving specific agents
- **Metadata Display**: Show priority, tags, task IDs, and other metadata
- **Responsive Design**: Adapts to different screen sizes
- **Glass Morphism**: Integrated with the system's glass morphism design

### Message Information
Each message displays:
- Message type with icon and color coding
- Sender and receiver with agent badges
- Timestamp (relative and absolute)
- Content preview (expandable to full content)
- Priority level
- Response requirement indicator
- Related task ID
- Tags

## Requirements

This component implements the following requirements:
- **Requirement 7.7**: Display interaction history
- **Requirement 8.7**: Show message flow between agents
- **Requirement 12.3**: Message subscription and display

## Usage

### Basic Usage

```tsx
import { InteractionTimeline } from './components/InteractionTimeline';
import { AgentMessage } from './types';

function MyComponent() {
  const messages: AgentMessage[] = [
    {
      id: 'msg-1',
      type: 'task_assignment',
      sender: 'decision_ai',
      receiver: 'writer_1',
      content: '请撰写论文的引言部分...',
      metadata: {
        priority: 'high',
        requiresResponse: true,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date(),
    },
    // ... more messages
  ];

  return <InteractionTimeline messages={messages} />;
}
```

### With Agent Highlighting

Highlight all messages involving a specific agent:

```tsx
<InteractionTimeline 
  messages={messages}
  highlightAgent="writer_1"
/>
```

### With Message Type Filtering

Show only specific types of messages:

```tsx
<InteractionTimeline 
  messages={messages}
  filterByType={['task_assignment', 'work_submission']}
/>
```

### With Agent Filtering

Show only messages involving a specific agent:

```tsx
<InteractionTimeline 
  messages={messages}
  filterByAgent="writer_1"
/>
```

### With Click Handler

Handle message clicks for custom actions:

```tsx
<InteractionTimeline 
  messages={messages}
  onMessageClick={(message) => {
    console.log('Message clicked:', message);
    // Open detail modal, navigate, etc.
  }}
/>
```

### With Sort Order

Control the sort order of messages:

```tsx
// Newest first (default)
<InteractionTimeline 
  messages={messages}
  sortOrder="desc"
/>

// Oldest first
<InteractionTimeline 
  messages={messages}
  sortOrder="asc"
/>
```

### Complex Filtering

Combine multiple filters:

```tsx
<InteractionTimeline 
  messages={messages}
  filterByAgent="writer_1"
  filterByType={['feedback_request', 'feedback_response']}
  highlightAgent="writer_1"
  onMessageClick={handleClick}
/>
```

## Props

### InteractionTimelineProps

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `messages` | `AgentMessage[]` | Yes | - | Array of messages to display |
| `highlightAgent` | `string` | No | - | Agent ID to highlight |
| `filterByType` | `MessageType[]` | No | - | Filter by message types |
| `filterByAgent` | `string` | No | - | Filter by specific agent |
| `onMessageClick` | `(message: AgentMessage) => void` | No | - | Callback when message is clicked |
| `sortOrder` | `'asc' \| 'desc'` | No | `'desc'` | Sort order (asc=oldest first, desc=newest first) |

## Message Types

The component supports the following message types:

| Type | Label | Icon | Description |
|------|-------|------|-------------|
| `task_assignment` | 任务分配 | 📋 | Decision AI assigns tasks |
| `work_submission` | 工作提交 | 📤 | AI submits completed work |
| `feedback_request` | 反馈请求 | ❓ | AI requests feedback |
| `feedback_response` | 反馈响应 | 💬 | AI responds to feedback request |
| `discussion` | 讨论 | 💭 | Informal discussion between AIs |
| `revision_request` | 修订请求 | 🔄 | Supervisor AI requests revision |
| `approval` | 批准 | ✅ | Review team approves content |
| `rejection` | 退稿 | ❌ | Review team rejects content |

## Styling

The component uses CSS modules for styling. Key style features:

### Agent Colors
Each agent is assigned a consistent color from a predefined palette:
- Agent 1: Blue (#3b82f6)
- Agent 2: Purple (#8b5cf6)
- Agent 3: Pink (#ec4899)
- Agent 4: Orange (#f59e0b)
- Agent 5: Green (#10b981)
- Agent 6: Cyan (#06b6d4)

### Message Type Colors
Each message type has a distinct color:
- Task: Blue
- Submission: Purple
- Request: Orange
- Response: Green
- Discussion: Cyan
- Revision: Orange
- Approval: Green
- Rejection: Red

### Theme Support
The component supports both light and dark themes through CSS variables.

## Accessibility

- **Keyboard Navigation**: Messages are clickable and keyboard accessible
- **Color Contrast**: All text meets WCAG AA contrast requirements
- **Screen Readers**: Semantic HTML structure for screen reader compatibility
- **Focus Indicators**: Clear focus indicators for keyboard navigation

## Performance

### Optimization Features
- **Memoization**: Uses `useMemo` to avoid unnecessary re-filtering
- **Virtual Scrolling**: Recommended for large message lists (>1000 messages)
- **Lazy Expansion**: Message content only fully rendered when expanded

### Best Practices
- For large message lists, consider pagination or virtual scrolling
- Use filtering to reduce the number of displayed messages
- Avoid passing new array/object references on every render

## Integration

### With InteractionRouter

```tsx
import { interactionRouter } from './services/interactionRouter';
import { InteractionTimeline } from './components/InteractionTimeline';

function MessageView() {
  const [messages, setMessages] = useState<AgentMessage[]>([]);

  useEffect(() => {
    // Subscribe to all messages
    const unsubscribe = interactionRouter.subscribeToMessages(
      'all',
      (message) => {
        setMessages(prev => [...prev, message]);
      }
    );

    return unsubscribe;
  }, []);

  return <InteractionTimeline messages={messages} />;
}
```

### With State Management (Zustand)

```tsx
import { useAgentStore } from './stores/agentStore';
import { InteractionTimeline } from './components/InteractionTimeline';

function MessageView() {
  const messages = useAgentStore(state => state.messages);
  const selectedAgent = useAgentStore(state => state.selectedAgent);

  return (
    <InteractionTimeline 
      messages={messages}
      highlightAgent={selectedAgent?.id}
    />
  );
}
```

## Examples

See `InteractionTimeline.example.tsx` for comprehensive usage examples including:
1. Basic usage
2. Agent highlighting
3. Message type filtering
4. Agent filtering
5. Click handlers
6. Broadcast messages (multiple receivers)
7. Sort order comparison
8. Empty state
9. Complex filtering scenarios

## Testing

### Unit Tests

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { InteractionTimeline } from './InteractionTimeline';

test('displays messages in timeline', () => {
  const messages = [
    {
      id: 'msg-1',
      type: 'task_assignment',
      sender: 'decision_ai',
      receiver: 'writer_1',
      content: 'Test message',
      metadata: {
        priority: 'high',
        requiresResponse: true,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date(),
    },
  ];

  render(<InteractionTimeline messages={messages} />);
  expect(screen.getByText('Test message')).toBeInTheDocument();
});

test('filters messages by type', () => {
  const messages = [
    { /* task_assignment message */ },
    { /* work_submission message */ },
  ];

  render(
    <InteractionTimeline 
      messages={messages}
      filterByType={['task_assignment']}
    />
  );

  // Only task_assignment messages should be visible
});

test('highlights agent messages', () => {
  const messages = [
    { sender: 'writer_1', /* ... */ },
    { sender: 'writer_2', /* ... */ },
  ];

  render(
    <InteractionTimeline 
      messages={messages}
      highlightAgent="writer_1"
    />
  );

  // writer_1 messages should have highlight class
});
```

## Troubleshooting

### Messages not displaying
- Ensure messages array is not empty
- Check that message objects have all required fields
- Verify timestamp is a valid Date object

### Filtering not working
- Ensure filter values match message properties exactly
- Check that filterByType contains valid MessageType values
- Verify filterByAgent matches actual agent IDs in messages

### Styling issues
- Ensure CSS module is imported correctly
- Check that theme CSS variables are defined
- Verify GlassContainer component is available

### Performance issues
- Reduce number of messages displayed
- Use filtering to show only relevant messages
- Consider implementing virtual scrolling for large lists

## Future Enhancements

Potential improvements for future versions:
- Virtual scrolling for large message lists
- Search functionality within messages
- Date range filtering
- Export timeline to various formats
- Message threading/grouping
- Real-time updates with animations
- Customizable message type icons and colors
- Keyboard shortcuts for navigation

## Related Components

- **WorkDisplayPanel**: Displays individual agent work status
- **GlassContainer**: Provides glass morphism styling
- **InteractionRouter**: Manages message routing and delivery

## References

- Design Document: `design.md` - Component and Interface section
- Requirements: `requirements.md` - Requirements 7.7, 8.7, 12.3
- Type Definitions: `src/types/message.ts`
