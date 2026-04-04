"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthSession, getSession, logout as doLogout, canAccess } from "./auth";

interface AuthContextType {
  session: AuthSession | null;
  loading: boolean;
  setSession: (s: AuthSession | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  setSession: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = getSession();
    // Initialize auth state from localStorage on mount
    requestAnimationFrame(() => {
      setSession(s);
      setLoading(false);
    });
  }, []);

  const logout = () => {
    doLogout();
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, loading, setSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace("/");
      return;
    }
    if (!canAccess(session.role, pathname)) {
      // Redirect members trying to access dashboard to chat
      router.replace("/chat");
    }
  }, [session, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#09090b]">
        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;
  if (!canAccess(session.role, pathname)) return null;

  return <>{children}</>;
}
