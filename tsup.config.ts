import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node22',
  outDir: 'dist',
  clean: true,
  dts: true,
  sourcemap: true,
  minify: false,
  splitting: false,
  bundle: true,
  external: [
    '@ai-sdk/google',
    '@ai-sdk/openai', 
    '@modelcontextprotocol/sdk',
    'ai',
    'express',
    'globby',
    'ignore',
    'zod'
  ]
});
