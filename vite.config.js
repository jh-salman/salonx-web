import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Map legacy RTK deep import path to the correct file in v2.x
      '@reduxjs/toolkit/dist/redux-toolkit.esm.js':
        '@reduxjs/toolkit/dist/redux-toolkit.legacy-esm.js'
    }
  },
  optimizeDeps: {
    // Ensure Vite re-optimizes dependencies after alias change
    force: true
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  base: '/'
}) 