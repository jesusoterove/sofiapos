import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      include: ['src/**/*'],
      exclude: ['src/**/*.test.*', 'src/**/*.stories.*'],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'SofiaUI',
      formats: ['es'],
      fileName: 'index',
    },
    cssCodeSplit: true,
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', '@tanstack/react-table'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'react/jsx-runtime',
          '@tanstack/react-table': '@tanstack/react-table',
        },
      },
    },
  },
})

