import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'shared': path.resolve(__dirname, '../shared/src'),
      'shared/enums': path.resolve(__dirname, '../shared/src/enums.ts'),
      'shared/types': path.resolve(__dirname, '../shared/src/types.ts'),
      'shared/events': path.resolve(__dirname, '../shared/src/events.ts'),
      'shared/constants': path.resolve(__dirname, '../shared/src/constants.ts')
    }
  },
  server: {
    port: 3000
  }
});

// Made with Bob
