import { Module } from '@nestjs/common';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';
import { AuthModule } from '../auth/index.js';
import { SettingsModule } from '../settings/index.js';

@Module({
  imports: [AuthModule, SettingsModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
