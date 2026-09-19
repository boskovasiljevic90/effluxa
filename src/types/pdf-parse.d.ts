declare module "pdf-parse";

declare module "pdf-parse/lib/pdf-parse.js" {
  type PdfTextItem = { str?: string };
  type PdfPage = {
    pageIndex: number;
    getTextContent(options: {
      normalizeWhitespace: boolean;
      disableCombineTextItems: boolean;
    }): Promise<{ items: PdfTextItem[] }>;
  };

  type PdfParseOptions = {
    pagerender?: (page: PdfPage) => Promise<string>;
  };

  type PdfParseResult = {
    text: string;
    numpages: number;
    info: Record<string, unknown>;
  };

  function pdfParse(buffer: Buffer, options?: PdfParseOptions): Promise<PdfParseResult>;
  export default pdfParse;
}
