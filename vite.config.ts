import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable React Fast Refresh
      fastRefresh: true,
      // Optimize React production builds
      jsxRuntime: 'automatic',
      jsxImportSource: 'react'
    })
  ],
  base: '/genshi-studio/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    open: true,
    host: true,
    cors: true,
    // Improved HMR for canvas components
    hmr: {
      overlay: false // Disable error overlay for canvas errors
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV === 'development',
    // Optimize for canvas and graphics performance
    target: 'es2015',
    minify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // React ecosystem
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // UI and interaction libraries
          'ui-vendor': ['framer-motion', 'zustand', 'lucide-react']
        },
        // Optimize chunk names for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.ts', '').replace('.tsx', '')
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name || '')) {
            return `img/[name]-[hash][extname]`;
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name || '')) {
            return `fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      }
    },
    // Increase chunk size limit for graphics-heavy applications
    chunkSizeWarningLimit: 1000,
    // Optimize for canvas applications
    cssCodeSplit: true,
    assetsInlineLimit: 4096
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'zustand',
      'lucide-react'
    ],
    exclude: [
      // Exclude WebGL-related modules from pre-bundling to avoid issues
      'webgl-utils',
      'gl-matrix'
    ]
  },
  esbuild: {
    // Drop console.log in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    // Optimize for modern browsers
    target: 'es2020'
  },
  css: {
    // Optimize CSS for production
    devSourcemap: true
  },
  // Canvas and WebGL specific optimizations
  define: {
    __DEV__: process.env.NODE_ENV === 'development',
    __CANVAS_DEBUG__: process.env.NODE_ENV === 'development',
    __WEBGL_DEBUG__: process.env.NODE_ENV === 'development'
  },
  worker: {
    format: 'es'
  },
  // Improve development experience
  clearScreen: false,
  logLevel: 'info'
})