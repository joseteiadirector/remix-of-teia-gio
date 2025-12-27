import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";
import viteCompression from "vite-plugin-compression";
import { sentryVitePlugin } from "@sentry/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const supabasePublishableKey =
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    "";

  const sentryDsn = process.env.VITE_SENTRY_DSN;
  const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN || process.env.VITE_SENTRY_AUTH_TOKEN;
  const sentryOrg = process.env.SENTRY_ORG || process.env.VITE_SENTRY_ORG;
  const sentryProject = process.env.SENTRY_PROJECT || process.env.VITE_SENTRY_PROJECT;
  const sentryEnabled = mode === "production" && !!sentryDsn && !!sentryAuthToken;

  // Flags para plugins opcionais (ativar via env vars quando necessário)
  const enableAnalyzer = process.env.ANALYZE === 'true';
  const enableCompression = process.env.COMPRESS === 'true';

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
      // Bundle Analyzer - APENAS quando ANALYZE=true (evita overhead no publish)
      enableAnalyzer && visualizer({
        open: false,
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
        template: 'treemap',
      }),
      // Compressão - APENAS quando COMPRESS=true (hospedagem já comprime automaticamente)
      enableCompression && viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 10240,
      }),
      enableCompression && viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 10240,
      }),
      // Sentry Plugin
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
      // Garante que o bundle sempre tenha a chave pública do backend disponível
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(supabasePublishableKey),
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
