import { describe, it, expect, beforeEach } from "vitest";

// Test chat localStorage persistence logic (matching chat page implementation)

const STORAGE_KEY = "jalan-ai-chat-history";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sqlQuery?: string;
}

function loadMessages(): Message[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return parsed.map((m: Message & { timestamp: string }) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    }));
  } catch {
    return [];
  }
}

function saveMessages(messages: Message[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // storage full or unavailable
  }
}

describe("Chat localStorage persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns empty array when no history exists", () => {
    expect(loadMessages()).toEqual([]);
  });

  it("saves and loads a single message", () => {
    const messages: Message[] = [
      {
        id: "1",
        role: "user",
        content: "Hello",
        timestamp: new Date("2025-06-15T10:00:00Z"),
      },
    ];

    saveMessages(messages);
    const loaded = loadMessages();

    expect(loaded).toHaveLength(1);
    expect(loaded[0].content).toBe("Hello");
    expect(loaded[0].role).toBe("user");
    expect(loaded[0].id).toBe("1");
  });

  it("preserves message timestamps as Date objects", () => {
    const now = new Date("2025-06-15T10:00:00Z");
    saveMessages([{ id: "1", role: "user", content: "test", timestamp: now }]);

    const loaded = loadMessages();
    expect(loaded[0].timestamp).toBeInstanceOf(Date);
    expect(loaded[0].timestamp.toISOString()).toBe(now.toISOString());
  });

  it("saves and loads conversation with user and assistant messages", () => {
    const conversation: Message[] = [
      { id: "1", role: "user", content: "What are top products?", timestamp: new Date() },
      {
        id: "2",
        role: "assistant",
        content: "Product A: ₹50 Cr",
        timestamp: new Date(),
        sqlQuery: "SELECT * FROM products",
      },
      { id: "3", role: "user", content: "Show me more", timestamp: new Date() },
    ];

    saveMessages(conversation);
    const loaded = loadMessages();

    expect(loaded).toHaveLength(3);
    expect(loaded[0].role).toBe("user");
    expect(loaded[1].role).toBe("assistant");
    expect(loaded[1].sqlQuery).toBe("SELECT * FROM products");
    expect(loaded[2].role).toBe("user");
  });

  it("handles corrupted localStorage gracefully", () => {
    localStorage.setItem(STORAGE_KEY, "not valid json at all{{[");
    expect(loadMessages()).toEqual([]);
  });

  it("handles empty string in localStorage", () => {
    localStorage.setItem(STORAGE_KEY, "");
    expect(loadMessages()).toEqual([]);
  });

  it("clear removes all messages", () => {
    saveMessages([
      { id: "1", role: "user", content: "test", timestamp: new Date() },
    ]);
    expect(loadMessages()).toHaveLength(1);

    localStorage.removeItem(STORAGE_KEY);
    expect(loadMessages()).toEqual([]);
  });

  it("preserves sqlQuery field on assistant messages", () => {
    const messages: Message[] = [
      {
        id: "1",
        role: "assistant",
        content: "Results here",
        timestamp: new Date(),
        sqlQuery: "SELECT name, SUM(amount) FROM orders GROUP BY name",
      },
    ];

    saveMessages(messages);
    const loaded = loadMessages();
    expect(loaded[0].sqlQuery).toBe("SELECT name, SUM(amount) FROM orders GROUP BY name");
  });

  it("handles message without optional sqlQuery", () => {
    const messages: Message[] = [
      { id: "1", role: "assistant", content: "No SQL for this", timestamp: new Date() },
    ];

    saveMessages(messages);
    const loaded = loadMessages();
    expect(loaded[0].sqlQuery).toBeUndefined();
  });
});
