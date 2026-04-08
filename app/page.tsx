"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap, LogIn, AlertCircle } from "lucide-react";
import { authenticate } from "./lib/auth";
import { useAuth } from "./lib/AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { session, setSession, loading: authLoading } = useAuth();
  const router = useRouter();

  // If already logged in, redirect
  useEffect(() => {
    if (authLoading) return;
    if (session) {
      router.replace(session.role === "member" ? "/chat" : "/dashboard");
    }
  }, [session, authLoading, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Small delay for UX feel
    setTimeout(() => {
      const result = authenticate(username.trim().toLowerCase(), password);
      if (result) {
        setSession(result);
        router.push(result.role === "member" ? "/chat" : "/dashboard");
      } else {
        setError("Invalid username or password");
        setLoading(false);
      }
    }, 300);
  };

  if (authLoading || session) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#09090b]">
        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] p-4 safe-bottom">
      {/* Subtle background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/[0.03] rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-[#161618] border border-[#2a2a2f] flex items-center justify-center mb-4 shadow-lg shadow-black/40">
            <Zap className="w-7 h-7 text-cyan-400 icon-glow-cyan" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Assistant JWB
          </h1>
          <p className="text-xs text-zinc-600 mt-1">
            Smart Business Intelligence
          </p>
        </div>

        {/* Login Card */}
        <div className="card-embossed rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-1">Sign in</h2>
          <p className="text-[11px] text-zinc-600 mb-5">
            Enter your credentials to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[#0c0c0e] border border-[#1f1f23] text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-cyan-500/30 transition-colors"
                placeholder="Enter username"
                autoComplete="username"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[#0c0c0e] border border-[#1f1f23] text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-cyan-500/30 transition-colors"
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!username.trim() || !password.trim() || loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-semibold hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/15 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-zinc-700 mt-4">
          Assistant JWB Business Intelligence Platform
        </p>
      </div>
    </div>
  );
}
