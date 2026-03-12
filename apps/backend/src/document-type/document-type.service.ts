import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateDocumentTypeDto } from './dto/create-document-type.dto.js';
import { UpdateDocumentTypeDto } from './dto/update-document-type.dto.js';

@Injectable()
export class DocumentTypeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDocumentTypeDto) {
    return this.prisma.documentType.create({
      data: {
        name: dto.name,
        schema: dto.schema,
        isMandatory: dto.isMandatory ?? false,
      },
    });
  }

  async findAll() {
    return this.prisma.documentType.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { documents: true } } },
    });
  }

  async findOne(id: string) {
    const docType = await this.prisma.documentType.findUnique({
      where: { id },
      include: { _count: { select: { documents: true } } },
    });
    if (!docType) throw new NotFoundException('DocumentType not found');
    return docType;
  }

  async update(id: string, dto: UpdateDocumentTypeDto) {
    await this.findOne(id);
    return this.prisma.documentType.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.documentType.delete({ where: { id } });
  }
}
