# Development Guide

This guide covers the development workflow for the Agent Swarm Writing System.

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run tauri:dev
   ```

   This starts both the Vite dev server and the Tauri application with hot reload enabled.

## Development Workflow

### Hot Module Replacement (HMR)

The development server includes HMR for instant feedback:

- **Frontend Changes**: React components update instantly without full page reload
- **Style Changes**: CSS updates are injected without reload
- **State Preservation**: Component state is preserved during updates when possible

HMR runs on:
- Dev Server: `http://localhost:1420`
- HMR WebSocket: `ws://localhost:1421`

### File Structure

```
agent-swarm-writing-system/
├── src/                      # Frontend source code
│   ├── components/          # React components
│   ├── services/            # Business logic and API clients
│   ├── stores/              # Zustand state management
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── styles/              # Global styles and themes
│   ├── App.tsx              # Main application component
│   └── main.tsx             # Application entry point
├── src-tauri/               # Tauri backend (Rust)
│   ├── src/                 # Rust source code
│   ├── icons/               # Application icons
│   ├── Cargo.toml           # Rust dependencies
│   └── tauri.conf.json      # Tauri configuration
├── public/                  # Static assets
├── scripts/                 # Build and utility scripts
└── dist/                    # Build output (generated)
```

### Path Aliases

The project uses path aliases for cleaner imports:

```typescript
import { Button } from '@/components/Button';
import { useAgentStore } from '@/stores/agentStore';
import { AIClient } from '@/services/aiClient';
import { Agent } from '@/types/agent';
import { formatDate } from '@/utils/date';
```

Available aliases:
- `@/` → `src/`
- `@/components` → `src/components/`
- `@/services` → `src/services/`
- `@/types` → `src/types/`
- `@/stores` → `src/stores/`
- `@/utils` → `src/utils/`

### State Management

The project uses Zustand for state management. Store files are located in `src/stores/`.

Example store usage:

```typescript
import { useAgentStore } from '@/stores/agentStore';

function MyComponent() {
  const agents = useAgentStore((state) => state.agents);
  const addAgent = useAgentStore((state) => state.addAgent);
  
  // Use state and actions
}
```

### Styling

The project uses CSS modules and a custom Glass Morphism theme:

- Global styles: `src/styles/theme.css`
- Component styles: Co-located with components (e.g., `Button.module.css`)
- Theme variables: Defined in `theme.css` for easy customization

Glass Morphism effects use:
```css
backdrop-filter: blur(10px);
background: rgba(255, 255, 255, 0.1);
border: 1px solid rgba(255, 255, 255, 0.2);
```

## Development Commands

### Frontend Development

```bash
# Start Vite dev server only (without Tauri)
npm run dev

# Build frontend only
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### Tauri Development

```bash
# Start Tauri in development mode (recommended)
npm run tauri:dev

# Build Tauri application
npm run tauri:build

# Run Tauri CLI commands
npm run tauri [command]
```

### Cross-Platform Builds

```bash
# Build for Windows
npm run tauri:build:windows

# Build for macOS (Universal)
npm run tauri:build:macos

# Build for Linux
npm run tauri:build:linux

# Build for current platform
npm run tauri:build:all
```

## Debugging

### Frontend Debugging

1. **Browser DevTools**: Open DevTools in the Tauri window (F12 or Cmd+Option+I)
2. **React DevTools**: Install the React DevTools browser extension
3. **Console Logging**: Use `console.log()` for debugging (removed in production builds)

### Backend Debugging

1. **Rust Logs**: Use `println!()` or the `log` crate in Rust code
2. **Tauri DevTools**: Enable in `tauri.conf.json` for development
3. **Cargo Check**: Run `cargo check` in `src-tauri/` to check Rust code

### Common Issues

**Port Already in Use**
```bash
# Kill process on port 1420
# Windows
netstat -ano | findstr :1420
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:1420 | xargs kill -9
```

**Build Fails**
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear Rust cache: `cd src-tauri && cargo clean`
- Update dependencies: `npm update`

**HMR Not Working**
- Check that ports 1420 and 1421 are not blocked by firewall
- Restart the dev server
- Clear browser cache

## Code Quality

### Linting

The project uses ESLint with TypeScript support:

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix
```

### Type Checking

TypeScript is configured for strict type checking:

```bash
# Type check without building
npx tsc --noEmit
```

### Code Style

- Use TypeScript for all new code
- Follow React best practices (hooks, functional components)
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Keep components small and focused

## Testing

### Unit Tests (Future)

```bash
# Run tests
npm test

# Run tests in watch mode
npm test:watch

# Generate coverage report
npm test:coverage
```

### Property-Based Tests (Future)

Property-based tests will use fast-check for TypeScript:

```typescript
import fc from 'fast-check';

test('property: config serialization round-trip', () => {
  fc.assert(
    fc.property(fc.record({...}), (config) => {
      const serialized = JSON.stringify(config);
      const deserialized = JSON.parse(serialized);
      expect(deserialized).toEqual(config);
    })
  );
});
```

## Performance Optimization

### Development Performance

- Use React DevTools Profiler to identify slow components
- Memoize expensive computations with `useMemo`
- Memoize callbacks with `useCallback`
- Use `React.memo` for components that render often with same props

### Build Performance

- Vite's esbuild-based build is already optimized
- Code splitting is configured for vendor libraries
- Tree shaking removes unused code automatically

### Runtime Performance

- Minimize re-renders by using Zustand selectors
- Lazy load components with `React.lazy()` when appropriate
- Optimize images and assets before adding to project
- Use Web Workers for heavy computations (if needed)

## Git Workflow

### Branch Strategy

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: Feature branches
- `bugfix/*`: Bug fix branches

### Commit Messages

Follow conventional commits:

```
feat: add new agent creation UI
fix: resolve HMR connection issue
docs: update development guide
style: format code with prettier
refactor: simplify state management
test: add unit tests for AIClient
chore: update dependencies
```

### Pull Requests

1. Create feature branch from `develop`
2. Make changes and commit
3. Push branch and create PR
4. Request review
5. Address feedback
6. Merge when approved

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Available variables:
- `VITE_DEV_PORT`: Development server port (default: 1420)
- `VITE_HMR_PORT`: HMR WebSocket port (default: 1421)
- `VITE_ENABLE_DEVTOOLS`: Enable development tools
- `VITE_ENABLE_LOGGING`: Enable console logging

## Resources

- [Tauri Documentation](https://tauri.app/)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [TypeScript Documentation](https://www.typescriptlang.org/)

## Getting Help

- Check existing documentation in `/docs`
- Review the spec files in `.kiro/specs/agent-swarm-writing-system/`
- Ask questions in team chat or create an issue
