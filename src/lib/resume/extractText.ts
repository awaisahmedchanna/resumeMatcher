export function extractResumeText(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string> {
  if (mimeType === "text/plain" || fileName.endsWith(".txt")) {
    return Promise.resolve(buffer.toString("utf-8"));
  }

  if (
    mimeType === "application/pdf" ||
    fileName.endsWith(".pdf")
  ) {
    return extractPDFText(buffer);
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.endsWith(".docx")
  ) {
    return extractDocxText(buffer);
  }

  throw new Error("Unsupported file type. Please upload a PDF, DOCX, or TXT file.");
}

async function extractPDFText(buffer: Buffer): Promise<string> {
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    const mod = await import("pdf-parse");
    const PDFParse = mod.PDFParse;
    const instance = new PDFParse(new Uint8Array(buffer));
    const result = await instance.getText();

    const text = result?.text?.trim();

    if (!text || text.length < 10) {
      throw new Error("Could not extract text from PDF. The file may be scanned or image-based.");
    }

    return text;
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`PDF text extraction failed: ${err.message}`);
    }
    throw new Error("PDF text extraction failed unexpectedly.");
  } finally {
    console.warn = originalWarn;
  }
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value?.trim();

    if (!text || text.length < 10) {
      throw new Error("Could not extract text from DOCX file.");
    }

    return text;
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`DOCX text extraction failed: ${err.message}`);
    }
    throw new Error("DOCX text extraction failed unexpectedly.");
  }
}
