import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { UploadFilesInterceptor } from './upload-files.interceptor';

export function UploadFiles(): MethodDecorator {
  return applyDecorators(
    UseInterceptors(UploadFilesInterceptor),
  );
}
