import { Column, Entity, PrimaryColumn } from 'typeorm';
import { Expose } from 'class-transformer';
import { BaseEntity } from '../common/base.entity';

@Entity('adm_co')
export class Company extends BaseEntity {
  @PrimaryColumn({ name: 'co_id' })
  @Expose()
  coId: string;

  @Column({ name: 'co_nm', nullable: true })
  @Expose()
  coNm: string;

  @Column({ name: 'co_tp_cd', nullable: true })
  @Expose()
  coTpCd: string;

  @Column({ name: 'co_frgn_nm', nullable: true })
  @Expose()
  coFrgnNm: string;

  @Column({ name: 'tax_cd', nullable: true })
  @Expose()
  taxCd: string;

  @Column({ name: 'tax_ofc', nullable: true })
  @Expose()
  taxOfc: string;

  @Column({ name: 'co_locl_nm', nullable: true })
  @Expose()
  coLoclNm: string;

  @Column({ name: 'co_addr_val_1', nullable: true })
  @Expose()
  coAddrVal1: string;

  @Column({ name: 'co_addr_val_2', nullable: true })
  @Expose()
  coAddrVal2: string;

  @Column({ name: 'co_addr_val_3', nullable: true })
  @Expose()
  coAddrVal3: string;

  @Column({ name: 'eml_addr', nullable: true })
  @Expose()
  emlAddr: string;

  @Column({ name: 'fax_no', nullable: true })
  @Expose()
  faxNo: string;

  @Column({ name: 'phn_no', nullable: true })
  @Expose()
  phnNo: string;

  @Column({ name: 'sl_rep', nullable: true })
  @Expose()
  slRep: string;

  @Column({ name: 'web_addr', nullable: true })
  @Expose()
  webAddr: string;

  @Column({ name: 'co_desc', type: 'text', nullable: true })
  @Expose()
  coDesc: string;

  @Column({ name: 'co_anv_dt', type: 'date', nullable: true })
  @Expose()
  coAnvDt: Date;

  @Column({ name: 'co_sz', nullable: true })
  @Expose()
  coSz: string;

  @Column({ name: 'co_ntn', nullable: true })
  @Expose()
  coNtn: string;

  @Column({ name: 'empe_sz', nullable: true })
  @Expose()
  empeSz: string;

  @Column({ name: 'curr_cd', nullable: true })
  @Expose()
  currCd: string;

  @Column({ name: 'co_indus_zn', nullable: true })
  @Expose()
  coIndusZn: string;

  @Column({ name: 'co_prod', nullable: true })
  @Expose()
  coProd: string;

  @Column({ name: 'tm_zn', nullable: true, default: 'Asia/Ho_Chi_Minh' })
  @Expose()
  tmZn: string;

  @Column({ name: 'bank_tp_cd', nullable: true })
  @Expose()
  bankTpCd: string;

  @Column({ name: 'bank_acct_no', nullable: true })
  @Expose()
  bankAcctNo: string;

  @Column({ name: 'bank_nm', nullable: true })
  @Expose()
  bankNm: string;

  @Column({ name: 'chtr_capi_val', type: 'numeric', nullable: true })
  @Expose()
  chtrCapiVal: number;

  @Column({ name: 'estb_dt', type: 'date', nullable: true })
  @Expose()
  estbDt: Date;

  @Column({ name: 'lgo_file_id', nullable: true })
  @Expose()
  lgoFileId: string;
}
