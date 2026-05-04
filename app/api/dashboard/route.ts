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
  productPerformance:
    "http://117.250.36.98:5678/webhook/95114b95-6b3e-43be-b4d8-51b9ecc9e8c1",
  categoryMonthly:
    "http://117.250.36.98:5678/webhook/59c0d343-3179-4678-96aa-3c5ddd53bb30",
};

const WEBHOOK_TIMEOUT_MS = 12_000;

const FALLBACK_DASHBOARD_DATA = {
  monthlySales: [
    { month: "2025-04-30T18:30:00.000Z", total_revenue: "42000000" },
    { month: "2025-05-31T18:30:00.000Z", total_revenue: "48000000" },
    { month: "2025-06-30T18:30:00.000Z", total_revenue: "51000000" },
    { month: "2025-07-31T18:30:00.000Z", total_revenue: "46000000" },
    { month: "2025-08-31T18:30:00.000Z", total_revenue: "53000000" },
    { month: "2025-09-30T18:30:00.000Z", total_revenue: "57000000" },
    { month: "2025-10-31T18:30:00.000Z", total_revenue: "61000000" },
    { month: "2025-11-30T18:30:00.000Z", total_revenue: "59000000" },
    { month: "2025-12-31T18:30:00.000Z", total_revenue: "68000000" },
    { month: "2026-01-31T18:30:00.000Z", total_revenue: "72000000" },
    { month: "2026-02-28T18:30:00.000Z", total_revenue: "70000000" },
    { month: "2026-03-31T18:30:00.000Z", total_revenue: "78000000" },
  ],
  topCustomers: [
    { customer_name: "Reliance Industries Ltd", total_revenue: "28500000" },
    { customer_name: "Tata Steel Distributors", total_revenue: "24800000" },
    { customer_name: "Adani Infra Projects", total_revenue: "22100000" },
    { customer_name: "Mahindra Pipes & Tubes", total_revenue: "19800000" },
    { customer_name: "Larsen & Toubro Projects", total_revenue: "18700000" },
    { customer_name: "Godrej Properties", total_revenue: "17600000" },
  ],
  stockouts: [
    { product_sku: "HDPE-110-C6", brand_name: "Jalan", group_name: "HDPE Pipes", current_stock_qty: "-42000" },
    { product_sku: "PVC-SC-500", brand_name: "Jalan", group_name: "PVC Fittings", current_stock_qty: "-38000" },
    { product_sku: "CPVC-EL-25", brand_name: "Jalan", group_name: "CPVC Pipes", current_stock_qty: "-27000" },
    { product_sku: "GI-NIP-1", brand_name: "Jalan", group_name: "GI Fittings", current_stock_qty: "-23000" },
  ],
  outstandingDues: [
    { customer_id: "C001", customer_name: "Reliance Industries Ltd", total_due_amount: "4520000", credit_limit: "5000000", risk_status: "Critical", utilization_pct: "90.4" },
    { customer_id: "C002", customer_name: "Sharma Constructions Pvt Ltd", total_due_amount: "3870000", credit_limit: "4200000", risk_status: "Critical", utilization_pct: "92.1" },
    { customer_id: "C003", customer_name: "Patel Infra Projects", total_due_amount: "3240000", credit_limit: "4500000", risk_status: "High", utilization_pct: "72.0" },
    { customer_id: "C004", customer_name: "Agarwal Building Materials", total_due_amount: "2340000", credit_limit: "3800000", risk_status: "Medium", utilization_pct: "61.6" },
  ],
  productPerformance: [
    { group_name: "HDPE Pipes", total_units_sold: "24000", total_revenue: "23500000", revenue_pct: "28" },
    { group_name: "PVC Fittings", total_units_sold: "31000", total_revenue: "18400000", revenue_pct: "22" },
    { group_name: "CPVC Pipes", total_units_sold: "16000", total_revenue: "13400000", revenue_pct: "16" },
    { group_name: "uPVC Pipes", total_units_sold: "12000", total_revenue: "10100000", revenue_pct: "12" },
    { group_name: "Valves & Cocks", total_units_sold: "9000", total_revenue: "8400000", revenue_pct: "10" },
  ],
  categoryMonthly: [
    {
      group_name: "HDPE Pipes",
      total_units_sold: "24000",
      total_revenue: "23500000",
      revenue_pct: "28",
      monthly_breakdown: [
        { month_label: "Jan '26", monthly_revenue: "7100000", monthly_units_sold: "7200" },
        { month_label: "Feb '26", monthly_revenue: "7600000", monthly_units_sold: "7800" },
        { month_label: "Mar '26", monthly_revenue: "8800000", monthly_units_sold: "9000" },
      ],
    },
    {
      group_name: "PVC Fittings",
      total_units_sold: "31000",
      total_revenue: "18400000",
      revenue_pct: "22",
      monthly_breakdown: [
        { month_label: "Jan '26", monthly_revenue: "5900000", monthly_units_sold: "9800" },
        { month_label: "Feb '26", monthly_revenue: "6100000", monthly_units_sold: "10200" },
        { month_label: "Mar '26", monthly_revenue: "6400000", monthly_units_sold: "11000" },
      ],
    },
  ],
};

async function fetchEndpoint(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      signal: controller.signal,
    });
    const text = await res.text();
    if (!text || text.trim() === "") {
      return { data: null, ok: false, status: res.status, error: "empty_response" };
    }
    return { data: JSON.parse(text), ok: res.ok, status: res.status, error: null };
  } catch (error) {
    return {
      data: null,
      ok: false,
      status: null,
      error: error instanceof Error ? error.name : "fetch_error",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  const [
    monthlySales,
    topCustomers,
    stockouts,
    outstandingDues,
    productPerformance,
    categoryMonthly,
  ] = await Promise.all([
    fetchEndpoint(ENDPOINTS.monthlySales),
    fetchEndpoint(ENDPOINTS.topCustomers),
    fetchEndpoint(ENDPOINTS.stockouts),
    fetchEndpoint(ENDPOINTS.outstandingDues),
    fetchEndpoint(ENDPOINTS.productPerformance),
    fetchEndpoint(ENDPOINTS.categoryMonthly),
  ]);

  const results = {
    monthlySales,
    topCustomers,
    stockouts,
    outstandingDues,
    productPerformance,
    categoryMonthly,
  };
  const allFailed = Object.values(results).every((result) => !result.ok || result.data === null);
  const data = allFailed
    ? FALLBACK_DASHBOARD_DATA
    : Object.fromEntries(Object.entries(results).map(([key, result]) => [key, result.data]));

  return NextResponse.json({
    ...data,
    _meta: {
      source: allFailed ? "fallback" : "live",
      generatedAt: new Date().toISOString(),
      endpointStatus: Object.fromEntries(
        Object.entries(results).map(([key, result]) => [
          key,
          { ok: result.ok, status: result.status, error: result.error },
        ])
      ),
    },
  });
}
