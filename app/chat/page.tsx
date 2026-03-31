"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  Zap,
  Trash2,
  BarChart3,
  Package,
  Users,
  CreditCard,
  ChevronDown,
  Database,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { ProtectedRoute } from "../lib/AuthContext";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sqlQuery?: string;
}

const WEBHOOK_URL =
  "http://117.250.36.98:5678/webhook/e5500488-4a22-47f7-abb7-0d2aba7f5f78";

const questionCategories = [
  {
    label: "Sales & Revenue",
    icon: BarChart3,
    color: "text-cyan-400",
    glow: "icon-glow-cyan",
    bg: "bg-cyan-500/10 border-cyan-500/15",
    questions: [
      "Which product categories (group_name) generated the most revenue in the last 3 months?",
      "Which region is contributing the most to sales this month?",
      "What are the top 10 best-selling brands by revenue this month?",
      "Which brands are driving the most revenue in the last 60 days?",
      "Show me month-by-month total sales revenue from April 2025 to today. Is the business growing?",
      "Which customers in Jharkhand or Orissa have placed orders this year?",
      "Which customer has placed the highest number of orders this year, regardless of order value?",
      "Which city generates the most revenue overall?",
      "What is the average revenue per invoice?",
      "Which product group commands the highest average selling rate per unit?",
      "How many invoices were raised each month?",
      "What is the revenue split between Pcs-based vs Mtr-based products?",
      "Which region has the lowest average revenue per invoice?",
      "What is the month-over-month revenue growth rate for 2025-2026?",
    ],
  },
  {
    label: "Inventory",
    icon: Package,
    color: "text-emerald-400",
    glow: "icon-glow-emerald",
    bg: "bg-emerald-500/10 border-emerald-500/15",
    questions: [
      "Which brand has the highest total stock quantity sitting in inventory right now?",
      "Which products have stock available but have not been sold in the last 90 days?",
      "Which brands have zero or negative stock?",
      "How many products have been in positive stock for more than 180 days without a single sale?",
      "Which product group has the highest total pending delivery quantity (deepest negative stock)?",
      "What is the current count of products in positive stock vs negative vs zero?",
      "Which brands have more than 50% of their products in negative stock?",
      "How many unique brands are currently represented in active inventory?",
      "What is the average purchase rate per product group?",
      "Which brand has the highest average purchase rate across its catalog?",
    ],
  },
  {
    label: "Customers",
    icon: Users,
    color: "text-amber-400",
    glow: "icon-glow-amber",
    bg: "bg-amber-500/10 border-amber-500/15",
    questions: [
      "How many active vs inactive customers do we currently have?",
      "Which city has the highest number of registered customers?",
      "How many customers have no valid contact number on record?",
      "Which region has the highest percentage of inactive customers?",
      "How many customers are registered per region?",
    ],
  },
  {
    label: "Outstanding & Credit",
    icon: CreditCard,
    color: "text-rose-400",
    glow: "icon-glow-rose",
    bg: "bg-rose-500/10 border-rose-500/15",
    questions: [
      "Which customers have the highest total outstanding dues right now?",
      "Which customers have exceeded their credit limit?",
      "What percentage of customers with outstanding dues have a ₹0 credit limit?",
    ],
  },
];

function parseResponse(output: string): { question: string; sql: string; results: string } {
  const questionMatch = output.match(/ORIGINAL USER QUESTION:\n?(.*?)(?:\n|$)/);
  const sqlMatch = output.match(/SQL EXECUTED:\n?([\s\S]*?)(?:\nRESULTS:|$)/);
  const resultsMatch = output.match(/RESULTS:\n?([\s\S]*?)$/);

  return {
    question: questionMatch?.[1]?.trim() || "",
    sql: sqlMatch?.[1]?.trim() || "",
    results: resultsMatch?.[1]?.trim() || output,
  };
}

const STORAGE_KEY = "jalan-ai-chat-history";

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

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [hydrated, setHydrated] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const fillInput = (text: string) => {
    setInput(text);
    // Focus and move cursor to end
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.style.height = "auto";
        inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 128) + "px";
      }
    }, 50);
  };

  // Load from localStorage on mount
  useEffect(() => {
    setMessages(loadMessages());
    setHydrated(true);
  }, []);

  // Save to localStorage whenever messages change
  useEffect(() => {
    if (hydrated && messages.length > 0) {
      saveMessages(messages);
    }
  }, [messages, hydrated]);

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim() }),
      });

      const rawText = await response.text();
      console.log("[Jalan AI] Raw response:", rawText);

      if (!rawText || rawText.trim() === "") {
        const emptyMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "The server returned an empty response. Check that the n8n workflow's 'Respond to Webhook' node is configured correctly.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, emptyMessage]);
        return;
      }

      const data = JSON.parse(rawText);
      const output = Array.isArray(data) ? data[0]?.output : data?.output;
      const parsed = parseResponse(output || "No response received");

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: parsed.results || output || "No response received",
        timestamp: new Date(),
        sqlQuery: parsed.sql || undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("[Jalan AI] Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I couldn't connect to the server.\n\nError: " + (error instanceof Error ? error.message : String(error)),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <ProtectedRoute>
    <div className="flex h-screen overflow-hidden bg-[#09090b]">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="glass border-b border-[#1c1c1f] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-lg bg-[#161618] border border-[#2a2a2f] flex items-center justify-center shadow-md shadow-black/40">
                  <Zap className="w-5 h-5 text-cyan-400 icon-glow-cyan" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#09090b] phosphor-pulse" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-white">Jalan AI Assistant</h1>
                <p className="text-[11px] text-zinc-600">
                  Ask anything about your business data
                </p>
              </div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161618] border border-[#2a2a2f] text-zinc-500 hover:text-rose-400 hover:border-rose-500/20 transition-all text-xs font-medium"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col items-center pt-8"
              >
                <div className="w-14 h-14 rounded-xl bg-[#161618] border border-[#2a2a2f] flex items-center justify-center mb-5 shadow-lg shadow-black/40">
                  <Sparkles className="w-7 h-7 text-cyan-400 icon-glow-cyan" />
                </div>
                <h2 className="text-xl font-bold text-white mb-1.5 tracking-tight text-center">
                  How can I help you today?
                </h2>
                <p className="text-zinc-600 mb-6 max-w-md text-sm text-center">
                  Pick a question below to fill the input, edit it if needed, then send.
                </p>

                <div className="w-full max-w-2xl space-y-2">
                  {questionCategories.map((cat, ci) => {
                    const isExpanded = expandedCategory === cat.label;
                    return (
                      <motion.div
                        key={cat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 + ci * 0.08 }}
                        className="card-embossed rounded-xl overflow-hidden"
                      >
                        {/* Category header */}
                        <button
                          onClick={() => setExpandedCategory(isExpanded ? null : cat.label)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.01] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg ${cat.bg} border flex items-center justify-center flex-shrink-0`}>
                              <cat.icon className={`w-4 h-4 ${cat.color} ${cat.glow}`} />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-medium text-zinc-200">{cat.label}</p>
                              <p className="text-[10px] text-zinc-600">{cat.questions.length} questions</p>
                            </div>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-zinc-600 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                        </button>

                        {/* Questions list */}
                        {isExpanded && (
                          <div className="border-t border-[#1c1c1f] px-2 py-2 space-y-0.5 max-h-64 overflow-y-auto">
                            {cat.questions.map((q) => (
                              <button
                                key={q}
                                onClick={() => fillInput(q)}
                                className="w-full text-left px-3 py-2 rounded-lg text-xs text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03] transition-all leading-snug"
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-3 chat-bubble ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg bg-[#161618] border border-[#2a2a2f] flex items-center justify-center flex-shrink-0 mt-1 shadow-md shadow-black/30">
                      <Bot className="w-4 h-4 text-cyan-400 icon-glow-cyan" />
                    </div>
                  )}

                  <div className={`max-w-[80%] ${message.role === "user" ? "order-1" : ""}`}>
                    <div
                      className={`rounded-xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-br-sm shadow-lg shadow-cyan-500/10"
                          : "card-embossed text-zinc-300 rounded-bl-sm"
                      }`}
                    >
                      {/* SQL Query block */}
                      {message.sqlQuery && (
                        <div className="mb-3 p-3 rounded-lg bg-black/30 border border-[#1c1c1f]">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <Database className="w-3 h-3 text-emerald-400 icon-glow-emerald" />
                              <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold">
                                SQL Query
                              </span>
                            </div>
                            <button
                              onClick={() => handleCopy(message.sqlQuery!, message.id + "-sql")}
                              className="text-zinc-600 hover:text-zinc-300 transition-colors"
                            >
                              {copiedId === message.id + "-sql" ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <code className="text-[11px] text-zinc-400 font-mono leading-relaxed block whitespace-pre-wrap">
                            {message.sqlQuery}
                          </code>
                        </div>
                      )}

                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>

                    {/* Message actions */}
                    <div className={`flex items-center gap-2 mt-1.5 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <span className="text-[10px] text-zinc-700">
                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {message.role === "assistant" && (
                        <>
                          <button
                            onClick={() => handleCopy(message.content, message.id)}
                            className="text-zinc-700 hover:text-zinc-400 transition-colors"
                          >
                            {copiedId === message.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                          <button
                            onClick={() => sendMessage(messages[messages.indexOf(message) - 1]?.content || "")}
                            className="text-zinc-700 hover:text-zinc-400 transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 mt-1 order-2 shadow-md shadow-cyan-500/10">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing Indicator */}
            {isLoading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-lg bg-[#161618] border border-[#2a2a2f] flex items-center justify-center flex-shrink-0 shadow-md shadow-black/30">
                  <Bot className="w-4 h-4 text-cyan-400 icon-glow-cyan" />
                </div>
                <div className="card-embossed rounded-xl rounded-bl-sm px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full typing-dot" />
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full typing-dot" />
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full typing-dot" />
                    </div>
                    <span className="text-[11px] text-zinc-600 ml-1">Querying database...</span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-[#1c1c1f] p-4">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="relative">
              <div className="flex items-end gap-2 p-2 rounded-xl card-embossed focus-within:border-cyan-500/20 transition-all">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about your data..."
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-700 resize-none px-3 py-2 focus:outline-none max-h-32"
                  style={{ height: "auto", minHeight: "40px" }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = Math.min(target.scrollHeight, 128) + "px";
                  }}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="w-9 h-9 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white disabled:opacity-20 disabled:cursor-not-allowed hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/10 flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
            <p className="text-center text-[10px] text-zinc-700 mt-2">
              Jalan AI can make mistakes. Verify important data from your reports.
            </p>
          </div>
        </div>
      </main>
    </div>
    </ProtectedRoute>
  );
}
