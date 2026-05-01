import { Controller, Get, Param, Res, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { FileService } from '../services/file.service';

@Controller('/file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get('download/:fileId')
  async download(
    @Param('fileId') fileId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { entity, stream } = await this.fileService.download(fileId);

    res.set({
      'Content-Type': entity.fileTp || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(entity.fileNm)}"`,
    });

    return new StreamableFile(stream);
  }
}
