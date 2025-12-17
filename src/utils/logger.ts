/**
 * Sistema de Logging Centralizado
 * Funciona mesmo se Sentry não estiver disponível
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown> | object;

class Logger {
  private isDevelopment = typeof import.meta !== 'undefined' && import.meta.env?.DEV === true;

  private log(level: LogLevel, message: string, context?: LogContext) {
    // Em desenvolvimento, continua usando console
    if (this.isDevelopment) {
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌'
      }[level];
      
      const consoleMethod = level === 'debug' ? 'log' : level;
      if (typeof console !== 'undefined' && console[consoleMethod]) {
        console[consoleMethod](`${emoji} ${message}`, context || '');
      }
      return;
    }

    // Em produção, apenas logar erros críticos
    if (level === 'error' && typeof console !== 'undefined') {
      console.error(message, context);
    }
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext) {
    this.log('error', message, context);
  }
}

export const logger = new Logger();
