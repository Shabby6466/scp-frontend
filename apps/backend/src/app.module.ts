import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller.js';
import { PrismaModule } from './prisma/index.js';
import { SupabaseModule } from './supabase/index.js';
import { AuthModule } from './auth/index.js';
import { DocumentTypeModule } from './document-type/index.js';
import { DocumentModule } from './document/index.js';
import { ExpiryModule } from './expiry/index.js';
import { AuditModule } from './audit/index.js';
import { ComplianceModule } from './compliance/index.js';
import { NotificationModule } from './notification/index.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    SupabaseModule,
    AuthModule,
    DocumentTypeModule,
    DocumentModule,
    ExpiryModule,
    AuditModule,
    ComplianceModule,
    NotificationModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
