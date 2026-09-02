import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const port = env.VITE_PORT ? parseInt(env.VITE_PORT) : 5174;
  const base = env.VITE_BASE_PATH || './';
  const useTerser = env.VITE_MINIFY === 'terser';
  const sourcemap = env.VITE_SOURCEMAP ? env.VITE_SOURCEMAP === 'true' : true;
  const reportCompressedSize = env.VITE_REPORT_COMPRESSED_SIZE
    ? env.VITE_REPORT_COMPRESSED_SIZE === 'true'
    : true;

  return {
    base,
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    server: {
      port,
      open: true,
    },
    build: {
      outDir: 'dist',
      sourcemap,
      minify: useTerser ? 'terser' : 'esbuild',
      reportCompressedSize,
      terserOptions: useTerser
        ? {
            compress: {
              passes: 2,
              drop_console: env.VITE_DROP_CONSOLE === 'true',
              drop_debugger: env.VITE_DROP_CONSOLE === 'true',
            },
            format: {
              comments: false,
            },
          }
        : undefined,
      rollupOptions: {
        onwarn(warning, warn) {
          const message = typeof warning === 'string' ? warning : warning.message;

          if (
            message.includes('Error when using sourcemap for reporting an error') &&
            message.includes("Can't resolve original location of error")
          ) {
            return;
          }

          warn(warning);
        },
        output: {
          manualChunks(id) {
            const normalizedId = id.split('\\').join('/');

            if (!normalizedId.includes('/node_modules/')) {
              return;
            }

            if (normalizedId.includes('/jspdf/')) {
              return 'vendor-pdf';
            }
            if (
              normalizedId.includes('CanvasRenderer') ||
              normalizedId.includes('WebGPURenderer') ||
              normalizedId.includes('WebGLRenderer')
            ) {
              return 'vendor-rendering';
            }
            if (
              normalizedId.includes('/node_modules/react/') ||
              normalizedId.includes('/node_modules/react-dom/') ||
              normalizedId.includes('/node_modules/scheduler/')
            ) {
              return 'vendor-react';
            }

            if (
              normalizedId.includes('/@chakra-ui/') ||
              normalizedId.includes('/@emotion/') ||
              normalizedId.includes('/framer-motion/') ||
              normalizedId.includes('/@ark-ui/') ||
              normalizedId.includes('/@zag-js/') ||
              normalizedId.includes('/@floating-ui/') ||
              normalizedId.includes('/react-icons/') ||
              normalizedId.includes('/@internationalized/')
            ) {
              return 'vendor-ui';
            }

            if (
              normalizedId.includes('/zustand/') ||
              normalizedId.includes('/idb-keyval/')
            ) {
              return 'vendor-state';
            }

            // Leave remaining packages (including pixi internals) to Rollup's default split behavior.
            return;
          },
        },
      },
    },
  }
});
