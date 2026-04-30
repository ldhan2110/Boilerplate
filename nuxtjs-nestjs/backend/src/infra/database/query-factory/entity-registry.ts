import path from 'path';

/**
 * Auto-scanned entity registry.
 * Any *.entity.ts file under src/infra/database/entities/ is discovered automatically.
 * No manual registration needed — just create the entity file.
 */
export const ENTITY_GLOB = [
  path.join(__dirname, '../entities/**/*.entity.{ts,js}'),
];
