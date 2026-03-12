import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { DocumentStatus } from '@prisma/client';

export interface HeatmapCell {
  schoolId: string;
  schoolName: string;
  branchId: string | null;
  branchName: string | null;
  documentTypeName: string;
  documentTypeId: string;
  total: number;
  valid: number;
  expired: number;
  pending: number;
  compliancePercent: number;
}

@Injectable()
export class ComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  async getHeatmapData(schoolId?: string): Promise<HeatmapCell[]> {
    const schools = schoolId
      ? await this.prisma.school.findMany({ where: { id: schoolId }, include: { branches: true } })
      : await this.prisma.school.findMany({ include: { branches: true } });

    const documentTypes = await this.prisma.documentType.findMany();
    const cells: HeatmapCell[] = [];

    for (const school of schools) {
      const targets = school.branches.length > 0
        ? school.branches.map((b) => ({ branchId: b.id, branchName: b.name }))
        : [{ branchId: null, branchName: null }];

      for (const target of targets) {
        for (const dt of documentTypes) {
          const where = {
            schoolId: school.id,
            documentTypeId: dt.id,
            ...(target.branchId ? { branchId: target.branchId } : {}),
          };

          const [total, valid, expired, pending] = await Promise.all([
            this.prisma.document.count({ where }),
            this.prisma.document.count({ where: { ...where, status: DocumentStatus.VALID } }),
            this.prisma.document.count({ where: { ...where, status: DocumentStatus.EXPIRED } }),
            this.prisma.document.count({ where: { ...where, status: DocumentStatus.PENDING } }),
          ]);

          cells.push({
            schoolId: school.id,
            schoolName: school.name,
            branchId: target.branchId,
            branchName: target.branchName,
            documentTypeId: dt.id,
            documentTypeName: dt.name,
            total,
            valid,
            expired,
            pending,
            compliancePercent: total > 0 ? Math.round((valid / total) * 100) : 0,
          });
        }
      }
    }

    return cells;
  }

  async getAuditReadiness(schoolId?: string) {
    const mandatoryTypes = await this.prisma.documentType.findMany({
      where: { isMandatory: true },
    });

    if (mandatoryTypes.length === 0) {
      return { score: 100, totalRequired: 0, totalValid: 0, missing: [] };
    }

    const where = schoolId ? { schoolId } : {};

    let totalValid = 0;
    let totalRequired = 0;
    const missing: { documentTypeName: string; count: number }[] = [];

    for (const dt of mandatoryTypes) {
      const valid = await this.prisma.document.count({
        where: { ...where, documentTypeId: dt.id, status: DocumentStatus.VALID },
      });
      const total = await this.prisma.document.count({
        where: { ...where, documentTypeId: dt.id },
      });

      totalRequired += Math.max(total, 1);
      totalValid += valid;

      if (valid === 0) {
        missing.push({ documentTypeName: dt.name, count: total });
      }
    }

    const score = totalRequired > 0 ? Math.round((totalValid / totalRequired) * 100) : 0;

    return { score, totalRequired, totalValid, missing };
  }
}
