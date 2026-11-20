import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Fixed port so the desktop app (Tauri) can find the dev server.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
  },
  envPrefix: ['VITE_', 'TAURI_ENV_'],
})
