import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [
    react(),
  ],

  // Path aliases
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/services": path.resolve(__dirname, "./src/services"),
      "@/types": path.resolve(__dirname, "./src/types"),
      "@/stores": path.resolve(__dirname, "./src/stores"),
      "@/utils": path.resolve(__dirname, "./src/utils"),
    },
  },

  // Build optimizations
  build: {
    // Target modern browsers for better optimization
    target: "esnext",
    // Disable minification to get readable error messages
    minify: false,
    // Enable source maps for debugging
    sourcemap: true,
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Rollup options for better code splitting
    rollupOptions: {
      // Exclude test files and example files from build
      external: [
        /\.test\.(ts|tsx)$/,
        /\.example\.(ts|tsx)$/,
        /\.spec\.(ts|tsx)$/,
      ],
      output: {
        // Manual chunks for better caching
        manualChunks: {
          // Vendor chunks
          react: ["react", "react-dom"],
          zustand: ["zustand"],
        },
        // Asset file names
        assetFileNames: "assets/[name]-[hash][extname]",
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
      },
    },
    // Optimize dependencies
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },

  // Optimize dependencies pre-bundling
  optimizeDeps: {
    include: ["react", "react-dom", "zustand"],
    exclude: ["@tauri-apps/api", "@tauri-apps/plugin-opener"],
  },
}));
