// Shared helper functions extracted for testability

export function parseCrValue(formatted: string): number {
  const match = formatted.match(/([\d.]+)\s*Cr/);
  return match ? parseFloat(match[1]) : 0;
}

export function formatINR(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

export function formatCompact(value: number): string {
  if (value >= 10000000) return `${(value / 10000000).toFixed(1)} Cr`;
  if (value >= 100000) return `${(value / 100000).toFixed(1)} L`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toFixed(0);
}

export function shortenName(name: string, maxLen = 28): string {
  let clean = name.replace(/-C$|-CC$|-K$/, "").trim();
  if (clean.length > maxLen) clean = clean.substring(0, maxLen) + "…";
  return clean;
}

export function getRiskBadge(risk: string) {
  if (risk.includes("Critical"))
    return { label: "CRITICAL", color: "bg-red-500/15 text-red-400 border-red-500/25", dot: "bg-red-400" };
  if (risk.includes("High"))
    return { label: "HIGH", color: "bg-orange-500/15 text-orange-400 border-orange-500/25", dot: "bg-orange-400" };
  if (risk.includes("Medium"))
    return { label: "MEDIUM", color: "bg-amber-500/15 text-amber-400 border-amber-500/25", dot: "bg-amber-400" };
  if (risk.includes("Low"))
    return { label: "LOW", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25", dot: "bg-emerald-400" };
  return { label: "NO LIMIT", color: "bg-zinc-500/15 text-zinc-500 border-zinc-500/25", dot: "bg-zinc-500" };
}

export function parseMonthLabel(isoOrLabel: string): string {
  if (isoOrLabel.includes("T") || isoOrLabel.match(/^\d{4}-/)) {
    const date = new Date(isoOrLabel);
    return date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
  }
  const short = isoOrLabel.replace(/\s*20(\d{2})/, " '$1");
  return short.length > 8 ? isoOrLabel.substring(0, 3) + " '" + isoOrLabel.slice(-2) : short;
}

export function normalizeArray<T>(data: unknown): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === "object") return [data as T];
  return [];
}

export function parseResponse(output: string): { question: string; sql: string; results: string } {
  const questionMatch = output.match(/ORIGINAL USER QUESTION:\n?(.*?)(?:\n|$)/);
  const sqlMatch = output.match(/SQL EXECUTED:\n?([\s\S]*?)(?:\nRESULTS:|$)/);
  const resultsMatch = output.match(/RESULTS:\n?([\s\S]*?)$/);

  return {
    question: questionMatch?.[1]?.trim() || "",
    sql: sqlMatch?.[1]?.trim() || "",
    results: resultsMatch?.[1]?.trim() || output,
  };
}
