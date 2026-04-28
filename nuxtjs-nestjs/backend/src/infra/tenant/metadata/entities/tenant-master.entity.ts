import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'tent_mst', schema: 'tenant' })
export class TenantMaster {
  @PrimaryColumn({ name: 'tent_id', length: 50 })
  tentId: string;

  @Column({ name: 'tent_nm', length: 200 })
  tentNm: string;

  @Column({ name: 'use_flg', length: 1, default: 'Y' })
  useFlg: string;

  @Column({ name: 'tent_crnt_ver', length: 4 })
  tentCrntVer: string;

  @Column({ name: 'cre_usr_id', length: 20, nullable: true })
  creUsrId: string;

  @CreateDateColumn({ name: 'cre_dt', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  creDt: Date;

  @Column({ name: 'upd_usr_id', length: 20, nullable: true })
  updUsrId: string;

  @UpdateDateColumn({ name: 'upd_dt', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updDt: Date;
}
