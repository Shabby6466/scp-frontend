import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SupabaseService } from '../supabase/supabase.service.js';
import { DocumentStatus } from '@prisma/client';
import archiver from 'archiver';
import type { Writable } from 'stream';
import * as path from 'path';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  async streamAuditZip(
    output: Writable,
    schoolId: string,
    branchId?: string,
  ) {
    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.pipe(output);

    const mandatoryTypes = await this.prisma.documentType.findMany({
      where: { isMandatory: true },
    });

    const where = {
      schoolId,
      ...(branchId ? { branchId } : {}),
      status: DocumentStatus.VALID,
      documentTypeId: { in: mandatoryTypes.map((t) => t.id) },
    };

    const documents = await this.prisma.document.findMany({
      where,
      include: { documentType: true },
    });

    const manifest: Record<string, unknown>[] = [];

    for (const doc of documents) {
      try {
        const signedUrl = await this.supabase.getSignedUrl(doc.filePath, 300);
        const response = await fetch(signedUrl);
        if (!response.ok) {
          this.logger.warn(`Failed to fetch ${doc.filePath}: ${response.status}`);
          continue;
        }

        const ext = path.extname(doc.filePath) || '.pdf';
        const fileName = `${doc.documentType.name}/v${doc.version}${ext}`.replace(/[^a-zA-Z0-9/._-]/g, '_');

        const buffer = Buffer.from(await response.arrayBuffer());
        archive.append(buffer, { name: fileName });

        manifest.push({
          documentType: doc.documentType.name,
          version: doc.version,
          status: doc.status,
          expiresAt: doc.expiresAt?.toISOString() ?? null,
          uploadedBy: doc.uploadedBy,
          filePath: fileName,
        });
      } catch (error) {
        this.logger.error(`Error processing ${doc.id}: ${error}`);
      }
    }

    archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });

    await archive.finalize();
    return { documentCount: documents.length };
  }
}
