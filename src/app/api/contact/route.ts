export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { trackError } from "@/lib/errorTracking";

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!email || !message) {
      return NextResponse.json(
        { error: "Email and message are required." },
        { status: 400 }
      );
    }

    const recentMessages = await prisma.contactMessage.count({
      where: {
        email,
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000),
        },
      },
    });

    if (recentMessages >= 3) {
      return NextResponse.json(
        { error: "Too many messages. Please try again later." },
        { status: 429 }
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
    await trackError({ type: "contact_error", error });

    return NextResponse.json(
      { error: "Failed to send message." },
      { status: 500 }
    );
  }
}