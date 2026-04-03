import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RenewalPeriod, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateDocumentTypeDto } from './dto/create-document-type.dto.js';
import { MailerService } from '../mailer/mailer.service.js';

type CurrentUser = {
  id: string;
  role: UserRole;
  schoolId: string | null;
  branchId: string | null;
};

@Injectable()
export class DocumentTypeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
  ) {}

  private canAssignRole(actorRole: UserRole, targetRole: UserRole): boolean {
    if (targetRole === UserRole.ADMIN || targetRole === UserRole.SCHOOL_ADMIN) {
      return false;
    }
    if (actorRole === UserRole.ADMIN) {
      return true;
    }
    if (
      actorRole === UserRole.SCHOOL_ADMIN ||
      actorRole === UserRole.DIRECTOR
    ) {
      return (
        targetRole === UserRole.BRANCH_DIRECTOR ||
        targetRole === UserRole.TEACHER ||
        targetRole === UserRole.STUDENT
      );
    }
    if (actorRole === UserRole.BRANCH_DIRECTOR) {
      return targetRole === UserRole.TEACHER || targetRole === UserRole.STUDENT;
    }
    return false;
  }

  private ensureScope(
    actor: CurrentUser,
    target: { schoolId: string | null; branchId: string | null },
  ) {
    if (actor.role === UserRole.ADMIN) return;
    if (!actor.schoolId) {
      throw new ForbiddenException('Your account is not linked to a school');
    }
    if (target.schoolId !== actor.schoolId) {
      throw new ForbiddenException('Target user is outside your school scope');
    }
    if (
      actor.role === UserRole.BRANCH_DIRECTOR &&
      actor.branchId !== target.branchId
    ) {
      throw new ForbiddenException('Target user is outside your branch scope');
    }
  }

  async create(dto: CreateDocumentTypeDto, user: CurrentUser) {
    if (!this.canAssignRole(user.role, dto.targetRole)) {
      throw new ForbiddenException('You cannot create doc types for this role');
    }

    const schoolId =
      user.role === UserRole.ADMIN
        ? (dto.schoolId ?? null)
        : (user.schoolId ?? null);

    if (
      user.role !== UserRole.ADMIN &&
      dto.schoolId &&
      dto.schoolId !== user.schoolId
    ) {
      throw new ForbiddenException(
        'Cannot create document type outside your school',
      );
    }

    return this.prisma.documentType.create({
      data: {
        name: dto.name,
        targetRole: dto.targetRole,
        renewalPeriod: dto.renewalPeriod ?? RenewalPeriod.NONE,
        schoolId,
        createdById: user.id,
      },
    });
  }

  async assignUsers(
    documentTypeId: string,
    userIds: string[],
    user: CurrentUser,
  ) {
    const docType = await this.prisma.documentType.findUnique({
      where: { id: documentTypeId },
      select: {
        id: true,
        name: true,
        targetRole: true,
        schoolId: true,
        createdById: true,
      },
    });
    if (!docType) throw new NotFoundException('Document type not found');

    if (
      user.role !== UserRole.ADMIN &&
      docType.schoolId &&
      docType.schoolId !== user.schoolId
    ) {
      throw new ForbiddenException(
        'Cannot assign document type outside your school',
      );
    }

    const targets = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        email: true,
        role: true,
        schoolId: true,
        branchId: true,
      },
    });

    if (targets.length !== userIds.length) {
      throw new BadRequestException('Some users were not found');
    }

    for (const target of targets) {
      if (!this.canAssignRole(user.role, target.role)) {
        throw new ForbiddenException(
          `Cannot assign documents to role ${target.role}`,
        );
      }
      this.ensureScope(user, target);
      if (docType.targetRole && target.role !== docType.targetRole) {
        throw new BadRequestException(
          'Target user role does not match document type target role',
        );
      }
    }

    await this.prisma.documentType.update({
      where: { id: documentTypeId },
      data: {
        requiredUsers: {
          connect: targets.map((target) => ({ id: target.id })),
        },
      },
    });

    await Promise.allSettled(
      targets.map((target) =>
        target.email
          ? this.mailer.sendDocTypeAssigned(target.email, docType.name)
          : Promise.resolve(),
      ),
    );

    return this.getAssignees(documentTypeId, user);
  }

  async unassignUser(
    documentTypeId: string,
    userId: string,
    user: CurrentUser,
  ) {
    const target = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, schoolId: true, branchId: true },
    });
    if (!target) throw new NotFoundException('User not found');
    if (!this.canAssignRole(user.role, target.role)) {
      throw new ForbiddenException(
        `Cannot unassign documents from role ${target.role}`,
      );
    }
    this.ensureScope(user, target);

    await this.prisma.documentType.update({
      where: { id: documentTypeId },
      data: {
        requiredUsers: {
          disconnect: { id: userId },
        },
      },
    });

    return this.getAssignees(documentTypeId, user);
  }

  async getAssignedForCurrentUser(user: CurrentUser) {
    const me = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: {
        id: true,
        requiredDocTypes: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        },
      },
    });
    return me.requiredDocTypes;
  }

  async getAssignees(documentTypeId: string, user: CurrentUser) {
    const docType = await this.prisma.documentType.findUnique({
      where: { id: documentTypeId },
      select: {
        id: true,
        name: true,
        targetRole: true,
        schoolId: true,
        requiredUsers: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            schoolId: true,
            branchId: true,
          },
          orderBy: [{ role: 'asc' }, { email: 'asc' }],
        },
      },
    });
    if (!docType) throw new NotFoundException('Document type not found');

    if (
      user.role !== UserRole.ADMIN &&
      docType.schoolId &&
      docType.schoolId !== user.schoolId
    ) {
      throw new ForbiddenException(
        'Cannot access assignees outside your school',
      );
    }
    if (
      user.role === UserRole.BRANCH_DIRECTOR &&
      docType.requiredUsers.some((u) => u.branchId !== user.branchId)
    ) {
      throw new ForbiddenException(
        'Cannot access assignees outside your branch',
      );
    }

    return docType;
  }

  async findAll(
    filters: {
      schoolId?: string;
      targetRole?: UserRole;
    },
    _user: CurrentUser,
  ) {
    const where: {
      schoolId?: string | null;
      targetRole?: UserRole;
      OR?: object[];
    } = {};

    if (filters.schoolId !== undefined) {
      where.OR = [{ schoolId: null }, { schoolId: filters.schoolId }];
    }
    if (filters.targetRole) {
      where.targetRole = filters.targetRole;
    }

    const rows = await this.prisma.documentType.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return rows;
  }

  async findOne(id: string) {
    return this.prisma.documentType.findUniqueOrThrow({
      where: { id },
    });
  }
}
