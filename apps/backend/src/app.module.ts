import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { PrismaModule } from './prisma/index.js';
import { SupabaseModule } from './supabase/index.js';
import { AuthModule } from './auth/index.js';
import { DocumentTypeModule } from './document-type/index.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    PrismaModule,
    SupabaseModule,
    AuthModule,
    DocumentTypeModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
