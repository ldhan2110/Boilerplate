import { Logger as TypeOrmLoggerInterface } from 'typeorm';
import * as winston from 'winston';
import { LoggerProperties } from './logger.properties';

export function interpolateParams(
  sql: string,
  params: any[] | undefined,
): string {
  if (!params || params.length === 0) return sql;

  let result = sql;
  // Replace in reverse order to avoid $1 matching inside $10, $11, etc.
  for (let i = params.length; i >= 1; i--) {
    const value = params[i - 1];
    let replacement: string;

    if (value === null || value === undefined) {
      replacement = 'NULL';
    } else if (Array.isArray(value)) {
      replacement = value
        .map((v) =>
          typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : String(v),
        )
        .join(',');
    } else if (typeof value === 'string') {
      replacement = `'${value.replace(/'/g, "''")}'`;
    } else {
      replacement = String(value);
    }

    result = result.replace(new RegExp(`\\$${i}\\b`, 'g'), replacement);
  }

  return result;
}

export class TypeOrmLogger implements TypeOrmLoggerInterface {
  constructor(
    private readonly winstonLogger: winston.Logger,
    private readonly props: LoggerProperties,
  ) {}

  logQuery(query: string, parameters?: any[]): void {
    if (!this.props.logSql) return;
    const interpolated = interpolateParams(query, parameters);
    this.winstonLogger.debug(interpolated, { context: 'TypeORM:Query' });
  }

  logQueryError(
    error: string | Error,
    query: string,
    parameters?: any[],
  ): void {
    const interpolated = interpolateParams(query, parameters);
    const errMsg = error instanceof Error ? error.message : error;
    this.winstonLogger.error(`${errMsg}\n  Query: ${interpolated}`, {
      context: 'TypeORM:QueryError',
    });
  }

  logQuerySlow(time: number, query: string, parameters?: any[]): void {
    const interpolated = interpolateParams(query, parameters);
    this.winstonLogger.warn(`${time}ms\n  ${interpolated}`, {
      context: 'TypeORM:SlowQuery',
    });
  }

  logMigration(message: string): void {
    this.winstonLogger.info(message, { context: 'TypeORM:Migration' });
  }

  logSchemaBuild(message: string): void {
    this.winstonLogger.debug(message, { context: 'TypeORM:Schema' });
  }

  log(level: 'log' | 'info' | 'warn', message: any): void {
    const winstonLevel = level === 'log' ? 'info' : level;
    this.winstonLogger.log(winstonLevel, message, { context: 'TypeORM' });
  }
}
