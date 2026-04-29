import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { LoggerProperties } from './logger.properties';

const { combine, timestamp, printf, colorize } = winston.format;

/**
 * Log format: [LEVEL][Context][HH:mm:ss.SSS]: message
 * File format: [LEVEL][Context][YYYY-MM-DD HH:mm:ss.SSS]: message
 */
function createLogFormat(includeDate: boolean) {
  return printf(({ level, message, timestamp: ts, context }) => {
    const ctx = context ? `[${context}]` : '';
    const upperLevel = `[${level.toUpperCase()}]`;
    const time = includeDate ? `[${ts}]` : `[${(ts as string).split(' ')[1]}]`;
    return `${upperLevel}${ctx}${time}: ${message}`;
  });
}

export function createWinstonLogger(props: LoggerProperties): winston.Logger {
  const transports: winston.transport[] = [];

  if (props.logConsole) {
    transports.push(
      new winston.transports.Console({
        format: combine(
          colorize({ level: true }),
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
          createLogFormat(false),
        ),
      }),
    );
  }

  if (props.logFile) {
    transports.push(
      new DailyRotateFile({
        dirname: props.dir,
        filename: 'app-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxFiles: `${props.maxDays}d`,
        format: combine(
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
          createLogFormat(true),
        ),
      }),
    );

    transports.push(
      new DailyRotateFile({
        dirname: props.dir,
        filename: 'error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxFiles: `${props.maxDays}d`,
        level: 'error',
        format: combine(
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
          createLogFormat(true),
        ),
      }),
    );
  }

  return winston.createLogger({
    level: props.level,
    transports,
  });
}
