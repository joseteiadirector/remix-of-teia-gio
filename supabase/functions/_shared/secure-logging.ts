/**
 * Secure Logging Utility
 * Provides PII redaction for edge function logs
 */

/**
 * Redact email address to prevent PII exposure
 */
export function redactEmail(email: string): string {
  if (!email || typeof email !== 'string') return '[invalid-email]';
  const parts = email.split('@');
  if (parts.length !== 2) return '[malformed-email]';
  const [user, domain] = parts;
  const redactedUser = user.length > 2 ? user.substring(0, 2) + '***' : '***';
  return `${redactedUser}@${domain}`;
}

/**
 * Redact user ID to prevent PII exposure
 */
export function redactUserId(userId: string): string {
  if (!userId || typeof userId !== 'string') return '[invalid-id]';
  return userId.length > 8 ? userId.substring(0, 8) + '***' : '***';
}

/**
 * Redact brand ID (partial redaction for debugging)
 */
export function redactBrandId(brandId: string): string {
  if (!brandId || typeof brandId !== 'string') return '[invalid-brand]';
  return brandId.length > 8 ? brandId.substring(0, 8) + '...' : brandId;
}

/**
 * Secure log context interface
 */
interface LogContext {
  userId?: string;
  userEmail?: string;
  email?: string;
  brandId?: string;
  action?: string;
  status?: 'success' | 'error' | 'warning' | 'info';
  [key: string]: unknown;
}

/**
 * Log with automatic PII redaction
 */
export function logSecure(message: string, context?: LogContext): void {
  if (!context) {
    console.log(message);
    return;
  }

  const redacted: Record<string, unknown> = { ...context };
  
  // Redact known PII fields
  if (redacted.email && typeof redacted.email === 'string') {
    redacted.email = redactEmail(redacted.email);
  }
  if (redacted.userEmail && typeof redacted.userEmail === 'string') {
    redacted.userEmail = redactEmail(redacted.userEmail);
  }
  if (redacted.userId && typeof redacted.userId === 'string') {
    redacted.userId = redactUserId(redacted.userId);
  }
  if (redacted.brandId && typeof redacted.brandId === 'string') {
    redacted.brandId = redactBrandId(redacted.brandId);
  }
  
  console.log(message, JSON.stringify(redacted));
}

/**
 * Log info level with redaction
 */
export function logInfo(message: string, context?: LogContext): void {
  logSecure(`[INFO] ${message}`, context ? { ...context, status: 'info' } : undefined);
}

/**
 * Log warning level with redaction
 */
export function logWarn(message: string, context?: LogContext): void {
  logSecure(`[WARN] ${message}`, context ? { ...context, status: 'warning' } : undefined);
}

/**
 * Log error level with redaction
 */
export function logError(message: string, context?: LogContext): void {
  logSecure(`[ERROR] ${message}`, context ? { ...context, status: 'error' } : undefined);
}

/**
 * Log success with redaction
 */
export function logSuccess(message: string, context?: LogContext): void {
  logSecure(`[SUCCESS] ${message}`, context ? { ...context, status: 'success' } : undefined);
}
