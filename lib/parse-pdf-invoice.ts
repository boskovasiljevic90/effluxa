type PdfInvoiceParseResult = {
  ok: true;
  source: "pdf";
  textChars: number;
  textSample: string;
  extracted: {
    invoice_number: string | null;
    vendor: string | null;
    invoice_date: string | null; // ISO YYYY-MM-DD
    due_date: string | null;     // ISO YYYY-MM-DD
    total: number | null;
    currency: string | null;
    language: string | null;
    confidence: number | null; // 0..1
  };
  debug?: any;
} | {
  ok: false;
  source: "pdf";
  error: string;
  debug?: any;
};

function safeIsoDate(s: any): string | null {
  if (!s) return null;
  const str = String(s).trim();
  if (!str) return null;
  // Accept YYYY-MM-DD directly
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const d = new Date(str);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function safeNumber(n: any): number | null {
  if (n === null || n === undefined || n === "") return null;
  if (typeof n === "number" && Number.isFinite(n)) return n;

  const s0 = String(n).trim();
  if (!s0) return null;

  // normalize common formats: 1.234,56 / 1,234.56 / 1234.56
  const s1 = s0.replace(/[^\d,.\-]/g, "");
  const lastComma = s1.lastIndexOf(",");
  const lastDot = s1.lastIndexOf(".");
  let s2 = s1;

  if (lastComma !== -1 && lastDot !== -1) {
    if (lastComma > lastDot) s2 = s1.replace(/\./g, "").replace(",", ".");
    else s2 = s1.replace(/,/g, "");
  } else if (lastComma !== -1) {
    s2 = s1.replace(/\./g, "").replace(",", ".");
  } else {
    s2 = s1.replace(/,/g, "");
  }

  const num = Number(s2);
  return Number.isFinite(num) ? num : null;
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  // pdf-parse is CommonJS; dynamic import is safest for Next/Turbopack
  const mod: any = await import("pdf-parse");
  const pdfParse = mod?.default || mod;
  const data = await pdfParse(buffer);
  const text = (data?.text ?? "").toString();
  return text;
}

async function llmExtractInvoice(text: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // No key: return empty extraction, still “ok” with debug
    return {
      invoice_number: null,
      vendor: null,
      invoice_date: null,
      due_date: null,
      total: null,
      currency: null,
      language: null,
      confidence: null,
      _debug: { note: "OPENAI_API_KEY missing, skipped LLM extraction" },
    };
  }

  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey });

  const prompt =
`You are an invoice parser. The input is raw text extracted from a PDF invoice.
Return ONLY valid JSON (no markdown). Output schema:

{
  "invoice_number": string|null,
  "vendor": string|null,
  "invoice_date": "YYYY-MM-DD"|null,
  "due_date": "YYYY-MM-DD"|null,
  "total": number|null,
  "currency": string|null,         // ISO currency if possible (EUR, USD, RSD, etc.)
  "language": string|null,         // detected human language name or code
  "confidence": number|null        // 0..1
}

Rules:
- If unsure, use null.
- Prefer the grand total / amount due.
- Dates must be ISO YYYY-MM-DD. If original is like 23012026 interpret as DDMMYYYY.
- Do NOT include extra keys.`;

  // Keep token usage bounded
  const clipped = text.length > 12000 ? text.slice(0, 12000) : text;

  const resp = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      { role: "system", content: "Return only JSON. No explanations." },
      { role: "user", content: prompt + "\n\nTEXT:\n" + clipped },
    ],
  });

  const raw = resp.choices?.[0]?.message?.content ?? "";
  // Parse JSON safely
  try {
    const json = JSON.parse(raw);
    return json;
  } catch (e) {
    return {
      invoice_number: null,
      vendor: null,
      invoice_date: null,
      due_date: null,
      total: null,
      currency: null,
      language: null,
      confidence: null,
      _debug: { parseError: String(e), raw },
    };
  }
}

export async function parsePdfInvoice(buffer: Buffer, filename: string): Promise<PdfInvoiceParseResult> {
  try {
    const text = await extractPdfText(buffer);
    const textClean = text.replace(/\u0000/g, "").trim();

    const sample = textClean.slice(0, 600);

    // If we extracted almost nothing, it’s likely scanned -> needs OCR/vision later
    if (!textClean || textClean.length < 40) {
      return {
        ok: false,
        source: "pdf",
        error: "PDF has little/no extractable text (likely scanned). OCR/vision step needed.",
        debug: { filename, textChars: textClean.length, sample },
      };
    }

    const llm = await llmExtractInvoice(textClean);

    const extracted = {
      invoice_number: llm?.invoice_number ? String(llm.invoice_number) : null,
      vendor: llm?.vendor ? String(llm.vendor) : null,
      invoice_date: safeIsoDate(llm?.invoice_date),
      due_date: safeIsoDate(llm?.due_date),
      total: safeNumber(llm?.total),
      currency: llm?.currency ? String(llm.currency).trim() : null,
      language: llm?.language ? String(llm.language).trim() : null,
      confidence:
        llm?.confidence !== null && llm?.confidence !== undefined && Number.isFinite(Number(llm.confidence))
          ? Number(llm.confidence)
          : null,
    };

    return {
      ok: true,
      source: "pdf",
      textChars: textClean.length,
      textSample: sample,
      extracted,
      debug: llm?._debug ? llm._debug : undefined,
    };
  } catch (e: any) {
    return {
      ok: false,
      source: "pdf",
      error: e?.message ?? String(e),
      debug: { filename },
    };
  }
}
