import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { PrismaModule } from './prisma/index.js';
import { MailerModule } from './mailer/index.js';
import { StorageModule } from './storage/index.js';
import { AuthModule } from './auth/index.js';
import { SchoolModule } from './school/index.js';
import { UserModule } from './user/index.js';
import { BranchModule } from './branch/branch.module.js';
import { DocumentTypeModule } from './document-type/document-type.module.js';
import { DocumentModule } from './document/index.js';
import { ChildModule } from './child/index.js';
import { SettingsModule } from './settings/index.js';
import { AnalyticsModule } from './analytics/analytics.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    PrismaModule,
    MailerModule,
    StorageModule,
    AuthModule,
    SchoolModule,
    UserModule,
    BranchModule,
    DocumentTypeModule,
    DocumentModule,
    ChildModule,
    SettingsModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
