import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DocumentStatus } from '@prisma/client';
import { SearchService } from './search.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly service: SearchService) {}

  @Get()
  search(
    @Query('q') q?: string,
    @Query('status') status?: DocumentStatus,
    @Query('schoolId') schoolId?: string,
    @Query('branchId') branchId?: string,
    @Query('documentTypeId') documentTypeId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.search({
      q,
      status,
      schoolId,
      branchId,
      documentTypeId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
