import winston from "winston";

class Logger {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || "info",
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: "HH:mm:ss" }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : "";

          return `[${timestamp}] ${level}: ${message}${metaStr}`;
        })
      ),
      transports: [
        new winston.transports.Console({
          level: process.env.LOG_LEVEL || "info",
        }),
        // new winston.transports.File({
        //   filename: "logs/error.log",
        //   level: "error",
        //   handleExceptions: true,
        //   handleRejections: true,
        // }),
      ],
    });
  }

  error(message: string, meta?: any) {
    this.logger.error(message, meta);
  }

  warn(message: string, meta?: any) {
    this.logger.warn(message, meta);
  }

  info(message: string, meta?: any) {
    this.logger.info(message, meta);
  }

  http(message: string, meta?: any) {
    this.logger.http(message, meta);
  }

  // Add request context
  withRequest(requestId: string, userId?: string) {
    return this.logger.child({ requestId, userId });
  }
}

export const logger = new Logger();
