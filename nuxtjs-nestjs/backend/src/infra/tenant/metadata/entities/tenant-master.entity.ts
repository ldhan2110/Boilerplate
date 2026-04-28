import { Column, Entity, PrimaryColumn } from 'typeorm';
import { BaseEntity } from '@infra/database/entities/common/base.entity';

@Entity({ name: 'tent_mst', schema: 'tenant' })
export class TenantMaster extends BaseEntity {
  @PrimaryColumn({ name: 'tent_id', length: 20 })
  tentId: string;

  @Column({ name: 'tent_nm', length: 100 })
  tentNm: string;
}
