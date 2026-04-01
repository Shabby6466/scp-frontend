import { Module } from '@nestjs/common';
import { BranchController } from './branch.controller.js';
import { BranchService } from './branch.service.js';
import { BranchDashboardService } from './branch-dashboard.service.js';

@Module({
  controllers: [BranchController],
  providers: [BranchService, BranchDashboardService],
  exports: [BranchService, BranchDashboardService],
})
export class BranchModule {}
