export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

class Logger {
  private format(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const metaString = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaString}`;
  }

  info(message: string, meta?: Record<string, unknown>) {
    console.log(this.format(LogLevel.INFO, message, meta));
  }

  warn(message: string, meta?: Record<string, unknown>) {
    console.warn(this.format(LogLevel.WARN, message, meta));
  }

  error(message: string, meta?: Record<string, unknown>) {
    console.error(this.format(LogLevel.ERROR, message, meta));
  }

  debug(message: string, meta?: Record<string, unknown>) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.format(LogLevel.DEBUG, message, meta));
    }
  }
}

export const logger = new Logger();
