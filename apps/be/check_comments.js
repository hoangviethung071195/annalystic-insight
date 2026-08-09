const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const groups = await prisma.group.findMany({
    include: {
      posts: {
        include: {
          comments: true
        }
      }
    }
  });

  for (const g of groups) {
    console.log(`Group ID: ${g.id}, Name: ${g.name}`);
    console.log(`  Posts: ${g.posts.length}`);
    const commentsCount = g.posts.reduce((sum, p) => sum + p.comments.length, 0);
    console.log(`  Comments: ${commentsCount}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
