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
  });

  it("handles empty response body gracefully", async () => {
    mockFetch.mockResolvedValue(mockFetchResponse(""));

    const response = await GET();
    const data = await response.json();

    // All fields should be null for empty responses
    expect(data.monthlySales).toBeNull();
    expect(data.topCustomers).toBeNull();
  });

  it("handles whitespace-only response body", async () => {
    mockFetch.mockResolvedValue({
      text: () => Promise.resolve("   \n  "),
      status: 200,
    });

    const response = await GET();
    const data = await response.json();

    expect(data.monthlySales).toBeNull();
  });

  it("handles fetch errors gracefully (returns null per endpoint)", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    const response = await GET();
    const data = await response.json();

    expect(data.monthlySales).toBeNull();
    expect(data.topCustomers).toBeNull();
    expect(data.stockouts).toBeNull();
    expect(data.outstandingDues).toBeNull();
  });

  it("handles invalid JSON response gracefully", async () => {
    mockFetch.mockResolvedValue({
      text: () => Promise.resolve("not json {{{"),
      status: 200,
    });

    const response = await GET();
    const data = await response.json();

    // Should return null for endpoints with invalid JSON
    expect(data.monthlySales).toBeNull();
  });

  it("parses valid JSON arrays correctly", async () => {
    const mockData = [
      { month: "2025-03-31T18:30:00.000Z", total_revenue: "97360592.82" },
    ];
    mockFetch.mockResolvedValue(mockFetchResponse(mockData));

    const response = await GET();
    const data = await response.json();

    expect(data.monthlySales).toEqual(mockData);
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

    // Some should have data, some should be null
    const values = Object.values(data);
    const hasData = values.filter((v) => v !== null);
    const hasNull = values.filter((v) => v === null);
    expect(hasData.length).toBeGreaterThan(0);
    expect(hasNull.length).toBeGreaterThan(0);
  });
});
