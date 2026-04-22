import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Expose } from 'class-transformer';
import { BaseEntity } from '../common/base.entity';
import { Role } from './role.entity';
import { Program } from './program.entity';
import { Permission } from './permission.entity';

@Entity('adm_role_auth')
export class RoleAuth extends BaseEntity {
  @PrimaryColumn({ name: 'role_id' })
  @Expose()
  roleId: string;

  @PrimaryColumn({ name: 'pgm_id' })
  @Expose()
  pgmId: string;

  @PrimaryColumn({ name: 'perm_id' })
  @Expose()
  permId: string;

  @Column({ name: 'active_yn', default: true })
  @Expose()
  activeYn: boolean;

  @ManyToOne(() => Role, (role) => role.roleAuthList)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Program)
  @JoinColumn({ name: 'pgm_id' })
  program: Program;

  @ManyToOne(() => Permission)
  @JoinColumn({ name: 'perm_id' })
  permission: Permission;
}
