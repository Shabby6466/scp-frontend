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

  await prisma.directorProfile.createMany({
    data: [
      {
        userId: directorA.id,
        officePhone: '+1-555-0101',
        notes: 'Demo: school director for Maple Street Early Learning (2 branches).',
      },
      {
        userId: directorB.id,
        officePhone: '+1-555-0202',
        notes: 'Demo: school director for Riverside Day School (2 branches).',
      },
    ],
  });

  await prisma.branchDirectorProfile.createMany({
    data: [
      {
        userId: bdA1.id,
        branchStartDate: daysAgo(420),
        notes:
          'Main Campus — Riley Park. Demo chain: Morgan (director) → Riley → teachers Priya & Chris → students Alex, Sam, Lia.',
      },
      {
        userId: bdA2.id,
        branchStartDate: daysAgo(310),
        notes: 'West Annex — Casey Nguyen. Linked to Morgan; teachers Dana; student Jordan.',
      },
      {
        userId: bdB1.id,
        branchStartDate: daysAgo(280),
        notes: 'Downtown Center — Alex Morgan. Linked to Jordan Ellis (director).',
      },
      {
        userId: bdB2.id,
        branchStartDate: daysAgo(190),
        notes: 'Harbor View — Jamie Lee. Linked to Jordan Ellis (director).',
      },
    ],
  });

  await prisma.teacherProfile.createMany({
    data: [
      {
        userId: teacherA1a.id,
        subjectArea: 'Pre-K / Rainbow Room (Main Campus)',
        employeeCode: 'MS-MC-LT-001',
        joiningDate: daysAgo(540),
      },
      {
        userId: teacherA1b.id,
        subjectArea: 'Pre-K / Rainbow Room (Main Campus)',
        employeeCode: 'MS-MC-AT-002',
        joiningDate: daysAgo(120),
      },
      {
        userId: teacherA2.id,
        subjectArea: 'Toddler Program (West Annex)',
        employeeCode: 'MS-WA-LT-003',
        joiningDate: daysAgo(400),
      },
      {
        userId: teacherB1.id,
        subjectArea: 'Early Childhood (Downtown)',
        employeeCode: 'RS-DT-ED-001',
        joiningDate: daysAgo(620),
      },
      {
        userId: teacherB2.id,
        subjectArea: 'Inclusion support (Harbor View)',
        employeeCode: 'RS-HV-PARA-001',
        joiningDate: daysAgo(90),
      },
    ],
  });

  const [stuAlex, stuSam, stuJordan, stuRiver, stuSkye, stuLia, stuMilo, stuZoe] = students;

  await prisma.studentProfile.createMany({
    data: [
      {
        userId: stuAlex.id,
        rollNumber: 'MS-MC-101',
        guardianName: 'Taylor Martinez',
        guardianPhone: '+1-555-3101',
      },
      {
        userId: stuSam.id,
        rollNumber: 'MS-MC-102',
        guardianName: 'Amina Okonkwo',
        guardianPhone: '+1-555-3102',
      },
      {
        userId: stuJordan.id,
        rollNumber: 'MS-WA-201',
        guardianName: 'Min Lee',
        guardianPhone: '+1-555-3201',
      },
      {
        userId: stuRiver.id,
        rollNumber: 'RS-DT-301',
        guardianName: 'Harpreet Singh',
        guardianPhone: '+1-555-4101',
      },
      {
        userId: stuSkye.id,
        rollNumber: 'RS-HV-401',
        guardianName: 'Jordan Brown',
        guardianPhone: '+1-555-4201',
      },
      {
        userId: stuLia.id,
        rollNumber: 'MS-MC-103',
        guardianName: 'Marisol Reyes',
        guardianPhone: '+1-555-3103',
      },
      {
        userId: stuMilo.id,
        rollNumber: 'RS-DT-302',
        guardianName: 'Wei Chen',
        guardianPhone: '+1-555-4102',
      },
      {
        userId: stuZoe.id,
        rollNumber: 'RS-HV-402',
        guardianName: 'Chris Adams',
        guardianPhone: '+1-555-4202',
      },
    ],
  });

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

  const teacherTypesA = allDocTypes.filter(
    (d) => d.schoolId === schoolA.id && d.targetRole === UserRole.TEACHER,
  );
  const teacherTypesB = allDocTypes.filter(
    (d) => d.schoolId === schoolB.id && d.targetRole === UserRole.TEACHER,
  );
  const studentTypesA = allDocTypes.filter(
    (d) => d.schoolId === schoolA.id && d.targetRole === UserRole.STUDENT,
  );
  const studentTypesB = allDocTypes.filter(
    (d) => d.schoolId === schoolB.id && d.targetRole === UserRole.STUDENT,
  );
  const branchDirectorTypesA = allDocTypes.filter(
    (d) => d.schoolId === schoolA.id && d.targetRole === UserRole.BRANCH_DIRECTOR,
  );
  const branchDirectorTypesB = allDocTypes.filter(
    (d) => d.schoolId === schoolB.id && d.targetRole === UserRole.BRANCH_DIRECTOR,
  );

  function typeByName(schoolId: string, role: UserRole, name: string) {
    const t = allDocTypes.find(
      (d) => d.schoolId === schoolId && d.targetRole === role && d.name === name,
    );
    if (!t) {
      throw new Error(`Seed: missing DocumentType "${name}" for school ${schoolId} role ${role}`);
    }
    return t;
  }

  await prisma.user.update({
    where: { id: teacherA1a.id },
    data: { requiredDocTypes: { connect: teacherTypesA.map((d) => ({ id: d.id })) } },
  });
  await prisma.user.update({
    where: { id: teacherA1b.id },
    data: { requiredDocTypes: { connect: teacherTypesA.map((d) => ({ id: d.id })) } },
  });
  await prisma.user.update({
    where: { id: teacherA2.id },
    data: { requiredDocTypes: { connect: teacherTypesA.map((d) => ({ id: d.id })) } },
  });
  await prisma.user.update({
    where: { id: teacherB1.id },
    data: { requiredDocTypes: { connect: teacherTypesB.map((d) => ({ id: d.id })) } },
  });
  await prisma.user.update({
    where: { id: teacherB2.id },
    data: { requiredDocTypes: { connect: teacherTypesB.map((d) => ({ id: d.id })) } },
  });

  for (const student of students) {
    const types = student.schoolId === schoolA.id ? studentTypesA : studentTypesB;
    await prisma.user.update({
      where: { id: student.id },
      data: { requiredDocTypes: { connect: types.map((d) => ({ id: d.id })) } },
    });
  }

  await prisma.user.update({
    where: { id: bdA1.id },
    data: { requiredDocTypes: { connect: branchDirectorTypesA.map((d) => ({ id: d.id })) } },
  });
  await prisma.user.update({
    where: { id: bdA2.id },
    data: { requiredDocTypes: { connect: branchDirectorTypesA.map((d) => ({ id: d.id })) } },
  });
  await prisma.user.update({
    where: { id: bdB1.id },
    data: { requiredDocTypes: { connect: branchDirectorTypesB.map((d) => ({ id: d.id })) } },
  });
  await prisma.user.update({
    where: { id: bdB2.id },
    data: { requiredDocTypes: { connect: branchDirectorTypesB.map((d) => ({ id: d.id })) } },
  });

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

  const A = schoolA.id;
  const B = schoolB.id;

  const tGov = (sid: string) => typeByName(sid, UserRole.TEACHER, 'Government-issued ID');
  const tBg = (sid: string) => typeByName(sid, UserRole.TEACHER, 'Background Check Clearance');
  const tCpr = (sid: string) => typeByName(sid, UserRole.TEACHER, 'CPR and First Aid Certificate');
  const tContract = (sid: string) =>
    typeByName(sid, UserRole.TEACHER, 'Teacher Contract Acknowledgment');

  const sId = (sid: string) => typeByName(sid, UserRole.STUDENT, 'Student Identity Proof');
  const sReg = (sid: string) => typeByName(sid, UserRole.STUDENT, 'Student Registration Form');
  const sParent = (sid: string) => typeByName(sid, UserRole.STUDENT, 'Parent Consent Form');

  const bdSafety = (sid: string) =>
    typeByName(sid, UserRole.BRANCH_DIRECTOR, 'Branch Safety Compliance Pack');
  const bdOps = (sid: string) =>
    typeByName(sid, UserRole.BRANCH_DIRECTOR, 'Branch Operations Approval Letter');

  /** Primary demo: Maple Street → Main Campus — one chain you can click through in the UI. */
  await addDocument({
    documentTypeId: bdSafety(A).id,
    ownerUserId: bdA1.id,
    uploadedById: directorA.id,
    createdAt: daysAgo(400, 10, 15),
    issuedAt: daysAgo(400, 10, 15),
    expiresAt: expNear,
    verifiedAt: daysAgo(380, 14, 0),
    fileName: 'main-campus_branch-safety.pdf',
  });
  await addDocument({
    documentTypeId: bdOps(A).id,
    ownerUserId: bdA1.id,
    uploadedById: directorA.id,
    createdAt: daysAgo(410, 11, 0),
    issuedAt: daysAgo(410, 11, 0),
    expiresAt: null,
    verifiedAt: daysAgo(405, 9, 30),
    fileName: 'main-campus_ops-approval.pdf',
  });

  await addDocument({
    documentTypeId: tGov(A).id,
    ownerUserId: teacherA1a.id,
    uploadedById: bdA1.id,
    createdAt: daysAgo(200, 10, 0),
    issuedAt: daysAgo(200, 10, 0),
    expiresAt: expActiveFar,
    verifiedAt: daysAgo(198, 15, 0),
    fileName: 'priya_government-id.pdf',
  });
  await addDocument({
    documentTypeId: tBg(A).id,
    ownerUserId: teacherA1a.id,
    uploadedById: directorA.id,
    createdAt: daysAgo(180, 14, 20),
    issuedAt: daysAgo(180, 14, 20),
    expiresAt: expActiveFar,
    verifiedAt: daysAgo(175, 11, 0),
    fileName: 'priya_background-check.pdf',
  });
  await addDocument({
    documentTypeId: tCpr(A).id,
    ownerUserId: teacherA1a.id,
    uploadedById: bdA1.id,
    createdAt: daysAgo(90, 9, 45),
    issuedAt: daysAgo(90, 9, 45),
    expiresAt: expNear,
    verifiedAt: daysAgo(88, 10, 0),
    fileName: 'priya_cpr-first-aid.pdf',
  });
  await addDocument({
    documentTypeId: tContract(A).id,
    ownerUserId: teacherA1a.id,
    uploadedById: directorA.id,
    createdAt: daysAgo(60, 16, 0),
    issuedAt: daysAgo(60, 16, 0),
    expiresAt: null,
    verifiedAt: daysAgo(59, 9, 0),
    fileName: 'priya_contract-ack.pdf',
  });

  await addDocument({
    documentTypeId: tGov(A).id,
    ownerUserId: teacherA1b.id,
    uploadedById: bdA1.id,
    createdAt: daysAgo(45, 11, 0),
    issuedAt: daysAgo(45, 11, 0),
    expiresAt: expActiveFar,
    verifiedAt: daysAgo(44, 14, 0),
    fileName: 'chris_government-id.pdf',
  });
  await addDocument({
    documentTypeId: tContract(A).id,
    ownerUserId: teacherA1b.id,
    uploadedById: bdA1.id,
    createdAt: daysAgo(40, 10, 30),
    issuedAt: daysAgo(40, 10, 30),
    expiresAt: null,
    verifiedAt: null,
    fileName: 'chris_contract-ack.pdf',
  });

  await addDocument({
    documentTypeId: sId(A).id,
    ownerUserId: stuAlex.id,
    uploadedById: teacherA1a.id,
    createdAt: daysAgo(30, 10, 0),
    issuedAt: daysAgo(30, 10, 0),
    expiresAt: expActiveFar,
    verifiedAt: daysAgo(28, 11, 0),
    fileName: 'alex_identity-proof.pdf',
  });
  await addDocument({
    documentTypeId: sReg(A).id,
    ownerUserId: stuAlex.id,
    uploadedById: bdA1.id,
    createdAt: daysAgo(28, 9, 30),
    issuedAt: daysAgo(28, 9, 30),
    expiresAt: null,
    verifiedAt: daysAgo(27, 15, 0),
    fileName: 'alex_registration.pdf',
  });
  await addDocument({
    documentTypeId: sParent(A).id,
    ownerUserId: stuAlex.id,
    uploadedById: teacherA1a.id,
    createdAt: daysAgo(25, 14, 0),
    issuedAt: daysAgo(25, 14, 0),
    expiresAt: expNearSoon,
    verifiedAt: daysAgo(24, 10, 0),
    fileName: 'alex_parent-consent.pdf',
  });

  await addDocument({
    documentTypeId: sId(A).id,
    ownerUserId: stuSam.id,
    uploadedById: bdA1.id,
    createdAt: daysAgo(20, 11, 0),
    issuedAt: daysAgo(20, 11, 0),
    expiresAt: expActiveFar,
    verifiedAt: daysAgo(19, 9, 0),
    fileName: 'sam_identity-proof.pdf',
  });
  await addDocument({
    documentTypeId: sReg(A).id,
    ownerUserId: stuSam.id,
    uploadedById: teacherA1a.id,
    createdAt: daysAgo(18, 10, 15),
    issuedAt: daysAgo(18, 10, 15),
    expiresAt: null,
    verifiedAt: null,
    fileName: 'sam_registration.pdf',
  });

  await addDocument({
    documentTypeId: sId(A).id,
    ownerUserId: stuLia.id,
    uploadedById: bdA1.id,
    createdAt: daysAgo(15, 9, 0),
    issuedAt: daysAgo(15, 9, 0),
    expiresAt: expExpired,
    verifiedAt: null,
    fileName: 'lia_identity-proof.pdf',
  });

  /** West Annex: complete coverage, one expired student doc for dashboards. */
  await addDocument({
    documentTypeId: bdSafety(A).id,
    ownerUserId: bdA2.id,
    uploadedById: directorA.id,
    createdAt: daysAgo(300, 10, 0),
    issuedAt: daysAgo(300, 10, 0),
    expiresAt: expActiveFar,
    verifiedAt: daysAgo(298, 12, 0),
    fileName: 'west_branch-safety.pdf',
  });
  await addDocument({
    documentTypeId: bdOps(A).id,
    ownerUserId: bdA2.id,
    uploadedById: directorA.id,
    createdAt: daysAgo(295, 11, 30),
    issuedAt: daysAgo(295, 11, 30),
    expiresAt: null,
    verifiedAt: daysAgo(294, 9, 0),
    fileName: 'west_ops-approval.pdf',
  });
  for (const dt of [tGov(A), tBg(A), tCpr(A), tContract(A)]) {
    await addDocument({
      documentTypeId: dt.id,
      ownerUserId: teacherA2.id,
      uploadedById: bdA2.id,
      createdAt: daysAgo(50 + dt.sortOrder, 10, 0),
      issuedAt: daysAgo(50 + dt.sortOrder, 10, 0),
      expiresAt: dt.name.includes('CPR') ? expNear : expActiveFar,
      verifiedAt: daysAgo(48 + dt.sortOrder, 14, 0),
      fileName: `dana_${dt.name.replace(/\s+/g, '_').toLowerCase()}.pdf`,
    });
  }
  await addDocument({
    documentTypeId: sId(A).id,
    ownerUserId: stuJordan.id,
    uploadedById: teacherA2.id,
    createdAt: daysAgo(40, 10, 0),
    issuedAt: daysAgo(40, 10, 0),
    expiresAt: expExpired,
    verifiedAt: daysAgo(38, 11, 0),
    fileName: 'jordan_identity.pdf',
  });
  await addDocument({
    documentTypeId: sReg(A).id,
    ownerUserId: stuJordan.id,
    uploadedById: bdA2.id,
    createdAt: daysAgo(35, 9, 0),
    issuedAt: daysAgo(35, 9, 0),
    expiresAt: null,
    verifiedAt: daysAgo(34, 16, 0),
    fileName: 'jordan_registration.pdf',
  });
  await addDocument({
    documentTypeId: sParent(A).id,
    ownerUserId: stuJordan.id,
    uploadedById: teacherA2.id,
    createdAt: daysAgo(32, 13, 0),
    issuedAt: daysAgo(32, 13, 0),
    expiresAt: expNearSoon,
    verifiedAt: null,
    fileName: 'jordan_parent-consent.pdf',
  });

  /** Riverside: lighter mirror so cross-school filters still show data. */
  await addDocument({
    documentTypeId: bdSafety(B).id,
    ownerUserId: bdB1.id,
    uploadedById: directorB.id,
    createdAt: daysAgo(250, 10, 0),
    issuedAt: daysAgo(250, 10, 0),
    expiresAt: expNear,
    verifiedAt: daysAgo(248, 9, 0),
    fileName: 'downtown_branch-safety.pdf',
  });
  await addDocument({
    documentTypeId: bdOps(B).id,
    ownerUserId: bdB1.id,
    uploadedById: directorB.id,
    createdAt: daysAgo(245, 11, 0),
    issuedAt: daysAgo(245, 11, 0),
    expiresAt: null,
    verifiedAt: daysAgo(244, 10, 30),
    fileName: 'downtown_ops-approval.pdf',
  });
  await addDocument({
    documentTypeId: bdSafety(B).id,
    ownerUserId: bdB2.id,
    uploadedById: directorB.id,
    createdAt: daysAgo(200, 9, 30),
    issuedAt: daysAgo(200, 9, 30),
    expiresAt: expActiveFar,
    verifiedAt: daysAgo(199, 14, 0),
    fileName: 'harbor_branch-safety.pdf',
  });
  await addDocument({
    documentTypeId: bdOps(B).id,
    ownerUserId: bdB2.id,
    uploadedById: directorB.id,
    createdAt: daysAgo(195, 10, 15),
    issuedAt: daysAgo(195, 10, 15),
    expiresAt: null,
    verifiedAt: daysAgo(194, 11, 0),
    fileName: 'harbor_ops-approval.pdf',
  });

  for (const dt of [tGov(B), tBg(B), tCpr(B), tContract(B)]) {
    await addDocument({
      documentTypeId: dt.id,
      ownerUserId: teacherB1.id,
      uploadedById: bdB1.id,
      createdAt: daysAgo(70 + dt.sortOrder, 10, 0),
      issuedAt: daysAgo(70 + dt.sortOrder, 10, 0),
      expiresAt: expActiveFar,
      verifiedAt: daysAgo(68 + dt.sortOrder, 15, 0),
      fileName: `emma_${dt.name.replace(/\s+/g, '_').toLowerCase()}.pdf`,
    });
  }
  for (const dt of [tGov(B), tBg(B)]) {
    await addDocument({
      documentTypeId: dt.id,
      ownerUserId: teacherB2.id,
      uploadedById: bdB2.id,
      createdAt: daysAgo(55 + dt.sortOrder, 11, 0),
      issuedAt: daysAgo(55 + dt.sortOrder, 11, 0),
      expiresAt: expActiveFar,
      verifiedAt: null,
      fileName: `noah_${dt.name.replace(/\s+/g, '_').toLowerCase()}.pdf`,
    });
  }

  for (const [stu, label] of [
    [stuRiver, 'river'],
    [stuMilo, 'milo'],
  ] as const) {
    await addDocument({
      documentTypeId: sId(B).id,
      ownerUserId: stu.id,
      uploadedById: teacherB1.id,
      createdAt: daysAgo(22, 10, 0),
      issuedAt: daysAgo(22, 10, 0),
      expiresAt: expActiveFar,
      verifiedAt: daysAgo(21, 9, 0),
      fileName: `${label}_identity.pdf`,
    });
    await addDocument({
      documentTypeId: sReg(B).id,
      ownerUserId: stu.id,
      uploadedById: bdB1.id,
      createdAt: daysAgo(20, 9, 0),
      issuedAt: daysAgo(20, 9, 0),
      expiresAt: null,
      verifiedAt: daysAgo(19, 14, 0),
      fileName: `${label}_registration.pdf`,
    });
  }
  for (const [stu, label] of [
    [stuSkye, 'skye'],
    [stuZoe, 'zoe'],
  ] as const) {
    await addDocument({
      documentTypeId: sId(B).id,
      ownerUserId: stu.id,
      uploadedById: teacherB2.id,
      createdAt: daysAgo(18, 10, 0),
      issuedAt: daysAgo(18, 10, 0),
      expiresAt: expNearSoon,
      verifiedAt: null,
      fileName: `${label}_identity.pdf`,
    });
    await addDocument({
      documentTypeId: sParent(B).id,
      ownerUserId: stu.id,
      uploadedById: bdB2.id,
      createdAt: daysAgo(16, 11, 0),
      issuedAt: daysAgo(16, 11, 0),
      expiresAt: expActiveFar,
      verifiedAt: daysAgo(15, 10, 0),
      fileName: `${label}_parent-consent.pdf`,
    });
  }

  console.log('');
  console.log('── Mock database ready ─────────────────────────────────────────');
  console.log(`Schools: ${schoolA.name}, ${schoolB.name}`);
  console.log(`Branches: 4 (2 per school)`);
  console.log(`Users: admin, 2 directors, 4 branch directors, 5 teachers, 8 students`);
  console.log(`Documents: ${docCount} rows (linked owners, uploaders, types; S3 keys are placeholders)`);
  console.log('');
  console.log('Demo flow (click-through):');
  console.log(`  • ${schoolA.name} → branch "Main Campus" → ${bdA1.name} (${bdA1.email})`);
  console.log(`    → teachers ${teacherA1a.name} & ${teacherA1b.name} → students ${stuAlex.name}, ${stuSam.name}, ${stuLia.name}`);
  console.log(`  • ${teacherA1a.name}: CPR cert expires ~12d; ${teacherA1b.name}: missing background & CPR uploads`);
  console.log(`  • ${stuAlex.name}: parent consent expires ~5d; ${stuSam.name}: registration pending verify`);
  console.log(`  • West Annex: ${stuJordan.name} has expired ID + unverified consent`);
  console.log('');
  console.log('All accounts use the same password:');
  console.log(`  ${SEED_PASSWORD}`);
  console.log('');
  console.log('Role           Email');
  console.log('-------------  ----------------------------------------');
  console.log(`ADMIN          ${admin.email}`);
  console.log(`DIRECTOR       ${directorA.email}`);
  console.log(`DIRECTOR       ${directorB.email}`);
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
