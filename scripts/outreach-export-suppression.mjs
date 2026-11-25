#!/usr/bin/env node
/**
 * Prints every address that opted out of cold outreach, one per line.
 *
 * The sender checks this list before every send:
 *   node scripts/outreach-export-suppression.mjs > ../outreach/suppression.txt
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const rows = await prisma.contactMessage.findMany({
    where: { source: "cold_outreach", status: "UNSUBSCRIBED" },
    select: { email: true },
    distinct: ["email"],
  });

  for (const row of rows) console.log(row.email.toLowerCase());
  console.error(`exported ${rows.length} suppressed address(es)`);
} finally {
  await prisma.$disconnect();
}
