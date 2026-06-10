export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!email || !message) {
      return NextResponse.json(
        { error: "Email and message are required." },
        { status: 400 }
      );
    }

    await prisma.contactMessage.create({
      data: {
        name: name || null,
        email,
        subject: subject || null,
        message,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Message sent successfully.",
    });
  } catch (error) {
    console.error("CONTACT ERROR:", error);

    return NextResponse.json(
      { error: "Failed to send message." },
      { status: 500 }
    );
  }
}
