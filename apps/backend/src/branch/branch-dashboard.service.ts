import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  canManageBranchLikeDirector,
  directorOwnsBranchSchool,
} from '../auth/school-scope.util.js';

/** Documents expiring within this many days (and still valid) count as "near expiry". */
export const NEAR_EXPIRY_DAYS = 30;

type CurrentUser = {
  id: string;
  role: UserRole;
  schoolId: string | null;
  branchId: string | null;
};

function isDocCurrentlyValid(expiresAt: Date | null, now: Date): boolean {
  if (expiresAt == null) return true;
  return expiresAt > now;
}

function isNearExpiry(expiresAt: Date | null, now: Date): boolean {
  if (expiresAt == null) return false;
  if (expiresAt <= now) return false;
  const end = new Date(now);
  end.setDate(end.getDate() + NEAR_EXPIRY_DAYS);
  return expiresAt <= end;
}

@Injectable()
export class BranchDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureBranchDashboardAccess(branchId: string, user: CurrentUser) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
    });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (user.role === UserRole.ADMIN) {
      return branch;
    }

    if (user.role === UserRole.SCHOOL_ADMIN) {
      if (user.schoolId !== branch.schoolId) {
        throw new ForbiddenException('Cannot access this branch');
      }
      return branch;
    }

    if (directorOwnsBranchSchool(user, branch.schoolId)) {
      return branch;
    }

    if (canManageBranchLikeDirector(user, branch)) {
      return branch;
    }

    throw new ForbiddenException('Cannot access branch dashboard');
  }

  async getDashboardSummary(branchId: string, user: CurrentUser) {
    const branch = await this.ensureBranchDashboardAccess(branchId, user);
    const now = new Date();

    const [studentUsers, teachers] = await Promise.all([
      this.prisma.user.findMany({
        where: { branchId, role: UserRole.STUDENT },
        include: {
          requiredDocTypes: { select: { id: true } },
        },
      }),
      this.prisma.user.findMany({
        where: { role: UserRole.TEACHER, branchId },
        include: {
          requiredDocTypes: { select: { id: true } },
        },
      }),
    ]);

    const ownerIds = [
      ...studentUsers.map((u) => u.id),
      ...teachers.map((u) => u.id),
    ];

    const branchDocs =
      ownerIds.length === 0
        ? []
        : await this.prisma.document.findMany({
            where: { ownerUserId: { in: ownerIds } },
            select: {
              id: true,
              ownerUserId: true,
              documentTypeId: true,
              expiresAt: true,
            },
          });

    let formsNearExpiryCount = 0;
    const satisfiedKeys = new Set<string>();

    for (const d of branchDocs) {
      if (isNearExpiry(d.expiresAt, now)) {
        formsNearExpiryCount += 1;
      }
      if (!isDocCurrentlyValid(d.expiresAt, now)) continue;
      satisfiedKeys.add(`${d.ownerUserId}:${d.documentTypeId}`);
    }

    let requiredSlots = 0;
    let satisfiedSlots = 0;

    const countPerson = (
      u: { id: string; requiredDocTypes: { id: string }[] },
    ) => {
      for (const t of u.requiredDocTypes) {
        requiredSlots += 1;
        if (satisfiedKeys.has(`${u.id}:${t.id}`)) satisfiedSlots += 1;
      }
    };

    for (const s of studentUsers) countPerson(s);
    for (const t of teachers) countPerson(t);

    const missingSlots = requiredSlots - satisfiedSlots;

    const teachersWithPosition = teachers.filter(
      (t) => t.staffPosition != null && t.branchId === branchId,
    );
    const teachersConsidered = teachersWithPosition.length;

    let teachersWithAllRequiredForms = 0;
    for (const teacher of teachersWithPosition) {
      const reqs = teacher.requiredDocTypes;
      if (reqs.length === 0) {
        teachersWithAllRequiredForms += 1;
        continue;
      }
      const allOk = reqs.every((t) =>
        satisfiedKeys.has(`${teacher.id}:${t.id}`),
      );
      if (allOk) teachersWithAllRequiredForms += 1;
    }

    return {
      branchId,
      schoolId: branch.schoolId,
      studentCount: studentUsers.length,
      teacherCount: teachers.length,
      teachersConsidered,
      teachersWithAllRequiredForms,
      formsNearExpiryCount,
      compliance: {
        requiredSlots,
        satisfiedSlots,
        missingSlots,
      },
    };
  }

  async getRecentDocuments(branchId: string, user: CurrentUser, limit = 20) {
    await this.ensureBranchDashboardAccess(branchId, user);

    const merged = await this.prisma.document.findMany({
      where: {
        ownerUser: { branchId },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        documentType: {
          select: { id: true, name: true, targetRole: true },
        },
        uploadedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return merged.map((d) => ({
      id: d.id,
      formRef: d.id.slice(0, 8),
      fileName: d.fileName,
      documentTypeName: d.documentType.name,
      category: d.documentType.targetRole,
      issuedAt: d.issuedAt?.toISOString() ?? null,
      expiresAt: d.expiresAt?.toISOString() ?? null,
      createdAt: d.createdAt.toISOString(),
      addedBy: {
        id: d.uploadedBy.id,
        name: d.uploadedBy.name,
        email: d.uploadedBy.email,
      },
    }));
  }

  async getCompliancePeople(branchId: string, user: CurrentUser) {
    await this.ensureBranchDashboardAccess(branchId, user);
    const now = new Date();

    const [studentUsers, teachers] = await Promise.all([
      this.prisma.user.findMany({
        where: { branchId, role: UserRole.STUDENT },
        include: {
          requiredDocTypes: { select: { id: true } },
          studentProfile: {
            select: { guardianName: true, guardianPhone: true },
          },
        },
      }),
      this.prisma.user.findMany({
        where: { role: UserRole.TEACHER, branchId },
        include: {
          requiredDocTypes: { select: { id: true } },
        },
      }),
    ]);

    const ownerIds = [
      ...studentUsers.map((u) => u.id),
      ...teachers.map((u) => u.id),
    ];

    const docs =
      ownerIds.length === 0
        ? []
        : await this.prisma.document.findMany({
            where: { ownerUserId: { in: ownerIds } },
            select: {
              ownerUserId: true,
              documentTypeId: true,
              expiresAt: true,
            },
          });

    const validPair = new Set<string>();
    for (const d of docs) {
      if (!isDocCurrentlyValid(d.expiresAt, now)) continue;
      validPair.add(`${d.ownerUserId}:${d.documentTypeId}`);
    }

    const students = studentUsers.map((s) => {
      const requiredIds = s.requiredDocTypes.map((t) => t.id);
      const requiredCount = requiredIds.length;
      let uploadedSatisfiedCount = 0;
      for (const id of requiredIds) {
        if (validPair.has(`${s.id}:${id}`)) uploadedSatisfiedCount += 1;
      }
      return {
        kind: 'STUDENT' as const,
        userId: s.id,
        name: s.name ?? s.email,
        guardianName: s.studentProfile?.guardianName ?? null,
        guardianEmail: s.email,
        requiredCount,
        uploadedSatisfiedCount,
        missingCount: requiredCount - uploadedSatisfiedCount,
      };
    });

    const teacherRows = teachers.map((teacher) => {
      const requiredIds = teacher.requiredDocTypes.map((t) => t.id);
      const requiredCount = requiredIds.length;
      let uploadedSatisfiedCount = 0;
      for (const id of requiredIds) {
        if (validPair.has(`${teacher.id}:${id}`)) uploadedSatisfiedCount += 1;
      }
      return {
        kind: 'TEACHER' as const,
        userId: teacher.id,
        name: teacher.name ?? teacher.email,
        email: teacher.email,
        requiredCount,
        uploadedSatisfiedCount,
        missingCount: requiredCount - uploadedSatisfiedCount,
      };
    });

    return { students, teachers: teacherRows };
  }
}
