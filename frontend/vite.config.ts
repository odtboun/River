import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import * as fs from 'fs';
import * as path from 'path';

export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait(),
    react(),
    nodePolyfills({
      include: ['buffer', 'crypto', 'stream', 'util'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
    // Custom plugin to serve WASM files with correct MIME type
    {
      name: 'wasm-mime-fix',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.endsWith('.wasm')) {
            // Try to serve from public folder
            const wasmPath = path.join(process.cwd(), 'public', path.basename(req.url));
            if (fs.existsSync(wasmPath)) {
              res.setHeader('Content-Type', 'application/wasm');
              fs.createReadStream(wasmPath).pipe(res);
              return;
            }
            // Try node_modules path
            const nodeModulesPath = path.join(process.cwd(), 'node_modules', '@phala', 'dcap-qvl-web', 'dcap-qvl-web_bg.wasm');
            if (fs.existsSync(nodeModulesPath)) {
              res.setHeader('Content-Type', 'application/wasm');
              fs.createReadStream(nodeModulesPath).pipe(res);
              return;
            }
          }
          next();
        });
      },
    },
  ],
  optimizeDeps: {
    exclude: ['@aztec/bb.js', '@phala/dcap-qvl-web'],
    esbuildOptions: {
      target: 'esnext',
    },
  },
  build: {
    target: 'esnext',
  },
  resolve: {
    alias: {
      pino: 'pino/browser.js',
    },
  },
  define: {
    'process.env': {},
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
    fs: {
      // Allow serving files from node_modules for WASM
      allow: ['..'],
    },
  },
  assetsInclude: ['**/*.wasm'],
});
