import {
  Company,
  User,
  Program,
  Permission,
  Role,
  RoleAuth,
} from '@infra/database/entities/administration';

/**
 * Central registry of all TypeORM entities.
 * Registered globally in DatabaseModule so feature modules do not need
 * TypeOrmModule.forFeature() or @InjectRepository().
 *
 * When you create a new entity, add it here.
 */
export const ALL_ENTITIES = [
  Company,
  User,
  Program,
  Permission,
  Role,
  RoleAuth,
];
