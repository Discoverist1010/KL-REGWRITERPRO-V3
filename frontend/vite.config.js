import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  server: {
    port: 3000,
    host: true, // ⭐ ADD: Allow external connections
    // ❌ REMOVE PROXY: Not needed in production (Vercel will use VITE_API_URL directly)
    // proxy: {
    //   '/api': {
    //     target: process.env.VITE_API_URL || 'http://localhost:5000',
    //     changeOrigin: true
    //   }
    // }
  },
  
  build: {
    outDir: 'dist', // ⭐ ADD: Explicit output directory for Vercel
    sourcemap: false, // ⭐ CHANGE: Disable sourcemaps in production for performance
    minify: 'terser', // ⭐ ADD: Better minification
    
    // ⭐ OPTIMIZE: Better code splitting for 40 concurrent users
    rollupOptions: {
      output: {
        // Cache-busting strategy with versioned assets (KEEP - good!)
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`,
        
        // ⭐ ADD: Manual chunks for better performance
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          api: ['axios'] // If you're using axios
        }
      }
    },
    
    // ⭐ ADD: Optimize for production bundle size
    chunkSizeWarningLimit: 1000, // Increase warning limit
    
    // ⭐ ADD: Target modern browsers for better performance
    target: 'esnext'
  },
  
  // ⭐ OPTIMIZE: Environment variable handling
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '3.0.0'),
    // ⭐ ADD: Production mode detection
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production')
  },
  
  // ⭐ ADD: Preview configuration for testing
  preview: {
    port: 3000,
    host: true
  }
})