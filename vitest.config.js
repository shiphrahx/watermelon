import { defineConfig } from 'vitest/config'

// jsdom so modules that touch `window`/`localStorage` (config.js, settings.js)
// load cleanly. globals: true exposes describe/it/expect without imports.
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.js'],
  },
})
