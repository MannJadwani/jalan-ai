import { NextResponse } from "next/server";

const ENDPOINTS = {
  monthlySales:
    "http://117.250.36.98:5678/webhook/29f37caa-de1d-49e1-bed0-6dd1b74a52ad",
  monthlySalesSummary:
    "http://117.250.36.98:5678/webhook/51a9dbac-4927-4695-aaed-515537bc63ba",
  topCustomers:
    "http://117.250.36.98:5678/webhook/3b896d4f-4f34-405b-9004-f3d6ab5fc612",
  stockouts:
    "http://117.250.36.98:5678/webhook/12201421-465b-420f-98ce-e5bc72c26240",
  outstandingDues:
    "http://117.250.36.98:5678/webhook/a55c98a1-2c22-4e2e-a80d-140403425e7a",
  productPerformance:
    "http://117.250.36.98:5678/webhook/95114b95-6b3e-43be-b4d8-51b9ecc9e8c1",
  categoryMonthly:
    "http://117.250.36.98:5678/webhook/59c0d343-3179-4678-96aa-3c5ddd53bb30",
};

async function fetchEndpoint(url: string) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const text = await res.text();
    if (!text || text.trim() === "") return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function GET() {
  const [
    monthlySales,
    monthlySalesSummary,
    topCustomers,
    stockouts,
    outstandingDues,
    productPerformance,
    categoryMonthly,
  ] = await Promise.all([
    fetchEndpoint(ENDPOINTS.monthlySales),
    fetchEndpoint(ENDPOINTS.monthlySalesSummary),
    fetchEndpoint(ENDPOINTS.topCustomers),
    fetchEndpoint(ENDPOINTS.stockouts),
    fetchEndpoint(ENDPOINTS.outstandingDues),
    fetchEndpoint(ENDPOINTS.productPerformance),
    fetchEndpoint(ENDPOINTS.categoryMonthly),
  ]);

  return NextResponse.json({
    monthlySales,
    monthlySalesSummary,
    topCustomers,
    stockouts,
    outstandingDues,
    productPerformance,
    categoryMonthly,
  });
}
