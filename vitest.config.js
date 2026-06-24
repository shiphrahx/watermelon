import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// jsdom so modules that touch `window`/`localStorage` (config.js, settings.js)
// load cleanly. globals: true exposes describe/it/expect without imports. The
// React plugin compiles JSX in component test files (*.test.jsx).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
  },
})
