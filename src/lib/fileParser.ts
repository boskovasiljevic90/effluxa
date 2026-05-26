import * as XLSX from "xlsx";
import mammoth from "mammoth";

export async function extractText(buffer: Buffer, fileType: string) {
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

  // For PDF and other types, return raw buffer as string
  return buffer.toString("utf-8");
}
