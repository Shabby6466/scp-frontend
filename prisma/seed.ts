import {
  PrismaClient,
  UserRole,
  StaffPosition,
  DocumentCategory,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { seedDocumentTypes } from './seed-document-types';

const prisma = new PrismaClient();

/** Shared password for every seeded user (dev / demo only). */
const SEED_PASSWORD = 'Admin@123456';

const ADMIN_EMAIL = 'admin@schoolcompliance.com';

/** Placeholder object keys for UI testing (downloads will fail without real S3). */
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
  await prisma.child.deleteMany();
  await prisma.authOtp.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.school.deleteMany();
  await prisma.documentType.deleteMany();
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

  console.log('Seeding document types…');
  await seedDocumentTypes(prisma);

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
      staffPosition: StaffPosition.PARAPROFESSIONAL,
      staffClearanceActive: false,
      emailVerifiedAt: new Date(),
    },
  });

  async function createStudentWithChild(
    email: string,
    firstName: string,
    lastName: string,
    branchId: string,
    schoolId: string,
    health: {
      hasAllergies?: boolean;
      hasAsthma?: boolean;
      takesMedsAtSchool?: boolean;
    },
  ) {
    const student = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: `${firstName} ${lastName}`,
        role: UserRole.STUDENT,
        schoolId,
        branchId,
        emailVerifiedAt: new Date(),
      },
    });
    const child = await prisma.child.create({
      data: {
        firstName,
        lastName,
        branchId,
        studentUserId: student.id,
        guardianName: `${firstName}'s Guardian`,
        guardianEmail: `guardian.${email}`,
        hasAllergies: health.hasAllergies ?? false,
        hasAsthma: health.hasAsthma ?? false,
        takesMedsAtSchool: health.takesMedsAtSchool ?? false,
      },
    });
    return { student, child };
  }

  const { student: studentAlexUser, child: child1 } = await createStudentWithChild(
    'student.alex@demo.local',
    'Alex',
    'Martinez',
    branchA1.id,
    schoolA.id,
    { hasAllergies: true, takesMedsAtSchool: true },
  );

  const { child: child2 } = await createStudentWithChild(
    'student.sam@demo.local',
    'Sam',
    'Okonkwo',
    branchA1.id,
    schoolA.id,
    { hasAsthma: true },
  );

  const { child: child3 } = await createStudentWithChild(
    'student.jordan@demo.local',
    'Jordan',
    'Lee',
    branchA2.id,
    schoolA.id,
    {},
  );

  const { child: child4 } = await createStudentWithChild(
    'student.river@demo.local',
    'River',
    'Singh',
    branchB1.id,
    schoolB.id,
    { hasAllergies: true },
  );

  const { child: child5 } = await createStudentWithChild(
    'student.skye@demo.local',
    'Skye',
    'Brown',
    branchB2.id,
    schoolB.id,
    {},
  );

  const { child: child6 } = await createStudentWithChild(
    'student.lia@demo.local',
    'Lia',
    'Reyes',
    branchA1.id,
    schoolA.id,
    {},
  );

  const { child: child7 } = await createStudentWithChild(
    'student.milo@demo.local',
    'Milo',
    'Chen',
    branchB1.id,
    schoolB.id,
    { hasAsthma: true },
  );

  const { child: child8 } = await createStudentWithChild(
    'student.zoe@demo.local',
    'Zoe',
    'Adams',
    branchB2.id,
    schoolB.id,
    {},
  );

  const allChildTypes = await prisma.documentType.findMany({
    where: { category: DocumentCategory.CHILD },
    orderBy: { sortOrder: 'asc' },
  });
  const allStaffTypes = await prisma.documentType.findMany({
    where: { category: DocumentCategory.STAFF },
    orderBy: { sortOrder: 'asc' },
  });
  const allFacilityTypes = await prisma.documentType.findMany({
    where: { category: DocumentCategory.FACILITY },
    orderBy: { sortOrder: 'asc' },
  });

  const schoolAChildren = [child1, child2, child3, child6];
  const schoolBChildren = [child4, child5, child7, child8];
  const uploadersA = [teacherA1a, teacherA1b, bdA1, directorA, schoolAdminA, admin] as const;
  const uploadersB = [teacherB1, teacherB2, bdB1, bdB2, directorB, schoolAdminB, admin] as const;

  let docCount = 0;

  async function addDocument(p: {
    documentTypeId: string;
    childId?: string;
    staffId?: string;
    branchId?: string;
    uploadedById: string;
    createdAt: Date;
    issuedAt?: Date | null;
    expiresAt?: Date | null;
    verifiedAt?: Date | null;
    fileName: string;
  }) {
    const keySlug = `${p.childId ?? p.staffId ?? p.branchId}-${p.documentTypeId}-${p.createdAt.getTime()}`;
    await prisma.document.create({
      data: {
        documentTypeId: p.documentTypeId,
        childId: p.childId ?? null,
        staffId: p.staffId ?? null,
        branchId: p.branchId ?? null,
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

  // Dashboard default is “last 7 days” — dense uploads with varied uploader roles.
  for (let day = 0; day < 7; day++) {
    for (let n = 0; n < 6; n++) {
      const ch = schoolAChildren[(day + n) % schoolAChildren.length]!;
      const dt = allChildTypes[(day * 3 + n) % allChildTypes.length]!;
      const up = uploadersA[(day + n) % uploadersA.length]!;
      const ex =
        n % 5 === 0 ? expNearSoon : n % 5 === 1 ? expExpired : n % 5 === 2 ? expActiveFar : n % 5 === 3 ? expNear : null;
      await addDocument({
        documentTypeId: dt.id,
        childId: ch.id,
        uploadedById: up.id,
        createdAt: daysAgo(day, 9 + n, (n * 7) % 60),
        expiresAt: ex,
        verifiedAt: n % 2 === 0 ? daysAgo(day, 10) : null,
        fileName: `child_${ch.firstName}_${n}.pdf`,
      });
    }
    for (let n = 0; n < 4; n++) {
      const ch = schoolBChildren[(day + n) % schoolBChildren.length]!;
      const dt = allChildTypes[(day + n + 5) % allChildTypes.length]!;
      const up = uploadersB[(day + n * 2) % uploadersB.length]!;
      await addDocument({
        documentTypeId: dt.id,
        childId: ch.id,
        uploadedById: up.id,
        createdAt: daysAgo(day, 11 + n, 15 + n * 11),
        expiresAt: n % 3 === 0 ? expNear : n % 3 === 1 ? null : expActiveFar,
        verifiedAt: daysAgo(Math.max(0, day - 1), 16),
        fileName: `child_${ch.firstName}_${day}_${n}.pdf`,
      });
    }
  }

  // Older activity so “30 days” and week/month buckets stay interesting.
  for (let day = 7; day < 32; day++) {
    if (day % 2 !== 0) continue;
    const ch = schoolAChildren[day % schoolAChildren.length]!;
    const dt = allChildTypes[day % allChildTypes.length]!;
    await addDocument({
      documentTypeId: dt.id,
      childId: ch.id,
      uploadedById: teacherA1a.id,
      createdAt: daysAgo(day, 14, 20),
      expiresAt: day % 4 === 0 ? expExpired : null,
      verifiedAt: daysAgo(day - 1, 15),
      fileName: `child_archive_${day}.pdf`,
    });
    const chB = schoolBChildren[day % schoolBChildren.length]!;
    const dtB = allChildTypes[(day + 2) % allChildTypes.length]!;
    await addDocument({
      documentTypeId: dtB.id,
      childId: chB.id,
      uploadedById: directorB.id,
      createdAt: daysAgo(day, 16, 45),
      expiresAt: day % 5 === 0 ? expNear : expActiveFar,
      fileName: `child_b_${day}.pdf`,
    });
  }

  const teachers = [
    teacherA1a,
    teacherA1b,
    teacherA2,
    teacherB1,
    teacherB2,
  ];
  const staffUploaderRotation = [
    schoolAdminA.id,
    bdA1.id,
    directorA.id,
    admin.id,
    teacherA1a.id,
    schoolAdminB.id,
    bdB1.id,
    directorB.id,
  ];

  for (const t of teachers) {
    const slice = allStaffTypes.slice(0, 12);
    let i = 0;
    for (const dt of slice) {
      const created = daysAgo((i % 28) + 1, 10 + (i % 8), (i * 5) % 55);
      const uploader = staffUploaderRotation[i % staffUploaderRotation.length]!;
      const needsRenewal = dt.renewalPeriod !== 'NONE';
      await addDocument({
        documentTypeId: dt.id,
        staffId: t.id,
        uploadedById: i % 6 === 0 ? t.id : uploader,
        createdAt: created,
        expiresAt: needsRenewal
          ? i % 4 === 0
            ? expExpired
            : i % 4 === 1
              ? expNear
              : expActiveFar
          : null,
        verifiedAt: i % 3 !== 0 ? daysAgo(2, 11) : null,
        fileName: `staff_${t.email.split('@')[0]}_${i}.pdf`,
      });
      i++;
    }
  }

  const facilityUploaders = [
    { branch: branchA1, ids: [admin.id, bdA1.id, schoolAdminA.id, directorA.id] },
    { branch: branchA2, ids: [bdA2.id, schoolAdminA.id, admin.id] },
    { branch: branchB1, ids: [bdB1.id, schoolAdminB.id, directorB.id] },
    { branch: branchB2, ids: [bdB2.id, schoolAdminB.id, admin.id] },
  ] as const;

  let fi = 0;
  for (const { branch, ids } of facilityUploaders) {
    for (const dt of allFacilityTypes.slice(0, 12)) {
      const dayOff = (fi % 25) + 1;
      const exp =
        dt.name.includes('Permit') || dt.name.includes('Fire')
          ? fi % 3 === 0
            ? expNear
            : fi % 3 === 1
              ? expExpired
              : expActiveFar
          : fi % 4 === 0
            ? expNearSoon
            : null;
      await addDocument({
        documentTypeId: dt.id,
        branchId: branch.id,
        uploadedById: ids[fi % ids.length]!,
        createdAt: daysAgo(dayOff, 13 + (fi % 6), (fi * 3) % 59),
        expiresAt: exp,
        verifiedAt: fi % 2 === 0 ? daysAgo(Math.min(dayOff, 5), 17) : null,
        fileName: `facility_${branch.name.replace(/\s+/g, '_')}_${dt.name.slice(0, 24).replace(/\W+/g, '_')}.pdf`,
      });
      fi++;
    }
  }

  // A few student-uploaded rows (same login as child) for “Uploaded by” variety.
  if (allChildTypes[3]) {
    await addDocument({
      documentTypeId: allChildTypes[3]!.id,
      childId: child1.id,
      uploadedById: studentAlexUser.id,
      createdAt: daysAgo(1, 18, 22),
      expiresAt: null,
      verifiedAt: null,
      fileName: 'child_alex_field_trip.pdf',
    });
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
  console.log('STUDENT        student.alex@demo.local');
  console.log('STUDENT        student.sam@demo.local');
  console.log('STUDENT        student.jordan@demo.local');
  console.log('STUDENT        student.river@demo.local');
  console.log('STUDENT        student.skye@demo.local');
  console.log('STUDENT        student.lia@demo.local');
  console.log('STUDENT        student.milo@demo.local');
  console.log('STUDENT        student.zoe@demo.local');
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
