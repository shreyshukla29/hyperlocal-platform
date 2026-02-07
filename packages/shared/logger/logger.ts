import type { TransformableInfo } from 'logform';
import { createLogger, format, transports, type Logger } from 'winston';

const { combine, timestamp, printf } = format;

const customFormat = printf((info: TransformableInfo): string => {
  const message = typeof info.message === 'string' ? info.message : String(info.message);
  return `${info.timestamp} : ${info.level}: ${message}`;
});

export const logger: Logger = createLogger({
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), customFormat),
  transports: [new transports.Console(), new transports.File({ filename: 'combined.log' })],
});
