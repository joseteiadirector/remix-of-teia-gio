/**
 * Sentry Configuration
 * Monitoramento de erros e performance em produção
 */

import * as Sentry from "@sentry/react";
import { logger } from "@/utils/logger";

// Inicializar Sentry apenas em produção
export const initSentry = () => {
  // Verificar se está em produção
  const isProduction = import.meta.env.PROD;
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

  if (!isProduction || !sentryDsn) {
    // Sentry não inicializado (desenvolvimento)
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    
    // Integração com React
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Performance Monitoring
    tracesSampleRate: 0.1, // 10% das transações
    
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% das sessões
    replaysOnErrorSampleRate: 1.0, // 100% quando há erro

    // Configurações de environment
    environment: import.meta.env.MODE,
    
    // Release tracking
    release: import.meta.env.VITE_APP_VERSION || 'development',

    // Filtrar erros conhecidos que não são críticos
    beforeSend(event, hint) {
      const error = hint.originalException;
      
      // Ignorar erros de extensões de browser
      if (error && typeof error === 'object' && 'message' in error) {
        const message = String(error.message);
        
        if (
          message.includes('chrome-extension://') ||
          message.includes('moz-extension://') ||
          message.includes('safari-extension://')
        ) {
          return null;
        }
      }

      // Ignorar erros de rede conhecidos
      if (event.exception?.values?.[0]?.type === 'NetworkError') {
        return null;
      }

      return event;
    },

    // Configurar tags padrão
    initialScope: {
      tags: {
        app: 'teia-studio-geo',
      },
    },
  });

  // Sentry inicializado em produção
};

// Capturar erro manualmente
export const captureError = (error: Error, context?: Record<string, any>) => {
  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    logger.error('Erro capturado', { error, context });
  }
};

// Capturar mensagem personalizada
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  if (import.meta.env.PROD) {
    Sentry.captureMessage(message, level);
  } else {
    // Message captured em desenvolvimento
  }
};

// Set user context
export const setSentryUser = (userId: string, email?: string) => {
  if (import.meta.env.PROD) {
    Sentry.setUser({
      id: userId,
      email: email,
    });
  }
};

// Clear user context
export const clearSentryUser = () => {
  if (import.meta.env.PROD) {
    Sentry.setUser(null);
  }
};

// Add breadcrumb
export const addBreadcrumb = (message: string, category: string, data?: Record<string, any>) => {
  if (import.meta.env.PROD) {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    });
  }
};
