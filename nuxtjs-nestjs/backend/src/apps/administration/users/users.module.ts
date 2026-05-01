import { Module } from '@nestjs/common';
import { UsersController } from './controllers';
import { UsersService } from './services';

@Module({
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
