import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Expose } from 'class-transformer';
import { BaseEntity } from '../common/base.entity';

@Entity('adm_usr')
export class User extends BaseEntity {
  @PrimaryColumn({ name: 'usr_id' })
  @Expose()
  usrId: string;

  @Column({ name: 'usr_nm', nullable: true })
  @Expose()
  usrNm: string;

  @Column({ name: 'usr_pwd' })
  usrPwd: string;

  @Column({ name: 'usr_eml', nullable: true })
  @Expose()
  usrEml: string;

  @Column({ name: 'usr_phn', nullable: true })
  @Expose()
  usrPhn: string;

  @Column({ name: 'usr_addr', nullable: true })
  @Expose()
  usrAddr: string;

  @Column({ name: 'usr_desc', type: 'text', nullable: true })
  @Expose()
  usrDesc: string;

  @Column({ name: 'usr_file_id', nullable: true })
  @Expose()
  usrFileId: string;

  @Column({ name: 'role_id', nullable: true })
  @Expose()
  roleId: string;

  @Column({ name: 'role_nm', nullable: true })
  @Expose()
  roleNm: string;

  @Column({ name: 'lang_val', default: 'en' })
  @Expose()
  langVal: string;

  @Column({ name: 'sys_mod_val', default: 'light' })
  @Expose()
  sysModVal: string;

  @Column({ name: 'dt_fmt_val', default: 'DD/MM/YYYY HH:mm:ss' })
  @Expose()
  dtFmtVal: string;

  @Column({ name: 'sys_colr_val', default: '#1890ff' })
  @Expose()
  sysColrVal: string;
}
