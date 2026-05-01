import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FileConfig {
  uploadDir: string;
  maxFileSize: number;
  maxFileCount: number;

  constructor(configService: ConfigService) {
    this.uploadDir = configService.get<string>('UPLOAD_DIR', 'uploads');
    this.maxFileSize = configService.get<number>('MAX_FILE_SIZE', 10485760);
    this.maxFileCount = configService.get<number>('MAX_FILE_COUNT', 5);
  }
}
