import { NextResponse } from "next/server";

const ENDPOINTS = [
  {
    id: "chat",
    name: "AI Chat",
    url: "http://117.250.36.98:5678/webhook/e5500488-4a22-47f7-abb7-0d2aba7f5f78",
    method: "POST",
    body: { message: "Which brand has the highest average purchase rate across its catalog?" },
  },
  {
    id: "monthlySales",
    name: "Monthly Sales Trend (Last 12 Months)",
    url: "http://117.250.36.98:5678/webhook/29f37caa-de1d-49e1-bed0-6dd1b74a52ad",
    method: "POST",
    body: {},
  },
  {
    id: "topCustomers",
    name: "Top 100 Customers by Revenue",
    url: "http://117.250.36.98:5678/webhook/3b896d4f-4f34-405b-9004-f3d6ab5fc612",
    method: "POST",
    body: {},
  },
  {
    id: "stockouts",
    name: "Stockout Alerts",
    url: "http://117.250.36.98:5678/webhook/12201421-465b-420f-98ce-e5bc72c26240",
    method: "POST",
    body: {},
  },
  {
    id: "outstandingDues",
    name: "Outstanding Dues & Credit Risk",
    url: "http://117.250.36.98:5678/webhook/a55c98a1-2c22-4e2e-a80d-140403425e7a",
    method: "POST",
    body: {},
  },
  {
    id: "productPerformance",
    name: "Product Performance Breakdown (Last 12 Months)",
    url: "http://117.250.36.98:5678/webhook/95114b95-6b3e-43be-b4d8-51b9ecc9e8c1",
    method: "POST",
    body: {},
  },
  {
    id: "categoryMonthly",
    name: "Category Sales - Month by Month",
    url: "http://117.250.36.98:5678/webhook/59c0d343-3179-4678-96aa-3c5ddd53bb30",
    method: "POST",
    body: {},
  },
];

export async function GET() {
  return NextResponse.json({ endpoints: ENDPOINTS });
}

export async function POST(request: Request) {
  const { endpointId } = await request.json();

  const endpoint = ENDPOINTS.find((e) => e.id === endpointId);
  if (!endpoint) {
    return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
  }

  const startTime = Date.now();

  const requestInfo = {
    method: endpoint.method,
    url: endpoint.url,
    headers: { "Content-Type": "application/json" },
    body: endpoint.body,
  };

  try {
    const res = await fetch(endpoint.url, {
      method: endpoint.method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(endpoint.body),
    });

    const elapsed = Date.now() - startTime;
    const rawText = await res.text();

    let parsedBody: unknown = null;
    let parseError: string | null = null;
    try {
      if (rawText.trim()) parsedBody = JSON.parse(rawText);
    } catch (e) {
      parseError = e instanceof Error ? e.message : String(e);
    }

    const responseHeaders: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return NextResponse.json({
      request: requestInfo,
      response: {
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        rawBody: rawText,
        rawBodyLength: rawText.length,
        rawBodyBytes: new TextEncoder().encode(rawText).length,
        parsedBody,
        parseError,
      },
      timing: {
        elapsed_ms: elapsed,
        elapsed_formatted: elapsed > 1000 ? `${(elapsed / 1000).toFixed(1)}s` : `${elapsed}ms`,
      },
    });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    return NextResponse.json({
      request: requestInfo,
      response: null,
      error: {
        message: error instanceof Error ? error.message : String(error),
        type: error instanceof Error ? error.constructor.name : typeof error,
      },
      timing: {
        elapsed_ms: elapsed,
        elapsed_formatted: elapsed > 1000 ? `${(elapsed / 1000).toFixed(1)}s` : `${elapsed}ms`,
      },
    });
  }
}
