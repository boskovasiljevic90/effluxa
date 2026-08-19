export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeVerifyToken } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { deleteAccountData } from "@/lib/accountDeletion";

export async function DELETE(req: NextRequest) {
  try {
    const limited = rateLimit({
      req,
      key: "account_delete",
      limit: 3,
      windowMs: 10 * 60 * 1000,
    });

    if (limited) return limited;

    const token = req.cookies.get("token")?.value;
    const decoded = token ? safeVerifyToken(token) : null;

    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL) {
      return NextResponse.json(
        { error: "The operational admin account must be transferred before deletion." },
        { status: 409 }
      );
    }

    const body = await req.json().catch(() => null);
    const confirmation = typeof body?.confirmation === "string"
      ? body.confirmation.trim().toLowerCase()
      : "";

    if (confirmation !== user.email.toLowerCase()) {
      return NextResponse.json(
        { error: "Enter your account email to confirm deletion." },
        { status: 400 }
      );
    }

    const subscriptionStillActive =
      user.role !== "FREE" &&
      user.subscriptionStatus === "active" &&
      (!user.subscriptionEndDate || user.subscriptionEndDate > new Date());

    if (subscriptionStillActive) {
      return NextResponse.json(
        {
          error:
            "Cancel your active subscription in Manage Billing before deleting the account.",
        },
        { status: 409 }
      );
    }

    await deleteAccountData(user.id);

    const response = NextResponse.json({
      success: true,
      message: "Your Effluxa account and stored account data have been deleted.",
    });

    response.cookies.set("token", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("ACCOUNT DELETE ERROR:", error);

    return NextResponse.json(
      { error: "We couldn't delete the account right now. Please contact support." },
      { status: 500 }
    );
  }
}
