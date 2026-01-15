import { defineConfig } from 'vite';

export default defineConfig({
  // Set base path for GitHub Pages
  // Change this to your repository name if deploying to https://<username>.github.io/<repo>/
  // Leave as '/' if deploying to https://<username>.github.io/ (user/org site)
  base: '/',
  
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
