export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import OpenAI from "openai";
import * as XLSX from "xlsx";
import { trackEvent } from "@/lib/events";
import { trackError } from "@/lib/errorTracking";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

function extractJSON(text: string) {
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;

  return match[0]
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]");
}

function safeParseAIJson(raw: string) {
  const jsonString = extractJSON(raw);

  if (!jsonString) {
    throw new Error("AI did not return JSON.");
  }

  try {
    return JSON.parse(jsonString);
  } catch {
    throw new Error("AI returned invalid JSON. Please try again.");
  }
}

async function analyzeWithAI(file: File, financialText?: string) {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  const content: any[] = [];

  if (isPdf) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64File = `data:application/pdf;base64,${buffer.toString("base64")}`;

    content.push({
      type: "input_file",
      file_data: base64File,
      filename: file.name,
    });
  }

  content.push({
    type: "input_text",
    text: `
You are Effluxa, an AI financial leakage auditor.

Analyze this financial document and return ONLY valid JSON.
Do not use markdown.
Do not add comments.
Do not add trailing commas.

Return exactly this structure:

{
  "executive_summary": "short business summary",
  "leakage_score": 0,
  "estimated_savings": 0,
  "key_findings": ["finding 1", "finding 2", "finding 3"],
  "top_vendors": [
    { "vendor": "Vendor name", "amount": 0 }
  ],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}

Financial data:
${financialText ? financialText.slice(0, 30000) : ""}
`
  });

  const response = await openai.responses.create({
    model: "gpt-4.1",
    input: [
      {
        role: "user",
        content,
      },
    ],
  });

  return safeParseAIJson(response.output_text || "");
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role === "FREE" && user.weeklyUploadCount >= 3) {
      return NextResponse.json(
        {
          error: "You have reached your free audit limit. You can still unlock existing reports for €29, or contact support for more access.",
        },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const allowedExtensions = [".pdf", ".csv", ".xlsx", ".xls"];
    const lowerName = file.name.toLowerCase();

    const validFile = allowedExtensions.some((ext) =>
      lowerName.endsWith(ext)
    );

    if (!validFile) {
      return NextResponse.json(
        { error: "Only PDF, CSV, XLSX, and XLS files are supported." },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    let financialText = "";

    if (lowerName.endsWith(".csv")) {
      financialText = await file.text();
    }

    if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
      const buffer = Buffer.from(await file.arrayBuffer());

      const workbook = XLSX.read(buffer, {
        type: "buffer",
      });

      financialText = workbook.SheetNames.map((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        return `Sheet: ${sheetName}\n${XLSX.utils.sheet_to_csv(sheet)}`;
      }).join("\n\n");
    }

    const parsedData = await analyzeWithAI(file, financialText);

    const upload = await prisma.upload.create({
      data: {
        userId: user.id,
        fileUrl: file.name,
        parsedData,
        summary: "AI financial leak audit generated",
      },
    });

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        weeklyUploadCount: {
          increment: 1,
        },
      },
    });

    await trackEvent({
      type: "upload_created",
      userId: user.id,
      reportId: upload.id,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
      },
    });

    return NextResponse.json({
      success: true,
      upload,
    });
  } catch (error: any) {
    console.error("UPLOAD ERROR:", error);
    await trackError({ type: "upload_error", error });

    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}