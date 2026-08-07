const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

const SUPPORTED_EXTENSIONS = [".pdf", ".csv", ".xlsx", ".xls"] as const;

function hasPrefix(bytes: Uint8Array, prefix: number[]) {
  return prefix.every((byte, index) => bytes[index] === byte);
}

export async function validateUploadFile(file: File) {
  const lowerName = file.name.toLowerCase();
  const extension = SUPPORTED_EXTENSIONS.find((item) =>
    lowerName.endsWith(item)
  );

  if (!extension) {
    return {
      valid: false,
      error: "Only PDF, CSV, XLSX, and XLS files are supported.",
    };
  }

  if (file.size <= 0) {
    return {
      valid: false,
      error: "The uploaded file is empty.",
    };
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    return {
      valid: false,
      error: "File too large. Maximum size is 10MB.",
    };
  }

  const header = new Uint8Array(
    await file.slice(0, Math.min(file.size, 16)).arrayBuffer()
  );

  if (extension === ".pdf" && !hasPrefix(header, [0x25, 0x50, 0x44, 0x46, 0x2d])) {
    return {
      valid: false,
      error: "This file is not a valid PDF. Please choose another file.",
    };
  }

  if (extension === ".xlsx" && !hasPrefix(header, [0x50, 0x4b])) {
    return {
      valid: false,
      error: "This file is not a valid XLSX workbook. Please choose another file.",
    };
  }

  if (
    extension === ".xls" &&
    !hasPrefix(header, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])
  ) {
    return {
      valid: false,
      error: "This file is not a valid XLS workbook. Please choose another file.",
    };
  }

  if (extension === ".csv") {
    const sample = new Uint8Array(
      await file.slice(0, Math.min(file.size, 4096)).arrayBuffer()
    );

    if (sample.includes(0)) {
      return {
        valid: false,
        error: "This file does not look like a readable CSV file.",
      };
    }
  }

  return { valid: true };
}

export const uploadLimits = {
  maxBytes: MAX_UPLOAD_SIZE,
  supportedExtensions: [...SUPPORTED_EXTENSIONS],
};
