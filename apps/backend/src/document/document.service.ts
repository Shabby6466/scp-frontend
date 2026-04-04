import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import { canManageBranchLikeDirector } from '../auth/school-scope.util.js';
import { PresignDto } from './dto/presign.dto.js';
import { CompleteDocumentDto } from './dto/complete.dto.js';
import PDFDocument from 'pdfkit';
import { MailerService } from '../mailer/mailer.service.js';
import { SearchDocumentDto } from './dto/search-document.dto.js';

type CurrentUser = {
  id: string;
  role: UserRole;
  schoolId: string | null;
  branchId: string | null;
};

type EntityScope = { schoolId: string; branchId: string };

@Injectable()
export class DocumentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly mailer: MailerService,
  ) {}

  async presign(
    dto: PresignDto,
    user: CurrentUser,
  ): Promise<{ uploadUrl: string; s3Key: string; uploadToken?: string }> {
    const { schoolId, branchId } = await this.resolveOwnerScope(
      dto.ownerUserId,
      user,
    );

    await this.prisma.documentType.findUniqueOrThrow({
      where: { id: dto.documentTypeId },
    });

    const s3Key = this.storage.buildDocumentKey(
      schoolId,
      branchId,
      'user-doc',
      dto.ownerUserId,
      dto.fileName,
    );

    try {
      const { uploadUrl, uploadToken } =
        await this.storage.createPresignedUploadUrl(s3Key, dto.mimeType);

      return uploadToken !== undefined
        ? { uploadUrl, s3Key, uploadToken }
        : { uploadUrl, s3Key };
    } catch (err: any) {
      console.error('[DocumentService.presign] Storage failure:', err);
      throw new InternalServerErrorException(
        `Failed to generate upload URL: ${err.message}`,
      );
    }
  }

  async complete(dto: CompleteDocumentDto, user: CurrentUser) {
    await this.resolveOwnerScope(dto.ownerUserId, user);

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

    const created = await this.prisma.document.create({
      data: {
        documentType: { connect: { id: dto.documentTypeId } },
        uploadedBy: { connect: { id: user.id } },
        ownerUser: { connect: { id: dto.ownerUserId } },
        s3Key: dto.s3Key,
        fileName: dto.fileName,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        issuedAt: issuedAt ?? undefined,
        expiresAt: expiresAt ?? undefined,
      },
      include: {
        documentType: {
          select: { id: true, name: true, targetRole: true },
        },
      },
    });

    const owner = await this.prisma.user.findUnique({
      where: { id: dto.ownerUserId },
      select: { email: true },
    });
    if (owner?.email) {
      await this.mailer.sendDocumentUploadedNotice(
        owner.email,
        created.documentType.name,
      );
    }

    return created;
  }

  async listByOwner(ownerUserId: string, user: CurrentUser) {
    await this.ensureCanAccessDocumentOwner(ownerUserId, user);
    return this.prisma.document.findMany({
      where: { ownerUserId },
      include: {
        documentType: {
          select: {
            id: true,
            name: true,
            targetRole: true,
            isMandatory: true,
            renewalPeriod: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async searchDocuments(dto: SearchDocumentDto, user: CurrentUser) {
    const where: any = { AND: [] };
    const and = where.AND;

    // 1. Scoping
    if (user.role !== UserRole.ADMIN) {
      if (canManageBranchLikeDirector(user, { schoolId: user.schoolId || '', id: user.branchId || '' } as any)) {
        if (user.branchId) {
          and.push({ ownerUser: { branchId: user.branchId } });
        } else if (user.schoolId) {
          and.push({ ownerUser: { schoolId: user.schoolId } });
        }
      } else {
        // Fallback: only own documents if not a director
        and.push({ ownerUserId: user.id });
      }
    }

    // 2. Filters
    if (dto.query?.trim()) {
      const q = dto.query.trim();
      and.push({
        OR: [
          { fileName: { contains: q, mode: 'insensitive' } },
          { ownerUser: { name: { contains: q, mode: 'insensitive' } } },
          { ownerUser: { email: { contains: q, mode: 'insensitive' } } },
        ],
      });
    }

    if (dto.schoolId && user.role === UserRole.ADMIN) {
      and.push({ ownerUser: { schoolId: dto.schoolId } });
    }

    if (dto.branchId) {
      and.push({ ownerUser: { branchId: dto.branchId } });
    }

    if (dto.documentTypeId) {
      and.push({ documentTypeId: dto.documentTypeId });
    }

    if (dto.verified !== undefined) {
      if (dto.verified) {
        and.push({ verifiedAt: { not: null } });
      } else {
        and.push({ verifiedAt: null });
      }
    }

    if (dto.ownerRole) {
      and.push({ ownerUser: { role: dto.ownerRole } });
    }

    return this.prisma.document.findMany({
      where,
      include: {
        documentType: true,
        ownerUser: {
          select: { id: true, name: true, email: true, role: true, branchId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAssignedSummary(user: CurrentUser) {
    const me = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: {
        requiredDocTypes: {
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });

    const docs = await this.prisma.document.findMany({
      where: { ownerUserId: user.id },
      include: {
        documentType: {
          select: {
            id: true,
            name: true,
            renewalPeriod: true,
            isMandatory: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const latestByType = new Map<string, (typeof docs)[number]>();
    for (const doc of docs) {
      if (!latestByType.has(doc.documentTypeId)) {
        latestByType.set(doc.documentTypeId, doc);
      }
    }

    const items = me.requiredDocTypes.map((docType) => {
      const latest = latestByType.get(docType.id) ?? null;
      return {
        documentType: docType,
        latestDocument: latest,
        remainingDays: latest?.expiresAt
          ? Math.max(
              0,
              Math.ceil(
                (latest.expiresAt.getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24),
              ),
            )
          : null,
      };
    });

    const assignedCount = items.length;
    const uploadedCount = items.filter(
      (item) => item.latestDocument != null,
    ).length;
    return {
      assignedCount,
      uploadedCount,
      remainingCount: assignedCount - uploadedCount,
      items,
    };
  }

  async getPerFormDetail(
    ownerUserId: string,
    documentTypeId: string,
    user: CurrentUser,
  ) {
    await this.ensureCanAccessDocumentOwner(ownerUserId, user);

    const owner = await this.prisma.user.findUniqueOrThrow({
      where: { id: ownerUserId },
      select: {
        id: true,
        name: true,
        email: true,
        requiredDocTypes: {
          where: { id: documentTypeId },
          select: {
            id: true,
            name: true,
            renewalPeriod: true,
            targetRole: true,
          },
        },
      },
    });
    const assignedDocType = owner.requiredDocTypes[0] ?? null;

    const documents = await this.prisma.document.findMany({
      where: { ownerUserId, documentTypeId },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });
    const latestDocument = documents[0] ?? null;

    const remainingDays = latestDocument?.expiresAt
      ? Math.ceil(
          (latestDocument.expiresAt.getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        )
      : null;

    return {
      owner: { id: owner.id, name: owner.name, email: owner.email },
      documentType: assignedDocType,
      latestDocument,
      uploadedDate: latestDocument?.createdAt ?? null,
      dueDate: latestDocument?.expiresAt ?? null,
      remainingDays,
    };
  }

  async verify(documentId: string, user: CurrentUser) {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        ownerUser: { include: { branch: true } },
        documentType: true,
      },
    });

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    const branchId = doc.ownerUser.branchId;
    if (branchId) {
      await this.ensureCanManageBranch(branchId, user);
    } else if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Cannot verify this document');
    }

    const updated = await this.prisma.document.update({
      where: { id: documentId },
      data: { verifiedAt: new Date() },
      include: {
        documentType: {
          select: { id: true, name: true, targetRole: true },
        },
      },
    });

    if (
      doc.ownerUser.role === UserRole.TEACHER &&
      doc.documentType.targetRole === UserRole.TEACHER
    ) {
      await this.syncTeacherClearanceFromVerifiedDocs(doc.ownerUserId);
    }

    return updated;
  }

  private async syncTeacherClearanceFromVerifiedDocs(ownerUserId: string) {
    const staff = await this.prisma.user.findUnique({
      where: { id: ownerUserId },
      include: { branch: true },
    });
    if (!staff?.branchId || staff.role !== UserRole.TEACHER) return;

    const position = staff.staffPosition;
    if (!position) {
      await this.prisma.user.update({
        where: { id: ownerUserId },
        data: { staffClearanceActive: false },
      });
      return;
    }

    const schoolId = staff.branch?.schoolId;
    if (!schoolId) return;

    const types = await this.prisma.documentType.findMany({
      where: {
        targetRole: UserRole.TEACHER,
        OR: [{ schoolId: null }, { schoolId }],
      },
      select: {
        id: true,
        name: true,
        isMandatory: true,
      },
    });

    const isClearanceType = (name: string) =>
      (name.includes('CBC') && name.includes('Background')) ||
      (name.includes('SCR') && name.includes('clearance')) ||
      (name.includes('PETS') && name.includes('eligible'));

    const clearanceIds = types
      .filter((dt) => dt.isMandatory && isClearanceType(dt.name))
      .map((dt) => dt.id);
    if (clearanceIds.length === 0) return;

    const verifiedDocs = await this.prisma.document.findMany({
      where: {
        ownerUserId,
        verifiedAt: { not: null },
        documentTypeId: { in: clearanceIds },
      },
      select: { documentTypeId: true },
    });
    const verifiedSet = new Set(verifiedDocs.map((d) => d.documentTypeId));
    const allClearancesVerified = clearanceIds.every((id) =>
      verifiedSet.has(id),
    );

    await this.prisma.user.update({
      where: { id: ownerUserId },
      data: { staffClearanceActive: allClearancesVerified },
    });
  }

  async getDownloadUrl(documentId: string, user: CurrentUser): Promise<string> {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      select: { s3Key: true, ownerUserId: true },
    });

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    await this.ensureCanAccessDocumentOwner(doc.ownerUserId, user);

    return this.storage.createPresignedDownloadUrl(doc.s3Key);
  }

  async exportPerFormPdf(
    ownerUserId: string,
    documentTypeId: string,
    user: CurrentUser,
  ) {
    const detail = await this.getPerFormDetail(
      ownerUserId,
      documentTypeId,
      user,
    );
    const uploadedAtLabel = detail.uploadedDate
      ? new Date(detail.uploadedDate).toISOString().slice(0, 10)
      : 'Not uploaded';
    const dueDateLabel = detail.dueDate
      ? new Date(detail.dueDate).toISOString().slice(0, 10)
      : 'N/A';
    const remainingLabel =
      detail.remainingDays == null ? 'N/A' : `${detail.remainingDays} day(s)`;

    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 48 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).text('Document Summary');
      doc.moveDown();
      doc
        .fontSize(12)
        .text(`Document type: ${detail.documentType?.name ?? 'Unknown'}`);
      doc.text(`Owner: ${detail.owner.name ?? detail.owner.email}`);
      doc.text(`Uploaded date: ${uploadedAtLabel}`);
      doc.text(`Due date: ${dueDateLabel}`);
      doc.text(`Remaining time: ${remainingLabel}`);
      doc.end();
    });
    const fileName = `document-${ownerUserId}-${documentTypeId}.pdf`;
    return { buffer, fileName };
  }

  private async resolveOwnerScope(
    ownerUserId: string,
    user: CurrentUser,
  ): Promise<EntityScope> {
    await this.ensureCanAccessDocumentOwner(ownerUserId, user);
    const owner = await this.prisma.user.findUniqueOrThrow({
      where: { id: ownerUserId },
      include: { branch: true },
    });
    const branchId = owner.branchId;
    if (!branchId)
      throw new ForbiddenException('Owner must belong to a branch');
    const branch =
      owner.branch ??
      (await this.prisma.branch.findUniqueOrThrow({ where: { id: branchId } }));
    return { schoolId: branch.schoolId, branchId: branch.id };
  }

  private async ensureCanAccessDocumentOwner(
    ownerUserId: string,
    user: CurrentUser,
  ) {
    if (user.role === UserRole.ADMIN) return;
    if (user.id === ownerUserId) return;

    const owner = await this.prisma.user.findUniqueOrThrow({
      where: { id: ownerUserId },
      include: { branch: true },
    });

    const branchId = owner.branchId;
    if (!branchId) throw new ForbiddenException('User has no branch');

    const branch =
      owner.branch ??
      (await this.prisma.branch.findUnique({ where: { id: branchId } }));
    if (!branch) throw new ForbiddenException('Branch not found');

    if (canManageBranchLikeDirector(user, branch)) return;

    throw new ForbiddenException('Cannot access this document');
  }

  private async ensureCanManageBranch(branchId: string, user: CurrentUser) {
    if (user.role === UserRole.ADMIN) return;

    const branch = await this.prisma.branch.findUniqueOrThrow({
      where: { id: branchId },
    });

    if (canManageBranchLikeDirector(user, branch)) return;

    throw new ForbiddenException('Cannot manage this branch');
  }
}
