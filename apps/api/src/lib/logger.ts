type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: unknown;
}

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'jwtsecret',
  'authorization',
]);

function sanitize(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.map(sanitize);
    }
    const sanitizedObj: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        sanitizedObj[key] = '[REDACTED]';
      } else {
        sanitizedObj[key] = sanitize(val);
      }
    }
    return sanitizedObj;
  }
  return value;
}

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
  if (context && Object.keys(context).length > 0) {
    const sanitizedContext = sanitize(context);
    return `${base} ${JSON.stringify(sanitizedContext)}`;
  }
  return base;
}

export const logger = {
  info(message: string, context?: LogContext): void {
    console.log(formatMessage('info', message, context));
  },
  warn(message: string, context?: LogContext): void {
    console.warn(formatMessage('warn', message, context));
  },
  error(message: string, error?: unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      ...(error instanceof Error
        ? { errorMessage: error.message, stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined }
        : { errorDetails: error }),
    };
    console.error(formatMessage('error', message, errorContext));
  },
  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatMessage('debug', message, context));
    }
  },
};
