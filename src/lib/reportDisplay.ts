type UnknownRecord = Record<string, unknown>;

export type DisplayVendor = {
  vendor: string;
  amount: number;
  reason: string;
};

export type DisplayCategory = {
  category: string;
  amount: number;
  reason: string;
};

export type DisplayRisk = {
  item: string;
  reason: string;
};

export function displayNumber(value: unknown, fallback = 0) {
  return numberFrom(value, fallback);
}

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function textFrom(value: unknown, fallback = "") {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return fallback;
}

function numberFrom(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function firstText(record: UnknownRecord, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return fallback;
}

export function asTextArray(value: unknown, fallback: string[] = []) {
  if (Array.isArray(value)) {
    const items = value
      .map((item) => {
        if (typeof item === "string") {
          return item.trim();
        }

        if (typeof item === "number" && Number.isFinite(item)) {
          return String(item);
        }

        if (isRecord(item)) {
          return firstText(
            item,
            [
              "finding",
              "recommendation",
              "observation",
              "reason",
              "summary",
              "description",
              "item",
              "name",
              "category",
              "vendor",
            ],
            ""
          );
        }

        return "";
      })
      .filter(Boolean);

    if (items.length > 0) {
      return items;
    }
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return fallback;
}

export function asVendorItems(value: unknown, fallback: DisplayVendor[] = []) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }

      const vendor = firstText(item, ["vendor", "name"], "");
      const reason = firstText(
        item,
        ["reason", "description", "observation"],
        "Vendor appeared in the uploaded data."
      );

      if (!vendor) {
        return null;
      }

      return {
        vendor,
        amount: Math.max(0, numberFrom(item.amount, 0)),
        reason,
      };
    })
    .filter((item): item is DisplayVendor => Boolean(item));

  return items.length > 0 ? items : fallback;
}

export function asCategoryItems(value: unknown, fallback: DisplayCategory[] = []) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }

      const category = firstText(item, ["category", "name"], "");
      const reason = firstText(
        item,
        ["reason", "description", "observation"],
        "Category appeared in the uploaded data."
      );

      if (!category) {
        return null;
      }

      return {
        category,
        amount: Math.max(0, numberFrom(item.amount, 0)),
        reason,
      };
    })
    .filter((item): item is DisplayCategory => Boolean(item));

  return items.length > 0 ? items : fallback;
}

export function asRiskItems(value: unknown, fallback: DisplayRisk[] = []) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value
    .map((item) => {
      if (typeof item === "string" && item.trim()) {
        return {
          item: item.trim(),
          reason: "",
        };
      }

      if (!isRecord(item)) {
        return null;
      }

      const riskItem = firstText(
        item,
        ["item", "risk", "name", "description", "reason"],
        "Duplicate payment risk"
      );

      const reason = firstText(
        item,
        ["reason", "description", "observation"],
        ""
      );

      return {
        item: riskItem,
        reason,
      };
    })
    .filter((item): item is DisplayRisk => Boolean(item));

  return items.length > 0 ? items : fallback;
}

export function isFallbackReport(data: unknown) {
  if (!isRecord(data)) {
    return false;
  }

  const reportQuality = data.report_quality;

  if (!isRecord(reportQuality)) {
    return false;
  }

  return reportQuality.fallback_used === true;
}

export function getReportQualityReason(data: unknown) {
  if (!isRecord(data)) {
    return "";
  }

  const reportQuality = data.report_quality;

  if (!isRecord(reportQuality)) {
    return "";
  }

  return textFrom(reportQuality.reason, "");
}
