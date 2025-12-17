/**
 * Constantes de configuração de API e integrações
 */

export const API_ENDPOINTS = {
  // Supabase Functions
  CHECK_SUBSCRIPTION: 'check-subscription',
  CREATE_CHECKOUT: 'create-checkout',
  CUSTOMER_PORTAL: 'customer-portal',
  COLLECT_MENTIONS: 'collect-llm-mentions',
  FETCH_GSC: 'fetch-gsc-queries',
  FETCH_GA4: 'fetch-ga4-data',
  TEST_CONNECTIONS: 'test-connections',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
} as const;

export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY: 1000, // ms
  MAX_DELAY: 10000, // ms
  BACKOFF_MULTIPLIER: 2,
} as const;
