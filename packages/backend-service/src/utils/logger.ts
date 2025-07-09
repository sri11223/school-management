export interface LogLevel {
  ERROR: 0;
  WARN: 1;
  INFO: 2;
  DEBUG: 3;
}

export const LOG_LEVELS: LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

export class Logger {
  private logLevel: number;

  constructor(logLevel: number = LOG_LEVELS.INFO) {
    this.logLevel = logLevel;
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  }

  public error(message: string, meta?: any): void {
    if (this.logLevel >= LOG_LEVELS.ERROR) {
      console.error(this.formatMessage('ERROR', message, meta));
    }
  }

  public warn(message: string, meta?: any): void {
    if (this.logLevel >= LOG_LEVELS.WARN) {
      console.warn(this.formatMessage('WARN', message, meta));
    }
  }

  public info(message: string, meta?: any): void {
    if (this.logLevel >= LOG_LEVELS.INFO) {
      console.log(this.formatMessage('INFO', message, meta));
    }
  }

  public debug(message: string, meta?: any): void {
    if (this.logLevel >= LOG_LEVELS.DEBUG) {
      console.log(this.formatMessage('DEBUG', message, meta));
    }
  }

  public setLogLevel(level: number): void {
    this.logLevel = level;
  }
}

// Export singleton logger instance
const logLevel = process.env.LOG_LEVEL ? parseInt(process.env.LOG_LEVEL) : LOG_LEVELS.INFO;
export const logger = new Logger(logLevel);
