import { PrismaClient, UserRole } from '@prisma/client';

async function test() {
  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.findMany({
      where: {
        AND: [
            {
                OR: [
                    { schoolId: 'some-id' },
                    { branch: { schoolId: 'some-id' } }
                ]
            }
        ]
      },
      include: {
        school: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } }
      }
    });
    console.log('Query successful');
  } catch (err) {
    console.error('Query failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
