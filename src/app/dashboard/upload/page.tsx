import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import UploadClient from "./UploadClient";

export const dynamic = "force-dynamic";

async function getUser() {
  const token = cookies().get("token")?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    return await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
    });
  } catch {
    return null;
  }
}

export default async function UploadPage({
  searchParams,
}: {
  searchParams?: {
    clientId?: string;
    repeat?: string;
  };
}) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <UploadClient
      initialClientId={typeof searchParams?.clientId === "string" ? searchParams.clientId : ""}
      repeatAudit={searchParams?.repeat === "1"}
    />
  );
}
