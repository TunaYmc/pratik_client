const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:C:/nano-cli/apps/backend/prisma/dev.db'
    }
  }
});
async function main() {
  const users = await prisma.user.findMany();
  console.log("Users in dev.db:", users);

  // let's also check if prod.db can be queried somehow (if it was created in the root folder instead of prisma/)
  try {
    const prismaProd = new PrismaClient({
      datasources: {
        db: {
          url: 'file:./prod.db'
        }
      }
    });
    const usersProd = await prismaProd.user.findMany();
    console.log("Users in prod.db:", usersProd);
  } catch (e) {
    console.log("prod.db failed:", e.message);
  }
}
main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
