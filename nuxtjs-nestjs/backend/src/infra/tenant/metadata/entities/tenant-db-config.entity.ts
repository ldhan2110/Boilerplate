import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'tent_db_cfg', schema: 'tenant' })
export class TenantDbConfig {
  @PrimaryColumn({ name: 'db_cfg_id', length: 36 })
  dbCfgId: string;

  @Column({ name: 'tent_id', length: 50 })
  tentId: string;

  @Column({ name: 'cfg_nm', length: 200 })
  cfgNm: string;

  @Column({ name: 'db_tp_cd', length: 20 })
  dbTpCd: string;

  @Column({ name: 'db_host', length: 255 })
  dbHost: string;

  @Column({ name: 'db_port', type: 'int4' })
  dbPort: number;

  @Column({ name: 'db_nm', length: 255 })
  dbNm: string;

  @Column({ name: 'db_usr_nm', length: 255 })
  dbUsrNm: string;

  @Column({ name: 'db_pwd', length: 500 })
  dbPwd: string;

  @Column({ name: 'db_schema', nullable: true })
  dbSchema: string;

  @Column({ name: 'priority', type: 'int4' })
  priority: number;

  @Column({ name: 'status', length: 20 })
  status: string;

  @Column({ name: 'use_flg', length: 1, nullable: true, default: 'Y' })
  useFlg: string;

  @Column({ name: 'cre_usr_id', length: 50, nullable: true })
  creUsrId: string;

  @CreateDateColumn({ name: 'cre_dt', type: 'timestamp', nullable: true, default: () => 'CURRENT_TIMESTAMP' })
  creDt: Date;

  @Column({ name: 'upd_usr_id', length: 50, nullable: true })
  updUsrId: string;

  @UpdateDateColumn({ name: 'upd_dt', type: 'timestamp', nullable: true, default: () => 'CURRENT_TIMESTAMP' })
  updDt: Date;
}
