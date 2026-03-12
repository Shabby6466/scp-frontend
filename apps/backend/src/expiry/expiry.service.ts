import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service.js';
import { DocumentStatus } from '@prisma/client';

@Injectable()
export class ExpiryService {
  private readonly logger = new Logger(ExpiryService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async updateExpiredDocuments() {
    const now = new Date();

    const result = await this.prisma.document.updateMany({
      where: {
        status: DocumentStatus.VALID,
        expiresAt: { lte: now },
      },
      data: { status: DocumentStatus.EXPIRED },
    });

    if (result.count > 0) {
      this.logger.log(`Marked ${result.count} documents as EXPIRED`);
    }

    const revalidated = await this.prisma.document.updateMany({
      where: {
        status: DocumentStatus.EXPIRED,
        expiresAt: { gt: now },
      },
      data: { status: DocumentStatus.VALID },
    });

    if (revalidated.count > 0) {
      this.logger.log(`Re-validated ${revalidated.count} documents`);
    }
  }

  async getExpiringDocuments(daysAhead: number, schoolId?: string) {
    const futureDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
    const now = new Date();

    return this.prisma.document.findMany({
      where: {
        status: DocumentStatus.VALID,
        expiresAt: { gt: now, lte: futureDate },
        ...(schoolId ? { schoolId } : {}),
      },
      include: { documentType: true },
      orderBy: { expiresAt: 'asc' },
    });
  }
}
