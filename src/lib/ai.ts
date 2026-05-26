import OpenAI, { toFile } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function analyzeFinancialDocument(
  fileBuffer: Buffer,
  fileName: string,
  language: string = "English"
) {
  const file = await toFile(fileBuffer, fileName);

  const uploaded = await openai.files.create({
    file,
    purpose: "assistants",
  });

  const response = await openai.responses.create({
    model: "gpt-4.1",
    input: [
      {
        role: "system",
        content: `You are a financial AI.
Extract and analyze all financial data.
Return VALID JSON only with:
- total_expenses
- recurring_costs
- unnecessary_costs
- leakage_score
- top_vendors
- category_breakdown
- recommendations
Respond in ${language}.`,
      },
      {
        role: "user",
        content: [
          {
            type: "input_file",
            file_id: uploaded.id,
          },
        ],
      },
    ],
  });

  return JSON.parse(response.output_text || "{}");
}
