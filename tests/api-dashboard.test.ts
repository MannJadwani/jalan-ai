import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Must import after mocking
import { GET } from "@/app/api/dashboard/route";

function mockFetchResponse(body: unknown) {
  return {
    text: () => Promise.resolve(typeof body === "string" ? body : JSON.stringify(body)),
    status: 200,
    ok: true,
  };
}

function mockJsonResponse(body: unknown) {
  return {
    json: () => Promise.resolve(body),
    status: 200,
    ok: true,
  };
}

describe("GET /api/dashboard", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("calls all 6 webhook endpoints", async () => {
    mockFetch.mockResolvedValue(mockFetchResponse([]));

    await GET();

    expect(mockFetch).toHaveBeenCalledTimes(6);
  });

  it("sends POST requests with empty JSON body", async () => {
    mockFetch.mockResolvedValue(mockFetchResponse([]));

    await GET();

    mockFetch.mock.calls.forEach((call) => {
      expect(call[1].method).toBe("POST");
      expect(call[1].headers["Content-Type"]).toBe("application/json");
      expect(call[1].body).toBe("{}");
    });
  });

  it("returns all data sections in response", async () => {
    mockFetch.mockResolvedValue(mockFetchResponse([{ test: true }]));

    const response = await GET();
    const data = await response.json();

    expect(data).toHaveProperty("monthlySales");
    expect(data).toHaveProperty("topCustomers");
    expect(data).toHaveProperty("stockouts");
    expect(data).toHaveProperty("outstandingDues");
    expect(data).toHaveProperty("productPerformance");
    expect(data).toHaveProperty("categoryMonthly");
    expect(data).toHaveProperty("_meta");
  });

  it("falls back when every endpoint returns an empty response body", async () => {
    mockFetch.mockResolvedValue(mockFetchResponse(""));

    const response = await GET();
    const data = await response.json();

    expect(data._meta.source).toBe("fallback");
    expect(data.monthlySales.length).toBeGreaterThan(0);
    expect(data.topCustomers.length).toBeGreaterThan(0);
  });

  it("falls back when every endpoint returns whitespace-only response body", async () => {
    mockFetch.mockResolvedValue({
      text: () => Promise.resolve("   \n  "),
      status: 200,
    });

    const response = await GET();
    const data = await response.json();

    expect(data._meta.source).toBe("fallback");
    expect(data.monthlySales.length).toBeGreaterThan(0);
  });

  it("handles fetch errors gracefully with fallback data", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    const response = await GET();
    const data = await response.json();

    expect(data._meta.source).toBe("fallback");
    expect(data.monthlySales.length).toBeGreaterThan(0);
    expect(data.topCustomers.length).toBeGreaterThan(0);
  });

  it("uses the dashboard proxy before static fallback when all direct endpoints fail", async () => {
    const proxyData = {
      monthlySales: [{ month: "2026-04-30T18:30:00.000Z", total_revenue: "99000000" }],
      topCustomers: [{ customer_name: "Live Customer", total_revenue: "123" }],
      stockouts: [],
      outstandingDues: [],
      productPerformance: [],
      categoryMonthly: [],
      _meta: { source: "live" },
    };

    let callCount = 0;
    mockFetch.mockImplementation(() => {
      callCount++;
      if (callCount <= 6) {
        return Promise.reject(new Error("Network error"));
      }
      return Promise.resolve(mockJsonResponse(proxyData));
    });

    const response = await GET();
    const data = await response.json();

    expect(mockFetch).toHaveBeenCalledTimes(7);
    expect(data.monthlySales).toEqual(proxyData.monthlySales);
    expect(data.topCustomers).toEqual(proxyData.topCustomers);
    expect(data._meta.source).toBe("proxy_live");
    expect(data._meta.upstreamSource).toBe("live");
    expect(data._meta.directEndpointStatus.monthlySales.ok).toBe(false);
  });

  it("falls back when every endpoint returns invalid JSON", async () => {
    mockFetch.mockResolvedValue({
      text: () => Promise.resolve("not json {{{"),
      status: 200,
    });

    const response = await GET();
    const data = await response.json();

    expect(data._meta.source).toBe("fallback");
    expect(data.monthlySales.length).toBeGreaterThan(0);
  });

  it("parses valid JSON arrays correctly", async () => {
    const mockData = [
      { month: "2025-03-31T18:30:00.000Z", total_revenue: "97360592.82" },
    ];
    mockFetch.mockResolvedValue(mockFetchResponse(mockData));

    const response = await GET();
    const data = await response.json();

    expect(data.monthlySales).toEqual(mockData);
    expect(data._meta.source).toBe("live");
  });

  it("handles mixed success/failure across endpoints", async () => {
    let callCount = 0;
    mockFetch.mockImplementation(() => {
      callCount++;
      if (callCount <= 3) {
        return Promise.resolve(mockFetchResponse([{ ok: true }]));
      }
      return Promise.reject(new Error("timeout"));
    });

    const response = await GET();
    const data = await response.json();

    expect(data.monthlySales).toEqual([{ ok: true }]);
    expect(data.topCustomers).toEqual([{ ok: true }]);
    expect(data.stockouts).toEqual([{ ok: true }]);
    expect(data.outstandingDues.length).toBeGreaterThan(0);
    expect(data.productPerformance.length).toBeGreaterThan(0);
    expect(data.categoryMonthly.length).toBeGreaterThan(0);
    expect(data._meta.source).toBe("partial_fallback");
    expect(data._meta.endpointStatus.monthlySales.ok).toBe(true);
    expect(data._meta.endpointStatus.outstandingDues.ok).toBe(false);
  });
});
