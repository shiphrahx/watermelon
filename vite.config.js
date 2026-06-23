import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base` must match the GitHub Pages repo name so that asset paths and
// client-side routing resolve correctly at https://<user>.github.io/watermelon/
export default defineConfig({
  plugins: [react()],
  base: '/watermelon/',
})
