import { Module } from '@nestjs/common';
import { DocumentTypeController } from './document-type.controller.js';
import { DocumentTypeService } from './document-type.service.js';
import { ChildModule } from '../child/child.module.js';

@Module({
  imports: [ChildModule],
  controllers: [DocumentTypeController],
  providers: [DocumentTypeService],
  exports: [DocumentTypeService],
})
export class DocumentTypeModule {}
