"use client";

import { useState, useEffect } from "react";
import {
  Play,
  PlayCircle,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Copy,
  Check,
  AlertTriangle,
  ArrowLeft,
  Terminal,
} from "lucide-react";
import Link from "next/link";

interface Endpoint {
  id: string;
  name: string;
  url: string;
  method: string;
  body: Record<string, unknown>;
}

interface TestResult {
  endpointId: string;
  status: "idle" | "loading" | "success" | "error";
  request?: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: Record<string, unknown>;
  };
  response?: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    rawBody: string;
    rawBodyLength: number;
    rawBodyBytes: number;
    parsedBody: unknown;
    parseError: string | null;
  };
  error?: {
    message: string;
    type: string;
  };
  timing?: {
    elapsed_ms: number;
    elapsed_formatted: string;
  };
}

export default function DebugPage() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [allLoading, setAllLoading] = useState(false);

  useEffect(() => {
    fetch("/api/debug")
      .then((r) => r.json())
      .then((d) => setEndpoints(d.endpoints));
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const testEndpoint = async (endpointId: string) => {
    setResults((prev) => ({
      ...prev,
      [endpointId]: { endpointId, status: "loading" },
    }));

    try {
      const res = await fetch("/api/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpointId }),
      });
      const data = await res.json();

      setResults((prev) => ({
        ...prev,
        [endpointId]: {
          endpointId,
          status: data.error ? "error" : data.response?.rawBodyLength === 0 ? "error" : "success",
          ...data,
        },
      }));
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [endpointId]: {
          endpointId,
          status: "error",
          error: {
            message: err instanceof Error ? err.message : String(err),
            type: "FetchError",
          },
        },
      }));
    }
  };

  const testAll = async () => {
    setAllLoading(true);
    await Promise.all(endpoints.map((ep) => testEndpoint(ep.id)));
    setAllLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "loading": return <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />;
      case "success": return <CheckCircle className="w-4 h-4 text-emerald-400 icon-glow-emerald" />;
      case "error": return <XCircle className="w-4 h-4 text-rose-400 icon-glow-rose" />;
      default: return <Clock className="w-4 h-4 text-zinc-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "loading": return "border-l-cyan-500";
      case "success": return "border-l-emerald-500";
      case "error": return "border-l-rose-500";
      default: return "border-l-zinc-700";
    }
  };

  if (process.env.NODE_ENV === "production") {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Debug Mode Only</h1>
          <p className="text-zinc-500">This page is only available in development mode.</p>
          <Link href="/dashboard" className="mt-4 inline-block text-cyan-400 text-sm hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300">
      {/* Header */}
      <div className="glass border-b border-[#1c1c1f] px-6 py-4 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="w-8 h-8 rounded-lg bg-[#161618] border border-[#2a2a2f] flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-9 h-9 rounded-lg bg-[#161618] border border-[#2a2a2f] flex items-center justify-center">
              <Terminal className="w-5 h-5 text-amber-400 icon-glow-amber" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">API Debug Console</h1>
              <p className="text-[10px] text-zinc-600">Test all webhook endpoints &middot; DEV ONLY</p>
            </div>
          </div>
          <button
            onClick={testAll}
            disabled={allLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-semibold hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/15 disabled:opacity-50"
          >
            {allLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <PlayCircle className="w-3.5 h-3.5" />
            )}
            Test All Endpoints
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-4">
        {/* Summary bar */}
        <div className="flex items-center gap-4 text-xs">
          <span className="text-zinc-600">{endpoints.length} endpoints configured</span>
          <span className="text-zinc-700">|</span>
          <span className="text-emerald-500">
            {Object.values(results).filter((r) => r.status === "success").length} passed
          </span>
          <span className="text-rose-500">
            {Object.values(results).filter((r) => r.status === "error").length} failed
          </span>
          <span className="text-cyan-500">
            {Object.values(results).filter((r) => r.status === "loading").length} running
          </span>
        </div>

        {/* Endpoint Cards */}
        {endpoints.map((ep) => {
          const result = results[ep.id];
          const status = result?.status || "idle";

          return (
            <div
              key={ep.id}
              className={`card-embossed rounded-xl overflow-hidden border-l-[3px] ${getStatusColor(status)} transition-all`}
            >
              {/* Endpoint header */}
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">{ep.name}</h3>
                      <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {ep.method}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-600 font-mono mt-0.5 select-all">{ep.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {result?.timing && (
                    <span className={`text-[10px] font-mono px-2 py-1 rounded border ${
                      result.timing.elapsed_ms > 10000
                        ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                        : "text-zinc-500 bg-[#161618] border-[#2a2a2f]"
                    }`}>
                      {result.timing.elapsed_formatted}
                    </span>
                  )}
                  <button
                    onClick={() => testEndpoint(ep.id)}
                    disabled={status === "loading"}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161618] border border-[#2a2a2f] text-zinc-400 hover:text-white hover:border-[#3a3a3f] transition-all text-xs font-medium disabled:opacity-40"
                  >
                    {status === "loading" ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                    Test
                  </button>
                </div>
              </div>

              {/* Result panel */}
              {result && status !== "idle" && status !== "loading" && (
                <div className="border-t border-[#1c1c1f] bg-[#0c0c0e]">
                  {/* Request */}
                  <div className="px-5 py-3 border-b border-[#1c1c1f]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-cyan-400">
                        Request
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            JSON.stringify(result.request, null, 2),
                            `${ep.id}-req`
                          )
                        }
                        className="text-zinc-700 hover:text-zinc-400 transition-colors"
                      >
                        {copiedKey === `${ep.id}-req` ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                    <pre className="text-[11px] font-mono text-zinc-500 overflow-x-auto whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {JSON.stringify(result.request, null, 2)}
                    </pre>
                  </div>

                  {/* Response or Error */}
                  {result.error ? (
                    <div className="px-5 py-3">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-rose-400 mb-2 block">
                        Error
                      </span>
                      <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/15">
                        <p className="text-xs text-rose-400 font-mono">
                          {result.error.type}: {result.error.message}
                        </p>
                      </div>
                    </div>
                  ) : result.response ? (
                    <div className="px-5 py-3 space-y-3">
                      {/* Status line */}
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400">
                          Response
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                            result.response.status >= 200 && result.response.status < 300
                              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                              : "text-rose-400 bg-rose-500/10 border-rose-500/20"
                          }`}
                        >
                          {result.response.status} {result.response.statusText}
                        </span>
                        <span className="text-[10px] text-zinc-700 font-mono">
                          {result.response.rawBodyBytes} bytes
                        </span>
                        {result.response.rawBodyLength === 0 && (
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            EMPTY BODY
                          </span>
                        )}
                        {result.response.parseError && (
                          <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                            JSON PARSE FAILED
                          </span>
                        )}
                      </div>

                      {/* Response Headers */}
                      <div>
                        <details className="group">
                          <summary className="text-[10px] text-zinc-600 cursor-pointer hover:text-zinc-400 transition-colors select-none">
                            Headers ({Object.keys(result.response.headers).length})
                          </summary>
                          <pre className="mt-1 text-[10px] font-mono text-zinc-600 overflow-x-auto whitespace-pre-wrap max-h-24 overflow-y-auto">
                            {JSON.stringify(result.response.headers, null, 2)}
                          </pre>
                        </details>
                      </div>

                      {/* Raw Body */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-zinc-600">
                            Raw Body
                            {result.response.rawBodyLength === 0
                              ? " (empty)"
                              : ` (${result.response.rawBodyLength} chars)`}
                          </span>
                          <button
                            onClick={() =>
                              copyToClipboard(result.response!.rawBody, `${ep.id}-raw`)
                            }
                            className="text-zinc-700 hover:text-zinc-400 transition-colors"
                          >
                            {copiedKey === `${ep.id}-raw` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <pre className="text-[11px] font-mono text-zinc-400 overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto p-3 rounded-lg bg-black/30 border border-[#1c1c1f]">
                          {result.response.rawBody || "(empty)"}
                        </pre>
                      </div>

                      {/* Parsed JSON */}
                      {result.response.parsedBody != null && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-zinc-600">Parsed JSON</span>
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  JSON.stringify(result.response!.parsedBody, null, 2),
                                  `${ep.id}-parsed`
                                )
                              }
                              className="text-zinc-700 hover:text-zinc-400 transition-colors"
                            >
                              {copiedKey === `${ep.id}-parsed` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <pre className="text-[11px] font-mono text-emerald-400/80 overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto p-3 rounded-lg bg-black/30 border border-[#1c1c1f]">
                            {JSON.stringify(result.response.parsedBody, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
