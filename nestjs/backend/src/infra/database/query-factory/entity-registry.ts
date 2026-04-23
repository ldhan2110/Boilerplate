import { Company } from '@infra/database/entities/administration/company.entity';
import { User } from '@infra/database/entities/administration/user.entity';
import { Program } from '@infra/database/entities/administration/program.entity';
import { Permission } from '@infra/database/entities/administration/permission.entity';
import { Role } from '@infra/database/entities/administration/role.entity';
import { RoleAuth } from '@infra/database/entities/administration/role-auth.entity';

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
