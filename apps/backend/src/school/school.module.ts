import { Module } from '@nestjs/common';
import { SchoolController } from './school.controller.js';
import { SchoolService } from './school.service.js';

@Module({
  imports: [],
  controllers: [SchoolController],
  providers: [SchoolService],
  exports: [SchoolService],
})
export class SchoolModule {}
