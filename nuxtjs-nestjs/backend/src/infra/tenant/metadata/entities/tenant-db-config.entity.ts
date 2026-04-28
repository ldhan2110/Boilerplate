import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BaseEntity } from '@infra/database/entities/common/base.entity';
import { TenantMaster } from './tenant-master.entity';

@Entity({ name: 'tent_db_cfg', schema: 'tenant' })
export class TenantDbConfig extends BaseEntity {
  @PrimaryColumn({ name: 'tent_id', length: 20 })
  tentId: string;

  @PrimaryColumn({ name: 'priority', type: 'int', default: 1 })
  priority: number;

  @Column({ name: 'db_type', length: 20, default: 'postgres' })
  dbType: string;

  @Column({ name: 'db_host', length: 255 })
  dbHost: string;

  @Column({ name: 'db_port', type: 'int', default: 5432 })
  dbPort: number;

  @Column({ name: 'db_name', length: 100 })
  dbName: string;

  @Column({ name: 'db_username', length: 100 })
  dbUsername: string;

  @Column({ name: 'db_password', length: 255 })
  dbPassword: string;

  @ManyToOne(() => TenantMaster)
  @JoinColumn({ name: 'tent_id' })
  tenant: TenantMaster;
}
