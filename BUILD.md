# Build Guide

This document provides instructions for building the Agent Swarm Writing System for different platforms.

## Prerequisites

### All Platforms
- Node.js 18+ and npm
- Rust 1.70+ (install from https://rustup.rs/)

### Windows
- Microsoft Visual Studio C++ Build Tools
- WebView2 (usually pre-installed on Windows 10/11)

### macOS
- Xcode Command Line Tools: `xcode-select --install`
- For universal builds, ensure both x86_64 and aarch64 targets are installed:
  ```bash
  rustup target add x86_64-apple-darwin
  rustup target add aarch64-apple-darwin
  ```

### Linux
- System dependencies (Ubuntu/Debian):
  ```bash
  sudo apt update
  sudo apt install libwebkit2gtk-4.1-dev \
    build-essential \
    curl \
    wget \
    file \
    libxdo-dev \
    libssl-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev
  ```

## Development

### Start Development Server

```bash
npm install
npm run tauri:dev
```

This will:
1. Start the Vite development server with hot module replacement (HMR)
2. Launch the Tauri application in development mode
3. Enable hot reload for both frontend and backend changes

The development server runs on `http://localhost:1420` with HMR on port `1421`.

## Production Builds

### Build for Current Platform

```bash
npm run tauri:build
```

This creates optimized production builds for your current platform in `src-tauri/target/release/bundle/`.

### Platform-Specific Builds

#### Windows (x64)
```bash
npm run tauri:build:windows
```

Output: `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/`
- `.msi` installer
- `.exe` portable executable

#### macOS (Universal Binary)
```bash
npm run tauri:build:macos
```

Output: `src-tauri/target/release/bundle/`
- `.dmg` disk image
- `.app` application bundle (supports both Intel and Apple Silicon)

#### Linux (x64)
```bash
npm run tauri:build:linux
```

Output: `src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/`
- `.deb` package (Debian/Ubuntu)
- `.AppImage` portable application

### Build All Platforms

```bash
npm run tauri:build:all
```

Note: This only builds for the current platform. Cross-compilation requires additional setup.

## Build Optimizations

The project includes several build optimizations:

### Vite Configuration
- **Code Splitting**: Vendor libraries (React, Zustand) are split into separate chunks for better caching
- **Minification**: Using esbuild for fast and efficient minification
- **Tree Shaking**: Unused code is automatically removed
- **Asset Optimization**: Images and other assets are optimized during build

### Tauri Configuration
- **Bundle Size**: Optimized Rust binary with release profile
- **Window Settings**: Configured for optimal user experience (1400x900 default, minimum 1024x768)
- **Security**: CSP configured for desktop application requirements

## Build Output

After a successful build, you'll find the installers in:

- **Windows**: `src-tauri/target/release/bundle/msi/` and `src-tauri/target/release/bundle/nsis/`
- **macOS**: `src-tauri/target/release/bundle/dmg/` and `src-tauri/target/release/bundle/macos/`
- **Linux**: `src-tauri/target/release/bundle/deb/` and `src-tauri/target/release/bundle/appimage/`

## Troubleshooting

### Build Fails on Windows
- Ensure Visual Studio C++ Build Tools are installed
- Check that WebView2 is installed: `winget install Microsoft.EdgeWebView2Runtime`

### Build Fails on macOS
- Run `xcode-select --install` to install command line tools
- For code signing issues, see Tauri's [macOS signing guide](https://tauri.app/v1/guides/distribution/sign-macos)

### Build Fails on Linux
- Ensure all system dependencies are installed (see Prerequisites)
- For AppImage issues, install `libfuse2`: `sudo apt install libfuse2`

### Slow Build Times
- First build is always slower due to Rust compilation
- Subsequent builds are faster thanks to incremental compilation
- Use `npm run dev` for development instead of full builds

## Code Signing and Distribution

### Windows
- For production releases, sign the `.exe` and `.msi` with a code signing certificate
- Use `signtool` from Windows SDK

### macOS
- Sign the application with an Apple Developer certificate
- Notarize the app for distribution outside the Mac App Store
- See Tauri's [macOS distribution guide](https://tauri.app/v1/guides/distribution/sign-macos)

### Linux
- No code signing required for most distributions
- Consider publishing to Flathub or Snap Store for wider distribution

## CI/CD Integration

For automated builds, see the GitHub Actions workflow examples in the Tauri documentation:
https://tauri.app/v1/guides/building/cross-platform

## Performance Tips

1. **Development**: Use `npm run tauri:dev` for fast iteration with HMR
2. **Production**: Always use `npm run tauri:build` for optimized builds
3. **Bundle Size**: Monitor the bundle size and use code splitting for large dependencies
4. **Startup Time**: Minimize initialization code in the main process

## Additional Resources

- [Tauri Documentation](https://tauri.app/)
- [Vite Documentation](https://vitejs.dev/)
- [Rust Documentation](https://doc.rust-lang.org/)
