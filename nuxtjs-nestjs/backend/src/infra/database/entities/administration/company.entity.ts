import { Column, Entity, PrimaryColumn } from 'typeorm';
import { Expose } from 'class-transformer';
import { BaseEntity } from '../common/base.entity';

@Entity('adm_co')
export class Company extends BaseEntity {
  @Column({ name: 'co_nm', nullable: true })
  @Expose()
  coNm: string;

  @Column({ name: 'tm_zn', nullable: true })
  @Expose()
  tmZn: string;
}
