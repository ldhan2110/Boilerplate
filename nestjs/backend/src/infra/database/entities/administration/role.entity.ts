import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { Expose } from 'class-transformer';
import { BaseEntity } from '../common/base.entity';
import { RoleAuth } from './role-auth.entity';

@Entity('adm_role')
export class Role extends BaseEntity {
  @PrimaryColumn({ name: 'role_id' })
  @Expose()
  roleId: string;

  @Column({ name: 'role_cd' })
  @Expose()
  roleCd: string;

  @Column({ name: 'role_nm', nullable: true })
  @Expose()
  roleNm: string;

  @Column({ name: 'role_desc', type: 'text', nullable: true })
  @Expose()
  roleDesc: string;

  @OneToMany(() => RoleAuth, (auth) => auth.role)
  roleAuthList: RoleAuth[];
}
