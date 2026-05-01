import { Injectable } from '@nestjs/common';
import { BizException } from '@infra/common/exceptions';
import { SuccessDto } from '@infra/common/dto';
import { QueryFactory } from '@infra/database/query-factory';
import { File } from '@infra/database/entities/common';
import { LogService } from '@infra/logger';
import { FileConfig, FileCategory } from '../configs';
import * as fs from 'fs';
import * as path from 'path';

@LogService()
@Injectable()
export class FileService {
  constructor(
    private readonly qf: QueryFactory,
    private readonly fileConfig: FileConfig,
  ) {}

  async upload(files: Express.Multer.File[], category: FileCategory): Promise<SuccessDto> {
    const categoryDir = path.join(this.fileConfig.uploadDir, category);
    await fs.promises.mkdir(categoryDir, { recursive: true });

    await this.qf.transaction(async (tx) => {
      for (const file of files) {
        const fileId = await tx.genId('FIL');
        const fileName = `${fileId}_${file.originalname}`;
        const filePath = path.join(category, fileName);
        const fullPath = path.join(this.fileConfig.uploadDir, filePath);

        await fs.promises.rename(file.path, fullPath);

        await tx.insert(File).values({
          fileId,
          fileNm: file.originalname,
          filePath,
          fileTp: file.mimetype,
          fileSz: file.size,
        }).execute();
      }
    });

    return SuccessDto.of(true, files.length);
  }

  async download(fileId: string): Promise<{ entity: File; stream: fs.ReadStream }> {
    const entity = await this.qf.findOne(File, { fileId } as any);
    if (!entity) {
      throw new BizException('FIL000001', 'ERROR', 'File not found');
    }

    const fullPath = path.join(this.fileConfig.uploadDir, entity.filePath);
    if (!fs.existsSync(fullPath)) {
      throw new BizException('FIL000002', 'ERROR', 'File not found on disk');
    }

    const stream = fs.createReadStream(fullPath);
    return { entity, stream };
  }

  async delete(fileId: string): Promise<void> {
    const entity = await this.qf.findOne(File, { fileId } as any);
    if (!entity) return;

    const fullPath = path.join(this.fileConfig.uploadDir, entity.filePath);

    await this.qf.transaction(async (tx) => {
      await tx.delete(File).where({ fileId } as any).execute();
    });

    await fs.promises.unlink(fullPath).catch(() => {});
  }

  async isExist(fileId: string): Promise<boolean> {
    const entity = await this.qf.findOne(File, { fileId } as any);
    return entity !== null;
  }
}
