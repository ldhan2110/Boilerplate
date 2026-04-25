import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Expose } from 'class-transformer';
import { BaseEntity } from '../common/base.entity';
import { Program } from './program.entity';

@Entity('com_perm')
export class Permission extends BaseEntity {
  @PrimaryColumn({ name: 'perm_id' })
  @Expose()
  permId: string;

  @Column({ name: 'perm_cd' })
  @Expose()
  permCd: string;

  @Column({ name: 'perm_nm', nullable: true })
  @Expose()
  permNm: string;

  @Column({ name: 'pgm_id' })
  @Expose()
  pgmId: string;

  @ManyToOne(() => Program, (program) => program.permList)
  @JoinColumn({ name: 'pgm_id' })
  program: Program;
}
