// ─── TYPES ──────────────────────────────────────────────────────────────
export type UserRole = "admin" | "member";

export interface User {
  username: string;
  password: string;
  role: UserRole;
  displayName: string;
  initials: string;
}

export interface AuthSession {
  username: string;
  role: UserRole;
  displayName: string;
  initials: string;
}

// ─── USER DATABASE ──────────────────────────────────────────────────────
const users: User[] = [
  {
    username: "priyank",
    password: "priyank",
    role: "admin",
    displayName: "Priyank",
    initials: "PK",
  },
  {
    username: "dhanraj",
    password: "dhanraj",
    role: "admin",
    displayName: "Dhanraj",
    initials: "DJ",
  },
  {
    username: "jalan",
    password: "jalan",
    role: "admin",
    displayName: "Jalan",
    initials: "JL",
  },
  {
    username: "jalan_member",
    password: "jalan123",
    role: "member",
    displayName: "Jalan Member",
    initials: "JM",
  },
];

// ─── AUTH HELPERS ────────────────────────────────────────────────────────
const SESSION_KEY = "jalan-ai-session";

export function authenticate(
  username: string,
  password: string
): AuthSession | null {
  const user = users.find(
    (u) => u.username === username && u.password === password
  );
  if (!user) return null;
  const session: AuthSession = {
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    initials: user.initials,
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  return session;
}

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as AuthSession;
  } catch {
    return null;
  }
}

export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function canAccess(role: UserRole, path: string): boolean {
  if (role === "admin") return true;
  // Members can only access /chat
  if (role === "member" && path.startsWith("/chat")) return true;
  return false;
}
