import { Expose } from 'class-transformer';
import { Column, CreateDateColumn, PrimaryColumn, UpdateDateColumn } from 'typeorm';

const COLUMN_DEFAULT = {
  createdAt: 'cre_dt',
  createdBy: 'cre_usr_id',
  updatedAt: 'upd_dt',
  updatedBy: 'upd_usr_id',
  useFlag: 'use_flg',
};

export class BaseEntity {
  @PrimaryColumn({ name: 'co_id', nullable: false })
  @Expose()
  coId: string;

  @CreateDateColumn({ name: COLUMN_DEFAULT.createdAt, type: 'timestamptz', nullable: false })
  @Expose()
  createdAt: Date;

  @Column({ name: COLUMN_DEFAULT.createdBy, nullable: false })
  @Expose()
  createdBy: string;

  @UpdateDateColumn({ name: COLUMN_DEFAULT.updatedAt, type: 'timestamptz', nullable: false })
  @Expose()
  updatedAt: Date;

  @Column({ name: COLUMN_DEFAULT.updatedBy, nullable: false })
  @Expose()
  updatedBy: string;

  @Column({ name: COLUMN_DEFAULT.useFlag, nullable: false, default: 'Y' })
  @Expose()
  useFlg: string;
}
