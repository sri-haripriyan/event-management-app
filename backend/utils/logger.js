import { createLogger, format, transports } from "winston";

const { combine, timestamp, printf } = format;

const simpleFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

const logger = createLogger({
  level: "info",
  format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), simpleFormat),
  transports: [new transports.Console()],
});

export default logger;
