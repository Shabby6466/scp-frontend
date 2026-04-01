import { Module } from '@nestjs/common';
import { ChildController } from './child.controller.js';
import { ChildService } from './child.service.js';
import { PrismaModule } from '../prisma/index.js';
import { AuthModule } from '../auth/auth.module.js';
import { SettingsModule } from '../settings/index.js';

@Module({
  imports: [PrismaModule, AuthModule, SettingsModule],
  controllers: [ChildController],
  providers: [ChildService],
  exports: [ChildService],
})
export class ChildModule {}
