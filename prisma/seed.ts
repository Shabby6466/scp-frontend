import { PrismaClient, UserRole, StaffPosition } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { seedDocumentTypes } from './seed-document-types';

const prisma = new PrismaClient();

/** Shared password for every seeded user (dev / demo only). */
const SEED_PASSWORD = 'Admin@123456';

const ADMIN_EMAIL = 'admin@schoolcompliance.com';

const mockS3Key = (slug: string) => `seed/mock/${slug}.pdf`;

/** Local date arithmetic (matches typical dev Postgres `CURRENT_DATE` with same TZ). */
function daysAgo(days: number, hour = 14, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function daysFromToday(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(12, 0, 0, 0);
  return d;
}

async function wipeDatabase() {
  await prisma.document.deleteMany();
  await prisma.directorProfile.deleteMany();
  await prisma.branchDirectorProfile.deleteMany();
  await prisma.teacherProfile.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.authOtp.deleteMany();
  await prisma.documentType.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.school.deleteMany();
  await prisma.appConfig.deleteMany();
}

async function main() {
  console.log('Clearing existing data…');
  await wipeDatabase();

  await prisma.appConfig.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      otpEmailVerificationEnabled: true,
      selfRegistrationEnabled: true,
    },
    update: {},
  });

  const hashedPassword = await bcrypt.hash(SEED_PASSWORD, 12);

  const schoolA = await prisma.school.create({
    data: { name: 'Maple Street Early Learning' },
  });
  const schoolB = await prisma.school.create({
    data: { name: 'Riverside Day School' },
  });

  const branchA1 = await prisma.branch.create({
    data: { name: 'Main Campus', schoolId: schoolA.id },
  });
  const branchA2 = await prisma.branch.create({
    data: { name: 'West Annex', schoolId: schoolA.id },
  });
  const branchB1 = await prisma.branch.create({
    data: { name: 'Downtown Center', schoolId: schoolB.id },
  });
  const branchB2 = await prisma.branch.create({
    data: { name: 'Harbor View', schoolId: schoolB.id },
  });

  const admin = await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      password: hashedPassword,
      name: 'Platform Admin',
      role: UserRole.ADMIN,
      authorities: [
        UserRole.DIRECTOR,
        UserRole.SCHOOL_ADMIN,
        UserRole.BRANCH_DIRECTOR,
        UserRole.TEACHER,
        UserRole.STUDENT,
      ],
      emailVerifiedAt: new Date(),
    },
  });

  const directorA = await prisma.user.create({
    data: {
      email: 'director.maple@demo.local',
      password: hashedPassword,
      name: 'Morgan Chen',
      role: UserRole.DIRECTOR,
      schoolId: schoolA.id,
      assignedById: admin.id,
      authorities: [UserRole.BRANCH_DIRECTOR, UserRole.TEACHER, UserRole.STUDENT],
      emailVerifiedAt: new Date(),
    },
  });

  const directorB = await prisma.user.create({
    data: {
      email: 'director.riverside@demo.local',
      password: hashedPassword,
      name: 'Jordan Ellis',
      role: UserRole.DIRECTOR,
      schoolId: schoolB.id,
      assignedById: admin.id,
      authorities: [UserRole.BRANCH_DIRECTOR, UserRole.TEACHER, UserRole.STUDENT],
      emailVerifiedAt: new Date(),
    },
  });

  const schoolAdminA = await prisma.user.create({
    data: {
      email: 'schooladmin.maple@demo.local',
      password: hashedPassword,
      name: 'Sam Rivera',
      role: UserRole.SCHOOL_ADMIN,
      schoolId: schoolA.id,
      assignedById: admin.id,
      authorities: [UserRole.BRANCH_DIRECTOR, UserRole.TEACHER, UserRole.STUDENT],
      emailVerifiedAt: new Date(),
    },
  });

  const schoolAdminB = await prisma.user.create({
    data: {
      email: 'schooladmin.riverside@demo.local',
      password: hashedPassword,
      name: 'Taylor Brooks',
      role: UserRole.SCHOOL_ADMIN,
      schoolId: schoolB.id,
      assignedById: admin.id,
      authorities: [UserRole.BRANCH_DIRECTOR, UserRole.TEACHER, UserRole.STUDENT],
      emailVerifiedAt: new Date(),
    },
  });

  const bdA1 = await prisma.user.create({
    data: {
      email: 'bd.main@demo.local',
      password: hashedPassword,
      name: 'Riley Park',
      role: UserRole.BRANCH_DIRECTOR,
      schoolId: schoolA.id,
      branchId: branchA1.id,
      assignedById: directorA.id,
      authorities: [UserRole.TEACHER, UserRole.STUDENT],
      emailVerifiedAt: new Date(),
    },
  });

  const bdA2 = await prisma.user.create({
    data: {
      email: 'bd.west@demo.local',
      password: hashedPassword,
      name: 'Casey Nguyen',
      role: UserRole.BRANCH_DIRECTOR,
      schoolId: schoolA.id,
      branchId: branchA2.id,
      assignedById: directorA.id,
      authorities: [UserRole.TEACHER, UserRole.STUDENT],
      emailVerifiedAt: new Date(),
    },
  });

  const bdB1 = await prisma.user.create({
    data: {
      email: 'bd.downtown@demo.local',
      password: hashedPassword,
      name: 'Alex Morgan',
      role: UserRole.BRANCH_DIRECTOR,
      schoolId: schoolB.id,
      branchId: branchB1.id,
      assignedById: directorB.id,
      authorities: [UserRole.TEACHER, UserRole.STUDENT],
      emailVerifiedAt: new Date(),
    },
  });

  const bdB2 = await prisma.user.create({
    data: {
      email: 'bd.harbor@demo.local',
      password: hashedPassword,
      name: 'Jamie Lee',
      role: UserRole.BRANCH_DIRECTOR,
      schoolId: schoolB.id,
      branchId: branchB2.id,
      assignedById: directorB.id,
      authorities: [UserRole.TEACHER, UserRole.STUDENT],
      emailVerifiedAt: new Date(),
    },
  });

  const teacherA1a = await prisma.user.create({
    data: {
      email: 'teacher.lead.main@demo.local',
      password: hashedPassword,
      name: 'Priya Sharma',
      role: UserRole.TEACHER,
      schoolId: schoolA.id,
      branchId: branchA1.id,
      assignedById: bdA1.id,
      staffPosition: StaffPosition.LEAD_TEACHER,
      staffClearanceActive: true,
      emailVerifiedAt: new Date(),
    },
  });

  const teacherA1b = await prisma.user.create({
    data: {
      email: 'teacher.asst.main@demo.local',
      password: hashedPassword,
      name: 'Chris Ortiz',
      role: UserRole.TEACHER,
      schoolId: schoolA.id,
      branchId: branchA1.id,
      assignedById: bdA1.id,
      staffPosition: StaffPosition.ASSISTANT_TEACHER,
      staffClearanceActive: false,
      emailVerifiedAt: new Date(),
    },
  });

  const teacherA2 = await prisma.user.create({
    data: {
      email: 'teacher.west@demo.local',
      password: hashedPassword,
      name: 'Dana Kim',
      role: UserRole.TEACHER,
      schoolId: schoolA.id,
      branchId: branchA2.id,
      assignedById: bdA2.id,
      staffPosition: StaffPosition.LEAD_TEACHER,
      staffClearanceActive: true,
      emailVerifiedAt: new Date(),
    },
  });

  const teacherB1 = await prisma.user.create({
    data: {
      email: 'teacher.downtown@demo.local',
      password: hashedPassword,
      name: 'Emma Wilson',
      role: UserRole.TEACHER,
      schoolId: schoolB.id,
      branchId: branchB1.id,
      assignedById: bdB1.id,
      staffPosition: StaffPosition.ED_DIRECTOR,
      staffClearanceActive: true,
      emailVerifiedAt: new Date(),
    },
  });

  const teacherB2 = await prisma.user.create({
    data: {
      email: 'para.harbor@demo.local',
      password: hashedPassword,
      name: 'Noah Patel',
      role: UserRole.TEACHER,
      schoolId: schoolB.id,
      branchId: branchB2.id,
      assignedById: bdB2.id,
      staffPosition: StaffPosition.PARAPROFESSIONAL,
      staffClearanceActive: false,
      emailVerifiedAt: new Date(),
    },
  });

  const students = await Promise.all([
    prisma.user.create({
      data: {
        email: 'student.alex@demo.local',
        password: hashedPassword,
        name: 'Alex Martinez',
        role: UserRole.STUDENT,
        schoolId: schoolA.id,
        branchId: branchA1.id,
        assignedById: bdA1.id,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: 'student.sam@demo.local',
        password: hashedPassword,
        name: 'Sam Okonkwo',
        role: UserRole.STUDENT,
        schoolId: schoolA.id,
        branchId: branchA1.id,
        assignedById: bdA1.id,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: 'student.jordan@demo.local',
        password: hashedPassword,
        name: 'Jordan Lee',
        role: UserRole.STUDENT,
        schoolId: schoolA.id,
        branchId: branchA2.id,
        assignedById: bdA2.id,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: 'student.river@demo.local',
        password: hashedPassword,
        name: 'River Singh',
        role: UserRole.STUDENT,
        schoolId: schoolB.id,
        branchId: branchB1.id,
        assignedById: bdB1.id,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: 'student.skye@demo.local',
        password: hashedPassword,
        name: 'Skye Brown',
        role: UserRole.STUDENT,
        schoolId: schoolB.id,
        branchId: branchB2.id,
        assignedById: bdB2.id,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: 'student.lia@demo.local',
        password: hashedPassword,
        name: 'Lia Reyes',
        role: UserRole.STUDENT,
        schoolId: schoolA.id,
        branchId: branchA1.id,
        assignedById: bdA1.id,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: 'student.milo@demo.local',
        password: hashedPassword,
        name: 'Milo Chen',
        role: UserRole.STUDENT,
        schoolId: schoolB.id,
        branchId: branchB1.id,
        assignedById: bdB1.id,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: 'student.zoe@demo.local',
        password: hashedPassword,
        name: 'Zoe Adams',
        role: UserRole.STUDENT,
        schoolId: schoolB.id,
        branchId: branchB2.id,
        assignedById: bdB2.id,
        emailVerifiedAt: new Date(),
      },
    }),
  ]);

  console.log('Seeding document types…');
  await seedDocumentTypes({
    prisma,
    createdById: directorA.id,
    schoolId: schoolA.id,
  });
  await seedDocumentTypes({
    prisma,
    createdById: directorB.id,
    schoolId: schoolB.id,
  });

  const allDocTypes = await prisma.documentType.findMany({
    orderBy: [{ schoolId: 'asc' }, { sortOrder: 'asc' }],
  });
  const teacherTypes = allDocTypes.filter((d) => d.targetRole === UserRole.TEACHER);
  const studentTypes = allDocTypes.filter((d) => d.targetRole === UserRole.STUDENT);
  const branchDirectorTypes = allDocTypes.filter(
    (d) => d.targetRole === UserRole.BRANCH_DIRECTOR,
  );

  await prisma.user.update({
    where: { id: teacherA1a.id },
    data: { requiredDocTypes: { connect: teacherTypes.map((d) => ({ id: d.id })) } },
  });
  await prisma.user.update({
    where: { id: teacherA1b.id },
    data: { requiredDocTypes: { connect: teacherTypes.map((d) => ({ id: d.id })) } },
  });
  await prisma.user.update({
    where: { id: teacherA2.id },
    data: { requiredDocTypes: { connect: teacherTypes.map((d) => ({ id: d.id })) } },
  });
  await prisma.user.update({
    where: { id: teacherB1.id },
    data: { requiredDocTypes: { connect: teacherTypes.map((d) => ({ id: d.id })) } },
  });
  await prisma.user.update({
    where: { id: teacherB2.id },
    data: { requiredDocTypes: { connect: teacherTypes.map((d) => ({ id: d.id })) } },
  });

  for (const student of students) {
    await prisma.user.update({
      where: { id: student.id },
      data: { requiredDocTypes: { connect: studentTypes.map((d) => ({ id: d.id })) } },
    });
  }

  for (const bd of [bdA1, bdA2, bdB1, bdB2]) {
    await prisma.user.update({
      where: { id: bd.id },
      data: { requiredDocTypes: { connect: branchDirectorTypes.map((d) => ({ id: d.id })) } },
    });
  }

  let docCount = 0;

  async function addDocument(p: {
    documentTypeId: string;
    ownerUserId: string;
    uploadedById: string;
    createdAt: Date;
    issuedAt?: Date | null;
    expiresAt?: Date | null;
    verifiedAt?: Date | null;
    fileName: string;
  }) {
    const keySlug = `${p.ownerUserId}-${p.documentTypeId}-${p.createdAt.getTime()}`;
    await prisma.document.create({
      data: {
        documentTypeId: p.documentTypeId,
        ownerUserId: p.ownerUserId,
        uploadedById: p.uploadedById,
        s3Key: mockS3Key(keySlug),
        fileName: p.fileName,
        mimeType: 'application/pdf',
        sizeBytes: 70_000 + (docCount % 120) * 800,
        issuedAt: p.issuedAt ?? p.createdAt,
        expiresAt: p.expiresAt ?? null,
        verifiedAt: p.verifiedAt ?? null,
        createdAt: p.createdAt,
      },
    });
    docCount++;
  }

  const expExpired = daysFromToday(-120);
  const expNear = daysFromToday(12);
  const expNearSoon = daysFromToday(5);
  const expActiveFar = daysFromToday(200);

  const owners = [bdA1, bdA2, bdB1, bdB2, teacherA1a, teacherA1b, teacherA2, teacherB1, teacherB2, ...students];
  const uploaders = [
    admin,
    directorA,
    directorB,
    schoolAdminA,
    schoolAdminB,
    bdA1,
    bdA2,
    bdB1,
    bdB2,
  ];
  const ownerTypeMap = new Map<string, string[]>();
  for (const owner of owners) {
    const assigned = await prisma.user.findUniqueOrThrow({
      where: { id: owner.id },
      select: { requiredDocTypes: { select: { id: true } } },
    });
    ownerTypeMap.set(owner.id, assigned.requiredDocTypes.map((d) => d.id));
  }

  for (let day = 0; day < 21; day++) {
    for (const owner of owners) {
      const typeIds = ownerTypeMap.get(owner.id) ?? [];
      if (typeIds.length === 0) continue;
      const typeId = typeIds[(day + owner.id.length) % typeIds.length]!;
      const uploader = uploaders[(day + owner.email.length) % uploaders.length]!;
      const expiresAt = day % 6 === 0 ? expNearSoon : day % 8 === 0 ? expExpired : day % 4 === 0 ? expNear : expActiveFar;
      await addDocument({
        documentTypeId: typeId,
        ownerUserId: owner.id,
        uploadedById: uploader.id,
        createdAt: daysAgo(day, 9 + (day % 8), (day * 7) % 59),
        issuedAt: daysAgo(day + 30, 9, 0),
        expiresAt,
        verifiedAt: day % 3 === 0 ? daysAgo(Math.max(0, day - 1), 11, 0) : null,
        fileName: `${owner.email.split('@')[0]}_${day}.pdf`,
      });
    }
  }

  console.log('');
  console.log('── Mock database ready ─────────────────────────────────────────');
  console.log(`Schools: ${schoolA.name}, ${schoolB.name}`);
  console.log(`Branches: 4 (2 per school)`);
  console.log(`Users: admin, 2 directors, 2 school admins, 4 branch directors, 5 teachers, 8 students`);
  console.log(`Documents: ${docCount} sample rows (S3 keys are placeholders)`);
  console.log('');
  console.log('All accounts use the same password:');
  console.log(`  ${SEED_PASSWORD}`);
  console.log('');
  console.log('Role           Email');
  console.log('-------------  ----------------------------------------');
  console.log(`ADMIN          ${admin.email}`);
  console.log(`DIRECTOR       ${directorA.email}`);
  console.log(`DIRECTOR       ${directorB.email}`);
  console.log(`SCHOOL_ADMIN   ${schoolAdminA.email}`);
  console.log(`SCHOOL_ADMIN   ${schoolAdminB.email}`);
  console.log(`BRANCH_DIR     ${bdA1.email}`);
  console.log(`BRANCH_DIR     ${bdA2.email}`);
  console.log(`BRANCH_DIR     ${bdB1.email}`);
  console.log(`BRANCH_DIR     ${bdB2.email}`);
  console.log(`TEACHER        ${teacherA1a.email}`);
  console.log(`TEACHER        ${teacherA1b.email}`);
  console.log(`TEACHER        ${teacherA2.email}`);
  console.log(`TEACHER        ${teacherB1.email}`);
  console.log(`TEACHER        ${teacherB2.email}`);
  console.log(`STUDENT        ${students[0]!.email}`);
  console.log(`STUDENT        ${students[1]!.email}`);
  console.log(`STUDENT        ${students[2]!.email}`);
  console.log(`STUDENT        ${students[3]!.email}`);
  console.log(`STUDENT        ${students[4]!.email}`);
  console.log(`STUDENT        ${students[5]!.email}`);
  console.log(`STUDENT        ${students[6]!.email}`);
  console.log(`STUDENT        ${students[7]!.email}`);
  console.log('────────────────────────────────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
