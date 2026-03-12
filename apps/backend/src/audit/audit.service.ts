import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface CreateAuditEntry {
  action: string;
  entityId?: string;
  userId: string;
  details?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: CreateAuditEntry) {
    return this.prisma.auditLog.create({
      data: {
        action: entry.action,
        entityId: entry.entityId,
        userId: entry.userId,
        details: entry.details as any,
      },
    });
  }

  async findAll(opts: {
    userId?: string;
    entityId?: string;
    action?: string;
    page?: number;
    limit?: number;
  }) {
    const page = opts.page ?? 1;
    const limit = Math.min(opts.limit ?? 20, 100);
    const where: Record<string, unknown> = {};
    if (opts.userId) where.userId = opts.userId;
    if (opts.entityId) where.entityId = opts.entityId;
    if (opts.action) where.action = { contains: opts.action, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }
}
