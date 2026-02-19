import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    return NextResponse.json({
      success: true,
      message: "Upload working without Clerk"
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
