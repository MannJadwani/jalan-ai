import { describe, it, expect, beforeEach } from "vitest";
import { authenticate, getSession, logout, canAccess } from "@/app/lib/auth";

describe("authenticate", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns a session for valid admin credentials", () => {
    const session = authenticate("priyank", "priyank");
    expect(session).not.toBeNull();
    expect(session!.username).toBe("priyank");
    expect(session!.role).toBe("admin");
    expect(session!.displayName).toBe("Priyank");
    expect(session!.initials).toBe("PK");
  });

  it("returns a session for valid member credentials", () => {
    const session = authenticate("jalan_member", "jalan123");
    expect(session).not.toBeNull();
    expect(session!.role).toBe("member");
    expect(session!.displayName).toBe("Jalan Member");
    expect(session!.initials).toBe("JM");
  });

  it("returns null for wrong password", () => {
    expect(authenticate("priyank", "wrongpass")).toBeNull();
  });

  it("returns null for non-existent user", () => {
    expect(authenticate("nobody", "nothing")).toBeNull();
  });

  it("returns null for empty credentials", () => {
    expect(authenticate("", "")).toBeNull();
  });

  it("is case-sensitive for username", () => {
    expect(authenticate("Priyank", "priyank")).toBeNull();
    expect(authenticate("PRIYANK", "priyank")).toBeNull();
  });

  it("stores session in localStorage after successful auth", () => {
    authenticate("dhanraj", "dhanraj");
    const stored = localStorage.getItem("jalan-ai-session");
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.username).toBe("dhanraj");
    expect(parsed.role).toBe("admin");
  });

  it("does not store session on failed auth", () => {
    authenticate("fake", "fake");
    expect(localStorage.getItem("jalan-ai-session")).toBeNull();
  });

  it("authenticates all admin accounts", () => {
    const admins = [
      { user: "priyank", pass: "priyank" },
      { user: "dhanraj", pass: "dhanraj" },
      { user: "jalan", pass: "jalan" },
    ];
    admins.forEach(({ user, pass }) => {
      const session = authenticate(user, pass);
      expect(session).not.toBeNull();
      expect(session!.role).toBe("admin");
    });
  });

  it("session does not include password", () => {
    const session = authenticate("priyank", "priyank");
    expect(session).not.toHaveProperty("password");
  });
});

describe("getSession", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when no session stored", () => {
    expect(getSession()).toBeNull();
  });

  it("returns session after authentication", () => {
    authenticate("jalan", "jalan");
    const session = getSession();
    expect(session).not.toBeNull();
    expect(session!.username).toBe("jalan");
    expect(session!.initials).toBe("JL");
  });

  it("returns null for corrupted localStorage data", () => {
    localStorage.setItem("jalan-ai-session", "not valid json{{{");
    expect(getSession()).toBeNull();
  });
});

describe("logout", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("removes session from localStorage", () => {
    authenticate("priyank", "priyank");
    expect(getSession()).not.toBeNull();
    logout();
    expect(getSession()).toBeNull();
  });

  it("does not throw when no session exists", () => {
    expect(() => logout()).not.toThrow();
  });
});

describe("canAccess", () => {
  it("admin can access dashboard", () => {
    expect(canAccess("admin", "/dashboard")).toBe(true);
  });

  it("admin can access chat", () => {
    expect(canAccess("admin", "/chat")).toBe(true);
  });

  it("admin can access debug", () => {
    expect(canAccess("admin", "/debug")).toBe(true);
  });

  it("admin can access any path", () => {
    expect(canAccess("admin", "/anything")).toBe(true);
    expect(canAccess("admin", "/")).toBe(true);
  });

  it("member can access chat", () => {
    expect(canAccess("member", "/chat")).toBe(true);
  });

  it("member cannot access dashboard", () => {
    expect(canAccess("member", "/dashboard")).toBe(false);
  });

  it("member cannot access debug", () => {
    expect(canAccess("member", "/debug")).toBe(false);
  });

  it("member cannot access root", () => {
    expect(canAccess("member", "/")).toBe(false);
  });
});
