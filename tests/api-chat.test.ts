import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
global.fetch = mockFetch;

import { POST } from "@/app/api/chat/route";

describe("POST /api/chat", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("forwards request body to webhook", async () => {
    mockFetch.mockResolvedValue({
      text: () => Promise.resolve(JSON.stringify({ output: "test" })),
      status: 200,
    });

    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "What are top products?" }),
    });

    await POST(request);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("117.250.36.98:5678/webhook/");
    expect(options.method).toBe("POST");
    const sentBody = JSON.parse(options.body);
    expect(sentBody.message).toBe("What are top products?");
  });

  it("returns raw webhook response text", async () => {
    const webhookResponse = JSON.stringify([{ output: "RESULTS:\nProduct A: ₹50Cr" }]);
    mockFetch.mockResolvedValue({
      text: () => Promise.resolve(webhookResponse),
      status: 200,
    });

    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "test" }),
    });

    const response = await POST(request);
    const text = await response.text();
    expect(text).toBe(webhookResponse);
  });

  it("returns Content-Type application/json header", async () => {
    mockFetch.mockResolvedValue({
      text: () => Promise.resolve("{}"),
      status: 200,
    });

    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "test" }),
    });

    const response = await POST(request);
    expect(response.headers.get("Content-Type")).toBe("application/json");
  });

  it("forwards webhook status code", async () => {
    mockFetch.mockResolvedValue({
      text: () => Promise.resolve("{}"),
      status: 500,
    });

    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "test" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
  });

  it("returns 502 on network error", async () => {
    mockFetch.mockRejectedValue(new Error("Connection refused"));

    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "test" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(502);

    const data = await response.json();
    expect(data.error).toContain("Connection refused");
  });

  it("returns 502 with generic message for non-Error throws", async () => {
    mockFetch.mockRejectedValue("string error");

    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "test" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(502);

    const data = await response.json();
    expect(data.error).toBe("Failed to reach webhook");
  });

  it("handles empty message body", async () => {
    mockFetch.mockResolvedValue({
      text: () => Promise.resolve("{}"),
      status: 200,
    });

    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
