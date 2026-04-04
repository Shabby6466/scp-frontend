import { PrismaClient, UserRole } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

async function test() {
  dotenv.config({ path: path.join(__dirname, '../../.env') });
  const prisma = new PrismaClient();
  try {
    const where = {
      AND: [
        {
          OR: [
            { schoolId: 'some-non-existent-id' },
            { branch: { schoolId: 'some-non-existent-id' } }
          ]
        }
      ]
    };
    
    const users = await prisma.user.findMany({
      where: where as any,
      include: {
        school: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } }
      }
    });
    console.log('Query successful, found:', users.length);
  } catch (err) {
    console.error('Query failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
