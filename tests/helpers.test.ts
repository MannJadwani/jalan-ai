import { describe, it, expect } from "vitest";
import {
  parseCrValue,
  formatINR,
  formatCompact,
  shortenName,
  getRiskBadge,
  parseMonthLabel,
  normalizeArray,
  parseResponse,
} from "@/app/lib/helpers";

// ─── parseCrValue ───────────────────────────────────────────────────────

describe("parseCrValue", () => {
  it("parses standard Cr format", () => {
    expect(parseCrValue("₹9.74 Cr")).toBe(9.74);
  });

  it("parses without rupee symbol", () => {
    expect(parseCrValue("12.5 Cr")).toBe(12.5);
  });

  it("returns 0 for non-matching string", () => {
    expect(parseCrValue("₹50 Lakh")).toBe(0);
    expect(parseCrValue("hello")).toBe(0);
    expect(parseCrValue("")).toBe(0);
  });

  it("parses whole numbers", () => {
    expect(parseCrValue("5 Cr")).toBe(5);
  });

  it("parses high-precision decimals", () => {
    expect(parseCrValue("1.234 Cr")).toBe(1.234);
  });
});

// ─── formatINR ──────────────────────────────────────────────────────────

describe("formatINR", () => {
  it("formats crores", () => {
    expect(formatINR(97360592.82)).toBe("₹9.74 Cr");
  });

  it("formats lakhs", () => {
    expect(formatINR(500000)).toBe("₹5.00 L");
    expect(formatINR(1234567)).toBe("₹12.35 L");
  });

  it("formats smaller amounts with commas", () => {
    expect(formatINR(50000)).toBe("₹50,000");
    expect(formatINR(1234)).toBe("₹1,234");
  });

  it("formats zero", () => {
    expect(formatINR(0)).toBe("₹0");
  });

  it("handles exact boundary values", () => {
    expect(formatINR(10000000)).toBe("₹1.00 Cr");
    expect(formatINR(100000)).toBe("₹1.00 L");
  });
});

// ─── formatCompact ──────────────────────────────────────────────────────

describe("formatCompact", () => {
  it("formats crores", () => {
    expect(formatCompact(50000000)).toBe("5.0 Cr");
  });

  it("formats lakhs", () => {
    expect(formatCompact(500000)).toBe("5.0 L");
  });

  it("formats thousands", () => {
    expect(formatCompact(5000)).toBe("5.0K");
  });

  it("formats small numbers", () => {
    expect(formatCompact(42)).toBe("42");
  });

  it("formats zero", () => {
    expect(formatCompact(0)).toBe("0");
  });
});

// ─── shortenName ────────────────────────────────────────────────────────

describe("shortenName", () => {
  it("returns short names unchanged", () => {
    expect(shortenName("Acme Corp")).toBe("Acme Corp");
  });

  it("truncates long names with ellipsis", () => {
    const long = "A Very Long Customer Name That Exceeds Limits";
    const result = shortenName(long, 20);
    expect(result.length).toBe(21); // 20 + "…"
    expect(result.endsWith("…")).toBe(true);
  });

  it("strips -C suffix", () => {
    expect(shortenName("Customer-C")).toBe("Customer");
  });

  it("strips -CC suffix", () => {
    expect(shortenName("Customer-CC")).toBe("Customer");
  });

  it("strips -K suffix", () => {
    expect(shortenName("Customer-K")).toBe("Customer");
  });

  it("uses default maxLen of 28", () => {
    const name = "A".repeat(30);
    const result = shortenName(name);
    expect(result.length).toBe(29); // 28 + "…"
  });

  it("handles empty string", () => {
    expect(shortenName("")).toBe("");
  });
});

// ─── getRiskBadge ───────────────────────────────────────────────────────

describe("getRiskBadge", () => {
  it("returns CRITICAL badge", () => {
    const badge = getRiskBadge("Critical Risk");
    expect(badge.label).toBe("CRITICAL");
    expect(badge.dot).toBe("bg-red-400");
  });

  it("returns HIGH badge", () => {
    const badge = getRiskBadge("High Risk");
    expect(badge.label).toBe("HIGH");
    expect(badge.dot).toBe("bg-orange-400");
  });

  it("returns MEDIUM badge", () => {
    const badge = getRiskBadge("Medium Risk");
    expect(badge.label).toBe("MEDIUM");
    expect(badge.dot).toBe("bg-amber-400");
  });

  it("returns LOW badge", () => {
    const badge = getRiskBadge("Low Risk");
    expect(badge.label).toBe("LOW");
    expect(badge.dot).toBe("bg-emerald-400");
  });

  it("returns NO LIMIT for unknown risk", () => {
    const badge = getRiskBadge("Unknown");
    expect(badge.label).toBe("NO LIMIT");
    expect(badge.dot).toBe("bg-zinc-500");
  });

  it("returns NO LIMIT for empty string", () => {
    expect(getRiskBadge("").label).toBe("NO LIMIT");
  });

  it("prioritizes Critical over others in combined strings", () => {
    // "Critical" is checked first, so even if string contains "High" too
    expect(getRiskBadge("Critical and High").label).toBe("CRITICAL");
  });
});

// ─── parseMonthLabel ────────────────────────────────────────────────────

describe("parseMonthLabel", () => {
  it("parses ISO date string to short format", () => {
    // 2025-03-31T18:30:00.000Z is March 31 UTC, but in IST (UTC+5:30) it's April 1
    // The function uses toLocaleDateString which is locale/timezone dependent
    const result = parseMonthLabel("2025-03-31T18:30:00.000Z");
    // Should produce a short month + year format
    expect(result).toMatch(/\w+ \d{2}/);
  });

  it("parses YYYY-MM format", () => {
    const result = parseMonthLabel("2025-06-15");
    expect(result).toMatch(/Jun/i);
  });

  it("shortens long labels over 8 chars", () => {
    // "April 2025" -> "April '25" (9 chars with replacement) -> over 8 so truncated: "Apr '25"
    const result = parseMonthLabel("April 2025");
    // After replacement: "April '25" which is 9 chars, so function truncates to first 3 + " '" + last 2
    expect(result).toBe("Apr '25");
  });

  it("shortens 'March 2026' consistently", () => {
    const result = parseMonthLabel("March 2026");
    // "March '26" is 9 chars > 8, so gets shortened
    expect(result).toBe("Mar '26");
  });

  it("handles already-short labels unchanged", () => {
    const result = parseMonthLabel("Mar '25");
    expect(result).toBe("Mar '25");
  });

  it("keeps labels under 8 chars as-is after year replacement", () => {
    // "May 2025" -> "May '25" (7 chars, <= 8), stays
    const result = parseMonthLabel("May 2025");
    expect(result).toBe("May '25");
  });
});

// ─── normalizeArray ─────────────────────────────────────────────────────

describe("normalizeArray", () => {
  it("returns array as-is", () => {
    const arr = [1, 2, 3];
    expect(normalizeArray(arr)).toEqual([1, 2, 3]);
  });

  it("wraps single object in array", () => {
    const obj = { id: 1, name: "test" };
    expect(normalizeArray(obj)).toEqual([obj]);
  });

  it("returns empty array for null", () => {
    expect(normalizeArray(null)).toEqual([]);
  });

  it("returns empty array for undefined", () => {
    expect(normalizeArray(undefined)).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(normalizeArray("")).toEqual([]);
  });

  it("returns empty array for zero", () => {
    expect(normalizeArray(0)).toEqual([]);
  });

  it("preserves nested arrays", () => {
    const data = [{ items: [1, 2] }, { items: [3] }];
    expect(normalizeArray(data)).toEqual(data);
  });
});

// ─── parseResponse ──────────────────────────────────────────────────────

describe("parseResponse", () => {
  it("parses full response with all sections", () => {
    const output = `ORIGINAL USER QUESTION:
What are the top products?

SQL EXECUTED:
SELECT * FROM products ORDER BY revenue DESC LIMIT 10

RESULTS:
Product A: ₹50 Cr
Product B: ₹30 Cr`;

    const parsed = parseResponse(output);
    expect(parsed.question).toBe("What are the top products?");
    expect(parsed.sql).toContain("SELECT * FROM products");
    expect(parsed.results).toContain("Product A");
    expect(parsed.results).toContain("Product B");
  });

  it("returns raw output when no sections found", () => {
    const output = "Just a plain text response with no markers.";
    const parsed = parseResponse(output);
    expect(parsed.question).toBe("");
    expect(parsed.sql).toBe("");
    expect(parsed.results).toBe(output);
  });

  it("handles response with only results section", () => {
    const output = `RESULTS:
Some data here`;
    const parsed = parseResponse(output);
    expect(parsed.results).toBe("Some data here");
  });

  it("handles multi-line SQL", () => {
    const output = `SQL EXECUTED:
SELECT c.name,
       SUM(o.amount) AS total
FROM customers c
JOIN orders o ON c.id = o.customer_id
GROUP BY c.name

RESULTS:
Customer A: ₹10 Cr`;

    const parsed = parseResponse(output);
    expect(parsed.sql).toContain("SELECT c.name");
    expect(parsed.sql).toContain("GROUP BY c.name");
  });

  it("handles empty string", () => {
    const parsed = parseResponse("");
    expect(parsed.question).toBe("");
    expect(parsed.sql).toBe("");
    expect(parsed.results).toBe("");
  });
});
