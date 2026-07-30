import fs from "fs";
import { PrismaClient } from "@prisma/client";

function loadEnvFile(path) {
  if (!fs.existsSync(path)) return;

  for (const line of fs.readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    let value = match[2].trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[match[1]]) {
      process.env[match[1]] = value;
    }
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const prisma = new PrismaClient();

const users = await prisma.user.findMany({
  where: {
    email: {
      startsWith: "pricing-matrix-",
    },
  },
  select: {
    id: true,
    email: true,
  },
});

console.log(`Found matrix users: ${users.length}`);

for (const user of users) {
  await prisma.event.deleteMany({
    where: {
      userId: user.id,
    },
  });

  await prisma.upload.deleteMany({
    where: {
      userId: user.id,
    },
  });

  await prisma.user.delete({
    where: {
      id: user.id,
    },
  });

  console.log(`✅ Cleaned ${user.email}`);
}

await prisma.$disconnect();
