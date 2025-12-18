import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
import postcss from 'rollup-plugin-postcss';
import json from '@rollup/plugin-json';
import copy from 'rollup-plugin-copy';

// Detect if we're in development mode (watch mode or NODE_ENV=development)
// Check for watch mode via command line args or NODE_ENV
const isWatchMode = process.argv.includes('-w') || process.argv.includes('--watch');
const isDev = process.env.NODE_ENV === 'development' || 
              (process.env.NODE_ENV !== 'production' && isWatchMode);

export default {
  input: 'src/index.tsx',
  output: {
    file: 'dist/bundle.js',
    format: 'iife',
    sourcemap: isDev, // Only generate sourcemaps in dev mode
    globals: {
      'canvas': 'canvas',
      'react': 'React',
      'react-dom': 'ReactDOM',
      'fabric': 'fabric'
    }
  },
  external: ['canvas'],
  plugins: [
    copy({
      targets: [
        { src: 'public/index.html', dest: 'dist' }
      ],
      hook: 'buildStart'
    }),
    json(),
    replace({
      'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
      preventAssignment: true
    }),
    resolve({
      preferBuiltins: false,
      browser: true
    }),
    commonjs({
      exclude: ['node_modules/canvas/**']
    }),
    typescript(),
    postcss({
      extensions: ['.css'],
    }),
    isDev && serve({
      open: true,
      contentBase: 'dist',
      host: 'localhost',
      port: 8888,
      historyApiFallback: true,
      verbose: true
    }),
    isDev && livereload({
      watch: 'dist'
    })
  ].filter(Boolean),
}; 