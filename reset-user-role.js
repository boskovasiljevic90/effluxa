const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const email = "free@effluxa.com";

  await prisma.user.update({
    where: {
      email,
    },
    data: {
      role: "FREE",
      subscriptionId: null,
    },
  });

  console.log("USER RESET TO FREE");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
