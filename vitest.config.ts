import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    define: {
      __BUILD_ID__: JSON.stringify('test-build'),
    },
    test: {
      include: ['tests/**/*.test.ts'],
    },
  }),
)
