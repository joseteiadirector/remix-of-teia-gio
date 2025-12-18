import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";
import viteCompression from "vite-plugin-compression";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Sentry é opcional. Só habilitar upload de sourcemaps se DSN + token estiverem presentes.
  // (Evita falha de build/publish quando apenas o DSN foi configurado.)
  const sentryDsn = process.env.VITE_SENTRY_DSN;
  const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN || process.env.VITE_SENTRY_AUTH_TOKEN;
  const sentryOrg = process.env.SENTRY_ORG || process.env.VITE_SENTRY_ORG;
  const sentryProject = process.env.SENTRY_PROJECT || process.env.VITE_SENTRY_PROJECT;
  const sentryEnabled = mode === "production" && !!sentryDsn && !!sentryAuthToken;

  return {
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    // PWA Configuration
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Teia GEO - Plataforma de Otimização para IAs Generativas',
        short_name: 'Teia GEO',
        description: 'Plataforma brasileira de GEO e IGO. Monitore sua marca em ChatGPT, Claude, Gemini e Perplexity.',
        theme_color: '#8B5CF6',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        // Evita SW velho segurando assets antigos (causa comum de "Carregando..." infinito)
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    }),
    // Bundle Analyzer - gerar stats.html após build
    visualizer({
      open: false,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
      template: 'treemap', // 'sunburst' | 'treemap' | 'network'
    }),
    // Compressão Brotli e Gzip
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240, // Apenas arquivos > 10kb
    }),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240,
    }),
    // Sentry Plugin - Upload de source maps em produção
    sentryEnabled && sentryVitePlugin({
      org: sentryOrg || 'teia-geo',
      project: sentryProject || 'teia-geo-cogni-weave',
      authToken: sentryAuthToken,
      sourcemaps: {
        assets: './dist/**',
      },
      release: {
        name: process.env.VITE_APP_VERSION || 'production',
      },
      telemetry: false,
    }),
  ].filter(Boolean) as any,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Suporte para CDN via variável de ambiente
  define: {
    __CDN_URL__: JSON.stringify(process.env.VITE_CDN_URL || ''),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  build: {
    // Gera manifest.json no build (permite loader resiliente no index.html)
    manifest: true,
    // Habilitar sourcemaps apenas quando Sentry está configurado
    sourcemap: sentryEnabled ? 'hidden' : false,
    // Target seguro e otimizado
    target: 'es2015',
    modulePreload: {
      polyfill: true,
      resolveDependencies: (filename, deps, { hostId, hostType }) => {
        // Preload apenas chunks críticos
        return deps.filter(dep => {
          return dep.includes('react-core') || 
                 dep.includes('supabase') ||
                 dep.includes('query');
        });
      },
    },
    rollupOptions: {
      output: {
        // Entry com hash (evita cache quebrado no deploy público)
        entryFileNames: 'assets/app-[hash].js',
        chunkFileNames: 'assets/chunk-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',

        // Chunks otimizados de forma segura
        manualChunks(id) {
          // React core
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/')) {
            return 'react-core';
          }

          // Radix UI agrupado
          if (id.includes('@radix-ui/')) {
            return 'radix-ui';
          }

          // Charts
          if (id.includes('recharts')) {
            return 'charts';
          }

          // Backend client
          if (id.includes('@supabase/')) {
            return 'supabase';
          }

          // React Query
          if (id.includes('@tanstack/react-query')) {
            return 'query';
          }

          // Forms
          if (id.includes('react-hook-form') ||
              id.includes('@hookform/') ||
              id.includes('zod')) {
            return 'forms';
          }

          // Utils
          if (id.includes('node_modules') &&
              (id.includes('clsx') ||
               id.includes('tailwind-merge') ||
               id.includes('class-variance-authority') ||
               id.includes('date-fns'))) {
            return 'utils';
          }

          // Framer Motion
          if (id.includes('framer-motion')) {
            return 'motion';
          }

          // Lucide icons
          if (id.includes('lucide-react')) {
            return 'icons';
          }
        },
      },
      // Tree shaking seguro
      treeshake: {
        moduleSideEffects: 'no-external',
      },
    },
    // Otimizações seguras de bundle
    chunkSizeWarningLimit: 800,
    cssCodeSplit: true,
    // Inline assets < 4KB (reduz requests HTTP)
    assetsInlineLimit: 4096,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: true,
        ecma: 2015,
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
      },
    },
  },
  // Otimizações de pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
    ],
  },
};
});
