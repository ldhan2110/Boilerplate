import { Module } from '@nestjs/common';
import { FileConfig } from './configs';
import { UploadFilesInterceptor } from './decorators';
import { FileService } from './services';
import { FileController } from './controllers';

@Module({
  providers: [FileConfig, UploadFilesInterceptor, FileService],
  controllers: [FileController],
  exports: [FileService, FileConfig],
})
export class FileModule {}
