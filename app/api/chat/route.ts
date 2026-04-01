import { NextResponse } from "next/server";

const WEBHOOK_URL =
  "http://117.250.36.98:5678/webhook/e5500488-4a22-47f7-abb7-0d2aba7f5f78";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const rawText = await res.text();

    return new NextResponse(rawText, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reach webhook" },
      { status: 502 }
    );
  }
}
