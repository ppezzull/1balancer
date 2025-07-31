import winston from 'winston';
import { config } from '../config';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let log = `${timestamp} [${level}]: ${message}`;
  
  if (Object.keys(metadata).length > 0) {
    log += ` ${JSON.stringify(metadata)}`;
  }
  
  if (stack) {
    log += `\n${stack}`;
  }
  
  return log;
});

// Create the logger
export const logger = winston.createLogger({
  level: config.logLevel,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  ),
  transports: [
    // Console transport
    new winston.transports.Console({
      format: combine(
        colorize(),
        consoleFormat
      ),
    }),
  ],
});

// Add file transport in production
if (config.env === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: combine(
      timestamp(),
      winston.format.json()
    ),
  }));

  logger.add(new winston.transports.File({
    filename: 'logs/combined.log',
    format: combine(
      timestamp(),
      winston.format.json()
    ),
  }));
}

// Create child loggers for specific modules
export function createLogger(module: string) {
  return logger.child({ module });
}