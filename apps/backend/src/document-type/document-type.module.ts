import { Module } from '@nestjs/common';
import { DocumentTypeController } from './document-type.controller.js';
import { DocumentTypeService } from './document-type.service.js';
import { MailerModule } from '../mailer/index.js';

@Module({
  imports: [MailerModule],
  controllers: [DocumentTypeController],
  providers: [DocumentTypeService],
  exports: [DocumentTypeService],
})
export class DocumentTypeModule {}
