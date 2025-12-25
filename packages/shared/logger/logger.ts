import { createLogger, format, transports, type Logger } from "winston";

const { combine, timestamp, printf } = format;

interface LogInfo {
  level: string;
  message: string;
  timestamp?: string;
  error?: unknown;
}

const customFormat = printf(
  ({ level, message, timestamp }: LogInfo): string => {
    return `${timestamp} : ${level}: ${message}`;
  },
);

export const logger: Logger = createLogger({
  format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), customFormat),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "combined.log" }),
  ],
});
