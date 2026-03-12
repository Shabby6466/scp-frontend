import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SupabaseService } from '../supabase/supabase.service.js';
import { CreateDocumentDto } from './dto/create-document.dto.js';
import { QueryDocumentDto } from './dto/query-document.dto.js';
import { DocumentStatus } from '@prisma/client';
import * as path from 'path';

@Injectable()
export class DocumentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  async upload(
    dto: CreateDocumentDto,
    file: Express.Multer.File,
    uploadedBy: string,
  ) {
    if (!file) throw new BadRequestException('File is required');

    const ext = path.extname(file.originalname);

    return this.prisma.$transaction(async (tx) => {
      const doc = await tx.document.create({
        data: {
          documentTypeId: dto.documentTypeId,
          schoolId: dto.schoolId,
          branchId: dto.branchId,
          metadata: (dto.metadata as any) ?? undefined,
          status: dto.expiresAt
            ? new Date(dto.expiresAt) > new Date()
              ? DocumentStatus.VALID
              : DocumentStatus.EXPIRED
            : DocumentStatus.PENDING,
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
          uploadedBy,
          filePath: '',
          version: 1,
        },
      });

      const storagePath = `${dto.schoolId}/${dto.branchId ?? '_school'}/${dto.documentTypeId}/${doc.id}/v1${ext}`;

      await this.supabase.uploadFile(storagePath, file.buffer, file.mimetype);

      const updated = await tx.document.update({
        where: { id: doc.id },
        data: { filePath: storagePath },
        include: { documentType: true },
      });

      await tx.documentVersion.create({
        data: {
          documentId: doc.id,
          version: 1,
          filePath: storagePath,
          metadata: (dto.metadata as any) ?? undefined,
          uploadedBy,
        },
      });

      return updated;
    });
  }

  async reupload(
    documentId: string,
    file: Express.Multer.File,
    uploadedBy: string,
    metadata?: Record<string, unknown>,
    expiresAt?: string,
  ) {
    if (!file) throw new BadRequestException('File is required');

    const existing = await this.prisma.document.findUnique({
      where: { id: documentId },
    });
    if (!existing) throw new NotFoundException('Document not found');

    const ext = path.extname(file.originalname);
    const newVersion = existing.version + 1;

    return this.prisma.$transaction(async (tx) => {
      const storagePath = `${existing.schoolId}/${existing.branchId ?? '_school'}/${existing.documentTypeId}/${existing.id}/v${newVersion}${ext}`;

      await this.supabase.uploadFile(storagePath, file.buffer, file.mimetype);

      const effectiveExpiry = expiresAt
        ? new Date(expiresAt)
        : existing.expiresAt;

      const updated = await tx.document.update({
        where: { id: documentId },
        data: {
          filePath: storagePath,
          version: newVersion,
          metadata: (metadata as any) ?? existing.metadata ?? undefined,
          expiresAt: effectiveExpiry,
          status: effectiveExpiry
            ? effectiveExpiry > new Date()
              ? DocumentStatus.VALID
              : DocumentStatus.EXPIRED
            : DocumentStatus.PENDING,
          uploadedBy,
        },
        include: { documentType: true },
      });

      await tx.documentVersion.create({
        data: {
          documentId,
          version: newVersion,
          filePath: storagePath,
          metadata: (metadata as any) ?? undefined,
          uploadedBy,
        },
      });

      return updated;
    });
  }

  async findAll(query: QueryDocumentDto) {
    const page = parseInt(query.page ?? '1', 10);
    const limit = Math.min(parseInt(query.limit ?? '20', 10), 100);

    const where: Record<string, unknown> = {};
    if (query.schoolId) where.schoolId = query.schoolId;
    if (query.branchId) where.branchId = query.branchId;
    if (query.documentTypeId) where.documentTypeId = query.documentTypeId;
    if (query.status) where.status = query.status;

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

  async findOne(id: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: {
        documentType: true,
        versions: { orderBy: { version: 'desc' } },
      },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async getSignedUrl(id: string) {
    const doc = await this.findOne(id);
    const url = await this.supabase.getSignedUrl(doc.filePath, 900);
    return { url, expiresIn: 900 };
  }

  async getVersionSignedUrl(documentId: string, version: number) {
    const ver = await this.prisma.documentVersion.findFirst({
      where: { documentId, version },
    });
    if (!ver) throw new NotFoundException('Version not found');
    const url = await this.supabase.getSignedUrl(ver.filePath, 900);
    return { url, version: ver.version, expiresIn: 900 };
  }

  async getStats(schoolId?: string, branchId?: string) {
    const where: Record<string, unknown> = {};
    if (schoolId) where.schoolId = schoolId;
    if (branchId) where.branchId = branchId;

    const [total, valid, expired, pending] = await Promise.all([
      this.prisma.document.count({ where }),
      this.prisma.document.count({ where: { ...where, status: DocumentStatus.VALID } }),
      this.prisma.document.count({ where: { ...where, status: DocumentStatus.EXPIRED } }),
      this.prisma.document.count({ where: { ...where, status: DocumentStatus.PENDING } }),
    ]);

    const expiringSoon = await this.prisma.document.count({
      where: {
        ...where,
        status: DocumentStatus.VALID,
        expiresAt: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          gt: new Date(),
        },
      },
    });

    return { total, valid, expired, pending, expiringSoon };
  }
}
