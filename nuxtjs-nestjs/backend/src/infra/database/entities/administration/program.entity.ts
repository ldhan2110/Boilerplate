import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';
import { Expose } from 'class-transformer';
import { BaseEntity } from '../common/base.entity';
import { Permission } from './permission.entity';
import { AutoId } from '../../decorators';

@Entity('com_pgm')
export class Program extends BaseEntity {
  @AutoId('PGM')
  @PrimaryColumn({ name: 'pgm_id' })
  @Expose()
  pgmId: string;

  @Column({ name: 'pgm_cd' })
  @Expose()
  pgmCd: string;

  @Column({ name: 'pgm_nm', nullable: true })
  @Expose()
  pgmNm: string;

  @Column({ name: 'pgm_tp_cd', nullable: true })
  @Expose()
  pgmTpCd: string;

  @Column({ name: 'prnt_pgm_id', nullable: true })
  @Expose()
  prntPgmId: string;

  @Column({ name: 'dsp_order', type: 'int', default: 9999 })
  @Expose()
  dspOrder: number;

  @Column({ name: 'pgm_rmk', type: 'text', nullable: true })
  @Expose()
  pgmRmk: string;

  // Computed fields (not stored, populated by recursive CTE)
  level?: number;
  treeKey?: string;
  treePath?: string;

  @OneToMany(() => Permission, (perm) => perm.program)
  permList: Permission[];

  @ManyToOne(() => Program)
  @JoinColumn({ name: 'prnt_pgm_id' })
  parent: Program;
}
