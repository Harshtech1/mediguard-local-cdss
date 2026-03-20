import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// import { mcpMiddleware } from './src/mcpServer.js';
export default defineConfig({
  plugins: [react()],
// server block disabled while fixing MCP
});
