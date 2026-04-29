import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LoggerProperties {
  readonly level: string;
  readonly dir: string;
  readonly maxDays: number;
  readonly logSql: boolean;
  readonly logConsole: boolean;
  readonly logFile: boolean;
  readonly slowQueryMs: number;

  constructor(config: ConfigService) {
    const isProd = config.get<string>('NODE_ENV') === 'production';
    this.level = config.get<string>('LOG_LEVEL', isProd ? 'info' : 'debug');
    this.dir = config.get<string>('LOG_DIR', 'logs');
    this.maxDays = config.get<number>('LOG_MAX_DAYS', 30);
    this.logSql = config.get<string>('LOG_SQL', isProd ? 'false' : 'true') === 'true';
    this.logConsole = config.get<string>('LOG_CONSOLE', 'true') === 'true';
    this.logFile = config.get<string>('LOG_FILE', 'true') === 'true';
    this.slowQueryMs = config.get<number>('LOG_SLOW_QUERY_MS', 1000);
  }
}
