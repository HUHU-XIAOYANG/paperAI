# Quick Reference Card

## Essential Commands

### Development
```bash
npm run tauri:dev          # Start dev server + Tauri app (recommended)
npm run dev                # Start Vite dev server only
```

### Building
```bash
npm run build              # Build frontend
npm run tauri:build        # Build complete application
```

### Platform-Specific Builds
```bash
npm run tauri:build:windows    # Windows (x64)
npm run tauri:build:macos      # macOS (Universal)
npm run tauri:build:linux      # Linux (x64)
```

### Code Quality
```bash
npm run lint               # Check code
npm run lint:fix           # Fix issues automatically
```

## Project Structure

```
src/
├── components/           # UI components
├── services/            # Business logic
├── stores/              # State management (Zustand)
├── types/               # TypeScript types
├── utils/               # Helper functions
└── styles/              # Global styles

src-tauri/               # Rust backend
└── src/                 # Rust source code
```

## Import Aliases

```typescript
import { Button } from '@/components/Button';
import { useAgentStore } from '@/stores/agentStore';
import { AIClient } from '@/services/aiClient';
import { Agent } from '@/types/agent';
import { formatDate } from '@/utils/date';
```

## State Management (Zustand)

```typescript
// Define store
export const useAgentStore = create<AgentStore>((set) => ({
  agents: [],
  addAgent: (agent) => set((state) => ({
    agents: [...state.agents, agent]
  })),
}));

// Use in component
const agents = useAgentStore((state) => state.agents);
const addAgent = useAgentStore((state) => state.addAgent);
```

## Glass Morphism Styling

```css
.glass-container {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
}
```

## Development Ports

- **Dev Server**: http://localhost:1420
- **HMR WebSocket**: ws://localhost:1421

## Common Issues

### Port in Use
```bash
# Windows
netstat -ano | findstr :1420
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:1420 | xargs kill -9
```

### Clear Cache
```bash
rm -rf node_modules dist
npm install
```

### Rust Build Issues
```bash
cd src-tauri
cargo clean
cd ..
npm run tauri:build
```

## File Locations

- **Config**: `src-tauri/tauri.conf.json`
- **Vite Config**: `vite.config.ts`
- **TypeScript Config**: `tsconfig.json`
- **Package Config**: `package.json`
- **Environment**: `.env` (copy from `.env.example`)

## Build Output

After building, find installers in:
- **Windows**: `src-tauri/target/release/bundle/msi/`
- **macOS**: `src-tauri/target/release/bundle/dmg/`
- **Linux**: `src-tauri/target/release/bundle/deb/` or `appimage/`

## Debugging

- **F12**: Open DevTools in Tauri window
- **Console**: Use `console.log()` for debugging
- **React DevTools**: Install browser extension
- **Rust Logs**: Use `println!()` in Rust code

## Documentation

- `BUILD.md`: Build instructions
- `DEVELOPMENT.md`: Development guide
- `README.md`: Project overview
- `.kiro/specs/`: Feature specifications

## Resources

- [Tauri Docs](https://tauri.app/)
- [Vite Docs](https://vitejs.dev/)
- [React Docs](https://react.dev/)
- [Zustand Docs](https://github.com/pmndrs/zustand)
