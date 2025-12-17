/**
 * Global constants and configuration
 * Centralized place for all app constants
 */

// ============================================================================
// ROUTES
// ============================================================================

export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
  BRANDS: '/brands',
  SCORES: '/scores',
  INSIGHTS: '/insights',
  REPORTS: '/reports',
  REPORTS_GEO: '/reports-geo',
  REPORTS_SEO: '/reports-seo',
  ANALYTICS: '/analytics',
  SEO_METRICS: '/seo-metrics',
  SEO_SCORES: '/seo-scores',
  GEO_METRICS: '/geo-metrics',
  LLM_MENTIONS: '/llm-mentions',
  URL_ANALYSIS: '/url-analysis',
  ALERTS: '/alerts',
  BRAND_COMPARISON: '/brand-comparison',
  SUBSCRIPTION: '/subscription',
  API_KEYS: '/api-keys',
  API_TEST: '/api-test',
  GOOGLE_SETUP: '/google-setup',
  CONNECTIONS_TEST: '/connections-test',
  DOCUMENTATION: '/documentation',
  INSTALL_PWA: '/install-pwa',
  NOT_FOUND: '/404',
} as const;

// ============================================================================
// API CONFIGURATION
// ============================================================================

export const API_CONFIG = {
  TIMEOUTS: {
    DEFAULT: 30000, // 30 seconds
    SHORT: 10000, // 10 seconds
    LONG: 60000, // 1 minute
    EXTENDED: 120000, // 2 minutes
    ANALYTICS: 300000, // 5 minutes (for multiple brands)
  },
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY_MS: 1000,
    BACKOFF: true,
  },
  RATE_LIMITS: {
    DEFAULT: {
      maxRequests: 100,
      windowMs: 60000, // 1 minute
    },
    STRICT: {
      maxRequests: 10,
      windowMs: 60000,
    },
  },
} as const;

// ============================================================================
// PAGINATION & LIMITS
// ============================================================================

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZES: [10, 25, 50, 100],
  MAX_PAGE_SIZE: 100,
} as const;

export const LIMITS = {
  MAX_BRANDS: {
    FREE: 1,
    PRO: 10,
    ENTERPRISE: 100,
  },
  MAX_ANALYSES_PER_MONTH: {
    FREE: 10,
    PRO: 500,
    ENTERPRISE: 10000,
  },
  MAX_FILE_SIZE_MB: 10,
  MAX_UPLOAD_SIZE_MB: 50,
} as const;

// ============================================================================
// UI CONFIGURATION
// ============================================================================

export const UI_CONFIG = {
  TOAST: {
    DURATION: 5000,
    LIMIT: 1,
    REMOVE_DELAY: 1000,
  },
  ANIMATION: {
    DELAYS: {
      SHORT: 100,
      MEDIUM: 200,
      LONG: 300,
      EXTRA_LONG: 400,
    },
    DURATIONS: {
      FAST: 150,
      NORMAL: 300,
      SLOW: 500,
    },
  },
  DEBOUNCE: {
    SEARCH: 500,
    INPUT: 300,
    SCROLL: 150,
  },
  BREAKPOINTS: {
    MOBILE: 768,
    TABLET: 1024,
    DESKTOP: 1280,
  },
} as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  GENERIC: 'Ocorreu um erro inesperado. Tente novamente.',
  NETWORK: 'Erro de conexão. Verifique sua internet.',
  TIMEOUT: 'A operação demorou muito. Tente novamente.',
  UNAUTHORIZED: 'Você precisa estar autenticado.',
  FORBIDDEN: 'Você não tem permissão para esta ação.',
  NOT_FOUND: 'Recurso não encontrado.',
  VALIDATION: 'Dados inválidos. Verifique os campos.',
  SERVER: 'Erro no servidor. Tente novamente mais tarde.',
  RATE_LIMIT: 'Muitas requisições. Aguarde um momento.',
  SUBSCRIPTION: {
    LIMIT_REACHED: 'Limite do plano atingido.',
    UPGRADE_REQUIRED: 'Faça upgrade para continuar.',
    INACTIVE: 'Assinatura inativa. Renove para continuar.',
  },
  IMPORT: {
    INVALID_FILE: 'Arquivo inválido. Use CSV ou Excel.',
    EMPTY_FILE: 'Arquivo vazio.',
    INVALID_FORMAT: 'Formato de dados inválido.',
  },
  AUTH: {
    INVALID_CREDENTIALS: 'Email ou senha incorretos.',
    EMAIL_EXISTS: 'Email já cadastrado.',
    WEAK_PASSWORD: 'Senha muito fraca. Use pelo menos 8 caracteres.',
    SESSION_EXPIRED: 'Sessão expirada. Faça login novamente.',
  },
} as const;

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

export const SUCCESS_MESSAGES = {
  SAVED: 'Salvo com sucesso!',
  UPDATED: 'Atualizado com sucesso!',
  DELETED: 'Excluído com sucesso!',
  CREATED: 'Criado com sucesso!',
  IMPORTED: 'Dados importados com sucesso!',
  EXPORTED: 'Relatório exportado com sucesso!',
  SENT: 'Enviado com sucesso!',
  SYNCED: 'Sincronizado com sucesso!',
  AUTH: {
    SIGNED_IN: 'Login realizado com sucesso!',
    SIGNED_OUT: 'Logout realizado com sucesso!',
    SIGNED_UP: 'Conta criada com sucesso!',
    PASSWORD_RESET: 'Senha redefinida com sucesso!',
  },
  BRAND: {
    CREATED: 'Marca criada com sucesso!',
    UPDATED: 'Marca atualizada com sucesso!',
    DELETED: 'Marca excluída com sucesso!',
  },
  ANALYSIS: {
    STARTED: 'Análise iniciada com sucesso!',
    COMPLETED: 'Análise concluída com sucesso!',
  },
} as const;

// ============================================================================
// VALIDATION RULES
// ============================================================================

export const VALIDATION = {
  EMAIL: {
    REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MAX_LENGTH: 255,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
  },
  URL: {
    REGEX: /^https?:\/\/.+/,
    MAX_LENGTH: 2048,
  },
  BRAND_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
} as const;

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export const FEATURES = {
  ENABLE_PWA: true,
  ENABLE_ANALYTICS: true,
  ENABLE_SENTRY: true,
  ENABLE_AI_INSIGHTS: true,
  ENABLE_EXPORT: true,
  ENABLE_IMPORT: true,
  ENABLE_REALTIME: true,
  ENABLE_DARK_MODE: true,
} as const;

// ============================================================================
// EXTERNAL SERVICES
// ============================================================================

export const SERVICES = {
  SUPABASE_PROJECT_ID: 'llzonwqocqzqpezcsbjh',
  SENTRY_DSN: 'https://d31dfea8e5b43fa3dd4e80c2c9b8c2b4@o4508707379011584.ingest.us.sentry.io/4508707385827328',
} as const;

// ============================================================================
// DATE & TIME
// ============================================================================

export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  DISPLAY_WITH_TIME: 'dd/MM/yyyy HH:mm',
  ISO: "yyyy-MM-dd'T'HH:mm:ss",
  API: 'yyyy-MM-dd',
} as const;

export const TIME_ZONES = {
  DEFAULT: 'America/Sao_Paulo',
} as const;

// ============================================================================
// SCORE RANGES
// ============================================================================

export const SCORE_RANGES = {
  EXCELLENT: { min: 90, max: 100, color: 'green' },
  GOOD: { min: 70, max: 89, color: 'blue' },
  AVERAGE: { min: 50, max: 69, color: 'yellow' },
  POOR: { min: 30, max: 49, color: 'orange' },
  CRITICAL: { min: 0, max: 29, color: 'red' },
} as const;

// ============================================================================
// LOCAL STORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
  SIDEBAR_STATE: 'sidebar_state',
  DASHBOARD_CONFIG: 'dashboard_config',
  TOUR_COMPLETED: 'tour_completed',
  LAST_SELECTED_BRAND: 'last_selected_brand',
} as const;
