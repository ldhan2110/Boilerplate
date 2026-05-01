import { Expose } from "class-transformer";
import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm";

@Entity('tb_file')
export class File extends BaseEntity {
  @PrimaryColumn({ name: 'file_id', nullable: false, length: 20 })
  @Expose()
  fileId: string;
  
  @Column({ name: 'file_nm', nullable: false, length: 255 })
  @Expose()
  fileNm: string;

  @Column({ name: 'file_path', nullable: true, length: 255 })
  @Expose()
  filePath: string;

  @Column({ name: 'file_tp', nullable: true, length: 200 })
  @Expose()
  fileTp: string;

  @Column({ name: 'file_sz', nullable: true, type: 'int' })
  @Expose()
  fileSz: number;
}