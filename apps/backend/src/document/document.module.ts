import { Module } from '@nestjs/common';
import { DocumentController } from './document.controller.js';
import { DocumentService } from './document.service.js';
import { PrismaModule } from '../prisma/index.js';
import { StorageModule } from '../storage/index.js';
import { MailerModule } from '../mailer/index.js';

@Module({
  imports: [PrismaModule, StorageModule, MailerModule],
  controllers: [DocumentController],
  providers: [DocumentService],
  exports: [DocumentService],
})
export class DocumentModule {}
