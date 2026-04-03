import { PrismaClient, RenewalPeriod, UserRole } from '@prisma/client';

type SeedDocTypeParams = {
  prisma: PrismaClient;
  createdById: string;
  schoolId: string;
};

export async function seedDocumentTypes({
  prisma,
  createdById,
  schoolId,
}: SeedDocTypeParams) {
  const byRole: Array<{
    targetRole: UserRole;
    docs: Array<{ name: string; isMandatory?: boolean; renewalPeriod?: RenewalPeriod }>;
  }> = [
    {
      targetRole: UserRole.BRANCH_DIRECTOR,
      docs: [
        { name: 'Branch Safety Compliance Pack', isMandatory: true, renewalPeriod: RenewalPeriod.ANNUAL },
        { name: 'Branch Operations Approval Letter', isMandatory: true, renewalPeriod: RenewalPeriod.NONE },
      ],
    },
    {
      targetRole: UserRole.TEACHER,
      docs: [
        { name: 'Government-issued ID', isMandatory: true },
        { name: 'Background Check Clearance', isMandatory: true, renewalPeriod: RenewalPeriod.BIENNIAL },
        { name: 'CPR and First Aid Certificate', isMandatory: true, renewalPeriod: RenewalPeriod.BIENNIAL },
        { name: 'Teacher Contract Acknowledgment', isMandatory: false, renewalPeriod: RenewalPeriod.NONE },
      ],
    },
    {
      targetRole: UserRole.STUDENT,
      docs: [
        { name: 'Student Identity Proof', isMandatory: true },
        { name: 'Student Registration Form', isMandatory: true },
        { name: 'Parent Consent Form', isMandatory: false },
      ],
    },
  ];

  let sortOrder = 0;
  let seeded = 0;
  for (const roleSet of byRole) {
    for (const doc of roleSet.docs) {
      await prisma.documentType.create({
        data: {
          name: doc.name,
          targetRole: roleSet.targetRole,
          isMandatory: doc.isMandatory ?? true,
          renewalPeriod: doc.renewalPeriod ?? RenewalPeriod.NONE,
          sortOrder: sortOrder++,
          schoolId,
          createdById,
        },
      });
      seeded++;
    }
  }

  console.log(`Seeded ${seeded} document types for school ${schoolId}`);
}
