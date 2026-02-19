import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"

export async function POST() {
  try {
    const user = await currentUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Upload working with Clerk production"
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal error", message: error.message },
      { status: 500 }
    )
  }
}
