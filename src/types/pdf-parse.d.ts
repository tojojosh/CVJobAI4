declare module 'pdf-parse/lib/pdf-parse' {
  interface PDFParseResult {
    text: string;
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    version: string;
    filename: string;
  }

  function pdfParse(dataBuffer: Buffer, options?: any): Promise<PDFParseResult>;
  export default pdfParse;
} 