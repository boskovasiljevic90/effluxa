import { NextResponse } from "next/server"

export async function POST() {
  try {
    return NextResponse.json({
      success: true,
      message: "Upload working without server auth"
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal error", message: error.message },
      { status: 500 }
    )
  }
}
