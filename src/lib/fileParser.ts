import * as XLSX from "xlsx";
import mammoth from "mammoth";
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export async function extractText(buffer: Buffer, fileType: string) {
  if (fileType === "application/pdf" || fileType === ".pdf") {
    const result = await pdfParse(buffer, {
      pagerender: async (pageData: { pageIndex: number; getTextContent: (options: { normalizeWhitespace: boolean; disableCombineTextItems: boolean }) => Promise<{ items: Array<{ str?: string }> }> }) => {
        const textContent = await pageData.getTextContent({
          normalizeWhitespace: true,
          disableCombineTextItems: false,
        });
        const pageText = textContent.items.map((item) => item.str || "").join(" ");
        return `\n[PDF_PAGE ${pageData.pageIndex + 1}]\n${pageText}\n`;
      },
    });

    return result.text;
  }

  if (
    fileType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (
    fileType ===
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    let text = "";
    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      text += XLSX.utils.sheet_to_csv(sheet);
    });
    return text;
  }

  // For other types, return raw buffer as string
  return buffer.toString("utf-8");
}
