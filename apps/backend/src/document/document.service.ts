import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DocumentCategory, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import { canManageBranchLikeDirector } from '../auth/school-scope.util.js';
import { PresignDto } from './dto/presign.dto.js';
import { CompleteDocumentDto } from './dto/complete.dto.js';

type CurrentUser = {
  id: string;
  role: UserRole;
  schoolId: string | null;
  branchId: string | null;
};

@Injectable()
export class DocumentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async presign(
    dto: PresignDto,
    user: CurrentUser,
  ): Promise<{ uploadUrl: string; s3Key: string; uploadToken?: string }> {
    const { schoolId, branchId } = await this.resolveEntityScope(dto.category, dto.entityId, user);

    await this.prisma.documentType.findUniqueOrThrow({
      where: { id: dto.documentTypeId },
    });

    const s3Key = this.storage.buildDocumentKey(
      schoolId,
      branchId,
      dto.category,
      dto.entityId,
      dto.fileName,
    );

    const { uploadUrl, uploadToken } = await this.storage.createPresignedUploadUrl(
      s3Key,
      dto.mimeType,
    );

    return uploadToken !== undefined
      ? { uploadUrl, s3Key, uploadToken }
      : { uploadUrl, s3Key };
  }

  async complete(dto: CompleteDocumentDto, user: CurrentUser) {
    const { schoolId, branchId } = await this.resolveEntityScope(
      dto.category,
      dto.entityId,
      user,
    );

    const docType = await this.prisma.documentType.findUniqueOrThrow({
      where: { id: dto.documentTypeId },
    });

    let issuedAt: Date | null = null;
    if (dto.issuedAt?.trim()) {
      issuedAt = new Date(dto.issuedAt.trim());
    }

    let expiresAt: Date | null = null;
    if (dto.expiresAt) {
      expiresAt = new Date(dto.expiresAt);
    } else if (docType.renewalPeriod === 'ANNUAL') {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      expiresAt = d;
    } else if (docType.renewalPeriod === 'BIENNIAL') {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 2);
      expiresAt = d;
    }

    const data: {
      documentTypeId: string;
      uploadedById: string;
      s3Key: string;
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      issuedAt?: Date | null;
      expiresAt?: Date | null;
      childId?: string | null;
      staffId?: string | null;
      branchId?: string | null;
    } = {
      documentTypeId: dto.documentTypeId,
      uploadedById: user.id,
      s3Key: dto.s3Key,
      fileName: dto.fileName,
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes,
      issuedAt: issuedAt ?? undefined,
      expiresAt: expiresAt ?? undefined,
    };

    if (dto.category === DocumentCategory.CHILD) {
      data.childId = dto.entityId;
    } else if (dto.category === DocumentCategory.STAFF) {
      data.staffId = dto.entityId;
    } else {
      data.branchId = dto.entityId;
    }

    return this.prisma.document.create({
      data,
      include: {
        documentType: { select: { id: true, name: true, category: true } },
      },
    });
  }

  async listByChild(childId: string, user: CurrentUser) {
    await this.ensureCanAccessChild(childId, user);
    return this.prisma.document.findMany({
      where: { childId },
      include: {
        documentType: { select: { id: true, name: true, category: true, isMandatory: true, renewalPeriod: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listByStaff(staffId: string, user: CurrentUser) {
    await this.ensureCanAccessStaff(staffId, user);
    return this.prisma.document.findMany({
      where: { staffId },
      include: {
        documentType: { select: { id: true, name: true, category: true, isMandatory: true, renewalPeriod: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listByBranchFacility(branchId: string, user: CurrentUser) {
    await this.ensureCanAccessBranch(branchId, user);
    return this.prisma.document.findMany({
      where: { branchId },
      include: {
        documentType: { select: { id: true, name: true, category: true, isMandatory: true, renewalPeriod: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async verify(documentId: string, user: CurrentUser) {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        child: true,
        staff: { include: { branch: true } },
        branch: true,
        documentType: true,
      },
    });

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    if (doc.childId) {
      await this.ensureCanManageBranch(doc.child!.branchId, user);
    } else if (doc.staffId) {
      await this.ensureCanManageStaff(doc.staffId, user);
    } else if (doc.branchId) {
      await this.ensureCanManageBranch(doc.branchId, user);
    }

    const updated = await this.prisma.document.update({
      where: { id: documentId },
      data: { verifiedAt: new Date() },
      include: {
        documentType: { select: { id: true, name: true, category: true } },
      },
    });

    if (doc.staffId && doc.documentType.category === DocumentCategory.STAFF) {
      await this.syncTeacherClearanceFromVerifiedDocs(doc.staffId);
    }

    return updated;
  }

  /**
   * When CBC, SCR, and PETS (seeded staff types) are all verified for the teacher’s position,
   * set staffClearanceActive. Aligns dashboard “active” with clearance gate from the plan backlog.
   */
  private async syncTeacherClearanceFromVerifiedDocs(staffId: string) {
    const staff = await this.prisma.user.findUnique({
      where: { id: staffId },
      include: { branch: true },
    });
    if (!staff?.branchId || staff.role !== UserRole.TEACHER) return;

    const position = staff.staffPosition;
    if (!position) {
      await this.prisma.user.update({
        where: { id: staffId },
        data: { staffClearanceActive: false },
      });
      return;
    }

    const schoolId = staff.branch?.schoolId;
    if (!schoolId) return;

    const types = await this.prisma.documentType.findMany({
      where: {
        category: DocumentCategory.STAFF,
        OR: [{ schoolId: null }, { schoolId }],
      },
      select: {
        id: true,
        name: true,
        isMandatory: true,
        appliesToPositions: true,
      },
    });

    const applicable = types.filter((dt) => {
      if (!dt.isMandatory) return false;
      const raw = dt.appliesToPositions as Prisma.JsonValue;
      if (raw == null) return true;
      if (!Array.isArray(raw) || raw.length === 0) return true;
      return raw.includes(position);
    });

    const isClearanceType = (name: string) =>
      (name.includes('CBC') && name.includes('Background')) ||
      (name.includes('SCR') && name.includes('clearance')) ||
      (name.includes('PETS') && name.includes('eligible'));

    const clearanceIds = applicable
      .filter((dt) => isClearanceType(dt.name))
      .map((dt) => dt.id);
    if (clearanceIds.length === 0) return;

    const verifiedDocs = await this.prisma.document.findMany({
      where: {
        staffId,
        verifiedAt: { not: null },
        documentTypeId: { in: clearanceIds },
      },
      select: { documentTypeId: true },
    });
    const verifiedSet = new Set(verifiedDocs.map((d) => d.documentTypeId));
    const allClearancesVerified = clearanceIds.every((id) => verifiedSet.has(id));

    await this.prisma.user.update({
      where: { id: staffId },
      data: { staffClearanceActive: allClearancesVerified },
    });
  }

  async getDownloadUrl(documentId: string, user: CurrentUser): Promise<string> {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { child: true, staff: true, branch: true },
    });

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    if (doc.childId) {
      await this.ensureCanAccessChild(doc.childId, user);
    } else if (doc.staffId) {
      await this.ensureCanAccessStaff(doc.staffId, user);
    } else if (doc.branchId) {
      await this.ensureCanAccessBranch(doc.branchId, user);
    }

    return this.storage.createPresignedDownloadUrl(doc.s3Key);
  }

  private async resolveEntityScope(
    category: DocumentCategory,
    entityId: string,
    user: CurrentUser,
  ): Promise<{ schoolId: string; branchId: string }> {
    if (category === DocumentCategory.CHILD) {
      await this.ensureCanAccessChild(entityId, user);
      const child = await this.prisma.child.findUniqueOrThrow({
        where: { id: entityId },
        include: { branch: true },
      });
      return { schoolId: child.branch.schoolId, branchId: child.branchId };
    }
    if (category === DocumentCategory.STAFF) {
      await this.ensureCanAccessStaff(entityId, user);
      const staff = await this.prisma.user.findUniqueOrThrow({
        where: { id: entityId },
        include: { branch: true },
      });
      const branchId = staff.branchId;
      if (!branchId) throw new ForbiddenException('Staff must have a branch');
      const branch = staff.branch ?? await this.prisma.branch.findUniqueOrThrow({ where: { id: branchId } });
      return { schoolId: branch.schoolId, branchId: branch.id };
    }
    // FACILITY
    await this.ensureCanAccessBranch(entityId, user);
    const branch = await this.prisma.branch.findUniqueOrThrow({
      where: { id: entityId },
    });
    return { schoolId: branch.schoolId, branchId: branch.id };
  }

  private async ensureCanAccessChild(childId: string, user: CurrentUser) {
    if (user.role === UserRole.ADMIN) return;

    const child = await this.prisma.child.findUniqueOrThrow({
      where: { id: childId },
      include: { branch: true },
    });

    if (user.role === UserRole.STUDENT) {
      if (child.studentUserId !== user.id) {
        throw new ForbiddenException('Cannot access this child');
      }
      return;
    }

    if (user.role === UserRole.TEACHER) {
      if (user.branchId !== child.branchId) {
        throw new ForbiddenException('Cannot access this child');
      }
      return;
    }

    if (canManageBranchLikeDirector(user, child.branch)) return;

    throw new ForbiddenException('Cannot access this child');
  }

  private async ensureCanAccessStaff(staffId: string, user: CurrentUser) {
    if (user.role === UserRole.ADMIN) return;
    if (user.id === staffId) return; // own staff file

    const staff = await this.prisma.user.findUniqueOrThrow({
      where: { id: staffId },
      include: { branch: true },
    });

    const branchId = staff.branchId;
    if (!branchId) throw new ForbiddenException('Staff has no branch');

    const branch = staff.branch ?? (await this.prisma.branch.findUnique({ where: { id: branchId } }));
    if (!branch) throw new ForbiddenException('Staff branch not found');

    if (canManageBranchLikeDirector(user, branch)) return;

    throw new ForbiddenException('Cannot access this staff');
  }

  private async ensureCanManageBranch(branchId: string, user: CurrentUser) {
    if (user.role === UserRole.ADMIN) return;

    const branch = await this.prisma.branch.findUniqueOrThrow({
      where: { id: branchId },
    });

    if (canManageBranchLikeDirector(user, branch)) return;

    throw new ForbiddenException('Cannot manage this branch');
  }

  private async ensureCanManageStaff(staffId: string, user: CurrentUser) {
    if (user.role === UserRole.ADMIN) return;

    const staff = await this.prisma.user.findUniqueOrThrow({
      where: { id: staffId },
      include: { branch: true },
    });

    const branchId = staff.branchId;
    if (!branchId) throw new ForbiddenException('Staff has no branch');

    const branch = staff.branch ?? (await this.prisma.branch.findUniqueOrThrow({ where: { id: branchId } }));

    if (canManageBranchLikeDirector(user, branch)) return;

    throw new ForbiddenException('Cannot manage this staff');
  }

  private async ensureCanAccessBranch(branchId: string, user: CurrentUser) {
    if (user.role === UserRole.ADMIN) return;

    const branch = await this.prisma.branch.findUniqueOrThrow({
      where: { id: branchId },
    });

    if (user.role === UserRole.TEACHER && user.branchId === branchId) return;

    if (user.role === UserRole.STUDENT) {
      const enrolled = await this.prisma.child.findFirst({
        where: { branchId, studentUserId: user.id },
      });
      if (enrolled) return;
    }

    if (canManageBranchLikeDirector(user, branch)) return;

    throw new ForbiddenException('Cannot access this branch');
  }
}
