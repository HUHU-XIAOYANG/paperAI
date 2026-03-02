# Agent Swarm Writing System - Project Structure

## Overview
This is a Tauri + React + TypeScript desktop application for multi-agent academic paper writing.

## Directory Structure

```
.
├── .kiro/                      # Kiro spec files
│   └── specs/
│       └── agent-swarm-writing-system/
├── src/                        # Frontend source code
│   ├── components/             # React UI components
│   ├── services/               # Service layer (AI, agents, etc.)
│   ├── stores/                 # Zustand state management
│   ├── styles/                 # Global styles and themes
│   ├── types/                  # TypeScript type definitions
│   ├── utils/                  # Utility functions
│   ├── App.tsx                 # Main App component
│   └── main.tsx                # Application entry point
├── src-tauri/                  # Tauri backend (Rust)
│   ├── src/                    # Rust source code
│   ├── icons/                  # Application icons
│   └── tauri.conf.json         # Tauri configuration
├── public/                     # Static assets
├── dist/                       # Build output
├── package.json                # NPM dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite build configuration
└── eslint.config.js            # ESLint configuration

```

## Technology Stack

- **Frontend Framework**: React 19 with TypeScript
- **Desktop Framework**: Tauri 2
- **Build Tool**: Vite 7
- **State Management**: Zustand (to be added)
- **Styling**: CSS with Glass Morphism effects
- **Linting**: ESLint with TypeScript support

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run tauri dev` - Run Tauri development mode
- `npm run tauri build` - Build Tauri application

## TypeScript Configuration

The project uses strict TypeScript settings with:
- Strict mode enabled
- No unused locals/parameters
- No implicit returns
- No unchecked indexed access
- Path aliases configured (@/, @/components/, etc.)

## Next Steps

1. Install Zustand for state management (Task 1.2)
2. Implement configuration management system (Task 2.x)
3. Implement prompt management system (Task 3.x)
4. Define AI output format specification (Task 4.x)
5. Implement AI client interface (Task 5.x)

## Development Notes

- All type definitions are in `src/types/`
- Service implementations will go in `src/services/`
- UI components will go in `src/components/`
- Global state will be managed in `src/stores/`
- Utility functions will go in `src/utils/`
