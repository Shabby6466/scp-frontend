import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RenewalPeriod, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateDocumentTypeDto } from './dto/create-document-type.dto.js';
import { UpdateDocumentTypeDto } from './dto/update-document-type.dto.js';
import { MailerService } from '../mailer/mailer.service.js';

type CurrentUser = {
  id: string;
  role: UserRole;
  schoolId: string | null;
  branchId: string | null;
};

const docTypeInclude = {
  school: { select: { id: true, name: true } },
  branch: { select: { id: true, name: true } },
} as const;

@Injectable()
export class DocumentTypeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
  ) {}

  private canAssignRole(actorRole: UserRole, targetRole: UserRole): boolean {
    if (targetRole === UserRole.ADMIN || targetRole === UserRole.DIRECTOR) {
      return false;
    }
    if (actorRole === UserRole.ADMIN) {
      return true;
    }
    if (actorRole === UserRole.DIRECTOR) {
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

  private assertActorCanAccessDocType(
    actor: CurrentUser,
    docType: { schoolId: string | null; branchId: string | null },
  ) {
    if (actor.role === UserRole.ADMIN) {
      return;
    }
    if (!actor.schoolId) {
      throw new ForbiddenException('Your account is not linked to a school');
    }
    if (docType.schoolId && docType.schoolId !== actor.schoolId) {
      throw new ForbiddenException('Document type is outside your school');
    }
    if (actor.role === UserRole.DIRECTOR) {
      return;
    }
    if (actor.role === UserRole.BRANCH_DIRECTOR) {
      if (!actor.branchId) {
        throw new ForbiddenException('Your account is not linked to a branch');
      }
      if (!docType.branchId) {
        return;
      }
      if (docType.branchId !== actor.branchId) {
        throw new ForbiddenException('Document type is outside your branch');
      }
      return;
    }
    if (actor.role === UserRole.TEACHER || actor.role === UserRole.STUDENT) {
      if (docType.schoolId !== actor.schoolId) {
        throw new ForbiddenException('Document type is outside your school');
      }
      if (!docType.branchId) {
        return;
      }
      if (actor.branchId && docType.branchId === actor.branchId) {
        return;
      }
      if (!actor.branchId) {
        throw new ForbiddenException('Document type is scoped to a branch');
      }
      if (docType.branchId !== actor.branchId) {
        throw new ForbiddenException('Document type is outside your branch');
      }
      return;
    }
    throw new ForbiddenException('Cannot access this document type');
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

    let schoolId: string | null = null;
    let branchId: string | null = null;

    if (user.role === UserRole.ADMIN) {
      schoolId = dto.schoolId ?? null;
      branchId = dto.branchId ?? null;
      if (branchId) {
        if (!schoolId) {
          throw new BadRequestException('schoolId is required when branchId is set');
        }
        const b = await this.prisma.branch.findUnique({
          where: { id: branchId },
        });
        if (!b || b.schoolId !== schoolId) {
          throw new BadRequestException('Branch does not belong to the selected school');
        }
      }
    } else if (user.role === UserRole.DIRECTOR) {
      schoolId = user.schoolId ?? null;
      branchId = null;
      if (!schoolId) {
        throw new ForbiddenException('Your account is not linked to a school');
      }
      if (dto.schoolId && dto.schoolId !== schoolId) {
        throw new ForbiddenException('Cannot create document type outside your school');
      }
      if (dto.branchId) {
        throw new ForbiddenException('Directors create school-wide document types only');
      }
    } else if (user.role === UserRole.BRANCH_DIRECTOR) {
      schoolId = user.schoolId!;
      branchId = user.branchId!;
      if (!schoolId || !branchId) {
        throw new ForbiddenException('Your account must be linked to a school and branch');
      }
    } else {
      throw new ForbiddenException('Cannot create document types');
    }

    return this.prisma.documentType.create({
      data: {
        name: dto.name.trim(),
        targetRole: dto.targetRole,
        renewalPeriod: dto.renewalPeriod ?? RenewalPeriod.NONE,
        schoolId,
        branchId,
        createdById: user.id,
      },
      include: docTypeInclude,
    });
  }

  async update(id: string, dto: UpdateDocumentTypeDto, user: CurrentUser) {
    const existing = await this.prisma.documentType.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Document type not found');
    }
    this.assertActorCanAccessDocType(user, existing);

    if (dto.targetRole !== undefined) {
      if (!this.canAssignRole(user.role, dto.targetRole)) {
        throw new ForbiddenException('You cannot set this target role');
      }
    }

    const data: Prisma.DocumentTypeUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.renewalPeriod !== undefined) data.renewalPeriod = dto.renewalPeriod;
    if (dto.isMandatory !== undefined) data.isMandatory = dto.isMandatory;
    if (dto.targetRole !== undefined) data.targetRole = dto.targetRole;

    if (Object.keys(data).length === 0) {
      return this.prisma.documentType.findUniqueOrThrow({
        where: { id },
        include: docTypeInclude,
      });
    }

    return this.prisma.documentType.update({
      where: { id },
      data,
      include: docTypeInclude,
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
        branchId: true,
        createdById: true,
      },
    });
    if (!docType) throw new NotFoundException('Document type not found');

    this.assertActorCanAccessDocType(user, docType);

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
      if (docType.branchId && target.branchId !== docType.branchId) {
        throw new BadRequestException(
          'This document type is limited to a specific branch; pick users from that branch.',
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
    const docType = await this.prisma.documentType.findUnique({
      where: { id: documentTypeId },
      select: { schoolId: true, branchId: true },
    });
    if (!docType) throw new NotFoundException('Document type not found');
    this.assertActorCanAccessDocType(user, docType);

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
        branchId: true,
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

    this.assertActorCanAccessDocType(user, docType);

    let requiredUsers = docType.requiredUsers;
    if (user.role === UserRole.BRANCH_DIRECTOR && user.branchId) {
      requiredUsers = requiredUsers.filter((u) => u.branchId === user.branchId);
    }

    return { ...docType, requiredUsers };
  }

  async findAll(
    filters: {
      schoolId?: string;
      branchId?: string;
      targetRole?: UserRole;
    },
    user: CurrentUser,
  ) {
    const where: Prisma.DocumentTypeWhereInput = {};

    if (filters.targetRole) {
      where.targetRole = filters.targetRole;
    }

    if (user.role === UserRole.ADMIN) {
      if (filters.schoolId) {
        where.schoolId = filters.schoolId;
      }
      if (filters.branchId) {
        where.branchId = filters.branchId;
      }
    } else if (user.role === UserRole.DIRECTOR) {
      if (!user.schoolId) {
        throw new ForbiddenException('Your account is not linked to a school');
      }
      where.schoolId = user.schoolId;
    } else if (user.role === UserRole.BRANCH_DIRECTOR) {
      if (!user.schoolId || !user.branchId) {
        throw new ForbiddenException(
          'Your account must be linked to a school and branch',
        );
      }
      where.AND = [
        { schoolId: user.schoolId },
        {
          OR: [{ branchId: null }, { branchId: user.branchId }],
        },
      ];
    } else if (
      user.role === UserRole.TEACHER ||
      user.role === UserRole.STUDENT
    ) {
      if (!user.schoolId) {
        throw new ForbiddenException('Your account is not linked to a school');
      }
      const branchOr: Prisma.DocumentTypeWhereInput[] = [{ branchId: null }];
      if (user.branchId) {
        branchOr.push({ branchId: user.branchId });
      }
      where.AND = [{ schoolId: user.schoolId }, { OR: branchOr }];
    } else {
      throw new ForbiddenException('Cannot list document types');
    }

    return this.prisma.documentType.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: docTypeInclude,
    });
  }

  async findOne(id: string, user: CurrentUser) {
    const docType = await this.prisma.documentType.findUnique({
      where: { id },
      include: docTypeInclude,
    });
    if (!docType) {
      throw new NotFoundException('Document type not found');
    }
    this.assertActorCanAccessDocType(user, docType);
    return docType;
  }
}
