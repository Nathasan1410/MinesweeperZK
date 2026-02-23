/**
 * Logger utility for consistent logging across the application
 * In production, only errors are logged to console
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface LoggerOptions {
  context?: string;
}

class Logger {
  private isDev = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    const prefix = context ? `[${context}]` : '';
    return `${timestamp} ${prefix} ${level.toUpperCase()}: ${message}`;
  }

  log(message: string, ...args: any[], options?: LoggerOptions) {
    if (this.isDev) {
      const formatted = this.formatMessage('log', message, options?.context);
      console.log(formatted, ...args);
    }
  }

  info(message: string, ...args: any[], options?: LoggerOptions) {
    if (this.isDev) {
      const formatted = this.formatMessage('info', message, options?.context);
      console.info(formatted, ...args);
    }
  }

  warn(message: string, ...args: any[], options?: LoggerOptions) {
    if (this.isDev) {
      const formatted = this.formatMessage('warn', message, options?.context);
      console.warn(formatted, ...args);
    }
  }

  error(message: string, ...args: any[], options?: LoggerOptions) {
    // Always log errors, even in production
    const formatted = this.formatMessage('error', message, options?.context);
    console.error(formatted, ...args);
  }

  debug(message: string, ...args: any[], options?: LoggerOptions) {
    if (this.isDev && process.env.DEBUG) {
      const formatted = this.formatMessage('debug', message, options?.context);
      console.debug(formatted, ...args);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions for quick access
export const log = (message: string, ...args: any[]) => logger.log(message, ...args);
export const info = (message: string, ...args: any[]) => logger.info(message, ...args);
export const warn = (message: string, ...args: any[]) => logger.warn(message, ...args);
export const error = (message: string, ...args: any[]) => logger.error(message, ...args);
export const debug = (message: string, ...args: any[]) => logger.debug(message, ...args);
