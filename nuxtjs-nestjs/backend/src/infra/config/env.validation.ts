import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, MinLength, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  PORT: number = 3000;

  // Database
  @IsString()
  DB_HOST: string;

  @IsNumber()
  DB_PORT: number;

  @IsString()
  DB_USERNAME: string;

  @IsString()
  DB_PASSWORD: string;

  @IsString()
  DB_NAME: string;

  // Metadata Database (tenant config storage)
  @IsString()
  METADATA_DB_HOST: string;

  @IsNumber()
  METADATA_DB_PORT: number;

  @IsString()
  METADATA_DB_USERNAME: string;

  @IsString()
  METADATA_DB_PASSWORD: string;

  @IsString()
  METADATA_DB_NAME: string;

  // Tenant pool settings (optional with defaults)
  @IsOptional()
  @IsNumber()
  TENANT_POOL_MIN: number = 5;

  @IsOptional()
  @IsNumber()
  TENANT_POOL_MAX: number = 20;

  @IsOptional()
  @IsNumber()
  TENANT_POOL_IDLE_MS: number = 600000;

  @IsOptional()
  @IsNumber()
  TENANT_POOL_EVICTION_MS: number = 3600000;

  @IsOptional()
  @IsNumber()
  TENANT_POOL_CONNECT_TIMEOUT: number = 30000;

  // Logger
  @IsOptional()
  @IsString()
  LOG_LEVEL: string = 'debug';

  @IsOptional()
  @IsString()
  LOG_DIR: string = 'logs';

  @IsOptional()
  @IsNumber()
  LOG_MAX_DAYS: number = 30;

  @IsOptional()
  @IsString()
  LOG_SQL: string = 'true';

  @IsOptional()
  @IsString()
  LOG_CONSOLE: string = 'true';

  @IsOptional()
  @IsString()
  LOG_FILE: string = 'true';

  @IsOptional()
  @IsNumber()
  LOG_SLOW_QUERY_MS: number = 1000;

  // JWT
  @IsString()
  @MinLength(32)
  JWT_ACCESS_SECRET: string;

  @IsString()
  @MinLength(32)
  JWT_REFRESH_SECRET: string;

  @IsNumber()
  JWT_ACCESS_EXPIRE_MS: number;

  @IsNumber()
  JWT_REFRESH_EXPIRE_MS: number;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
