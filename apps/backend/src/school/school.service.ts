import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateSchoolDto } from './dto/create-school.dto.js';
import { UpdateSchoolDto } from './dto/update-school.dto.js';
import { isSchoolDirector } from '../auth/school-scope.util.js';

@Injectable()
export class SchoolService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSchoolDto) {
    return this.prisma.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: { name: dto.name.trim() },
      });

      const directorId = dto.directorUserId?.trim();
      if (directorId) {
        const director = await tx.user.findUnique({
          where: { id: directorId },
        });

        if (!director) {
          throw new NotFoundException('Director user not found');
        }

        if (director.role === UserRole.ADMIN) {
          throw new BadRequestException('A platform admin cannot be assigned as a school director');
        }

        if (director.role !== UserRole.DIRECTOR) {
          throw new BadRequestException('Selected user must have the director role');
        }

        await tx.user.update({
          where: { id: director.id },
          data: {
            schoolId: school.id,
            branchId: null,
            staffPosition: null,
            staffClearanceActive: false,
          },
        });
      }

      return tx.school.findUniqueOrThrow({
        where: { id: school.id },
        include: {
          _count: { select: { users: true, branches: true } },
        },
      });
    });
  }

  async findAll(user: { role: UserRole; schoolId: string | null }) {
    if (user.role === UserRole.DIRECTOR && !user.schoolId) {
      return [];
    }
    if (user.role === UserRole.BRANCH_DIRECTOR && user.schoolId) {
      return this.prisma.school.findMany({
        where: { id: user.schoolId },
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { users: true, branches: true } },
        },
      });
    }
    const where =
      (isSchoolDirector(user) || (user.role === UserRole.SCHOOL_ADMIN && user.schoolId))
        ? { id: user.schoolId! }
        : {};
    return this.prisma.school.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { users: true, branches: true } },
      },
    });
  }

  async findOne(id: string, user: { role: UserRole; schoolId: string | null }) {
    if (user.role === UserRole.DIRECTOR) {
      if (!user.schoolId || user.schoolId !== id) {
        throw new ForbiddenException('Cannot access this school');
      }
    }
    if (user.role === UserRole.BRANCH_DIRECTOR) {
      if (!user.schoolId || user.schoolId !== id) {
        throw new ForbiddenException('Cannot access this school');
      }
    }
    if (user.role === UserRole.SCHOOL_ADMIN && user.schoolId !== id) {
      throw new ForbiddenException('Cannot access this school');
    }
    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          },
        },
        _count: { select: { users: true, branches: true } },
      },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    return school;
  }

  async update(id: string, dto: UpdateSchoolDto, user?: { role: UserRole; schoolId: string | null }) {
    if (user?.role === UserRole.DIRECTOR) {
      if (!user.schoolId || user.schoolId !== id) {
        throw new ForbiddenException('Cannot update this school');
      }
    }
    if (user?.role === UserRole.SCHOOL_ADMIN && user.schoolId !== id) {
      throw new ForbiddenException('Cannot update this school');
    }
    await this.findOne(id, user ?? { role: UserRole.ADMIN, schoolId: null });
    return this.prisma.school.update({
      where: { id },
      data: dto.name != null ? { name: dto.name.trim() } : {},
    });
  }

  async remove(id: string) {
    await this.findOne(id, { role: UserRole.ADMIN, schoolId: null });
    return this.prisma.school.delete({
      where: { id },
    });
  }
}
