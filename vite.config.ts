import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/recharts')) {
            return 'vendor-recharts'
          }
          if (id.includes('node_modules/@google/genai')) {
            return 'vendor-genai'
          }
          if (id.includes('node_modules/jspdf')) {
            return 'vendor-jspdf'
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
