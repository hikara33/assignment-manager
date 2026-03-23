import { PrismaService } from 'src/prisma/prisma.service';

export async function startTestTx(prisma: PrismaService) {
  await prisma.$executeRawUnsafe('BEGIN');
  return prisma;
}

export async function rollbackTestTx(prisma: PrismaService) {
  await prisma.$executeRawUnsafe('ROLLBACK');
}
