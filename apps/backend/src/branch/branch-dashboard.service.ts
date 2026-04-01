import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DocumentCategory, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { canManageBranchLikeDirector, directorOwnsBranchSchool } from '../auth/school-scope.util.js';

/** Documents expiring within this many days (and still valid) count as "near expiry". */
export const NEAR_EXPIRY_DAYS = 30;

type CurrentUser = {
  id: string;
  role: UserRole;
  schoolId: string | null;
  branchId: string | null;
};

type ChildForCompliance = {
  id: string;
  firstName: string;
  lastName: string;
  hasAllergies: boolean;
  hasAsthma: boolean;
  hasDiabetes: boolean;
  hasSeizures: boolean;
  takesMedsAtSchool: boolean;
};

type DocTypeRow = {
  id: string;
  category: DocumentCategory;
  isMandatory: boolean;
  isConditional: boolean;
  conditionField: string | null;
  appliesToPositions: Prisma.JsonValue;
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

/** Match [`children/[id]/page.tsx`](frontend) conditional document visibility. */
function applicableChildTypes(
  child: ChildForCompliance,
  types: DocTypeRow[],
): DocTypeRow[] {
  return types.filter((dt) => {
    if (!dt.isMandatory || dt.category !== DocumentCategory.CHILD) return false;
    if (!dt.isConditional || !dt.conditionField) return true;
    const val = (child as unknown as Record<string, boolean>)[
      dt.conditionField
    ];
    return !!val;
  });
}

/**
 * Staff types with `appliesToPositions` null/empty apply to every position.
 * Teachers without a position set have no applicable staff types (avoids false "missing" noise).
 */
function applicableStaffTypes(
  position: string | null,
  types: DocTypeRow[],
): DocTypeRow[] {
  if (!position) return [];
  return types.filter((dt) => {
    if (!dt.isMandatory || dt.category !== DocumentCategory.STAFF) return false;
    const raw = dt.appliesToPositions;
    if (raw == null) return true;
    if (!Array.isArray(raw) || raw.length === 0) return true;
    return raw.includes(position);
  });
}

function facilityMandatoryTypes(types: DocTypeRow[]): DocTypeRow[] {
  return types.filter(
    (dt) => dt.category === DocumentCategory.FACILITY && dt.isMandatory,
  );
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

  private async loadDocTypesForSchool(schoolId: string): Promise<DocTypeRow[]> {
    const rows = await this.prisma.documentType.findMany({
      where: {
        OR: [{ schoolId: null }, { schoolId }],
      },
      select: {
        id: true,
        category: true,
        isMandatory: true,
        isConditional: true,
        conditionField: true,
        appliesToPositions: true,
      },
    });
    return rows;
  }

  async getDashboardSummary(branchId: string, user: CurrentUser) {
    const branch = await this.ensureBranchDashboardAccess(branchId, user);
    const now = new Date();

    const [children, teachers, docTypes] = await Promise.all([
      this.prisma.child.findMany({
        where: { branchId },
        include: {
          student: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.user.findMany({
        where: { role: UserRole.TEACHER, branchId },
      }),
      this.loadDocTypesForSchool(branch.schoolId),
    ]);

    const teacherIds = teachers.map((t) => t.id);
    const childDocs = await this.prisma.document.findMany({
      where: { child: { branchId } },
      select: {
        id: true,
        childId: true,
        staffId: true,
        branchId: true,
        documentTypeId: true,
        expiresAt: true,
      },
    });
    const staffDocs =
      teacherIds.length > 0
        ? await this.prisma.document.findMany({
            where: { staffId: { in: teacherIds } },
            select: {
              id: true,
              childId: true,
              staffId: true,
              branchId: true,
              documentTypeId: true,
              expiresAt: true,
            },
          })
        : [];
    const facilityDocs = await this.prisma.document.findMany({
      where: {
        branchId,
        documentType: { category: DocumentCategory.FACILITY },
      },
      select: {
        id: true,
        childId: true,
        staffId: true,
        branchId: true,
        documentTypeId: true,
        expiresAt: true,
      },
    });

    const allDocs = [...childDocs, ...staffDocs, ...facilityDocs];

    const satisfiedKeys = new Set<string>();
    let formsNearExpiryCount = 0;

    for (const d of allDocs) {
      if (isNearExpiry(d.expiresAt, now)) {
        formsNearExpiryCount += 1;
      }
      if (!isDocCurrentlyValid(d.expiresAt, now)) continue;
      if (d.childId) {
        satisfiedKeys.add(`child:${d.childId}:${d.documentTypeId}`);
      } else if (d.staffId) {
        satisfiedKeys.add(`staff:${d.staffId}:${d.documentTypeId}`);
      } else if (d.branchId) {
        satisfiedKeys.add(`facility:${d.branchId}:${d.documentTypeId}`);
      }
    }

    const childTypeRows = docTypes.filter(
      (t) => t.category === DocumentCategory.CHILD,
    );
    const staffTypeRows = docTypes.filter(
      (t) => t.category === DocumentCategory.STAFF,
    );
    const facilityTypes = facilityMandatoryTypes(docTypes);

    let requiredSlots = 0;
    let satisfiedSlots = 0;

    for (const c of children) {
      const applicable = applicableChildTypes(
        c as ChildForCompliance,
        childTypeRows,
      );
      for (const t of applicable) {
        requiredSlots += 1;
        const key = `child:${c.id}:${t.id}`;
        if (satisfiedKeys.has(key)) satisfiedSlots += 1;
      }
    }

    for (const teacher of teachers) {
      const position = teacher.staffPosition ?? null;
      const applicable = applicableStaffTypes(position, staffTypeRows);
      for (const t of applicable) {
        requiredSlots += 1;
        const key = `staff:${teacher.id}:${t.id}`;
        if (satisfiedKeys.has(key)) satisfiedSlots += 1;
      }
    }

    for (const t of facilityTypes) {
      requiredSlots += 1;
      const key = `facility:${branchId}:${t.id}`;
      if (satisfiedKeys.has(key)) satisfiedSlots += 1;
    }

    const missingSlots = requiredSlots - satisfiedSlots;

    const teachersWithPosition = teachers.filter(
      (t) => t.staffPosition != null && t.branchId === branchId,
    );
    const teachersConsidered = teachersWithPosition.length;

    let teachersWithAllRequiredForms = 0;
    for (const teacher of teachersWithPosition) {
      const position = teacher.staffPosition!;
      const applicable = applicableStaffTypes(position, staffTypeRows);
      if (applicable.length === 0) {
        teachersWithAllRequiredForms += 1;
        continue;
      }
      const allOk = applicable.every((t) =>
        satisfiedKeys.has(`staff:${teacher.id}:${t.id}`),
      );
      if (allOk) teachersWithAllRequiredForms += 1;
    }

    return {
      branchId,
      schoolId: branch.schoolId,
      studentCount: children.length,
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

    const teachers = await this.prisma.user.findMany({
      where: { role: UserRole.TEACHER, branchId },
      select: { id: true },
    });
    const teacherIds = teachers.map((t) => t.id);

    const orFilters: Prisma.DocumentWhereInput[] = [
      { child: { branchId } },
      {
        branchId,
        documentType: { category: DocumentCategory.FACILITY },
      },
    ];
    if (teacherIds.length > 0) {
      orFilters.push({ staffId: { in: teacherIds } });
    }

    const merged = await this.prisma.document.findMany({
      where: { OR: orFilters },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        documentType: { select: { id: true, name: true, category: true } },
        uploadedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return merged.map((d) => ({
      id: d.id,
      formRef: d.id.slice(0, 8),
      fileName: d.fileName,
      documentTypeName: d.documentType.name,
      category: d.documentType.category,
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
    const branch = await this.ensureBranchDashboardAccess(branchId, user);
    const now = new Date();

    const [children, teachers, docTypes] = await Promise.all([
      this.prisma.child.findMany({
        where: { branchId },
        include: {
          student: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.user.findMany({
        where: { role: UserRole.TEACHER, branchId },
      }),
      this.loadDocTypesForSchool(branch.schoolId),
    ]);

    const childTypeRows = docTypes.filter(
      (t) => t.category === DocumentCategory.CHILD,
    );
    const staffTypeRows = docTypes.filter(
      (t) => t.category === DocumentCategory.STAFF,
    );

    const teacherIds = teachers.map((t) => t.id);
    const childDocs = await this.prisma.document.findMany({
      where: { child: { branchId } },
      select: { childId: true, documentTypeId: true, expiresAt: true },
    });
    const staffDocs =
      teacherIds.length > 0
        ? await this.prisma.document.findMany({
            where: { staffId: { in: teacherIds } },
            select: { staffId: true, documentTypeId: true, expiresAt: true },
          })
        : [];

    const satisfiedChild = new Set<string>();
    const satisfiedStaff = new Set<string>();
    for (const d of childDocs) {
      if (!d.childId || !isDocCurrentlyValid(d.expiresAt, now)) continue;
      satisfiedChild.add(`${d.childId}:${d.documentTypeId}`);
    }
    for (const d of staffDocs) {
      if (!d.staffId || !isDocCurrentlyValid(d.expiresAt, now)) continue;
      satisfiedStaff.add(`${d.staffId}:${d.documentTypeId}`);
    }

    const students = children.map((c) => {
      const applicable = applicableChildTypes(
        c as ChildForCompliance,
        childTypeRows,
      );
      const requiredCount = applicable.length;
      let uploadedSatisfiedCount = 0;
      for (const t of applicable) {
        if (satisfiedChild.has(`${c.id}:${t.id}`)) uploadedSatisfiedCount += 1;
      }
      return {
        kind: 'STUDENT' as const,
        childId: c.id,
        name: `${c.firstName} ${c.lastName}`.trim(),
        guardianName: c.guardianName ?? c.student.name,
        guardianEmail: c.guardianEmail ?? c.student.email,
        requiredCount,
        uploadedSatisfiedCount,
        missingCount: requiredCount - uploadedSatisfiedCount,
      };
    });

    const teacherRows = teachers.map((teacher) => {
      const position = teacher.staffPosition ?? null;
      const applicable = applicableStaffTypes(position, staffTypeRows);
      const requiredCount = applicable.length;
      let uploadedSatisfiedCount = 0;
      for (const t of applicable) {
        if (satisfiedStaff.has(`${teacher.id}:${t.id}`))
          uploadedSatisfiedCount += 1;
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
