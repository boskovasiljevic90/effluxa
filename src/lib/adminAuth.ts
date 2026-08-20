import { NextRequest } from "next/server";
import { safeVerifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const adminSelect = {
  id: true,
  email: true,
  role: true,
} as const;

export async function getOperationalAdminFromToken(token?: string | null) {
  const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  if (!configuredEmail || !token) {
    return null;
  }

  const decoded = safeVerifyToken(token);

  if (!decoded) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: adminSelect,
  });

  if (!user || user.email.trim().toLowerCase() !== configuredEmail) {
    return null;
  }

  return user;
}

export async function getOperationalAdmin(req: NextRequest) {
  return getOperationalAdminFromToken(req.cookies.get("token")?.value);
}
