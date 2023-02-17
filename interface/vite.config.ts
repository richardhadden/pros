import devtools from 'solid-devtools/vite';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';


export default defineConfig({
  plugins: [solidPlugin(), devtools({
    /* additional options */
    autoname: true, // e.g. enable autoname
    locator: {
      targetIDE: 'vscode',
      componentLocation: true,
      jsxLocation: true,
    },
  }),],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
  optimizeDeps: {
    extensions: ["jsx"],
  },
  
});
