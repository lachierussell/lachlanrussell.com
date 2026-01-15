import { defineConfig } from 'vite';

export default defineConfig({
  // Base path for GitHub Pages - repo name
  base: '/lachlanrussell.com/',
  
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Ensure everything is bundled into a single JS file
    rollupOptions: {
      output: {
        // Single JS bundle
        manualChunks: undefined,
        inlineDynamicImports: true,
      },
    },
  },
});
