import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Upload accepted (Free mode)"
    })

  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Internal error",
        message: error?.message || "Unknown error"
      },
      { status: 500 }
    )
  }
}
