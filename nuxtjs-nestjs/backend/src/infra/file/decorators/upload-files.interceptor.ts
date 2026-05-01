import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FileConfig } from '@infra/file/configs';

@Injectable()
export class UploadFilesInterceptor implements NestInterceptor {
  constructor(private readonly fileConfig: FileConfig) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const InterceptorClass = FilesInterceptor('files', this.fileConfig.maxFileCount, {
      limits: { fileSize: this.fileConfig.maxFileSize },
    });
    const interceptor = new InterceptorClass();
    return interceptor.intercept(context, next);
  }
}
