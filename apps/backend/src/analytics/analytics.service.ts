import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { isSchoolDirector } from '../auth/school-scope.util.js';
import type { FormsBucket } from './dto/forms-analytics-query.dto.js';

export const ANALYTICS_NEAR_EXPIRY_DAYS = 30;

type CurrentUser = {
  id: string;
  role: UserRole;
  schoolId: string | null;
  branchId: string | null;
};

type ResolvedScope =
  | { kind: 'global' }
  | { kind: 'school'; schoolId: string }
  | { kind: 'branch'; branchId: string }
  | { kind: 'teacher'; branchId: string };

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  resolveScope(user: CurrentUser): ResolvedScope {
    if (user.role === UserRole.ADMIN) {
      return { kind: 'global' };
    }
    if (user.role === UserRole.TEACHER) {
      if (!user.branchId) {
        throw new ForbiddenException('Teacher has no branch assignment');
      }
      return { kind: 'teacher', branchId: user.branchId };
    }
    if (user.role === UserRole.BRANCH_DIRECTOR) {
      if (!user.branchId) {
        throw new ForbiddenException(
          'Branch director has no branch assignment',
        );
      }
      return { kind: 'branch', branchId: user.branchId };
    }
    if (user.role === UserRole.DIRECTOR || isSchoolDirector(user)) {
      if (!user.schoolId) {
        throw new ForbiddenException('Account is not linked to a school');
      }
      return { kind: 'school', schoolId: user.schoolId };
    }
    throw new ForbiddenException('Insufficient permissions for analytics');
  }

  private scopeWhereSql(scope: ResolvedScope): Prisma.Sql {
    switch (scope.kind) {
      case 'global':
        return Prisma.sql`TRUE`;
      case 'school':
        return Prisma.sql`EXISTS (
          SELECT 1 FROM "User" owner
          INNER JOIN "Branch" b ON b.id = owner."branchId"
          WHERE owner.id = d."ownerUserId" AND b."schoolId" = ${scope.schoolId}
        )`;
      case 'teacher':
        return Prisma.sql`EXISTS (
          SELECT 1 FROM "User" owner
          WHERE owner.id = d."ownerUserId" AND owner."branchId" = ${scope.branchId}
        )`;
      case 'branch':
        return Prisma.sql`EXISTS (
          SELECT 1 FROM "User" owner
          WHERE owner.id = d."ownerUserId" AND owner."branchId" = ${scope.branchId}
        )`;
      default:
        return Prisma.sql`FALSE`;
    }
  }

  private typeFilter(documentTypeId?: string): Prisma.Sql {
    if (!documentTypeId?.trim()) return Prisma.sql`TRUE`;
    return Prisma.sql`d."documentTypeId" = ${documentTypeId.trim()}`;
  }

  private dateTruncRaw(bucket: FormsBucket): Prisma.Sql {
    const unit =
      bucket === 'week' ? 'week' : bucket === 'month' ? 'month' : 'day';
    return Prisma.raw(`date_trunc('${unit}', d."createdAt")`);
  }

  async submissions(
    user: CurrentUser,
    from: Date,
    to: Date,
    bucket: FormsBucket,
    documentTypeId?: string,
  ) {
    const scope = this.resolveScope(user);
    const scopeSql = this.scopeWhereSql(scope);
    const typeSql = this.typeFilter(documentTypeId);
    const trunc = this.dateTruncRaw(bucket);

    const rows = await this.prisma.$queryRaw<{ bucket: Date; count: number }[]>(
      Prisma.sql`
      SELECT ${trunc} AS bucket,
             COUNT(*)::int AS count
      FROM "Document" d
      WHERE d."createdAt" >= ${from}
        AND d."createdAt" <= ${to}
        AND ${scopeSql}
        AND ${typeSql}
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    );

    return {
      buckets: rows.map((r) => ({
        label: r.bucket.toISOString(),
        count: Number(r.count),
      })),
    };
  }

  async byUploader(
    user: CurrentUser,
    from: Date,
    to: Date,
    documentTypeId?: string,
  ) {
    const scope = this.resolveScope(user);
    const scopeSql = this.scopeWhereSql(scope);
    const typeSql = this.typeFilter(documentTypeId);

    const rows = await this.prisma.$queryRaw<
      { role: UserRole; count: number }[]
    >(
      Prisma.sql`
      SELECT u.role, COUNT(*)::int AS count
      FROM "Document" d
      INNER JOIN "User" u ON u.id = d."uploadedById"
      WHERE d."createdAt" >= ${from}
        AND d."createdAt" <= ${to}
        AND ${scopeSql}
        AND ${typeSql}
      GROUP BY u.role
      ORDER BY count DESC
    `,
    );

    const byRole = rows.map((r) => ({
      role: r.role,
      count: Number(r.count),
    }));
    const total = byRole.reduce((s, r) => s + r.count, 0);
    return { byRole, total };
  }

  async expiryByType(user: CurrentUser, documentTypeId?: string) {
    const scope = this.resolveScope(user);
    const scopeSql = this.scopeWhereSql(scope);
    const typeSql = this.typeFilter(documentTypeId);
    const nearDays = ANALYTICS_NEAR_EXPIRY_DAYS;

    const rows = await this.prisma.$queryRaw<
      {
        formName: string;
        total: number;
        active: number;
        nearExpiry: number;
        expired: number;
        noExpiry: number;
      }[]
    >(Prisma.sql`
      SELECT
        dt.name AS "formName",
        COUNT(*)::int AS total,
        SUM(CASE WHEN d."expiresAt" IS NULL THEN 1 ELSE 0 END)::int AS "noExpiry",
        SUM(
          CASE
            WHEN d."expiresAt" IS NOT NULL
              AND d."expiresAt"::date < CURRENT_DATE
            THEN 1 ELSE 0
          END
        )::int AS expired,
        SUM(
          CASE
            WHEN d."expiresAt" IS NOT NULL
              AND d."expiresAt"::date >= CURRENT_DATE
              AND d."expiresAt"::date <= CURRENT_DATE + (${nearDays})::integer
            THEN 1 ELSE 0
          END
        )::int AS "nearExpiry",
        SUM(
          CASE
            WHEN d."expiresAt" IS NOT NULL
              AND d."expiresAt"::date > CURRENT_DATE + (${nearDays})::integer
            THEN 1 ELSE 0
          END
        )::int AS active
      FROM "Document" d
      INNER JOIN "DocumentType" dt ON dt.id = d."documentTypeId"
      WHERE ${scopeSql}
        AND ${typeSql}
      GROUP BY dt.name
      ORDER BY dt.name ASC
    `);

    return {
      rows: rows.map((r) => ({
        formName: r.formName,
        total: Number(r.total),
        active: Number(r.active),
        nearExpiry: Number(r.nearExpiry),
        expired: Number(r.expired),
        noExpiry: Number(r.noExpiry),
      })),
    };
  }
}
