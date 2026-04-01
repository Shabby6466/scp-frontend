import { BadRequestException, Injectable } from '@nestjs/common';
import { DocumentCategory, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { ChildService } from '../child/child.service.js';

type CurrentUser = {
  id: string;
  role: UserRole;
  schoolId: string | null;
  branchId: string | null;
};

function applicableChildTypesForChecklist<
  T extends { isConditional: boolean; conditionField: string | null },
>(
  child: {
    hasAllergies: boolean;
    hasAsthma: boolean;
    hasDiabetes: boolean;
    hasSeizures: boolean;
    takesMedsAtSchool: boolean;
  },
  types: T[],
): T[] {
  return types.filter((dt) => {
    if (!dt.isConditional || !dt.conditionField) return true;
    const val = (child as unknown as Record<string, boolean>)[dt.conditionField];
    return !!val;
  });
}

@Injectable()
export class DocumentTypeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly childService: ChildService,
  ) {}

  async findAll(
    filters: { category?: DocumentCategory; schoolId?: string; position?: string; childId?: string },
    user: CurrentUser,
  ) {
    if (filters.childId && filters.category !== DocumentCategory.CHILD) {
      throw new BadRequestException('childId is only valid with category=CHILD');
    }

    const where: {
      category?: DocumentCategory;
      schoolId?: string | null;
      OR?: object[];
    } = {};

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.schoolId !== undefined) {
      where.OR = [{ schoolId: null }, { schoolId: filters.schoolId }];
    }

    let rows = await this.prisma.documentType.findMany({
      where,
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });

    if (filters.childId) {
      await this.childService.ensureCanAccessChild(filters.childId, user);
      const child = await this.prisma.child.findUniqueOrThrow({
        where: { id: filters.childId },
        select: {
          hasAllergies: true,
          hasAsthma: true,
          hasDiabetes: true,
          hasSeizures: true,
          takesMedsAtSchool: true,
        },
      });
      rows = applicableChildTypesForChecklist(child, rows);
    }

    const positionFilter = filters.position;
    if (positionFilter) {
      rows = rows.filter((dt) => {
        if (dt.category !== DocumentCategory.STAFF) return true;
        const raw = dt.appliesToPositions as Prisma.JsonValue;
        if (raw == null) return true;
        if (!Array.isArray(raw) || raw.length === 0) return true;
        return raw.includes(positionFilter);
      });
    }

    return rows;
  }

  async findOne(id: string) {
    return this.prisma.documentType.findUniqueOrThrow({
      where: { id },
    });
  }
}
