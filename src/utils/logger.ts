const getTimestamp = (): string => {
  return new Date().toISOString();
};

const generateCorrelationId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

export const logger = {
  log: (
    message: string,
    meta?: Record<string, unknown>,
    correlationId?: string,
  ) => {
    const log = {
      timestamp: getTimestamp(),
      level: 'log',
      message,
      correlationId: correlationId || generateCorrelationId(),
      ...meta,
    };
    console.log(JSON.stringify(log));
  },

  error: (
    message: string,
    meta?: Record<string, unknown>,
    correlationId?: string,
  ) => {
    const log = {
      timestamp: getTimestamp(),
      level: 'error',
      message,
      correlationId: correlationId || generateCorrelationId(),
      ...meta,
    };
    console.error(JSON.stringify(log));
  },

  warn: (
    message: string,
    meta?: Record<string, unknown>,
    correlationId?: string,
  ) => {
    const log = {
      timestamp: getTimestamp(),
      level: 'warn',
      message,
      correlationId: correlationId || generateCorrelationId(),
      ...meta,
    };
    console.warn(JSON.stringify(log));
  },

  info: (
    message: string,
    meta?: Record<string, unknown>,
    correlationId?: string,
  ) => {
    const log = {
      timestamp: getTimestamp(),
      level: 'info',
      message,
      correlationId: correlationId || generateCorrelationId(),
      ...meta,
    };
    console.log(JSON.stringify(log));
  },

  debug: (
    message: string,
    meta?: Record<string, unknown>,
    correlationId?: string,
  ) => {
    const log = {
      timestamp: getTimestamp(),
      level: 'debug',
      message,
      correlationId: correlationId || generateCorrelationId(),
      ...meta,
    };
    console.log(JSON.stringify(log));
  },
};
