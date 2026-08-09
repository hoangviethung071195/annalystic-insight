const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  const adminUser = users.find(u => u.email === 'admin@gmail.com');
  if (!adminUser) {
    console.log('User admin@gmail.com not found.');
    return;
  }

  const updateResult = await prisma.group.updateMany({
    data: {
      userId: adminUser.id
    }
  });
  console.log(`Updated all groups to admin@gmail.com (ID: ${adminUser.id}). Count: ${updateResult.count}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
