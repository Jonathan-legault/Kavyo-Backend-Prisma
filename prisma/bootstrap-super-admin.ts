import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();

  if (!email) {
    throw new Error(
      'SUPER_ADMIN_EMAIL environment variable is required',
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new Error(`User not found: ${email}`);
  }

  if (!user.isActive) {
    throw new Error(`User is inactive: ${email}`);
  }

  const superAdminRole = await prisma.role.upsert({
    where: {
      name: 'SUPER_ADMIN',
    },
    update: {
      description:
        'Privileged Kavyo administrator with role management access',
    },
    create: {
      name: 'SUPER_ADMIN',
      description:
        'Privileged Kavyo administrator with role management access',
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      roleId: superAdminRole.id,
    },
  });

  console.log(`SUPER_ADMIN assigned to ${email}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });