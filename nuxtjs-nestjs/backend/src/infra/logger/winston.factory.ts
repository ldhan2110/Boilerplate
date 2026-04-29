import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { LoggerProperties } from './logger.properties';

const { combine, timestamp, printf } = winston.format;

const LEVEL_COLORS: Record<string, string> = {
  error: '\x1b[31m',   // red
  warn: '\x1b[33m',    // yellow
  info: '\x1b[32m',    // green
  debug: '\x1b[36m',   // cyan
  verbose: '\x1b[35m', // magenta
};
const RESET = '\x1b[0m';

/**
 * Log format: [LEVEL][Context][HH:mm:ss.SSS]: message
 * File format: [LEVEL][Context][YYYY-MM-DD HH:mm:ss.SSS]: message
 */
function createLogFormat(includeDate: boolean, colorize: boolean) {
  return printf(({ level, message, timestamp: ts, context }) => {
    const ctx = context ? `[${context}]` : '';
    const rawLevel = level.replace(/\x1b\[\d+m/g, '');
    const upperLevel = rawLevel.toUpperCase();
    const levelTag = colorize
      ? `${LEVEL_COLORS[rawLevel] ?? ''}[${upperLevel}]${RESET}`
      : `[${upperLevel}]`;
    const time = includeDate ? `[${ts}]` : `[${(ts as string).split(' ')[1]}]`;
    return `${levelTag}${ctx}${time}: ${message}`;
  });
}

export function createWinstonLogger(props: LoggerProperties): winston.Logger {
  const transports: winston.transport[] = [];

  if (props.logConsole) {
    transports.push(
      new winston.transports.Console({
        format: combine(
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
          createLogFormat(false, true),
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
          createLogFormat(true, false),
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
          createLogFormat(true, false),
        ),
      }),
    );
  }

  return winston.createLogger({
    level: props.level,
    transports,
  });
}
