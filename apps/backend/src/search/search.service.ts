import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma, DocumentStatus } from '@prisma/client';

interface SearchParams {
  q?: string;
  status?: DocumentStatus;
  schoolId?: string;
  branchId?: string;
  documentTypeId?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(params: SearchParams) {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 20, 100);

    const where: Prisma.DocumentWhereInput = {};
    if (params.status) where.status = params.status;
    if (params.schoolId) where.schoolId = params.schoolId;
    if (params.branchId) where.branchId = params.branchId;
    if (params.documentTypeId) where.documentTypeId = params.documentTypeId;

    if (params.q) {
      const query = params.q.trim();
      where.OR = [
        { documentType: { name: { contains: query, mode: 'insensitive' } } },
        { filePath: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        include: { documentType: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.document.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }
}
