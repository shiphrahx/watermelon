import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base` must match the GitHub Pages repo name so that asset paths and
// client-side routing resolve correctly at https://<user>.github.io/watermelon/
export default defineConfig({
  plugins: [react()],
  base: '/watermelon/',
  build: {
    rollupOptions: {
      output: {
        // Split heavy vendors into their own cacheable chunks.
        manualChunks: {
          recharts: ['recharts'],
          react: ['react', 'react-dom', 'react-router-dom'],
          msal: ['@azure/msal-browser'],
        },
      },
    },
  },
})
