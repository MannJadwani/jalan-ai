import { NextResponse } from "next/server";

const ENDPOINTS = {
  monthlySales:
    "http://117.250.36.98:5678/webhook/29f37caa-de1d-49e1-bed0-6dd1b74a52ad",
  topCustomers:
    "http://117.250.36.98:5678/webhook/3b896d4f-4f34-405b-9004-f3d6ab5fc612",
  stockouts:
    "http://117.250.36.98:5678/webhook/12201421-465b-420f-98ce-e5bc72c26240",
  outstandingDues:
    "http://117.250.36.98:5678/webhook/a55c98a1-2c22-4e2e-a80d-140403425e7a",
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
  const [monthlySales, topCustomers, stockouts, outstandingDues] =
    await Promise.all([
      fetchEndpoint(ENDPOINTS.monthlySales),
      fetchEndpoint(ENDPOINTS.topCustomers),
      fetchEndpoint(ENDPOINTS.stockouts),
      fetchEndpoint(ENDPOINTS.outstandingDues),
    ]);

  return NextResponse.json({
    monthlySales,
    topCustomers,
    stockouts,
    outstandingDues,
  });
}
